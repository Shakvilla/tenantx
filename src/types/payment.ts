// Payment types — mirrors PaymentDto.java on the backend

export type MobileNetwork = 'MTN' | 'AIRTELTIGO' | 'VODAFONE'
export type PaymentMethod = 'MOBILE_MONEY' | 'CASH' | 'CHEQUE' | 'BANK_TRANSFER'
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'RECORDED'

// ── Requests ──────────────────────────────────────────────────────────────────

export interface InitiateMoMoRequest {
  invoiceId: string
  invoiceNumber?: string
  occupantId?: string
  occupantName?: string
  amount: number
  mobileNetwork: MobileNetwork
  walletNumber: string
  description?: string
  gatewayName?: string // defaults to tenant's default gateway (REDDE)
}

export interface RecordManualRequest {
  invoiceId: string
  invoiceNumber?: string
  occupantId?: string
  occupantName?: string
  amount: number
  paymentMethod: 'CASH' | 'CHEQUE' | 'BANK_TRANSFER'
  paymentDate?: string // ISO date YYYY-MM-DD
  chequeNumber?: string
  chequeBank?: string
  notes?: string
}

// ── Responses ─────────────────────────────────────────────────────────────────

export interface PaymentResponse {
  id: string
  invoiceId: string
  invoiceNumber?: string
  occupantId?: string
  occupantName?: string
  amount: number
  currency: string
  paymentMethod: PaymentMethod
  mobileNetwork?: MobileNetwork
  walletNumber?: string
  gatewayName?: string
  gatewayTransactionId?: string
  clientTransId?: string
  status: PaymentStatus
  failureReason?: string
  notes?: string
  paymentDate?: string
  initiatedAt?: string
  completedAt?: string
  createdAt: string
}

// ── Gateway config ────────────────────────────────────────────────────────────

export interface GatewayConfigRequest {
  gatewayName: string
  apiKey: string
  appId: string
  nickname: string
  isLive: boolean
  isDefault: boolean
}

export interface GatewayConfigResponse {
  id: string
  gatewayName: string
  apiKeyMasked: string
  appId: string
  nickname: string
  isLive: boolean
  isDefault: boolean
  isActive: boolean
}
