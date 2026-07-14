/**
 * Notices API client
 *
 * Endpoints:
 *   POST   /api/v1/notices                       → landlord issues a notice
 *   GET    /api/v1/notices?occupantId=           → notice history for an occupant
 *   GET    /api/v1/notices/my                     → the current occupant's own notices
 *   PATCH  /api/v1/notices/{id}/acknowledge       → occupant acknowledges a notice
 */

import { apiClient, API_BASE } from './client'
import type { Notice, NoticeSummary, IssueNoticeRequest } from '@/types/notice'

const BASE = `${API_BASE}/notices`

export const noticesApi = {
  issue: async (data: IssueNoticeRequest): Promise<Notice> => {
    const res = await apiClient.post<Notice>(BASE, data)
    return res.data
  },

  listByOccupant: async (occupantId: string): Promise<NoticeSummary[]> => {
    const res = await apiClient.get<NoticeSummary[]>(BASE, { params: { occupantId } })
    return res.data
  },

  listMine: async (): Promise<NoticeSummary[]> => {
    const res = await apiClient.get<NoticeSummary[]>(`${BASE}/my`)
    return res.data
  },

  acknowledge: async (id: string): Promise<Notice> => {
    const res = await apiClient.patch<Notice>(`${BASE}/${id}/acknowledge`)
    return res.data
  },
}
