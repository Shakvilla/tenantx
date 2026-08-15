import { apiGet, API_BASE } from './client'
import type { CashFlowResponse } from '@/types/cashflow'

const BASE = `${API_BASE}/reports`

/**
 * Fetch a 12-month cash flow projection based on current tenancies
 * (advance rent renewals + regular monthly rent).
 */
export function getCashFlowProjection(): Promise<CashFlowResponse> {
  return apiGet<CashFlowResponse>(`${BASE}/cash-flow`)
}
