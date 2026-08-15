import { test as setup, expect } from '@playwright/test'

import { E2E_USER } from './fixtures'

const STATE = 'e2e/.auth/state.json'

/**
 * Signs in once and saves the storage state; every other spec reuses it.
 *
 * Logging in per-test would triple the suite's runtime and make an auth outage
 * look like a dozen unrelated failures instead of one.
 */
setup('authenticate', async ({ page }) => {
  await page.goto('/login')

  await page.getByLabel('Email').fill(E2E_USER.email)
  await page.getByLabel('Password').fill(E2E_USER.password)
  await page.getByRole('button', { name: 'Log In' }).click()

  // The app is "fully authenticated" only once it has both an auth token and a
  // tenant, which is what landing on the dashboard proves.
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 })
  await expect(page.getByText(/Welcome to/i).first()).toBeVisible()

  await page.context().storageState({ path: STATE })
})
