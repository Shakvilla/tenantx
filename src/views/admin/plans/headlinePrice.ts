// Util Imports
import { formatCurrency } from '@/utils/currency'

/**
 * The one figure that tells plans apart in a list.
 *
 * The column previously showed `entryPrice` — the quote at ONE unit — and so read "0" for every
 * plan, because every plan's first unit is free. Technically correct and useless: a column whose
 * job is to distinguish plans that cannot.
 *
 * The per-unit rate is what actually differs (PRO 30, BASIC 15), so that leads. A plan with no
 * per-unit rate charges a flat fee instead, and rendering "₵0.00/unit" for one would be a lie —
 * hence the fallback. A plan that charges neither is free, and says so.
 */
export function headlinePrice(plan: {
  pricePerUnit: string | null
  entryPrice: string | null
}): string {
  const perUnit = Number(plan.pricePerUnit ?? 0)

  if (perUnit > 0) return `${formatCurrency(perUnit)}/unit`

  const entry = Number(plan.entryPrice ?? 0)

  if (entry > 0) return formatCurrency(entry)

  return 'Free'
}
