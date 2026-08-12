import { describe, it, expect } from 'vitest'

import { UNKNOWN_TOTAL, tablePaginationCount } from '@/lib/api/pagination'

/**
 * Why this exists.
 *
 * The cursor-paginated tables used to compute their own row total from page
 * arithmetic:
 *
 *   count={hasNext ? (page + 2) * pageSize : (page + 1) * pageSize}
 *
 * With one property on the first page that evaluates to 10, so the footer read
 * **"1–10 of 10"** for a single row. Every list in the app overstated its size
 * to the next multiple of the page size — a landlord with 3 properties was told
 * they had 10.
 *
 * The backend was returning the real figure the whole time
 * (`meta.pagination.total`); the frontend just never read it. Verified against
 * the running API: /properties, /units and /occupants each answered
 * `total: 1` for this tenant.
 */
describe('tablePaginationCount', () => {
  it('uses the real total when the API supplies one', () => {
    expect(tablePaginationCount(1)).toBe(1)
    expect(tablePaginationCount(37)).toBe(37)
  })

  it('never rounds a total up to a multiple of the page size', () => {
    // The exact regression: 1 row must not become 10.
    expect(tablePaginationCount(1)).not.toBe(10)
    expect(tablePaginationCount(3)).toBe(3)
  })

  it('keeps a legitimate zero rather than treating it as missing', () => {
    // An empty list has a known total of 0; it must not fall back to "unknown",
    // or empty tables would read "of more than 0".
    expect(tablePaginationCount(0)).toBe(0)
  })

  it('reports an unknown total honestly instead of inventing one', () => {
    // MUI renders count={-1} as "1–10 of more than 10", which is true. Making a
    // number up is what caused this bug in the first place.
    expect(tablePaginationCount(undefined)).toBe(UNKNOWN_TOTAL)
    expect(tablePaginationCount(null)).toBe(UNKNOWN_TOTAL)
  })

  it('treats a nonsense total as unknown', () => {
    expect(tablePaginationCount(NaN)).toBe(UNKNOWN_TOTAL)
    expect(tablePaginationCount(-5)).toBe(UNKNOWN_TOTAL)
    expect(tablePaginationCount(Infinity)).toBe(UNKNOWN_TOTAL)
  })

  it('exposes the sentinel MUI understands', () => {
    expect(UNKNOWN_TOTAL).toBe(-1)
  })
})
