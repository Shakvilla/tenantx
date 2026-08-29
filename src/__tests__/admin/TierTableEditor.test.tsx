import { describe, it, expect } from 'vitest'

import { addBand, removeBand, setUpperBound, rechain } from '@/views/admin/plans/TierTableEditor'
import type { PlanTier } from '@/lib/api/subscription-plans-admin'

const band = (fromQty: number, toQty: number | null, perUnitPrice = '10.00'): PlanTier => ({
  fromQty,
  toQty,
  flatPrice: '0.00',
  perUnitPrice
})

describe('tier band arithmetic', () => {
  it('keeps the last band open-ended when a band is added', () => {
    const result = addBand([band(1, null)])

    expect(result).toHaveLength(2)
    expect(result[result.length - 1].toQty).toBeNull()
  })

  it('derives each lower bound from its predecessor', () => {
    const result = setUpperBound([band(1, null), band(2, null)], 0, 15)

    expect(result[0].toQty).toBe(15)
    expect(result[1].fromQty).toBe(16)
  })

  it('leaves no gap when a middle band is removed', () => {
    const result = removeBand([band(1, 10), band(11, 25), band(26, null)], 1)

    expect(result).toHaveLength(2)
    expect(result[0].toQty).toBe(10)
    expect(result[1].fromQty).toBe(11)
    expect(result[1].toQty).toBeNull()
  })

  it('never leaves zero bands — a plan that cannot price anything is not a plan', () => {
    expect(removeBand([band(1, null)], 0)).toHaveLength(1)
  })

  it('re-chains a whole table so no gap or overlap can survive an edit', () => {
    // Deliberately corrupt: a gap between 10 and 20, and a stray upper bound on the last band.
    const result = rechain([band(1, 10), band(20, 40), band(99, 200)])

    expect(result[0].fromQty).toBe(1)
    expect(result[1].fromQty).toBe(11)
    expect(result[2].fromQty).toBe(41)
    expect(result[result.length - 1].toQty).toBeNull()
  })

  it('refuses an upper bound at or below its own lower bound, leaving the table unchanged', () => {
    const tiers = [band(1, 10), band(11, null)]

    // A band cannot end before it starts. Ignoring the edit keeps the table always-valid,
    // which is the whole point of deriving rather than validating.
    expect(setUpperBound(tiers, 1, 5)).toEqual(tiers)
  })

  it('preserves the prices already typed into each band', () => {
    const result = addBand([band(1, null, '30.00')])

    expect(result[0].perUnitPrice).toBe('30.00')
  })
})
