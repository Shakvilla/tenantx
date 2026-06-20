/**
 * Caution Fees API client
 *
 * Endpoints:
 *   POST   /api/v1/caution-fees                          → collect new caution fee
 *   GET    /api/v1/caution-fees                          → list all
 *   GET    /api/v1/caution-fees/stats                    → aggregate stats
 *   GET    /api/v1/caution-fees/{id}                     → get by id
 *   GET    /api/v1/caution-fees/occupant/{occupantId}    → list by occupant
 *   POST   /api/v1/caution-fees/{id}/deductions          → add deduction
 *   POST   /api/v1/caution-fees/{id}/refund              → process refund
 *   POST   /api/v1/caution-fees/{id}/forfeit             → forfeit fee
 */

import { apiClient, API_BASE } from './client'
import type {
  CautionFeeResponse,
  CreateCautionFeeRequest,
  AddDeductionRequest,
  ProcessRefundRequest,
  CautionFeeStatsResponse,
} from '@/types/cautionFee'

const BASE = `${API_BASE}/caution-fees`

export const cautionFeesApi = {
  create: async (data: CreateCautionFeeRequest): Promise<CautionFeeResponse> => {
    const res = await apiClient.post<CautionFeeResponse>(BASE, data)
    return res.data
  },

  getAll: async (): Promise<CautionFeeResponse[]> => {
    const res = await apiClient.get<CautionFeeResponse[]>(BASE)
    return res.data
  },

  getById: async (id: string): Promise<CautionFeeResponse> => {
    const res = await apiClient.get<CautionFeeResponse>(`${BASE}/${id}`)
    return res.data
  },

  getByOccupant: async (occupantId: string): Promise<CautionFeeResponse[]> => {
    const res = await apiClient.get<CautionFeeResponse[]>(`${BASE}/occupant/${occupantId}`)
    return res.data
  },

  getStats: async (): Promise<CautionFeeStatsResponse> => {
    const res = await apiClient.get<CautionFeeStatsResponse>(`${BASE}/stats`)
    return res.data
  },

  addDeduction: async (id: string, data: AddDeductionRequest): Promise<CautionFeeResponse> => {
    const res = await apiClient.post<CautionFeeResponse>(`${BASE}/${id}/deductions`, data)
    return res.data
  },

  processRefund: async (id: string, data?: ProcessRefundRequest): Promise<CautionFeeResponse> => {
    const res = await apiClient.post<CautionFeeResponse>(`${BASE}/${id}/refund`, data ?? {})
    return res.data
  },

  forfeit: async (id: string): Promise<CautionFeeResponse> => {
    const res = await apiClient.post<CautionFeeResponse>(`${BASE}/${id}/forfeit`, {})
    return res.data
  },
}
