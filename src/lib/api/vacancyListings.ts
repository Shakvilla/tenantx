import { apiClient, API_BASE } from './client'
import type { VacancyListing, CreateVacancyListingPayload, UpdateVacancyListingPayload } from '@/types/vacancyListing'

const BASE         = `${API_BASE}/vacancy-listings`
const PUBLIC_BASE  = `${API_BASE}/listings/public`

export const vacancyListingsApi = {
  /** GET /api/v1/vacancy-listings */
  getAll(): Promise<VacancyListing[]> {
    return apiClient.get<VacancyListing[]>(BASE).then(r => r.data)
  },

  /** GET /api/v1/vacancy-listings/:id */
  getById(id: string): Promise<VacancyListing> {
    return apiClient.get<VacancyListing>(`${BASE}/${id}`).then(r => r.data)
  },

  /** GET /api/v1/vacancy-listings/unit/:unitId */
  getByUnit(unitId: string): Promise<VacancyListing[]> {
    return apiClient.get<VacancyListing[]>(`${BASE}/unit/${unitId}`).then(r => r.data)
  },

  /** POST /api/v1/vacancy-listings */
  create(payload: CreateVacancyListingPayload): Promise<VacancyListing> {
    return apiClient.post<VacancyListing>(BASE, payload).then(r => r.data)
  },

  /** PATCH /api/v1/vacancy-listings/:id */
  update(id: string, payload: UpdateVacancyListingPayload): Promise<VacancyListing> {
    return apiClient.patch<VacancyListing>(`${BASE}/${id}`, payload).then(r => r.data)
  },

  /** DELETE /api/v1/vacancy-listings/:id */
  delete(id: string): Promise<void> {
    return apiClient.delete(`${BASE}/${id}`).then(() => undefined)
  },

  /** GET /api/v1/listings/public/:id — no auth required */
  getPublic(id: string): Promise<VacancyListing> {
    return apiClient.get<VacancyListing>(`${PUBLIC_BASE}/${id}`).then(r => r.data)
  },
}
