import { describe, it, expect } from 'vitest'

import { headlinePrice } from '@/views/admin/plans/headlinePrice'

/**
 * The plans list showed "0" for every plan, because it quoted each at ONE unit and every plan's
 * first unit is free. Technically true and completely useless: the column exists to tell plans
 * apart and could not.
 */
describe('headlinePrice', () => {
  it('shows the per-unit rate a plan actually charges', () => {
    // PRO: five free, then 30. The 30 is what distinguishes it from BASIC's 15.
    expect(headlinePrice({ pricePerUnit: '30.0000', entryPrice: '0.00' })).toBe('GH₵30.00/unit')
    expect(headlinePrice({ pricePerUnit: '15.0000', entryPrice: '0.00' })).toBe('GH₵15.00/unit')
  })

  it('falls back to the entry price for a plan with no per-unit rate', () => {
    // A flat plan charges a fee, not a rate. Rendering "₵0.00/unit" would be a lie.
    expect(headlinePrice({ pricePerUnit: '0.0000', entryPrice: '150.00' })).toBe('GH₵150.00')
  })

  it('says a free plan is free rather than showing zero', () => {
    expect(headlinePrice({ pricePerUnit: '0.0000', entryPrice: '0.00' })).toBe('Free')
  })

  it('tolerates the fields being absent', () => {
    expect(headlinePrice({ pricePerUnit: null, entryPrice: null })).toBe('Free')
  })
})
