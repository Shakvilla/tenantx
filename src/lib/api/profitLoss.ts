import { apiGet, API_BASE } from './client'
import type { ProfitLossResponse } from '@/types/profitLoss'

const BASE = `${API_BASE}/reports`

/**
 * Fetch the profit-and-loss report for a period (income − expenses) plus a current
 * occupancy-rate snapshot. Omitting both dates defaults to the current calendar month.
 *
 * GET /api/v1/reports/profit-loss?from=&to=
 */
export function getProfitLoss(from?: string, to?: string): Promise<ProfitLossResponse> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const qs = params.toString()

  return apiGet<ProfitLossResponse>(`${BASE}/profit-loss${qs ? `?${qs}` : ''}`)
}
