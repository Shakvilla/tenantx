import { describe, it, expect } from 'vitest'

import { calculateMonthlyCharge, describeMonthlyCharge } from '@/lib/subscription/pricing'

const ghs = (n: number) => `GH₵ ${n.toFixed(2)}`

/**
 * These numbers are the ones the backend actually bills — see
 * SubscriptionBillingServiceImpl: billableUnits = max(0, totalUnits - freeCap),
 * amount = billableUnits × pricePerUnit. If this drifts from that, the page
 * quotes a price the invoice will contradict, which is worse than quoting none.
 */
describe('calculateMonthlyCharge', () => {
  it('charges only the units above the free allowance', () => {
    // The exact case from the field test: 9 units on Pro is ₵120, not ₵270.
    const charge = calculateMonthlyCharge(9, 30, 5)

    expect(charge.freeUnits).toBe(5)
    expect(charge.billableUnits).toBe(4)
    expect(charge.monthlyTotal).toBe(120)
  })

  it('charges nothing while the portfolio is inside the allowance', () => {
    const charge = calculateMonthlyCharge(5, 30, 5)

    expect(charge.billableUnits).toBe(0)
    expect(charge.monthlyTotal).toBe(0)
  })

  it('bills every unit when there is no allowance', () => {
    expect(calculateMonthlyCharge(9, 30, null).monthlyTotal).toBe(270)
    expect(calculateMonthlyCharge(9, 30, 0).monthlyTotal).toBe(270)
  })

  it('does not go negative or fractional on odd input', () => {
    expect(calculateMonthlyCharge(-3, 30, 5).monthlyTotal).toBe(0)
    expect(calculateMonthlyCharge(2.7, 30, 0).billableUnits).toBe(2)
  })
})

describe('describeMonthlyCharge', () => {
  it('shows the subtraction, so the landlord can check it', () => {
    const text = describeMonthlyCharge(calculateMonthlyCharge(9, 30, 5), ghs)

    expect(text).toContain('first 5 free')
    expect(text).toContain('4 × GH₵ 30.00')
    expect(text).toContain('GH₵ 120.00')
  })

  it('says plainly when nothing is owed yet', () => {
    expect(describeMonthlyCharge(calculateMonthlyCharge(4, 30, 5), ghs)).toContain('GH₵ 0.00')
    expect(describeMonthlyCharge(calculateMonthlyCharge(0, 30, 5), ghs)).toMatch(/nothing to pay/i)
  })
})
