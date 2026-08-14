import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

import { E2E_USER, unique } from './fixtures'

/**
 * Two status readouts that were reporting the wrong thing.
 *
 * Agreements: terminating writes TERMINATED to BOTH `status` and
 * `renewalDecision`, and the STATUS cell rendered a chip for each — so every
 * terminated agreement read "Terminated Terminated". The second chip is only
 * meant to add what the status cannot say, which is the renewal case:
 * terminating leaves both fields agreeing, renewing sets only the decision.
 *
 * Billing: the tile row showed Total, Paid, Pending and Overdue while the
 * stats endpoint has always also returned draft, partial and cancelled. A
 * draft invoice therefore appeared in no tile while still counting towards
 * Total, so the figures could not be reconciled and unsent work was invisible.
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

test.describe.serial('status readouts', () => {
  let agreementNumber = ''
  let renewedNumber = ''
  let renewedStatus = ''
  let draftNumber = ''

  /** Mirrors agreementStatusObj in AgreementsListTable. */
  const STATUS_LABEL: Record<string, string> = {
    ACTIVE: 'Active',
    PENDING: 'Pending',
    EXPIRED: 'Expired',
    TERMINATED: 'Terminated'
  }

  test.beforeAll(async ({ playwright, browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' })
    const page = await context.newPage()
    const headers = await apiHeaders(page)
    const req = await playwright.request.newContext()

    const property = await post<{ id: string; name: string }>(req, '/properties', {
      name: unique('Status Property'),
      type: 'house',
      ownership: 'own',
      condition: 'good',
      status: 'active',
      region: 'greater-accra',
      district: 'accra-metro',
      city: 'Accra'
    }, headers)

    const unit = await post<{ id: string; unitNo: string }>(req, `/properties/${property.id}/units`, {
      propertyId: property.id,
      unitNo: unique('SU'),
      type: '1br',
      rent: 900,
      currency: 'GHS',
      status: 'available'
    }, headers)

    const last = unique('Ender')

    const occupant = await post<{ id: string }>(req, '/occupants', {
      firstName: 'E2E',
      lastName: last,
      email: `${last.toLowerCase()}@localtest.dev`,
      phone: `02${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
      status: 'active',
      propertyId: property.id,
      unitId: unit.id,
      unitNo: unit.unitNo
    }, headers)

    const agreement = await post<{ id: string; agreementNumber: string }>(req, '/agreements', {
      occupantId: occupant.id,
      propertyId: property.id,
      unitId: unit.id,
      agreementType: 'LEASE',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      rent: 900,
      currency: 'GHS',
      paymentFrequency: 'MONTHLY',
      status: 'ACTIVE'
    }, headers)

    agreementNumber = agreement.agreementNumber

    // Sets status AND renewalDecision to TERMINATED — the pair that produced
    // the doubled chip.
    await post(req, `/agreements/${agreement.id}/terminate`, { notes: 'E2E' }, headers)

    // A second agreement, renewed rather than terminated. Renewal records the
    // decision on the predecessor and leaves its status alone, so the two
    // fields disagree — the case the decision chip exists for, and the control
    // that stops "hide the duplicate" from becoming "hide the chip".
    const renewable = await post<{ id: string; agreementNumber: string }>(req, '/agreements', {
      occupantId: occupant.id,
      propertyId: property.id,
      unitId: unit.id,
      agreementType: 'LEASE',

      // A term that is still running — renewed ahead of its end, which is the
      // normal case and the one where the two fields genuinely differ. Dating
      // it in the past instead makes the row read "Expired", which is also
      // correct but tests the lifecycle rather than the chip.
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      rent: 900,
      currency: 'GHS',
      paymentFrequency: 'MONTHLY',
      status: 'ACTIVE'
    }, headers)

    renewedNumber = renewable.agreementNumber

    await post(req, `/agreements/${renewable.id}/renew`, {
      startDate: '2027-01-01',
      endDate: '2027-12-31',
      rent: 950,
      notes: 'E2E'
    }, headers)

    // Read the status back rather than assuming it. POST /agreements does not
    // honour a submitted status — it files everything as PENDING — and renewal
    // deliberately leaves the predecessor's lifecycle alone. Hard-coding a
    // label here would tie this test to that behaviour instead of to the chip
    // it is about.
    const after = await (await req.get(`${API}/agreements/${renewable.id}`, { headers })).json()

    renewedStatus = after.status

    expect(renewedStatus, 'the renewal must leave a status that differs from the decision').not.toBe('RENEWED')

    // A DRAFT invoice: counted in Total, shown in no tile.
    const draft = await post<{ invoiceNumber: string }>(req, '/invoices', {
      occupantId: occupant.id,
      occupantName: `E2E ${last}`,
      propertyId: property.id,
      propertyName: property.name,
      unitId: unit.id,
      unitNo: unit.unitNo,
      issuedDate: '2026-08-01',
      dueDate: '2026-09-01',
      amount: 900,
      currency: 'GHS',
      status: 'DRAFT',
      invoiceType: 'Rent',
      description: 'E2E draft fixture'
    }, headers)

    draftNumber = draft.invoiceNumber

    await req.dispose()
    await context.close()
  })

  test('a terminated agreement says so once', async ({ page }) => {
    await page.goto('/agreement')

    const row = page.getByRole('row').filter({ hasText: agreementNumber })

    await expect(row).toBeVisible({ timeout: 30_000 })

    // The count is the assertion. Both chips read "Terminated", so anything
    // checking only that the word is present passes against the bug.
    await expect(row.getByText('Terminated', { exact: true })).toHaveCount(1)
  })

  test('a renewed agreement still reports the decision alongside its status', async ({ page }) => {
    await page.goto('/agreement')

    const row = page.getByRole('row').filter({ hasText: renewedNumber })

    await expect(row).toBeVisible({ timeout: 30_000 })

    // Two chips saying different things: where the term stands, and that it
    // was renewed. Suppressing the decision chip outright would also have
    // silenced the duplicate, and this is what would have caught it.
    await expect(row.getByText('Renewed', { exact: true })).toHaveCount(1)
    await expect(row.getByText(STATUS_LABEL[renewedStatus], { exact: true })).toHaveCount(1)
  })

  test('the billing tiles account for draft invoices', async ({ page }) => {
    await page.goto('/billing/invoices')

    await expect(page.getByText('Draft Invoices')).toBeVisible({ timeout: 30_000 })

    const stats = await (await page.request.get(`${API}/invoices/stats`, { headers: await apiHeaders(page) })).json()

    expect(stats.draft, 'the fixture draft should be counted').toBeGreaterThan(0)

    // Every status the endpoint reports is now represented, so the tiles
    // reconcile against Total rather than silently falling short of it.
    const shown = stats.draft + stats.pending + stats.partial + stats.overdue + stats.paid + stats.cancelled

    expect(shown).toBe(stats.total)

    for (const title of ['Total Invoices', 'Draft Invoices', 'Pending Invoices', 'Part-paid Invoices', 'Overdue Invoices', 'Paid Invoices']) {
      await expect(page.getByText(title, { exact: true })).toBeVisible()
    }

    // And the draft is reachable from the list it is counted in.
    await expect(page.getByRole('row').filter({ hasText: draftNumber })).toBeVisible()
  })
})
