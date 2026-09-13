import { apiGet, apiPost, API_BASE } from './client'

export interface SenderIdRequestDto {
  id: string
  requestedSenderId: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason: string | null
  createdAt: string
  approvedAt: string | null
  rejectedAt: string | null
}

const BASE = `${API_BASE}/sms/sender-id-requests`

export async function createSenderIdRequest(requestedSenderId: string): Promise<SenderIdRequestDto> {
  return apiPost<SenderIdRequestDto>(BASE, { requestedSenderId })
}

export async function getMySenderIdRequests(): Promise<SenderIdRequestDto[]> {
  return apiGet<SenderIdRequestDto[]>(BASE)
}

export interface SmsCreditAccountDto {
  activeSenderId: string | null
  balance: number
  estimatedMessagesRemaining: number
}

export async function getSmsCreditAccount(): Promise<SmsCreditAccountDto> {
  return apiGet<SmsCreditAccountDto>(`${API_BASE}/sms/credit-account`)
}

export async function fundSmsCreditFromWallet(amount: number): Promise<void> {
  return apiPost<void>(`${API_BASE}/sms/credit-account/fund/wallet`, { amount })
}

export async function fundSmsCreditViaGateway(
  amount: number,
  mobileNumber: string
): Promise<{ redirectUrl: string | null }> {
  return apiPost(`${API_BASE}/sms/credit-account/fund/gateway`, { amount, mobileNumber })
}

// --- SMS Credit Top-Up Request API ---

export interface SmsCreditTopUpRequestDto {
  id: string
  tenantId: string
  amount: number
  paymentMethod: 'WALLET' | 'MOBILE_MONEY'
  status: 'REQUESTED' | 'PAYMENT_PENDING' | 'ESCROW' | 'APPROVED' | 'COMPLETED' | 'REJECTED' | 'REFUNDED'
  escrowAmount: number | null
  paymentReference: string | null
  clientTransId: string | null
  mobileNumber: string | null
  requestedAt: string
  paidAt: string | null
  approvedAt: string | null
  approvedBy: string | null
  rejectedAt: string | null
  rejectionReason: string | null
  completedAt: string | null
  refundedAt: string | null
}

const REQUEST_BASE = `${API_BASE}/sms/credit-requests`
const ADMIN_REQUEST_BASE = `${API_BASE}/admin/sms/credit-requests`

export async function createSmsCreditRequest(
  amount: number,
  paymentMethod: 'WALLET' | 'MOBILE_MONEY',
  mobileNumber?: string
): Promise<SmsCreditTopUpRequestDto> {
  return apiPost<SmsCreditTopUpRequestDto>(REQUEST_BASE, { amount, paymentMethod, mobileNumber })
}

export async function getMySmsCreditRequests(
  status?: string,
  page = 0,
  size = 20
): Promise<{ content: SmsCreditTopUpRequestDto[]; totalElements: number }> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (status) params.set('status', status)
  return apiGet(`${REQUEST_BASE}?${params}`)
}

export async function getAdminSmsCreditRequests(
  status?: string,
  tenantId?: string,
  page = 0,
  size = 20
): Promise<{ content: SmsCreditTopUpRequestDto[]; totalElements: number }> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (status) params.set('status', status)
  if (tenantId) params.set('tenantId', tenantId)
  return apiGet(`${ADMIN_REQUEST_BASE}?${params}`)
}

export async function approveSmsCreditRequest(id: string): Promise<SmsCreditTopUpRequestDto> {
  return apiPost<SmsCreditTopUpRequestDto>(`${ADMIN_REQUEST_BASE}/${id}/approve`)
}

export async function rejectSmsCreditRequest(id: string, reason: string): Promise<SmsCreditTopUpRequestDto> {
  return apiPost<SmsCreditTopUpRequestDto>(`${ADMIN_REQUEST_BASE}/${id}/reject`, { reason })
}
