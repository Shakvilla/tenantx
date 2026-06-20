export type AdvanceRentStatus = 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'CANCELLED'

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
  periodStart: string   // ISO date
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
