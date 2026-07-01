import { apiGet } from './client'
import type { CashFlowResponse } from '@/types/cashflow'

const BASE = '/api/v1/reports'

/**
 * Fetch a 12-month cash flow projection based on current tenancies
 * (advance rent renewals + regular monthly rent).
 */
export function getCashFlowProjection(): Promise<CashFlowResponse> {
  return apiGet<CashFlowResponse>(`${BASE}/cash-flow`)
}
