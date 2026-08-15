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
