import { execFileSync } from 'node:child_process'

import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

import { E2E_USER, unique } from './fixtures'

/**
 * Recording a payment — the highest-risk uncovered write path.
 *
 * Everything else the suite covers creates a record. This one MOVES MONEY: it
 * settles an invoice, changes a balance, and decides whether a landlord thinks
 * they have been paid. It was exercised by nothing at all before this file.
 *
 * The prerequisite chain (property, unit, occupant, invoice) is built through
 * the API rather than the wizard. Driving the wizard again would re-test what
 * write-paths.spec.ts already covers, add two minutes, and make a payment
 * failure look like an onboarding failure. The subject here is the payment.
 *
 * Assertions are made after a reload, and the decisive ones read the database,
 * because "the drawer closed and a green snackbar appeared" is exactly the kind
 * of evidence that hides a write that never landed.
 */

const API = process.env.E2E_API_URL ?? 'http://localhost:8099/api/v1'

/**
 * The app sends its credentials from cookies (see storage.ts — cookies are the
 * source of truth, localStorage is a fallback), and the axios interceptor adds
 * both headers on every call. Reproduce that here rather than logging in again.
 */
async function apiHeaders(page: Page): Promise<Record<string, string>> {
  const cookies = await page.context().cookies()
  const token = cookies.find(c => c.name === 'auth_token')?.value
  const tenant = cookies.find(c => c.name === 'tenant_id')?.value ?? E2E_USER.tenantId

  if (!token) throw new Error('No auth_token cookie — auth.setup.ts did not run, or its state is stale.')

  return {
    Authorization: `Bearer ${token}`,
    'X-Tenant-ID': tenant,
    'Content-Type': 'application/json'
  }
}

async function post<T>(req: APIRequestContext, path: string, body: unknown, headers: Record<string, string>): Promise<T> {
  const res = await req.post(`${API}${path}`, { data: body, headers })

  if (!res.ok()) throw new Error(`POST ${path} → ${res.status()} ${await res.text()}`)

  return (await res.json()) as T
}

/** Reads the row the UI claims to have written. The DB is the only real witness. */
function queryDb(sql: string): string {
  return execFileSync(
    'docker',
    ['exec', 'tenantx-backend-db-1', 'psql', '-U', 'postgres', '-d', 'tenantx', '-t', '-A', '-c', sql],
    { encoding: 'utf8' }
  ).trim()
}

