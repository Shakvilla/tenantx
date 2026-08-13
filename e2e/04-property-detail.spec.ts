import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

import { E2E_USER, unique } from './fixtures'

/**
 * What the property detail page shows about a property.
 *
 * Two defects lived here, both in the same mapping in
 * `app/(dashboard)/properties/[id]/page.tsx`:
 *
 *   - `address: gpsCode || street` put the Ghana Post code ahead of the street,
 *     so a property with a street address could never display it — the page
 *     showed the code in the Address row AND in the GPS Code row, the same value
 *     twice, with the actual street nowhere.
 *
 *   - `facilities: property.amenities` copied the amenity array into a second
 *     field, which rendered below the labelled list as raw storage keys. Every
 *     amenity appeared twice: once as "Kitchen Cabinets", once as
 *     `kitchenCabinets`.
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

test.describe.serial('property detail', () => {
  const STREET = unique('12 Nii Boi Street')
  const GPS_CODE = 'GA-184-7915'

  let propertyId = ''

  test.beforeAll(async ({ playwright, browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' })
    const page = await context.newPage()
    const headers = await apiHeaders(page)
    const req = await playwright.request.newContext()

    const property = await post<{ id: string }>(req, '/properties', {
      name: unique('Detail Property'),
      type: 'house',
      ownership: 'own',
      condition: 'good',
      status: 'active',
      region: 'Greater Accra',
      district: 'Accra',
      city: 'Accra',
      gpsCode: GPS_CODE,

      // The street lives under `address` on the way in and maps to
      // properties.address_line_1.
      address: { street: STREET, city: 'Accra' },

      // Stored as ids; the page resolves them to display names through the
      // reference data. `kitchenCabinets` is the one whose raw form is most
      // obviously wrong on screen.
      amenities: ['kitchenCabinets', 'popCeiling', 'gatedCompound']
    }, headers)

    propertyId = property.id

    await req.dispose()
    await context.close()
  })

  test('the Address row shows the street, not the GPS code', async ({ page }) => {
    await page.goto(`/properties/${propertyId}`)

    await expect(page.getByText(STREET).first()).toBeVisible({ timeout: 30_000 })

    // The code still belongs on the page — in its own row. What must not happen
    // is it standing in for an address that exists.
    await expect(page.getByText(GPS_CODE).first()).toBeVisible()
  })

  test('amenities are listed once, with their names', async ({ page }) => {
    await page.goto(`/properties/${propertyId}`)

    await expect(page.getByText('Kitchen Cabinets').first()).toBeVisible({ timeout: 30_000 })

    // The storage keys must not reach the page at all.
    for (const rawId of ['kitchenCabinets', 'popCeiling', 'gatedCompound']) {
      await expect(page.getByText(rawId, { exact: true })).toHaveCount(0)
    }

    // And exactly once — the duplicate block rendered the same amenity twice,
    // which a "is it visible" assertion would not have caught.
    await expect(page.getByText('Kitchen Cabinets', { exact: true })).toHaveCount(1)
  })
})
