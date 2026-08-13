import { execFileSync } from 'node:child_process'

import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

import { E2E_USER, unique } from './fixtures'

/**
 * What the Advertise card says versus what the public can actually see.
 *
 * A listing is shown publicly only when it is ACTIVE *and* its unit is still
 * available. The second half is enforced in the query, not stored on the
 * listing — deliberately, so a unit that has been let can never be advertised
 * even if nobody flipped the listing's own flag.
 *
 * The consequence was that signing an agreement, which reserves the unit,
 * took a listing off the public page without touching it, while the owner's
 * card went on reading the listing's flag alone and saying "Listed for rent".
 * The only symptom was silence from a page nobody could see. It had happened
 * to the first unit this product ever listed.
 *
 * So this walks the whole path: list a vacant unit, confirm it is public, sign
 * an agreement, and confirm both that it has gone AND that the card says so.
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

/** The listing ids the public browse endpoint is currently serving. */
async function publicListingIds(page: Page): Promise<string[]> {
  const res = await page.request.get(`${API}/listings/public`)
  const body = await res.json()

  return (Array.isArray(body) ? body : body.data ?? []).map((l: { id: string }) => l.id)
}

test.describe.serial('listing visibility', () => {
  let unitId = ''
  let occupantId = ''
  let propertyId = ''
  let listingId = ''

  test.beforeAll(async ({ playwright, browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' })
    const page = await context.newPage()
    const headers = await apiHeaders(page)
    const req = await playwright.request.newContext()

    const property = await post<{ id: string }>(req, '/properties', {
      name: unique('Listed Property'),
      type: 'house',
      ownership: 'own',
      condition: 'good',
      status: 'active',
      region: 'Greater Accra',
      district: 'Accra',
      city: 'Accra'
    }, headers)

    propertyId = property.id

    const unit = await post<{ id: string; unitNo: string }>(req, `/properties/${property.id}/units`, {
      propertyId: property.id,
      unitNo: unique('LU'),
      type: '1br',
      rent: 1100,
      currency: 'GHS',
      status: 'available'
    }, headers)

    unitId = unit.id

    // Before the occupant exists. POST /vacancy-listings refuses a unit that
    // is not available (422 UNIT_NOT_AVAILABLE) — the same invariant the
    // public queries enforce, which is why this has to be listed while it is
    // genuinely vacant, exactly as a landlord would.
    const listing = await post<{ id: string }>(req, '/vacancy-listings', {
      unitId: unit.id,
      title: unique('Vacant Unit'),
      status: 'ACTIVE'
    }, headers)

    listingId = listing.id

    const last = unique('Mover')

    // Deliberately WITHOUT a unit. Assigning one here would occupy it, and the
    // unit cannot then be freed again while an occupant is attached — the API
    // refuses that too. The agreement below is what attaches this occupant to
    // the unit, which is the transition under test.
    const occupant = await post<{ id: string }>(req, '/occupants', {
      firstName: 'E2E',
      lastName: last,
      email: `${last.toLowerCase()}@localtest.dev`,
      phone: `02${Math.floor(10_000_000 + Math.random() * 89_999_999)}`,
      status: 'active'
    }, headers)

    occupantId = occupant.id

    await req.dispose()
    await context.close()
  })

  test('a listed, available unit is public and the card says so', async ({ page }) => {
    expect(await publicListingIds(page)).toContain(listingId)

    await page.goto(`/properties/units/${unitId}`)

    const card = page.locator('.MuiCard-root').filter({ hasText: 'Advertise Unit' })

    await expect(card.getByText('Active listing')).toBeVisible({ timeout: 30_000 })
    await expect(card.getByText('Listed for rent')).toBeVisible()
  })

  test('signing an agreement hides it publicly, and the card reports that', async ({ page }) => {
    const headers = await apiHeaders(page)
    const req = await page.request

    // Reserves the unit — AgreementServiceImpl assigns 'reserved' on create.
    // Nothing here touches the listing.
    await post(req, '/agreements', {
      occupantId,
      propertyId,
      unitId,
      agreementType: 'LEASE',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      rentAmount: 1100,
      currency: 'GHS',
      paymentFrequency: 'MONTHLY',
      status: 'ACTIVE'
    }, headers)

    // Gone from the public page, without its own status having changed.
    expect(await publicListingIds(page)).not.toContain(listingId)

    const still = await (await page.request.get(`${API}/vacancy-listings/${listingId}`, { headers })).json()

    expect(still.status, 'the listing itself must be untouched').toBe('ACTIVE')
    expect(still.unitStatus).toBe('reserved')

    await page.goto(`/properties/units/${unitId}`)

    const card = page.locator('.MuiCard-root').filter({ hasText: 'Advertise Unit' })

    // The defect in one assertion: the card used to say "Active listing" here.
    await expect(card.getByText('Paused — not showing publicly')).toBeVisible({ timeout: 30_000 })
    await expect(card.getByText(/while this unit is reserved/i)).toBeVisible()
    await expect(card.getByText('Active listing')).toHaveCount(0)

    // The switch stays on: the owner's setting really is on, and the listing
    // returns by itself once the unit frees up.
    await expect(card.getByRole('checkbox')).toBeChecked()
  })

  test('the owner is notified that the listing paused', async () => {
    /**
     * The unit tests drive the entity listener directly, which proves the
     * transition logic and nothing else — not that Hibernate calls @PostLoad,
     * not that the snapshot survives to @PostUpdate, and not that the
     * after-commit event reaches the notifier. Only the real stack does, and
     * every one of those is a way for this to be silently dead.
     *
     * Read from the database rather than the bell: an unread count can be
     * satisfied by any other notification the fixtures happened to produce.
     */
    const row = queryDb(
      `SELECT title FROM user_notifications
       WHERE tenant_id = '${E2E_USER.tenantId}' AND entity_type = 'UNIT'
       ORDER BY created_at DESC LIMIT 1;`
    )

    expect(row, 'no listing-paused notification was written').toContain('Listing paused')

    const body = queryDb(
      `SELECT body FROM user_notifications
       WHERE tenant_id = '${E2E_USER.tenantId}' AND entity_type = 'UNIT'
       ORDER BY created_at DESC LIMIT 1;`
    )

    expect(body).toContain('reserved')
    expect(body).toContain('start showing again by itself')

    // Addressed to the unit, so the bell can deep-link to the page whose
    // Advertise card explains the pause. A notification about a listing with
    // nowhere to click is half a feature.
    const target = queryDb(
      `SELECT entity_id FROM user_notifications
       WHERE tenant_id = '${E2E_USER.tenantId}' AND entity_type = 'UNIT'
       ORDER BY created_at DESC LIMIT 1;`
    )

    expect(target).toBe(unitId)

    // Exactly one. The unit went available → reserved once; a listener that
    // announced the state rather than the transition would fire again on every
    // later write to the row.
    const count = queryDb(
      `SELECT count(*) FROM user_notifications
       WHERE tenant_id = '${E2E_USER.tenantId}' AND entity_type = 'UNIT';`
    )

    expect(count).toBe('1')
  })
})
