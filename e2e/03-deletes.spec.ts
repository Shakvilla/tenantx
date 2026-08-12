import { execFileSync } from 'node:child_process'

import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

import { E2E_USER, unique } from './fixtures'

/**
 * Delete flows — the paths that destroy data.
 *
 * These matter more than they look, because the application-level guards are
 * the ONLY thing standing between a mistaken click and silent corruption.
 * There are no foreign keys from `agreements` to property / unit / occupant,
 * and `units.property_id` is ON DELETE CASCADE. So deleting a property with a
 * live tenancy would cascade its units away and leave agreements and occupants
 * pointing at rows that no longer exist — and the database would allow all of
 * it. If a guard regresses, nothing downstream catches it.
 *
 * That is the case these tests exist to hold: every guard is asserted by
 * confirming the row SURVIVES, read back from the database, not by trusting a
 * status code or a toast.
 */

const API = process.env.E2E_API_URL ?? 'http://localhost:8099/api/v1'

async function apiHeaders(page: Page): Promise<Record<string, string>> {
  const cookies = await page.context().cookies()
  const token = cookies.find(c => c.name === 'auth_token')?.value
  const tenant = cookies.find(c => c.name === 'tenant_id')?.value ?? E2E_USER.tenantId

  if (!token) throw new Error('No auth_token cookie — auth.setup.ts did not run, or its state is stale.')

  return { Authorization: `Bearer ${token}`, 'X-Tenant-ID': tenant, 'Content-Type': 'application/json' }
}

async function post<T>(req: APIRequestContext, path: string, body: unknown, headers: Record<string, string>): Promise<T> {
  const res = await req.post(`${API}${path}`, { data: body, headers })

  if (!res.ok()) throw new Error(`POST ${path} → ${res.status()} ${await res.text()}`)

  return (await res.json()) as T
}

function queryDb(sql: string): string {
  return execFileSync(
    'docker',
    ['exec', 'tenantx-backend-db-1', 'psql', '-U', 'postgres', '-d', 'tenantx', '-t', '-A', '-c', sql],
    { encoding: 'utf8' }
  ).trim()
}

const rowCount = (table: string, id: string) =>
  Number(queryDb(`SELECT count(*) FROM ${table} WHERE id = '${id}';`))

