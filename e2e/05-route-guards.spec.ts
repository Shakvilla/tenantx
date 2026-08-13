import { test, expect } from '@playwright/test'

/**
 * Which routes the middleware lets through without a session.
 *
 * `isPublicPageRoute` matched its list with a bare `startsWith`, and the
 * platform's offline notice sat at `/maintenance`. So every page under the
 * landlord's own Maintenance section — Requests, Categories, Maintainers,
 * Preventative Schedules — was classified public: a signed-out visitor got a
 * 200 and a dashboard shell instead of a redirect to login, and a signed-in
 * one reached Server Components with no injected auth headers. Typing
 * `/maintenance` itself served the "platform is temporarily offline" screen.
 *
 * The offline notice now lives at `/platform-offline`, and route matching
 * respects segment boundaries.
 *
 * These tests run in a context with NO storage state — the point is what an
 * anonymous visitor gets — so they cannot rely on the suite's shared login.
 */

const SIGNED_OUT = { storageState: { cookies: [], origins: [] } }

test.describe('route guards', () => {
  test.describe('signed out', () => {
    test.use(SIGNED_OUT)

    test('every page under Maintenance redirects to login', async ({ page }) => {
      for (const path of [
        '/maintenance',
        '/maintenance/requests',
        '/maintenance/categories',
        '/maintenance/maintainers',
        '/maintenance/preventative-schedules'
      ]) {
        await page.goto(path)
        // The middleware puts the original path in redirectTo, percent-encoded
        // by URLSearchParams — so asserting it also proves the visitor gets
        // back where they were going after signing in.
        await expect(page, `${path} must not be reachable signed out`).toHaveURL(
          new RegExp(`/login\\?redirectTo=${encodeURIComponent(path)}`)
        )
      }
    })

    test('a protected page still redirects, and the offline notice still does not', async ({ page }) => {
      // The control: proves the assertion above is testing the Maintenance
      // subtree rather than a guard that redirects everything.
      await page.goto('/properties')
      await expect(page).toHaveURL(/\/login\?redirectTo=%2Fproperties/)

      // The offline notice has to stay reachable with no session — it is what
      // a visitor sees when the platform is down, which is exactly when
      // nobody can log in.
      await page.goto('/platform-offline')
      await expect(page).toHaveURL(/\/platform-offline/)
      await expect(page.getByText(/maintenance/i).first()).toBeVisible()
    })

    test('a route merely starting with a public one is not itself public', async ({ page }) => {
      // `/jobs` is public so maintainers can open a job link without an
      // account. Under the old prefix rule that also handed out `/jobs-archive`
      // and anything else sharing those characters. No such route exists today
      // — which is the point: the guard must not depend on nobody adding one.
      await page.goto('/jobs-archive')
      await expect(page).toHaveURL(/\/login\?redirectTo=/)
    })
  })

  test('signed in, /maintenance lands on the request queue', async ({ page }) => {
    // It is a sidebar group, not a page. It used to serve the platform's
    // "temporarily offline" screen to any landlord who typed or bookmarked it.
    await page.goto('/maintenance')
    await expect(page).toHaveURL(/\/maintenance\/requests/)
    await expect(page.getByText(/temporarily offline/i)).toHaveCount(0)
  })
})
