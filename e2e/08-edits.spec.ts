import { execFileSync } from 'node:child_process'

import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

import { E2E_USER, unique } from './fixtures'

/**
 * Editing one field must not quietly change another.
 *
 * Every edit form in this app prefills itself, sends the whole record back,
 * and so gets a chance to rewrite fields the user never touched. That is where
 * this codebase's worst bugs have lived: an 11-bedroom property came back as 6
 * because the form's Select can only say "6+" and the submit took it
 * literally, and a valuation was echoed from a field no input could set.
 *
 * Both were caught by component tests. Nothing exercised a real edit form
 * against the real backend, which is the gap this closes: create a record with
 * every field populated, change exactly ONE through the UI, and read the rest
 * back out of the database.
 *
 * Assertions are made against the database, not the page. A form that drops a
 * field usually still renders the stale value it was given, so the screen is
 * the last place the loss shows up.
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
 * A unique suffix made only of letters.
 *
 * `unique()` appends a base-36 timestamp, and the occupant form rejects names
 * containing digits — correctly, since real ones do not. Everywhere else in
 * the suite occupants are created through the API, which never sees that rule.
 */
function alphaUnique(stem: string): string {
  return stem + Date.now().toString(36).replace(/[0-9]/g, d => String.fromCharCode(97 + Number(d)))
}

function queryDb(sql: string): string {
  return execFileSync(
    'docker',
    ['exec', 'tenantx-backend-db-1', 'psql', '-U', 'postgres', '-d', 'tenantx', '-t', '-A', '-c', sql],
    { encoding: 'utf8' }
  ).trim()
}

