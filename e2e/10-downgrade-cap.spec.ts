import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

import { E2E_USER, unique } from './fixtures'

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
 * The first-run onboarding wizard opens full-screen over whatever page you asked
 * for, so every assertion below would otherwise be made against the wizard.
 * Resume Later dismisses it without marking setup skipped, leaving the tenant as
 * the other specs expect to find it.
 */
async function dismissSetupWizard(page: Page) {
  const close = page.getByRole('button', { name: 'close setup' })

  // It mounts after the page settles, so an immediate isVisible() check misses
  // it and every assertion afterwards is made against the wizard instead.
  await close.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {})

  if (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.getByRole('button', { name: /Resume Later/i }).click()
    await expect(close).toBeHidden()
  }
}

/**
 * Downgrading to a plan that cannot hold the units you already have.
 *
 * The button was enabled for anyone. The server stored the pending plan without
 * looking at the unit count, and applied it unconditionally at the end of the
 * billing period — so a landlord was told the downgrade was scheduled and found
 * out weeks later, when adding a unit stopped working, that units beyond the new
 * cap were never accounted for. Nothing in the flow mentioned them.
 *
 * The server now refuses (409, naming how many units to remove) and the card
 * says so before the landlord clicks, which is the difference between a decision
 * and an error message.
 *
 * The E2E tenant is on PRO with more units than FREE allows, which is exactly
 * the case. The counts are read from the page rather than hard-coded — earlier
 * specs in this suite broke on fixture drift, and this one only needs the
 * relationship between the two numbers to hold.
 */

test.describe('downgrading below your unit count', () => {
  /**
   * Seeded rather than assumed. This spec first read whatever units the tenant
   * happened to have, and passed — until other specs' deletes emptied the
   * tenant, at which point it failed while nothing was wrong with the product.
   * A test whose premise is ambient state is a test that reports on the fixture.
   *
   * FREE allows 5, so six units puts this tenant one over, which is the smallest
   * arrangement that exercises the rule.
   */
  test.beforeAll(async ({ playwright, browser }) => {
    const context = await browser.newContext({ storageState: 'e2e/.auth/state.json' })
    const page = await context.newPage()
    const headers = await apiHeaders(page)
    const req = await playwright.request.newContext()

    const property = await post<{ id: string }>(req, '/properties', {
      name: unique('Cap Property'),
      type: 'house',
      ownership: 'own',
      condition: 'good',
      status: 'active',
      region: 'greater-accra',
      district: 'accra-metro',
      city: 'Accra'
    }, headers)

    for (let i = 0; i < 6; i++) {
      await post(req, `/properties/${property.id}/units`, {
        propertyId: property.id,
        unitNo: unique(`CU${i}`),
        type: '1br',
        rent: 900,
        currency: 'GHS',
        status: 'available'
      }, headers)
    }

    await req.dispose()
    await context.close()
  })

  test('the Free plan card refuses, and says how many units to remove', async ({ page }) => {
    await page.goto('/subscription-plans')
    await dismissSetupWizard(page)

    const freeCard = page.locator('.MuiCard-root').filter({ hasText: 'Free' }).last()
    const downgrade = freeCard.getByRole('button', { name: /Downgrade to/i })

    await expect(downgrade).toBeVisible({ timeout: 30_000 })

    // The whole defect in one assertion: this used to be clickable.
    await expect(downgrade).toBeDisabled()

    // "Too many units" would leave a landlord guessing. The caption has to do
    // the arithmetic, so assert on the shape of the sentence, not just that
    // some text appeared.
    await expect(freeCard.getByText(/You have \d+ units and this plan allows \d+/)).toBeVisible()
    await expect(freeCard.getByText(/Remove \d+ units? to switch/)).toBeVisible()
  })

  test('the server refuses too, so a stale page cannot slip past the button', async ({ page }) => {
    await page.goto('/subscription-plans')
    await dismissSetupWizard(page)
    await expect(page.getByRole('button', { name: /Downgrade to/i }).first())
      .toBeVisible({ timeout: 30_000 })

    // The disabled button is a courtesy, not the gate. Units added in another
    // tab, or by a colleague, leave this page's count stale — so the request is
    // made directly here, the way a stale page would make it.
    const res = await page.request.post(
      `${process.env.E2E_API_URL ?? 'http://localhost:8099/api/v1'}/subscription/downgrade`,
      {
        data: { targetPlan: 'FREE' },
        headers: await (async () => {
          const cookies = await page.context().cookies()
          const token = cookies.find(c => c.name === 'auth_token')?.value
          const tenant = cookies.find(c => c.name === 'tenant_id')?.value ?? 'e2e-qa-ltd'

          if (!token) throw new Error('No auth_token cookie — auth.setup.ts did not run.')

          return { Authorization: `Bearer ${token}`, 'X-Tenant-ID': tenant, 'Content-Type': 'application/json' }
        })()
      }
    )

    expect(res.status()).toBe(409)

    const body = await res.json()

    expect(body.code).toBe('SUBSCRIPTION_DOWNGRADE_UNIT_CAP_EXCEEDED')
    expect(body.message).toMatch(/You have \d+ units and the FREE plan allows \d+/)
    expect(body.message).toMatch(/Remove \d+ units?\b/)
  })
})
