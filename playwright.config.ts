import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests for the write paths — creating, editing and deleting.
 *
 * The unit suite (vitest) covers logic in isolation and the manual QA pass
 * covered the read paths, but nothing exercised a form being filled and
 * submitted against a real backend. That was the largest gap before release.
 *
 * These run against the local Docker stack, NOT a mock:
 *   web  http://localhost:3099
 *   api  http://localhost:8099
 *
 * Bring it up with (the ports are not optional — see the repo notes):
 *   BACKEND_PORT=8099 WEB_PORT=3099 docker compose up -d
 */
export default defineConfig({
  testDir: './e2e',
  // Writes race each other: two specs creating properties in the same tenant
  // make row-count assertions non-deterministic. Correctness over speed here.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  // The dashboard fans out to a dozen API calls on load and this stack is slow
  // under test; /login alone measured over 4s. Tight timeouts here produce
  // failures that look like product bugs and are not.
  timeout: 180_000,
  expect: { timeout: 20_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3099',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    // The app is a heavy MUI dashboard; give actions room on a loaded machine.
    actionTimeout: 20_000,
    navigationTimeout: 90_000
  },
  projects: [
    { name: 'reset', testMatch: /reset\.setup\.ts/ },
    { name: 'setup', testMatch: /auth\.setup\.ts/, dependencies: ['reset'] },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/state.json' },
      dependencies: ['setup']
    }
  ]
})
