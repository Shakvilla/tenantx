/**
 * Agreements API Client
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete, API_BASE } from './client'
import { getStoredToken, getStoredTenantId } from './storage'

const BASE = `${API_BASE}`

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

  sublettingAllowed: boolean | null
  petsAllowed: boolean | null
  noiseRestrictionsApply: boolean | null
  noticePeriodDays: number | null
  earlyTerminationAllowed: boolean | null
  witnessName: string | null

  /** Renewal workflow: set on a successor — the agreement this one renewed. */
  previousAgreementId: string | null
  /** RENEWED | TERMINATED; null = undecided (expiry reminders still fire). */
  renewalDecision: RenewalDecision | null
  renewalDecidedAt: string | null
  renewalNotes: string | null

  createdAt: string
  updatedAt: string | null
}

export type RenewalDecision = 'RENEWED' | 'TERMINATED'

export interface RenewAgreementPayload {
  /** Defaults to the predecessor's endDate + 1 day when omitted. */
  startDate?: string
  endDate: string
  /** Defaults to the predecessor's rent when omitted. */
  rent?: number
  notes?: string
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

  sublettingAllowed?: boolean | null
  petsAllowed?: boolean | null
  noiseRestrictionsApply?: boolean | null
  noticePeriodDays?: number | null
  earlyTerminationAllowed?: boolean | null
  witnessName?: string | null
}

export type UpdateAgreementPayload = Partial<CreateAgreementPayload>

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function getAgreements(params?: { status?: string; type?: string; occupantId?: string }): Promise<Agreement[]> {
  const q = new URLSearchParams()
  if (params?.status) q.set('status', params.status)
  if (params?.type) q.set('type', params.type)
  if (params?.occupantId) q.set('occupantId', params.occupantId)
  const query = q.toString() ? `?${q}` : ''
  return apiGet(`${BASE}/agreements${query}`)
}

export async function getAgreementById(id: string): Promise<Agreement> {
  return apiGet(`${BASE}/agreements/${id}`)
}

export async function createAgreement(data: CreateAgreementPayload): Promise<Agreement> {
  return apiPost(`${BASE}/agreements`, data)
}

export async function updateAgreement(id: string, data: UpdateAgreementPayload): Promise<Agreement> {
  return apiPut(`${BASE}/agreements/${id}`, data)
}

export async function updateAgreementStatus(id: string, status: AgreementStatus): Promise<Agreement> {
  return apiPatch(`${BASE}/agreements/${id}/status`, { status })
}

export async function deleteAgreement(id: string): Promise<void> {
  return apiDelete(`${BASE}/agreements/${id}`)
}

/**
 * Renews an expiring agreement — creates a PENDING successor linked to it via
 * previousAgreementId and marks this one RENEWED. Returns the new successor agreement.
 */
export async function renewAgreement(id: string, data: RenewAgreementPayload): Promise<Agreement> {
  return apiPost(`${BASE}/agreements/${id}/renew`, data)
}

/** Terminates an agreement — records the decision and a TERMINATION notice. */
export async function terminateAgreement(id: string, notes?: string): Promise<Agreement> {
  return apiPost(`${BASE}/agreements/${id}/terminate`, { notes })
}

export async function getAgreementStats(): Promise<AgreementStats> {
  return apiGet(`${BASE}/agreements/stats`)
}

/**
 * Downloads all agreements for the current tenant as a CSV file.
 */
export async function exportAgreementsCsv(): Promise<void> {
  const token = getStoredToken() ?? ''
  const tenantId = getStoredTenantId() ?? ''

  const res = await fetch(`${BASE}/agreements/export`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    }
  })

  if (!res.ok) throw new Error('Failed to export agreements')

  const blob = await res.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = href
  a.download = `agreements-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(href)
}