test.describe.serial('deleting records', () => {
  const occupantLast = unique('Deletee')
  const phone = `02${Math.floor(10_000_000 + Math.random() * 89_999_999)}`

  /** Occupied: property + unit + active occupant + an unpaid invoice. Every guard fires here. */
  let propertyId = ''
  let propertyName = ''
  let unitId = ''
  let occupantId = ''
  let invoiceId = ''

  /** Clean: a property with nothing attached, so the successful path has a subject. */
  let emptyPropertyId = ''
  let emptyPropertyName = ''

  let headers: Record<string, string> = {}

  test.beforeAll(async ({ playwright, browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' })
    const page = await context.newPage()

    headers = await apiHeaders(page)

    const req = await playwright.request.newContext()

    const baseProperty = {
      type: 'house',
      ownership: 'own',
      condition: 'good',
      status: 'active',
      region: 'Greater Accra',
      district: 'Accra',
      city: 'Accra'
    }

    propertyName = unique('Del Property')

    const property = await post<{ id: string }>(req, '/properties', { ...baseProperty, name: propertyName }, headers)

    propertyId = property.id

    emptyPropertyName = unique('Empty Property')

    const empty = await post<{ id: string }>(req, '/properties', { ...baseProperty, name: emptyPropertyName }, headers)

    emptyPropertyId = empty.id

    const unit = await post<{ id: string; unitNo: string }>(req, `/properties/${propertyId}/units`, {
      propertyId,
      unitNo: unique('DU'),
      type: '1br',
      rent: 900,
      currency: 'GHS',
      status: 'available'
    }, headers)

    unitId = unit.id

    const occupant = await post<{ id: string }>(req, '/occupants', {
      firstName: 'E2E',
      lastName: occupantLast,
      email: `${occupantLast.toLowerCase()}@localtest.dev`,
      phone,
      status: 'active',
      propertyId,
      unitId,
      unitNo: unit.unitNo
    }, headers)

    occupantId = occupant.id

    const invoice = await post<{ id: string }>(req, '/invoices', {
      occupantId,
      occupantName: `E2E ${occupantLast}`,
      propertyId,
      propertyName,
      unitId,
      unitNo: unit.unitNo,
      issuedDate: '2026-08-01',
      dueDate: '2026-09-01',
      amount: 900,
      currency: 'GHS',
      status: 'PENDING',
      invoiceType: 'Rent',
      description: 'E2E delete fixture'
    }, headers)

    invoiceId = invoice.id

    await req.dispose()
    await context.close()
  })

  // ── The guards ────────────────────────────────────────────────────────────

  test('a property with an active occupant cannot be deleted', async ({ playwright }) => {
    const req = await playwright.request.newContext()
    const res = await req.delete(`${API}/properties/${propertyId}`, { headers })

    expect(res.status(), await res.text()).toBe(409)

    // The status code is not the point — surviving is. units.property_id is
    // ON DELETE CASCADE, so a delete that slipped through would take the unit
    // with it and strand the occupant and agreement rows that reference both.
    expect(rowCount('properties', propertyId)).toBe(1)
    expect(rowCount('units', unitId)).toBe(1)
    expect(rowCount('occupants', occupantId)).toBe(1)

    await req.dispose()
  })

  test('a unit with an active occupant cannot be deleted', async ({ playwright }) => {
    const req = await playwright.request.newContext()
    const res = await req.delete(`${API}/units/${unitId}`, { headers })

    expect(res.status(), await res.text()).toBe(409)
    expect(rowCount('units', unitId)).toBe(1)

    await req.dispose()
  })

  test('an occupant with an outstanding invoice cannot be deleted', async ({ playwright }) => {
    const req = await playwright.request.newContext()
    const res = await req.delete(`${API}/occupants/${occupantId}`, { headers })

    expect(res.status(), await res.text()).toBe(409)
    expect(rowCount('occupants', occupantId)).toBe(1)

    // And the invoice it was protecting is still there to be settled.
    expect(rowCount('invoices', invoiceId)).toBe(1)

    await req.dispose()
  })

  // ── The successful paths, and what they must clean up ─────────────────────

  test('deleting an occupant frees their unit and revokes their login', async ({ playwright }) => {
    const req = await playwright.request.newContext()

    // Clear the guard the honest way — the same thing the error message tells
    // the landlord to do.
    const cancelled = await req.patch(`${API}/invoices/${invoiceId}/status`, {
      data: { status: 'CANCELLED' },
      headers
    })

    expect(cancelled.ok(), await cancelled.text()).toBeTruthy()

    const res = await req.delete(`${API}/occupants/${occupantId}`, { headers })

    expect(res.ok(), await res.text()).toBeTruthy()
    expect(rowCount('occupants', occupantId)).toBe(0)

    // The unit must come back into circulation. Leaving occupant_id set would
    // point at a row that no longer exists, and leaving the status as-is would
    // keep the unit out of both the vacancy listing and the wizard's picker.
    const unit = queryDb(`SELECT status, coalesce(occupant_id::text, 'null') FROM units WHERE id = '${unitId}';`)

    expect(unit).toBe('available|null')

    // A deleted occupant must not keep a working account: login builds its
    // workspace list from ACTIVE links, so an active link here is a live
    // account belonging to someone who has moved out.
    const activeLinks = queryDb(
      `SELECT count(*) FROM user_tenant_links
       WHERE tenant_id = '${E2E_USER.tenantId}' AND tenant_user_id = '${occupantId}' AND active = true;`
    )

    expect(activeLinks).toBe('0')

    await req.dispose()
  })

  test('a property with no dependents deletes, through the UI', async ({ page }) => {
    // Driven through the UI rather than the API because this is the only path a
    // landlord actually takes, and the confirm dialog is part of it.
    await page.goto('/properties')
    await expect(page.getByText(emptyPropertyName)).toBeVisible({ timeout: 30_000 })

    const row = page.getByRole('row').filter({ hasText: emptyPropertyName })

    await row.getByRole('button', { name: /more actions/i }).click()
    await page.getByRole('menuitem', { name: /^Delete$/ }).click()
    await page.getByRole('button', { name: /Yes, Delete Property!/i }).click()

    // The delete only fires when the second dialog is dismissed — see the
    // documented defect below. Close it so the request is actually sent.
    await page.getByRole('button', { name: /^Ok$/i }).click()

    await expect
      .poll(() => rowCount('properties', emptyPropertyId), { timeout: 30_000 })
      .toBe(0)
  })

  // ── Documented defect ─────────────────────────────────────────────────────

  test.fail('the confirm dialog does not claim success before the delete is attempted', async ({ page }) => {
    /**
     * KNOWN DEFECT — this test is expected to fail until it is fixed.
     *
     * ConfirmationDialog.handleConfirmation() opens the result dialog
     * immediately, so "Deleted — Property deleted successfully." renders BEFORE
     * any request is made. onConfirm() — the actual delete — runs later, from
     * handleSecondDialogClose().
     *
     * So a landlord who deletes a property that the guard refuses is told it
     * was deleted, and the row is still there. The failure surfaces only as an
     * inline error behind a dialog that has already congratulated them. For a
     * destructive action reported against the wrong outcome, that is worse than
     * showing nothing.
     *
     * Fix: await onConfirm() and report what it returned. Deleting this
     * test.fail marker is the last step of that change.
     */
    await page.goto('/properties')
    await expect(page.getByText(propertyName)).toBeVisible({ timeout: 30_000 })

    const row = page.getByRole('row').filter({ hasText: propertyName })

    await row.getByRole('button', { name: /more actions/i }).click()
    await page.getByRole('menuitem', { name: /^Delete$/ }).click()
    await page.getByRole('button', { name: /Yes, Delete Property!/i }).click()

    // This property has an active occupant, so the delete is refused. Nothing
    // should tell the landlord it succeeded.
    await expect(page.getByText(/deleted successfully/i)).not.toBeVisible()
  })
})
