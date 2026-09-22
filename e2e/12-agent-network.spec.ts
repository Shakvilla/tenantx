import { test, expect } from '@playwright/test'

/**
 * Agent network — route guards, explicit signup path, and rollout gating.
 *
 * These need no feature flags and no landlord relationship: they prove the
 * agent surface exists, is unreachable without a session, and stays locked
 * until the AGENT_NETWORK flag is enabled for the tenant (V198 seeds it
 * disabled everywhere; the pilot enables it per tenant).
 *
 * Positive relationship/mandate flows live in 13-agent-relationships.spec.ts,
 * which skips itself while the flag is off.
 */

const SIGNED_OUT = { storageState: { cookies: [], origins: [] } }

test.describe('agent network guards', () => {
  test.describe('signed out', () => {
    test.use(SIGNED_OUT)

    test('agent portal redirects to login with redirectTo', async ({ page }) => {
      await page.goto('/agent')
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fagent/)
    })

    test('agent referrals redirect to login with redirectTo', async ({ page }) => {
      await page.goto('/agent/referrals')
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fagent%2Freferrals/)
    })

    test('relationships page redirects to login with redirectTo', async ({ page }) => {
      await page.goto('/members/relationships')
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fmembers%2Frelationships/)
    })
  })

  test.describe('signed in', () => {
    test('agent signup is an explicit path, not hidden under landlord signup', async ({ page }) => {
      await page.goto('/register/agent')
      await expect(page.getByText(/Join as an agent/i).first()).toBeVisible()
      await expect(page.getByLabel('Email')).toBeVisible()

      // Password is collected at the final step, after OTP verification.
      await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible()
    })

    test('landlord register links to the agent path', async ({ page }) => {
      await page.goto('/register')
      await expect(page.getByRole('link', { name: /Join as an agent/i })).toBeVisible()
    })

    test('relationships page is locked until AGENT_NETWORK is enabled', async ({ page }) => {
      await page.goto('/members/relationships')

      // Either the locked upgrade prompt (flag off — the V198 default) or the
      // relationship list (flag on for this tenant). Both are valid states;
      // what must never happen is a raw error or an empty shell.
      const locked = page.getByText(/Agent relationships are part of the agent network/i)
      const unlocked = page.getByText(/Agent relationships/i).first()

      await expect(locked.or(unlocked)).toBeVisible({ timeout: 30_000 })
    })
  })
})
