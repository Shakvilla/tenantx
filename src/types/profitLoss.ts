// ─── Profit & Loss report ───────────────────────────────────────────────────

/**
 * Combined P&L + occupancy snapshot.
 *
 * Income basis: PAID invoices attributed to the period by `issuedDate` (Invoice has no `paidAt`),
 * i.e. accrual-filtered-to-paid rather than true payment-date cash basis.
 * Occupancy basis: a current snapshot, not an average over the period.
 */
export interface ProfitLossResponse {
  from: string
  to: string
  totalIncome: number
  totalExpenses: number
  netProfit: number
  /** netProfit / totalIncome * 100; 0 when there is no income */
  profitMargin: number
  occupiedUnits: number
  vacantUnits: number
  damagedUnits: number
  totalUnits: number
  /** occupiedUnits / totalUnits * 100; 0 when there are no units */
  occupancyRate: number
}
