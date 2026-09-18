/**
 * What a landlord will actually be charged.
 *
 * The plans page showed the per-unit rate and the unit count and left the
 * landlord to multiply them, which gives the wrong answer: the first units are
 * free. A landlord with nine units on Pro read "GH₵ 30.00 / unit / month" and
 * "Units used 9", worked out ₵270, and had no way to discover that the real
 * charge is ₵120. A price nobody can reproduce is a price nobody trusts.
 *
 * Pricing comes from the CMS migration (V159/V169): plans carry `entryPrice`
 * (the flat per-unit headline price) plus `pricingMode` and a `tiers` table.
 * The legacy `pricePerUnit` is derived and returns 0 for FLAT plans, so it can
 * never be used to compute or display a price.
 *
 * This mirrors `SubscriptionBillingServiceImpl.initiateUpgrade` exactly:
 * billable units are the total minus the FREE plan's cap — the FREE plan's cap,
 * not the target plan's, which is why `freeUnitCap` has to be read off the FREE
 * plan and passed in rather than taken from the plan being priced.
 */

/** The pricing fields a plan needs to be charged for. Mirrors SubscriptionPlanPublicDto. */
export interface PricingSource {
  entryPrice: number
  pricingMode: string   // FLAT | GRADUATED | VOLUME
  tiers: Array<{
    fromQty: number
    toQty: number | null
    flatPrice: number
    perUnitPrice: number
  }>
}

export interface MonthlyCharge {
  /** Units the landlord holds. */
  totalUnits: number
  /** Units covered by the free allowance. */
  freeUnits: number
  /** Units actually charged for. */
  billableUnits: number
  /** Effective per-unit rate used to build the bill (for display). */
  pricePerUnit: number
  /** What the landlord pays per month. */
  monthlyTotal: number
}

/** Cost of `count` billable units under a GRADUATED tier table. */
const graduatedTotal = (
  count: number,
  tiers: PricingSource['tiers']
): number => {
  let remaining = count
  let total = 0

  for (const tier of tiers) {
    if (remaining <= 0) break

    const upper = tier.toQty ?? Infinity
    // Inclusive band: a tier from 1→5 covers units 1,2,3,4,5 (five units).
    const unitsInTier = Math.max(0, Math.min(remaining, upper - tier.fromQty + 1))
    if (unitsInTier <= 0) continue

    total += tier.perUnitPrice > 0
      ? unitsInTier * tier.perUnitPrice
      : tier.flatPrice

    remaining -= unitsInTier
  }

  return total
}

/** Cost of `count` billable units under a VOLUME tier table. */
const volumeTotal = (
  count: number,
  tiers: PricingSource['tiers']
): number => {
  // Pick the tier whose band contains the billable count, then apply its rate.
  const band = tiers.find(t => {
    const upper = t.toQty ?? Infinity
    return count >= t.fromQty && count <= upper
  })

  if (!band) return 0
  return band.perUnitPrice > 0 ? count * band.perUnitPrice : band.flatPrice
}

export const calculateMonthlyCharge = (
  totalUnits: number,
  pricing: PricingSource,
  freeUnitCap: number | null | undefined
): MonthlyCharge => {
  const units = Math.max(0, Math.floor(totalUnits) || 0)
  const cap = Math.max(0, Math.floor(freeUnitCap ?? 0) || 0)

  const freeUnits = Math.min(units, cap)
  const billableUnits = units - freeUnits
  const entryPrice = Number(pricing?.entryPrice) || 0
  const mode = pricing?.pricingMode ?? 'FLAT'
  const tiers = pricing?.tiers ?? []

  let monthlyTotal: number
  let rate: number

  if (billableUnits === 0) {
    // Nothing owed, but keep the nominal unit rate so the UI can still state
    // what a unit costs once the free allowance is passed.
    monthlyTotal = 0
    rate = entryPrice
  } else if (mode === 'GRADUATED') {
    monthlyTotal = graduatedTotal(billableUnits, tiers)
    rate = monthlyTotal / billableUnits
  } else if (mode === 'VOLUME') {
    monthlyTotal = volumeTotal(billableUnits, tiers)
    rate = monthlyTotal / billableUnits
  } else {
    // FLAT (and any unrecognised mode): a single price per billable unit.
    monthlyTotal = billableUnits * entryPrice
    rate = entryPrice
  }

  return {
    totalUnits: units,
    freeUnits,
    billableUnits,
    pricePerUnit: rate,
    monthlyTotal
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
