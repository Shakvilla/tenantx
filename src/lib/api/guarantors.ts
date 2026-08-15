import { apiClient, API_BASE } from './client'
import type { GuarantorResponse, CreateGuarantorRequest, UpdateGuarantorRequest } from '@/types/guarantor'

const BASE = `${API_BASE}/guarantors`

export const guarantorsApi = {
  getAll: async (): Promise<GuarantorResponse[]> => {
    const res = await apiClient.get<GuarantorResponse[]>(BASE)
    return res.data
  },

  getById: async (id: string): Promise<GuarantorResponse> => {
    const res = await apiClient.get<GuarantorResponse>(`${BASE}/${id}`)
    return res.data
  },

  getByOccupant: async (occupantId: string): Promise<GuarantorResponse[]> => {
    const res = await apiClient.get<GuarantorResponse[]>(`${BASE}/occupant/${occupantId}`)
    return res.data
  },

  create: async (data: CreateGuarantorRequest): Promise<GuarantorResponse> => {
    const res = await apiClient.post<GuarantorResponse>(BASE, data)
    return res.data
  },

  update: async (id: string, data: UpdateGuarantorRequest): Promise<GuarantorResponse> => {
    const res = await apiClient.patch<GuarantorResponse>(`${BASE}/${id}`, data)
    return res.data
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/${id}`)
  },
}
