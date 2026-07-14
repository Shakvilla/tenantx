/**
 * Violations API client
 *
 * Endpoints:
 *   POST   /api/v1/violations                      → log a violation (OPEN)
 *   GET    /api/v1/violations?occupantId=          → list (by occupant, or all)
 *   GET    /api/v1/violations/{id}                 → get by id
 *   PATCH  /api/v1/violations/{id}/warn            → issue warning
 *   PATCH  /api/v1/violations/{id}/fine            → assess fine { amount }
 *   PATCH  /api/v1/violations/{id}/fine-status     → { fineStatus: PAID | WAIVED }
 *   PATCH  /api/v1/violations/{id}/resolve         → { notes }
 *   PATCH  /api/v1/violations/{id}/escalate        → { notes }
 *   DELETE /api/v1/violations/{id}                 → delete (OPEN only)
 */

import { apiClient, API_BASE } from './client'
import type { Violation, ViolationSummary, CreateViolationRequest, FineStatus } from '@/types/violation'

const BASE = `${API_BASE}/violations`

export const violationsApi = {
  create: async (data: CreateViolationRequest): Promise<Violation> => {
    const res = await apiClient.post<Violation>(BASE, data)
    return res.data
  },

  listByOccupant: async (occupantId: string): Promise<ViolationSummary[]> => {
    const res = await apiClient.get<ViolationSummary[]>(BASE, { params: { occupantId } })
    return res.data
  },

  warn: async (id: string): Promise<Violation> => {
    const res = await apiClient.patch<Violation>(`${BASE}/${id}/warn`)
    return res.data
  },

  assessFine: async (id: string, amount: number): Promise<Violation> => {
    const res = await apiClient.patch<Violation>(`${BASE}/${id}/fine`, { amount })
    return res.data
  },

  setFineStatus: async (id: string, fineStatus: Extract<FineStatus, 'PAID' | 'WAIVED'>): Promise<Violation> => {
    const res = await apiClient.patch<Violation>(`${BASE}/${id}/fine-status`, { fineStatus })
    return res.data
  },

  resolve: async (id: string, notes?: string): Promise<Violation> => {
    const res = await apiClient.patch<Violation>(`${BASE}/${id}/resolve`, { notes })
    return res.data
  },

  escalate: async (id: string, notes?: string): Promise<Violation> => {
    const res = await apiClient.patch<Violation>(`${BASE}/${id}/escalate`, { notes })
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`)
  },
}
