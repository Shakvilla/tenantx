/**
 * Agreements API Client
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete, API_BASE } from './client'
import { getStoredTenantId } from './storage'

const BASE = `${API_BASE}`
const tenantHeader = () => ({ 'X-Tenant-ID': getStoredTenantId() })

// ---------------------------------------------------------------------------
// Types (aligned with AgreementDto.Response)
// ---------------------------------------------------------------------------

export type AgreementStatus = 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'TERMINATED'
export type AgreementType   = 'LEASE' | 'CONTRACT' | 'OTHER'
export type PaymentFrequency = 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'ONE_TIME'

export interface Agreement {
  id: string
  agreementNumber: string
  type: AgreementType
  status: AgreementStatus

  occupantId: string | null
  occupantName: string | null
  propertyId: string | null
  propertyName: string | null
  unitId: string | null
  unitNo: string | null

  startDate: string
  endDate: string
  signedDate: string | null

  rent: number | null
  securityDeposit: number | null
  lateFee: number | null
  totalAmount: number | null
  currency: string
  paymentFrequency: PaymentFrequency

  duration: string | null
  terms: string | null
  conditions: string | null
  renewalOptions: string | null
  documentUrl: string | null

  createdAt: string
  updatedAt: string | null
}

export interface AgreementStats {
  total: number
  active: number
  pending: number
  expired: number
  terminated: number
}

export interface CreateAgreementPayload {
  type: AgreementType
  occupantId?: string
  occupantName?: string
  propertyId?: string
  propertyName?: string
  unitId?: string
  unitNo?: string
  startDate: string
  endDate: string
  signedDate?: string | null
  rent?: number | null
  securityDeposit?: number | null
  lateFee?: number | null
  totalAmount?: number | null
  currency?: string
  paymentFrequency: PaymentFrequency
  duration?: string
  terms?: string
  conditions?: string
  renewalOptions?: string
  documentUrl?: string
}

export type UpdateAgreementPayload = Partial<CreateAgreementPayload>

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function getAgreements(params?: { status?: string; type?: string }): Promise<Agreement[]> {
  const q = new URLSearchParams()
  if (params?.status) q.set('status', params.status)
  if (params?.type) q.set('type', params.type)
  const query = q.toString() ? `?${q}` : ''
  return apiGet(`${BASE}/agreements${query}`, { headers: tenantHeader() })
}

export async function getAgreementById(id: string): Promise<Agreement> {
  return apiGet(`${BASE}/agreements/${id}`, { headers: tenantHeader() })
}

export async function createAgreement(data: CreateAgreementPayload): Promise<Agreement> {
  return apiPost(`${BASE}/agreements`, data, { headers: tenantHeader() })
}

export async function updateAgreement(id: string, data: UpdateAgreementPayload): Promise<Agreement> {
  return apiPut(`${BASE}/agreements/${id}`, data, { headers: tenantHeader() })
}

export async function updateAgreementStatus(id: string, status: AgreementStatus): Promise<Agreement> {
  return apiPatch(`${BASE}/agreements/${id}/status`, { status }, { headers: tenantHeader() })
}

export async function deleteAgreement(id: string): Promise<void> {
  return apiDelete(`${BASE}/agreements/${id}`, { headers: tenantHeader() })
}

export async function getAgreementStats(): Promise<AgreementStats> {
  return apiGet(`${BASE}/agreements/stats`, { headers: tenantHeader() })
}
