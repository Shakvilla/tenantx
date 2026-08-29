import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The plan editor must not carry its own list of feature keys.
 *
 * It did once: a hardcoded array of ten. Six real capabilities were missing from it, and two
 * entries — DOCUMENT_MANAGEMENT and MAINTENANCE_TRACKING — were not FeatureKeys at all, so
 * ticking either produced a 422 on save. The component test did not catch it, because it passed
 * a fabricated `available` prop and so never checked the list itself.
 *
 * A unit test cannot verify a list is correct without restating it, which is the same coupling
 * again. So this asserts the SHAPE instead: the editor reads the keys from the server, and passes
 * what it read straight through. The server derives them from the registry, which already fails
 * its own test when a key goes unclassified.
 *
 * There is deliberately no "contains no SCREAMING_SNAKE array" check. The file legitimately lists
 * statuses, metrics, modes and cycles that way, and a guard that cannot tell those from a feature
 * list is one that gets weakened the first time it cries wolf.
 */
describe('plan feature keys', () => {
  const source = readFileSync(
    join(process.cwd(), 'src/views/admin/plans/PlanEditorForm.tsx'),
    'utf8'
  )

  it('are fetched from the server, not listed in the editor', () => {
    expect(source).toContain('getGrantableFeatures')
  })

  it('passes the fetched list straight to the feature matrix', () => {
    // If this ever reads `available={SOMETHING_LOCAL}` again, the fetch above is decorative.
    expect(source).toMatch(/available=\{grantable\}/)
  })
})
