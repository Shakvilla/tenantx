import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

import { E2E_USER, unique } from './fixtures'

/**
 * The Export buttons, driven the way a landlord drives them.
 *
 * Four list tables offer CSV export — properties, units, invoices,
 * agreements — and none of them had ever been exercised. An admin export was
 * 500ing in the July platform sweep and was never re-verified, which is the
 * whole reason these are worth pinning: an export is used at the moment
 * somebody needs the data most, and it fails in a place nobody watches.
 *
 * Clicking the real button matters here rather than calling the endpoint. The
 * download path is the part most likely to be wrong — `exportPropertiesCsv`
 * reads the token from storage itself rather than going through the axios
 * interceptor, builds its own fetch, and turns the response into a blob and an
 * anchor click. Hitting the API directly would skip all of it.
 *
 * Each test asserts the CSV actually contains this run's fixture, because a
 * 200 with an empty body downloads perfectly happily.
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

/**
 * Clicks an Export button and returns what the browser was handed.
 *
 * The download is captured rather than saved: the assertion is about content,
 * and Playwright discards the file when the context closes anyway.
 */
async function exportFrom(page: Page, url: string): Promise<{ name: string; body: string }> {
  await page.goto(url)

  const button = page.getByRole('button', { name: /^Export$/i })

  await expect(button).toBeVisible({ timeout: 30_000 })

  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60_000 }),
    button.click()
  ])

  const stream = await download.createReadStream()
  const chunks: Buffer[] = []

  for await (const chunk of stream) chunks.push(chunk as Buffer)

  return { name: download.suggestedFilename(), body: Buffer.concat(chunks).toString('utf8') }
}

test.describe.serial('exporting to CSV', () => {
  const propertyName = unique('Export Property')

  let unitNo = ''
  let invoiceNumber = ''
  let agreementNumber = ''

  test.beforeAll(async ({ playwright, browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' })
    const page = await context.newPage()
    const headers = await apiHeaders(page)
    const req = await playwright.request.newContext()

    const property = await post<{ id: string; name: string }>(req, '/properties', {
      name: propertyName,
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
      unitNo: unique('XU'),
      type: '1br',
      rent: 1400,
      currency: 'GHS',
      status: 'available'
    }, headers)

    unitNo = unit.unitNo

    const last = unique('Exporter')

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

    const agreement = await post<{ agreementNumber: string }>(req, '/agreements', {
      occupantId: occupant.id,
      propertyId: property.id,
      unitId: unit.id,
      agreementType: 'LEASE',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      rentAmount: 1400,
      currency: 'GHS',
      paymentFrequency: 'MONTHLY',
      status: 'ACTIVE'
    }, headers)

    agreementNumber = agreement.agreementNumber

    const invoice = await post<{ invoiceNumber: string }>(req, '/invoices', {
      occupantId: occupant.id,
      occupantName: `E2E ${last}`,
      propertyId: property.id,
      propertyName: property.name,
      unitId: unit.id,
      unitNo: unit.unitNo,
      issuedDate: '2026-08-01',
      dueDate: '2026-09-01',
      amount: 1400,
      currency: 'GHS',
      status: 'PENDING',
      invoiceType: 'Rent',
      description: 'E2E export fixture'
    }, headers)

    invoiceNumber = invoice.invoiceNumber

    await req.dispose()
    await context.close()
  })

  test('properties export downloads a CSV containing the properties', async ({ page }) => {
    const csv = await exportFrom(page, '/properties')

    expect(csv.name).toMatch(/\.csv$/)

    // A header line and at least this run's property. An export that returns
    // 200 and nothing at all downloads just as happily as one that works.
    expect(csv.body.split('\n').length).toBeGreaterThan(1)
    expect(csv.body).toContain(propertyName)
  })

  test('units export downloads a CSV containing the units', async ({ page }) => {
    const csv = await exportFrom(page, '/properties/units')

    expect(csv.name).toMatch(/\.csv$/)
    expect(csv.body).toContain(unitNo)
  })

  test('invoices export downloads a CSV containing the invoices', async ({ page }) => {
    const csv = await exportFrom(page, '/billing/invoices')

    expect(csv.name).toMatch(/\.csv$/)
    expect(csv.body).toContain(invoiceNumber)
  })

  test('agreements export downloads a CSV containing the agreements', async ({ page }) => {
    const csv = await exportFrom(page, '/agreement')

    expect(csv.name).toMatch(/\.csv$/)
    expect(csv.body).toContain(agreementNumber)
  })
})
