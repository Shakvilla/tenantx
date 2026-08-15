import { apiClient, API_BASE } from './client'
import type {
  CreateVacateNoticeRequest,
  ConfirmVacateRequest,
  MoveOutRequest,
  CompleteVacateRequest,
  VacateNoticeResponse,
  VacateNoticeSummary,
} from '@/types/vacateNotice'

const BASE = `${API_BASE}/vacate-notices`

export const vacateNoticesApi = {
  /** POST /api/v1/vacate-notices */
  create(request: CreateVacateNoticeRequest): Promise<VacateNoticeResponse> {
    return apiClient.post<VacateNoticeResponse>(BASE, request).then(r => r.data)
  },

  /** GET /api/v1/vacate-notices/{id} */
  getById(id: string): Promise<VacateNoticeResponse> {
    return apiClient.get<VacateNoticeResponse>(`${BASE}/${id}`).then(r => r.data)
  },

  /** GET /api/v1/vacate-notices?unitId={unitId} */
  getByUnit(unitId: string): Promise<VacateNoticeSummary[]> {
    return apiClient
      .get<VacateNoticeSummary[]>(BASE, { params: { unitId } })
      .then(r => r.data)
  },

  /** GET /api/v1/vacate-notices */
  getAll(): Promise<VacateNoticeSummary[]> {
    return apiClient.get<VacateNoticeSummary[]>(BASE).then(r => r.data)
  },

  /** PATCH /api/v1/vacate-notices/{id}/confirm */
  confirm(id: string, request?: ConfirmVacateRequest): Promise<VacateNoticeResponse> {
    return apiClient
      .patch<VacateNoticeResponse>(`${BASE}/${id}/confirm`, request ?? {})
      .then(r => r.data)
  },

  /** PATCH /api/v1/vacate-notices/{id}/move-out */
  markMovedOut(id: string, request: MoveOutRequest): Promise<VacateNoticeResponse> {
    return apiClient
      .patch<VacateNoticeResponse>(`${BASE}/${id}/move-out`, request)
      .then(r => r.data)
  },

  /** PATCH /api/v1/vacate-notices/{id}/complete */
  complete(id: string, request?: CompleteVacateRequest): Promise<VacateNoticeResponse> {
    return apiClient
      .patch<VacateNoticeResponse>(`${BASE}/${id}/complete`, request ?? {})
      .then(r => r.data)
  },

  /** DELETE /api/v1/vacate-notices/{id} */
  delete(id: string): Promise<void> {
    return apiClient.delete(`${BASE}/${id}`).then(() => undefined)
  },
}