test.describe.serial('recording a payment against an invoice', () => {
  const occupantLast = unique('Payer')
  const phone = `02${Math.floor(10_000_000 + Math.random() * 89_999_999)}`

  let invoiceId = ''
  let invoiceNumber = ''

  const RENT = 1200

  test.beforeAll(async ({ playwright, browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' })
    const page = await context.newPage()
    const headers = await apiHeaders(page)
    const req = await playwright.request.newContext()

    const property = await post<{ id: string; name: string }>(req, '/properties', {
      name: unique('Pay Property'),
      type: 'house',
      // Both required by the API and easy to miss — the create form supplies
      // them from selects, so they are invisible in the payload the UI sends.
      ownership: 'own',
      condition: 'good',
      status: 'active',
      region: 'greater-accra',
      district: 'accra-metro',
      city: 'Accra'
    }, headers)

    // Units are nested under their property; POST /units is a GET-only route.
    const unit = await post<{ id: string; unitNo: string }>(req, `/properties/${property.id}/units`, {
      propertyId: property.id,
      unitNo: unique('PU'),
      type: '1br',
      rent: RENT,
      currency: 'GHS',
      status: 'available'
    }, headers)

    const occupant = await post<{ id: string }>(req, '/occupants', {
      firstName: 'E2E',
      lastName: occupantLast,
      email: `${occupantLast.toLowerCase()}@localtest.dev`,
      phone,
      status: 'active',
      propertyId: property.id,
      unitId: unit.id,
      unitNo: unit.unitNo
    }, headers)

    const invoice = await post<{ id: string; invoiceNumber: string }>(req, '/invoices', {
      occupantId: occupant.id,
      occupantName: `E2E ${occupantLast}`,
      propertyId: property.id,
      propertyName: property.name,
      unitId: unit.id,
      unitNo: unit.unitNo,
      issuedDate: '2026-08-01',
      dueDate: '2026-09-01',
      amount: RENT,
      currency: 'GHS',
      status: 'PENDING',
      invoiceType: 'Rent',
      description: 'E2E payment fixture'
    }, headers)

    invoiceId = invoice.id
    invoiceNumber = invoice.invoiceNumber

    await req.dispose()
    await context.close()
  })

  /**
   * Opens the Record Payment drawer and switches it off Mobile Money.
   *
   * MOBILE_MONEY is the default and its submit button reads "Send MoMo
   * Request" — it calls initiateMoMo and starts a real gateway transaction.
   * A test suite must never do that. CASH routes to recordManual, which is the
   * manual-entry path this test is about.
   */
  async function openDrawerAsCash(page: Page) {
    await page.goto(`/billing/invoices/${invoiceId}`)
    await page.getByRole('button', { name: /Add Payment/i }).click()

    const drawer = page.getByRole('presentation').filter({ hasText: 'Record Payment' }).first()

    await expect(drawer.getByText('Record Payment').first()).toBeVisible({ timeout: 20_000 })

    await drawer.locator('.MuiFormControl-root').filter({ hasText: /Payment Method/i })
      .first().locator('[role="combobox"]').click()
    await page.getByRole('option', { name: /^Cash$/i }).click()

    // Proof we are on the manual path and not about to bill someone for real.
    await expect(drawer.getByRole('button', { name: /^Record Payment$/i })).toBeVisible()

    return drawer
  }

  test('a part payment reduces the balance and does not mark the invoice paid', async ({ page }) => {
    const drawer = await openDrawerAsCash(page)

    await drawer.getByLabel(/Payment Amount/i).fill('500')
    await drawer.getByRole('button', { name: /^Record Payment$/i }).click()

    // Survives a reload — proves it round-tripped rather than sat in local state.
    await page.reload()

    const row = queryDb(
      `SELECT status, balance FROM invoices WHERE id = '${invoiceId}';`
    )

    // 1200 - 500. Settling an invoice that is only part-paid is the failure that
    // would cost a landlord real money, so assert the balance, not just a chip.
    expect(row).toContain('700')
    expect(row).not.toContain('PAID')
  })

  test('paying the remainder settles the invoice', async ({ page }) => {
    const drawer = await openDrawerAsCash(page)

    await drawer.getByLabel(/Payment Amount/i).fill('700')
    await drawer.getByRole('button', { name: /^Record Payment$/i }).click()

    await page.reload()

    const row = queryDb(`SELECT status, balance FROM invoices WHERE id = '${invoiceId}';`)

    expect(row).toContain('PAID')
    // A settled invoice must owe nothing. A PAID status sitting on a non-zero
    // balance is the shape of the paid-without-payment bug this repo has hit
    // before.
    expect(row).toMatch(/\|0(\.00)?$/)
  })

  test('both payments are recorded against the invoice, not just the last', async ({ page }) => {
    const count = queryDb(
      `SELECT count(*), COALESCE(sum(amount),0) FROM payment_transactions WHERE invoice_id = '${invoiceId}' AND status = 'RECORDED';`
    )

    // Two rows totalling the full rent. An implementation that overwrites the
    // payment instead of appending would still show the invoice as PAID, so the
    // invoice status alone cannot catch it.
    expect(count).toBe(`2|${RENT}.00`)

    // And the history the landlord actually reads agrees with the ledger.
    await page.goto(`/billing/invoices/${invoiceId}`)
    await expect(page.getByText('500').first()).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('700').first()).toBeVisible()
  })

  test('an overpayment is refused', async ({ page }) => {
    // The invoice is settled; anything further is money the landlord does not
    // owe a receipt for. PaymentServiceImpl:182 rejects amount > balance with
    // PAYMENT_EXCEEDS_INVOICE_BALANCE — this is the regression guard for that,
    // because unguarded it floors the balance to zero, marks PAID, and tracks
    // the excess nowhere.
    const drawer = await openDrawerAsCash(page)

    await drawer.getByLabel(/Payment Amount/i).fill('50')
    await drawer.getByRole('button', { name: /^Record Payment$/i }).click()

    await page.waitForTimeout(2000)

    const after = queryDb(
      `SELECT count(*), COALESCE(sum(amount),0) FROM payment_transactions WHERE invoice_id = '${invoiceId}' AND status = 'RECORDED';`
    )

    expect(after).toBe(`2|${RENT}.00`)
  })

  test('the settled invoice shows as paid in the invoices list', async ({ page }) => {
    await page.goto('/billing/invoices')

    const row = page.getByRole('row').filter({ hasText: invoiceNumber })

    await expect(row).toBeVisible({ timeout: 30_000 })

    // The BALANCE column swaps the figure for a "Paid" chip once the balance
    // reaches zero, so this asserts settlement AND that the balance actually
    // landed at zero — the amount would still be rendered otherwise. The amount
    // column still reads ₵1,200.00: that is the invoice's value and does not
    // change when it is settled. Only the balance column flips.
    await expect(row).toContainText('Paid')
  })

  test('the invoice status is readable, not just an icon', async ({ page }) => {
    /**
     * The STATUS column used to be an icon-only avatar with the word hidden in a
     * hover tooltip — nothing to read at a glance, nothing for a screen reader,
     * and no tooltip at all on a touch device, on the column that says whether
     * you have been paid. Verified in the live DOM at the time: the cell had
     * empty innerText, no aria-label and no title.
     *
     * Asserted on the cell itself rather than the row, because the row already
     * contains "Paid" from the balance column — which is exactly how a
     * regression here would hide.
     */
    await page.goto('/billing/invoices')

    const row = page.getByRole('row').filter({ hasText: invoiceNumber })

    await expect(row).toBeVisible({ timeout: 30_000 })

    const statusCell = row.getByRole('cell').nth(2)

    await expect(statusCell).toHaveText(/Paid/i)
  })
})
