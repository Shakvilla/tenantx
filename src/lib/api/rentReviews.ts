import { apiClient, API_BASE } from './client'
import type {
  RentReviewSummary,
  RentReviewResponse,
  CreateRentReviewRequest,
} from '@/types/rentReview'

const BASE = `${API_BASE}/rent-reviews`

export const rentReviewsApi = {

  getAll: async (params?: { status?: string; unitId?: string }): Promise<RentReviewSummary[]> => {
    const res = await apiClient.get<RentReviewSummary[]>(BASE, { params })
    return res.data
  },

  getById: async (id: string): Promise<RentReviewResponse> => {
    const res = await apiClient.get<RentReviewResponse>(`${BASE}/${id}`)
    return res.data
  },

  create: async (data: CreateRentReviewRequest): Promise<RentReviewResponse> => {
    const res = await apiClient.post<RentReviewResponse>(BASE, data)
    return res.data
  },

  notify: async (id: string): Promise<RentReviewResponse> => {
    const res = await apiClient.post<RentReviewResponse>(`${BASE}/${id}/notify`)
    return res.data
  },

  apply: async (id: string): Promise<RentReviewResponse> => {
    const res = await apiClient.post<RentReviewResponse>(`${BASE}/${id}/apply`)
    return res.data
  },

  cancel: async (id: string): Promise<RentReviewResponse> => {
    const res = await apiClient.post<RentReviewResponse>(`${BASE}/${id}/cancel`)
    return res.data
  },
}
