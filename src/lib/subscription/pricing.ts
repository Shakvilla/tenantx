/**
 * What a landlord will actually be charged.
 *
 * The plans page showed the per-unit rate and the unit count and left the
 * landlord to multiply them, which gives the wrong answer: the first units are
 * free. A landlord with nine units on Pro read "GH₵ 30.00 / unit / month" and
 * "Units used 9", worked out ₵270, and had no way to discover that the real
 * charge is ₵120. A price nobody can reproduce is a price nobody trusts.
 *
 * This mirrors `SubscriptionBillingServiceImpl.initiateUpgrade` exactly:
 * billable units are the total minus the FREE plan's cap — the FREE plan's cap,
 * not the target plan's, which is why `freeUnitCap` has to be read off the FREE
 * plan and passed in rather than taken from the plan being priced.
 */
export interface MonthlyCharge {
  /** Units the landlord holds. */
  totalUnits: number
  /** Units covered by the free allowance. */
  freeUnits: number
  /** Units actually charged for. */
  billableUnits: number
  /** Rate applied to each billable unit. */
  pricePerUnit: number
  /** What the landlord pays per month. */
  monthlyTotal: number
}

export const calculateMonthlyCharge = (
  totalUnits: number,
  pricePerUnit: number,
  freeUnitCap: number | null | undefined
): MonthlyCharge => {
  const units = Math.max(0, Math.floor(totalUnits) || 0)
  const cap = Math.max(0, Math.floor(freeUnitCap ?? 0) || 0)

  const freeUnits = Math.min(units, cap)
  const billableUnits = units - freeUnits
  const rate = Number(pricePerUnit) || 0

  return {
    totalUnits: units,
    freeUnits,
    billableUnits,
    pricePerUnit: rate,
    monthlyTotal: billableUnits * rate
  }
}

/**
 * The line a landlord can check against his own arithmetic. Deliberately spells
 * out the subtraction rather than presenting a total he cannot reproduce.
 */
export const describeMonthlyCharge = (
  charge: MonthlyCharge,
  formatMoney: (amount: number) => string
): string => {
  if (charge.totalUnits === 0) return 'No units yet — nothing to pay.'

  if (charge.billableUnits === 0) {
    return `All ${charge.totalUnits} ${charge.totalUnits === 1 ? 'unit is' : 'units are'} within the free allowance — you pay ${formatMoney(0)} a month.`
  }

  const billed = `${charge.billableUnits} × ${formatMoney(charge.pricePerUnit)} = ${formatMoney(charge.monthlyTotal)} a month`

  if (charge.freeUnits === 0) return `${charge.totalUnits} units billed: ${billed}.`

  return `${charge.totalUnits} units, first ${charge.freeUnits} free: ${billed}.`
}
