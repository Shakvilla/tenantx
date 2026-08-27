export type AdvanceRentStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED' | 'PENDING' | 'FAILED'

export type PaymentMethodType = 'CASH' | 'MOBILE_MONEY' | 'CHEQUE' | 'BANK_TRANSFER'

export interface AdvanceRentResponse {
  id: string
  occupantId: string
  occupantName: string | null
  unitId: string | null
  unitNo: string | null
  propertyId: string | null
  propertyName: string | null

  totalAmount: number
  monthlyRent: number
  monthsCovered: number
  /** Number of PAID invoices auto-generated for this advance rent record */
  invoiceCount: number
  remainingBalance: number
  currency: string

  periodStart: string   // ISO date "2024-01-01"
  periodEnd: string     // ISO date "2026-01-01"

  monthsRemaining: number   // computed server-side
  percentageUsed: number    // 0–100, computed server-side

  status: AdvanceRentStatus
  paymentMethod: PaymentMethodType | null
  paymentReference: string | null
  notes: string | null

  createdAt: string
  updatedAt: string | null
}

export interface CreateAdvanceRentRequest {
  occupantId: string
  unitId?: string
  propertyId?: string
  monthlyRent: number
  monthsCovered: number
  periodStart: string   // ISO date — when the tenancy the money buys begins
  /**
   * When the money actually changed hands. Optional; the server stamps today if absent.
   *
   * Separate from periodStart on purpose: a tenant can pay in July for a lease starting in
   * September, and reporting that cash as September income is what makes a landlord stop
   * believing the collection figure.
   */
  paymentDate?: string  // ISO date
  currency?: string
  paymentMethod?: PaymentMethodType
  paymentReference?: string
  notes?: string
}

export interface AdvanceRentStatsResponse {
  totalRecords: number
  activeCount: number
  expiringCount: number
  expiredCount: number
}

export interface AdvanceRentLimits {
  minMonths: number
  maxMonths: number
  occupantSelfServiceEnabled: boolean
}

export interface InitiateAdvancePaymentRequest {
  occupantId: string
  unitId: string
  propertyId?: string
  monthlyRent: number
  monthsCovered: number
  periodStart: string
  mobileNetwork: 'MTN' | 'AIRTELTIGO' | 'VODAFONE'
  walletNumber: string
}

export interface AdvancePaymentInitiated {
  advanceRentId: string
  paymentTransactionId: string
  status: 'PENDING'
}
