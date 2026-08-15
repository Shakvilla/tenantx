import { execFileSync } from 'node:child_process'

import { test as reset } from '@playwright/test'

import { E2E_USER } from './fixtures'

/**
 * Empties the E2E tenant before each run.
 *
 * Without this the suite is single-use: the first-run wizard only appears while
 * the tenant has no properties, so the second run would find no wizard and fail
 * for a reason that has nothing to do with the code under test.
 *
 * Scoped to `e2e-qa-ltd` by an explicit WHERE on every statement. It must never
 * be pointed at a tenant with real data.
 */
/**
 * Order matters only for readability — every statement is a plain DELETE scoped
 * by tenant_id, and none of these carry a foreign key to another (see F-09:
 * agreements have no FK to property/unit/occupant at all).
 */
const TABLES = [
  // Notifications accumulate across runs, and the listing-pause spec asserts
  // exactly one was written — a listener that announced a unit's state rather
  // than its transition would show up as a growing count, which only reads as
  // a failure from a clean slate.
  'user_notifications',

  // Payments and the wallet entries they credit, before the invoices they settle.
  // Without these the payment spec's second run starts against an invoice that
  // is already PAID, and its part-payment assertion fails for the wrong reason.
  'payment_transactions',
  'ledger_entries',
  'invoices',
  'agreements',
  'vacancy_listings',
  'occupants',
  'units',
  'properties'
] as const

reset('reset the e2e tenant', async () => {
  if (E2E_USER.tenantId !== 'e2e-qa-ltd') {
    throw new Error(`Refusing to wipe data for tenant "${E2E_USER.tenantId}" — E2E only runs against e2e-qa-ltd.`)
  }

  /**
   * Lift the unit ceiling for this tenant, and only this tenant.
   *
   * e2e-qa-ltd sits on the FREE plan, which caps units at 5. The specs share
   * that budget across one run and had already spent all of it, so the next
   * spec to need a unit failed with SUBSCRIPTION_UNIT_LIMIT_EXCEEDED — a
   * fixture running out of room, reported as though the feature under test
   * were broken.
   *
   * `grandfathered_unit_cap` is the per-tenant override the enforcement checks
   * first (SubscriptionServiceImpl.enforceUnitCap). Raising it leaves the plan
   * itself untouched, so the suite keeps exercising the same FREE-tier feature
   * gating it always has; only the unit count changes. Editing the FREE plan's
   * own cap would have moved the ceiling for every tenant in the database.
   */
  const raiseCap = `UPDATE tenant_subscriptions SET grandfathered_unit_cap = 500
                    WHERE tenant_id = '${E2E_USER.tenantId}';`

  const sql = TABLES.map(t => `DELETE FROM ${t} WHERE tenant_id = '${E2E_USER.tenantId}';`).join(' ') + raiseCap

  const out = execFileSync(
    'docker',
    ['exec', 'tenantx-backend-db-1', 'psql', '-U', 'postgres', '-d', 'tenantx', '-c', sql],
    { encoding: 'utf8' }
  )

  console.log(`[reset] cleared ${E2E_USER.tenantId}: ${out.trim().split('\n').join(' ')}`)
})
