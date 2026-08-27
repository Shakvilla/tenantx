import { apiGet, API_BASE } from './client'
import type { ProfitLossResponse } from '@/types/profitLoss'

const BASE = `${API_BASE}/reports`

/**
 * Fetch the profit-and-loss report for a period (income − expenses) plus a current
 * occupancy-rate snapshot. Omitting both dates defaults to the current calendar month.
 *
 * GET /api/v1/reports/profit-loss?from=&to=
 */
/**
 * @param propertyId omit for the whole portfolio — the only answer available before. A landlord
 *   with a compound in Adenta and a self-contained in East Legon saw one combined figure and
 *   could not tell which was carrying the other.
 */
export function getProfitLoss(from?: string, to?: string, propertyId?: string): Promise<ProfitLossResponse> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  if (propertyId) params.set('propertyId', propertyId)
  const qs = params.toString()

  return apiGet<ProfitLossResponse>(`${BASE}/profit-loss${qs ? `?${qs}` : ''}`)
}
