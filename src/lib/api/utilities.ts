import { apiClient, API_BASE } from './client'
import type {
  UtilityMeterResponse,
  CreateUtilityMeterRequest,
  UpdateUtilityMeterRequest,
  UtilityBillResponse,
  CreateUtilityBillRequest,
  PayBillRequest,
  UtilityTokenResponse,
  CreateUtilityTokenRequest,
} from '@/types/utility'

const BASE = `${API_BASE}/utilities`

export const utilitiesApi = {
  // ── Meters ──────────────────────────────────────────────────────────────────

  getAllMeters: async (): Promise<UtilityMeterResponse[]> => {
    const res = await apiClient.get<UtilityMeterResponse[]>(`${BASE}/meters`)
    return res.data
  },

  getMetersByProperty: async (propertyId: string): Promise<UtilityMeterResponse[]> => {
    const res = await apiClient.get<UtilityMeterResponse[]>(`${BASE}/meters/property/${propertyId}`)
    return res.data
  },

  getMeterById: async (id: string): Promise<UtilityMeterResponse> => {
    const res = await apiClient.get<UtilityMeterResponse>(`${BASE}/meters/${id}`)
    return res.data
  },

  createMeter: async (data: CreateUtilityMeterRequest): Promise<UtilityMeterResponse> => {
    const res = await apiClient.post<UtilityMeterResponse>(`${BASE}/meters`, data)
    return res.data
  },

  updateMeter: async (id: string, data: UpdateUtilityMeterRequest): Promise<UtilityMeterResponse> => {
    const res = await apiClient.patch<UtilityMeterResponse>(`${BASE}/meters/${id}`, data)
    return res.data
  },

  deleteMeter: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/meters/${id}`)
  },

  addUnitsToMeter: async (meterId: string, unitIds: string[]): Promise<UtilityMeterResponse> => {
    const res = await apiClient.post<UtilityMeterResponse>(`${BASE}/meters/${meterId}/units`, unitIds)
    return res.data
  },

  removeUnitFromMeter: async (meterId: string, unitId: string): Promise<UtilityMeterResponse> => {
    const res = await apiClient.delete<UtilityMeterResponse>(`${BASE}/meters/${meterId}/units/${unitId}`)
    return res.data
  },

  // ── Bills ──────────────────────────────────────────────────────────────────

  getBillsByMeter: async (meterId: string): Promise<UtilityBillResponse[]> => {
    const res = await apiClient.get<UtilityBillResponse[]>(`${BASE}/bills/meter/${meterId}`)
    return res.data
  },

  getBillById: async (id: string): Promise<UtilityBillResponse> => {
    const res = await apiClient.get<UtilityBillResponse>(`${BASE}/bills/${id}`)
    return res.data
  },

  createBill: async (data: CreateUtilityBillRequest): Promise<UtilityBillResponse> => {
    const res = await apiClient.post<UtilityBillResponse>(`${BASE}/bills`, data)
    return res.data
  },

  payBill: async (id: string, data: PayBillRequest): Promise<UtilityBillResponse> => {
    const res = await apiClient.patch<UtilityBillResponse>(`${BASE}/bills/${id}/pay`, data)
    return res.data
  },

  // ── Tokens ──────────────────────────────────────────────────────────────────

  getTokensByMeter: async (meterId: string): Promise<UtilityTokenResponse[]> => {
    const res = await apiClient.get<UtilityTokenResponse[]>(`${BASE}/tokens/meter/${meterId}`)
    return res.data
  },

  createToken: async (data: CreateUtilityTokenRequest): Promise<UtilityTokenResponse> => {
    const res = await apiClient.post<UtilityTokenResponse>(`${BASE}/tokens`, data)
    return res.data
  },

  deleteToken: async (id: string): Promise<void> => {
    await apiClient.delete(`${BASE}/tokens/${id}`)
  },
}
