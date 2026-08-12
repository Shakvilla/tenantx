/**
 * Shared constants for the E2E suite.
 *
 * The tests run against a DEDICATED tenant (`e2e-qa-ltd`), never against real
 * data. Creating and deleting rows is the entire point of these tests, so they
 * must not be pointed at a tenant anyone cares about.
 *
 * Create it once with:
 *   curl -s -X POST http://localhost:8099/api/v1/auth/signup \
 *     -H 'Content-Type: application/json' \
 *     -d '{"email":"e2e@localtest.dev","password":"E2eTest@2026",
 *          "fullName":"E2E Runner","companyName":"E2E QA Ltd"}'
 */
export const E2E_USER = {
  email: 'e2e@localtest.dev',
  password: 'E2eTest@2026',
  tenantId: 'e2e-qa-ltd'
} as const

/** Names are stamped per-run so a failed run never collides with the next. */
export function unique(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`
}
