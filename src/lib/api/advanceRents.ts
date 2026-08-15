/**
 * Advance Rents API client
 *
 * Endpoints:
 *   POST   /api/v1/advance-rents                         → record new advance rent (auto-generates invoices + credits wallet)
 *   GET    /api/v1/advance-rents                         → list all
 *   GET    /api/v1/advance-rents/{id}                    → get by id
 *   GET    /api/v1/advance-rents/occupant/{occupantId}   → list by occupant
 *   GET    /api/v1/advance-rents/expiring                → list expiring (< 2 months)
 *   GET    /api/v1/advance-rents/stats                   → summary stats
 *   POST   /api/v1/advance-rents/{id}/cancel             → cancel record
 */

import { apiClient, API_BASE } from './client'
import type {
  AdvanceRentResponse,
  CreateAdvanceRentRequest,
  AdvanceRentStatsResponse
} from '@/types/advanceRent'

const BASE = `${API_BASE}/advance-rents`

export const advanceRentsApi = {
  create: async (data: CreateAdvanceRentRequest): Promise<AdvanceRentResponse> => {
    const res = await apiClient.post<AdvanceRentResponse>(BASE, data)
    return res.data
  },

  getAll: async (): Promise<AdvanceRentResponse[]> => {
    const res = await apiClient.get<AdvanceRentResponse[]>(BASE)
    return res.data
  },

  getById: async (id: string): Promise<AdvanceRentResponse> => {
    const res = await apiClient.get<AdvanceRentResponse>(`${BASE}/${id}`)
    return res.data
  },

  getByOccupant: async (occupantId: string): Promise<AdvanceRentResponse[]> => {
    const res = await apiClient.get<AdvanceRentResponse[]>(`${BASE}/occupant/${occupantId}`)
    return res.data
  },

  getExpiring: async (): Promise<AdvanceRentResponse[]> => {
    const res = await apiClient.get<AdvanceRentResponse[]>(`${BASE}/expiring`)
    return res.data
  },

  getStats: async (): Promise<AdvanceRentStatsResponse> => {
    const res = await apiClient.get<AdvanceRentStatsResponse>(`${BASE}/stats`)
    return res.data
  },

  cancel: async (id: string): Promise<AdvanceRentResponse> => {
    const res = await apiClient.post<AdvanceRentResponse>(`${BASE}/${id}/cancel`, {})
    return res.data
  }
}
