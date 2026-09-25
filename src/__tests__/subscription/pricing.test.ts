import { describe, it, expect } from 'vitest'

import { calculateMonthlyCharge, describeMonthlyCharge } from '@/lib/subscription/pricing'

const ghs = (n: number) => `GH₵ ${n.toFixed(2)}`

/** A FLAT-priced source: one account fee regardless of unit count. */
const flat = (entryPrice: number) => ({ entryPrice, pricingMode: 'FLAT', tiers: [] })

const graduated = (entryPrice: number) => ({
  entryPrice,
  pricingMode: 'GRADUATED',
  tiers: [{ fromQty: 1, toQty: null, flatPrice: 0, perUnitPrice: entryPrice }]
})

/**
 * These numbers are the ones the backend actually bills — see
 * PricingEngine: FLAT is one price regardless of quantity, while GRADUATED and
 * VOLUME plans derive their total from their tier table. If this drifts from that,
 * the page quotes a price the invoice will contradict, which is worse than quoting none.
 */
describe('calculateMonthlyCharge', () => {
  it('charges a flat plan once regardless of unit count', () => {
    expect(calculateMonthlyCharge(2, flat(799), null).monthlyTotal).toBe(799)
    expect(calculateMonthlyCharge(20, flat(799), null).monthlyTotal).toBe(799)
    expect(calculateMonthlyCharge(0, flat(799), null).monthlyTotal).toBe(799)
  })

  it('charges only graduated units above the free allowance', () => {
    // The exact case from the field test: 9 units on Pro is ₵120, not ₵270.
    const charge = calculateMonthlyCharge(9, graduated(30), 5)

    expect(charge.freeUnits).toBe(5)
    expect(charge.billableUnits).toBe(4)
    expect(charge.monthlyTotal).toBe(120)
  })

  it('charges nothing while the portfolio is inside the allowance', () => {
    const charge = calculateMonthlyCharge(5, graduated(30), 5)

    expect(charge.billableUnits).toBe(0)
    expect(charge.monthlyTotal).toBe(0)
  })

  it('bills every unit when there is no allowance', () => {
    expect(calculateMonthlyCharge(9, graduated(30), null).monthlyTotal).toBe(270)
    expect(calculateMonthlyCharge(9, graduated(30), 0).monthlyTotal).toBe(270)
  })

  it('does not go negative or fractional on odd input', () => {
    expect(calculateMonthlyCharge(-3, graduated(30), 5).monthlyTotal).toBe(0)
    expect(calculateMonthlyCharge(2.7, graduated(30), 0).billableUnits).toBe(2)
  })
})

describe('describeMonthlyCharge', () => {
  it('shows the subtraction, so the landlord can check it', () => {
    const text = describeMonthlyCharge(calculateMonthlyCharge(9, graduated(30), 5), ghs)

    expect(text).toContain('first 5 free')
    expect(text).toContain('4 × GH₵ 30.00')
    expect(text).toContain('GH₵ 120.00')
  })

  it('says plainly when nothing is owed yet', () => {
    expect(describeMonthlyCharge(calculateMonthlyCharge(4, graduated(30), 5), ghs)).toContain('GH₵ 0.00')
    expect(describeMonthlyCharge(calculateMonthlyCharge(0, graduated(30), 5), ghs)).toMatch(/nothing to pay/i)
  })

  it('describes a flat plan without per-unit arithmetic', () => {
    const text = describeMonthlyCharge(calculateMonthlyCharge(2, flat(799), null), ghs)

    expect(text).toMatch(/flat plan fee/i)
    expect(text).toContain('GH₵ 799.00')
    expect(text).not.toContain('×')
  })
})