test.describe.serial('editing a record', () => {
  const STREET = unique('7 Ako Adjei Street')
  const GPS = 'GA-184-7915'

  let propertyId = ''
  let unitId = ''
  let occupantId = ''
  let occupantLast = ''

  test.beforeAll(async ({ playwright, browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' })
    const page = await context.newPage()
    const headers = await apiHeaders(page)
    const req = await playwright.request.newContext()

    // Everything filled in. A field left null cannot demonstrate being lost.
    const property = await post<{ id: string }>(req, '/properties', {
      name: unique('Edit Property'),
      type: 'house',
      ownership: 'own',
      condition: 'good',
      status: 'active',
      region: 'greater-accra',
      district: 'accra-metro',
      city: 'Accra',
      address: { street: STREET, city: 'Accra' },

      // No GPS code, so this stays a test of the round trip. What a code adds
      // — a decode on open that used to discard the city — is the last test in
      // this file, on its own fixture.
      description: 'Original description',

      // 11 is the count the form cannot represent exactly: it prefills as the
      // open-ended "6+" option, so a literal read of that option on submit
      // silently deletes five bedrooms.
      bedrooms: 11,
      bathrooms: 3,
      rooms: 4,
      currentValue: 850_000,
      currency: 'GHS',
      amenities: ['kitchenCabinets', 'popCeiling', 'gatedCompound']
    }, headers)

    propertyId = property.id

    const unit = await post<{ id: string }>(req, `/properties/${property.id}/units`, {
      propertyId: property.id,
      unitNo: unique('EU'),
      type: '2br',
      rent: 1500,
      deposit: 3000,
      currency: 'GHS',
      status: 'available',
      bedrooms: 2,
      bathrooms: 2,
      floor: 3,
      sizeSqft: 900,
      amenities: ['airConditioning', 'balcony']
    }, headers)

    unitId = unit.id

    // A second unit, so assigning the occupant below does not occupy the one
    // the unit test asserts is still 'available'.
    const tenanted = await post<{ id: string; unitNo: string }>(req, `/properties/${property.id}/units`, {
      propertyId: property.id,
      unitNo: unique('TU'),
      type: '1br',
      rent: 1200,
      currency: 'GHS',
      status: 'available'
    }, headers)

    occupantLast = alphaUnique('Editable')

    // With a tenancy. The edit form requires property, unit and move-in date,
    // so an occupant created without them cannot be saved from it at all — and
    // a real one never lacks them: onboarding assigns a unit as it creates the
    // record.
    const occupant = await post<{ id: string }>(req, '/occupants', {
      firstName: 'Ama',
      lastName: occupantLast,
      email: `${occupantLast.toLowerCase()}@localtest.dev`,
      phone: '0244000111',
      status: 'active',
      propertyId: property.id,
      unitId: tenanted.id,
      unitNo: tenanted.unitNo,
      moveInDate: '2026-01-01',
      occupation: 'Architect',
      familyMembersCount: 4,
      emergencyContact: { name: 'Next Of Kin', phone: '0244000222', relationship: 'Sibling' }
    }, headers)

    occupantId = occupant.id

    await req.dispose()
    await context.close()
  })

  test('editing a property description leaves every other field alone', async ({ page }) => {
    await page.goto(`/properties/${propertyId}`)

    await page.getByRole('button', { name: /Edit Property/i }).click()

    const dialog = page.getByRole('dialog')

    await expect(dialog.getByLabel(/Property Name/i)).toHaveValue(/Edit Property/, { timeout: 30_000 })

    await dialog.getByLabel(/Description/i).fill('Edited description')

    // The City select is populated from the district's locality list, fetched
    // when the dialog opens. Until that resolves the step's validator has not
    // learned whether the list is empty — and an empty list is what waives the
    // requirement — so clicking Next first blocks on a field the user never
    // touched. Waiting for it enabled is what the component test does, for the
    // same reason.
    await expect(dialog.getByLabel(/^City/i)).not.toHaveAttribute('aria-disabled', 'true', { timeout: 30_000 })

    // Step 1 -> 2 -> 3 -> Submit, touching nothing else on the way. Each step
    // is confirmed rather than assumed: a blind run of clicks on a form that
    // refused to advance ends at a "Submit is missing" timeout that says
    // nothing about why.
    await dialog.getByRole('button', { name: /^Next$/i }).click()
    await expect(dialog.getByLabel(/Bedrooms/i)).toBeVisible({ timeout: 30_000 })

    await dialog.getByRole('button', { name: /^Next$/i }).click()
    await expect(dialog.getByText(/Upload Images|drag/i).first()).toBeVisible({ timeout: 30_000 })

    await dialog.getByRole('button', { name: /^Next$/i }).click()

    await dialog.getByRole('button', { name: /^Submit$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 60_000 })

    const row = queryDb(
      `SELECT description, bedrooms, bathrooms, rooms, current_value, gps_code, address_line_1
       FROM properties WHERE id = '${propertyId}';`
    )

    const [description, bedrooms, bathrooms, rooms, currentValue, gpsCode, street] = row.split('|')

    // The one field that was meant to change.
    expect(description).toBe('Edited description')

    // The eleven bedrooms this form cannot express. Losing them was live
    // behaviour until the count round-trip was fixed, and it is the exact
    // shape of loss this whole spec exists to catch.
    expect(bedrooms).toBe('11')

    expect(bathrooms).toBe('3')
    expect(rooms).toBe('4')
    expect(currentValue).toMatch(/^850000/)
    expect(gpsCode === '' || gpsCode === null).toBeTruthy()
    expect(street).toBe(STREET)

    // Amenities are a separate column and a separate chance to be dropped.
    const amenities = queryDb(`SELECT amenities FROM properties WHERE id = '${propertyId}';`)

    for (const amenity of ['kitchenCabinets', 'popCeiling', 'gatedCompound']) {
      expect(amenities, `amenity ${amenity} was dropped by the edit`).toContain(amenity)
    }
  })

  test('editing a unit rent leaves every other field alone', async ({ page }) => {
    await page.goto(`/properties/units/${unitId}`)

    await page.getByRole('button', { name: /Edit Unit/i }).click()

    const dialog = page.getByRole('dialog')

    await expect(dialog.getByLabel(/^Rent \(/i)).toHaveValue('1500', { timeout: 30_000 })

    await dialog.getByLabel(/^Rent \(/i).fill('1650')
    await dialog.getByRole('button', { name: /Update Unit/i }).click()
    await expect(dialog).toBeHidden({ timeout: 60_000 })

    const row = queryDb(
      `SELECT rent, deposit, bedrooms, bathrooms, floor, size_sqft, status
       FROM units WHERE id = '${unitId}';`
    )

    const [rent, deposit, bedrooms, bathrooms, floor, size, status] = row.split('|')

    expect(rent).toMatch(/^1650/)

    // A deposit quietly zeroed by a rent change is money the landlord thinks
    // they are holding.
    expect(deposit).toMatch(/^3000/)
    expect(bedrooms).toBe('2')
    expect(bathrooms).toBe('2')
    expect(floor).toBe('3')
    expect(size).toMatch(/^900/)

    // And the unit must not be handed back to the market by an edit.
    expect(status).toBe('available')
  })

  test('editing an occupant phone leaves the rest of the profile alone', async ({ page }) => {
    await page.goto('/occupants')

    const row = page.getByRole('row').filter({ hasText: occupantLast }).first()

    await expect(row).toBeVisible({ timeout: 30_000 })

    // The row actions collapse into an overflow menu past two entries.
    await row.getByRole('button').last().click()
    await page.getByRole('menuitem', { name: /^Edit$/i }).click()

    const dialog = page.getByRole('dialog')

    await expect(dialog.getByLabel(/Phone/i).first()).toHaveValue('0244000111', { timeout: 30_000 })

    await dialog.getByLabel(/Phone/i).first().fill('0244000999')
    await dialog.getByRole('button', { name: /^Update$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 60_000 })

    const profile = queryDb(
      `SELECT phone, occupation, family_members_count, status FROM occupants WHERE id = '${occupantId}';`
    )

    const [phone, occupation, family, status] = profile.split('|')

    expect(phone).toBe('0244000999')

    // These three live on the occupant record but are filled in on a later
    // step of the form, which is exactly the sort of field an edit forgets.
    expect(occupation).toBe('Architect')
    expect(family).toBe('4')
    expect(status).toBe('active')

    // The emergency contact is JSONB — a whole object an edit can replace with
    // an empty one and still look like it saved.
    const kin = queryDb(`SELECT emergency_contact FROM occupants WHERE id = '${occupantId}';`)

    expect(kin).toContain('Next Of Kin')
    expect(kin).toContain('0244000222')
  })

  /**
   * A property with a Ghana Post GPS code can be edited, and keeps its city.
   *
   * Opening the dialog decodes the property's own stored code, and
   * `handleDecoded` cleared City along with region and district — a rule
   * written for a user TYPING a new code, where a city under the previous
   * district would indeed be wrong. On open nothing has moved, so the stored
   * city was discarded for no reason, and City is required.
   *
   * Whether that merely annoys or hard-blocks depended on the property. The
   * catalogue itself is fine — reference/ghana-locations.json ships 7,150
   * localities and `?district=accra-metro` returns 26 of them, 'Accra' among
   * them. But the lookup matches the district SLUG, and properties saved
   * before anything checked hold display names ('Accra', 'Adenta') that match
   * nothing: those got an empty City list, so there was nothing to re-pick and
   * the property could not be saved at all.
   *
   * This fixture uses catalogue values, because that is what the product now
   * writes and refuses to accept anything else. It still guards the fix: with
   * the city cleared on open, the form loses a value the owner never touched
   * and saves an empty one.
   *
   * Isolated at the time by creating the same property twice, with and without
   * a code: the one without advanced past Step 1, the one with did not. City is
   * now cleared only when the decoded district actually differs.
   */
  test('a property with a GPS code can be edited, and keeps its city', async ({ page }) => {
    const headers = await apiHeaders(page)
    const codedStreet = unique('2 Coded Street')

    const withCode = await post<{ id: string }>(page.request, '/properties', {
      name: unique('Gps Property'),
      type: 'house',
      ownership: 'own',
      condition: 'good',
      status: 'active',
      region: 'greater-accra',
      district: 'accra-metro',
      city: 'Accra',
      address: { street: codedStreet, city: 'Accra' },
      gpsCode: GPS,
      description: 'Coded original',

      // Step 2 requires all three. A property created without them cannot be
      // saved from the form at all, which would block this test for a reason
      // that has nothing to do with the code.
      bedrooms: 3,
      bathrooms: 2,
      rooms: 4
    }, headers)

    await page.goto(`/properties/${withCode.id}`)
    await page.getByRole('button', { name: /Edit Property/i }).click()

    const dialog = page.getByRole('dialog')

    await expect(dialog.getByLabel(/Property Name/i)).toHaveValue(/Gps Property/, { timeout: 30_000 })

    // Wait for the decode to settle, so a pass here cannot be a race that
    // happened to land the right way. The block shows the resolved district
    // rather than the region/district/city selects once a code has decoded —
    // which is itself the evidence the read-back decode ran.
    await expect(dialog.getByText(/Accra Metropolitan/i).first()).toBeVisible({ timeout: 30_000 })

    await dialog.getByLabel(/Description/i).fill('Coded edited')

    // Step 2 is where Bedrooms lives. Reaching it is the whole point: the form
    // used to stay on Step 1 with "City — This field is required" against a
    // select that had no options to offer.
    await dialog.getByRole('button', { name: /^Next$/i }).click()
    await expect(dialog.getByLabel(/Bedrooms/i)).toBeVisible({ timeout: 30_000 })

    await dialog.getByRole('button', { name: /^Next$/i }).click()
    await expect(dialog.getByText(/Upload Images|drag/i).first()).toBeVisible({ timeout: 30_000 })

    await dialog.getByRole('button', { name: /^Next$/i }).click()
    await dialog.getByRole('button', { name: /^Submit$/i }).click()
    await expect(dialog).toBeHidden({ timeout: 60_000 })

    const row = queryDb(
      `SELECT description, city, gps_code, region, district, address_line_1
       FROM properties WHERE id = '${withCode.id}';`
    )

    const [description, city, gpsCode, region, district, street] = row.split('|')

    expect(description).toBe('Coded edited')

    // The city the decode used to discard. Advancing past the step is not
    // enough on its own — a form that let the edit through while saving an
    // empty city would still have lost it.
    expect(city).toBe('Accra')

    expect(gpsCode).toBe(GPS)
    // The catalogue slugs, unchanged. The edit dialog used to send the display
    // name back over these — 'Greater Accra' for 'greater-accra' — so every
    // save rewrote the values the locality lookup and marketplace search
    // depend on, in the one flow most likely to be used on an old property.
    expect(region).toBe('greater-accra')
    expect(district).toBe('accra-metro')
    expect(street).toBe(codedStreet)
  })
})
