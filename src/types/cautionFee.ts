export type CautionFeeStatus =
  | 'HELD'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED'
  | 'FORFEITED'

export type DeductionReason = 'DAMAGE' | 'CLEANING' | 'UNPAID_RENT' | 'OTHER'

export type PaymentMethodType = 'CASH' | 'MOBILE_MONEY' | 'CHEQUE' | 'BANK_TRANSFER'

export interface CautionFeeDeductionResponse {
  id: string
  amount: number
  reason: DeductionReason
  description: string | null
  deductedAt: string
  inspectionId: string | null
}

export interface CautionFeeResponse {
  id: string
  occupantId: string
  occupantName: string | null
  unitId: string | null
  unitNo: string | null
  propertyId: string | null
  propertyName: string | null

  amount: number
  totalDeductions: number
  refundableAmount: number
  refundAmount: number | null
  currency: string

  status: CautionFeeStatus

  paymentMethod: PaymentMethodType | null
  paymentReference: string | null
  collectedAt: string
  refundedAt: string | null
  notes: string | null

  deductions: CautionFeeDeductionResponse[]

  createdAt: string
  updatedAt: string | null
}

export interface CreateCautionFeeRequest {
  occupantId: string
  unitId?: string
  propertyId?: string
  amount: number
  currency?: string
  paymentMethod?: PaymentMethodType
  paymentReference?: string
  collectedAt?: string
  notes?: string
}

export interface AddDeductionRequest {
  amount: number
  reason?: DeductionReason
  description?: string
  deductedAt?: string
  /** Optional — links this deduction to the inspection that documented the damage */
  inspectionId?: string
}

export interface ProcessRefundRequest {
  amount?: number
  refundedAt?: string
  notes?: string
}

export interface CautionFeeStatsResponse {
  totalRecords: number
  heldCount: number
  partiallyRefundedCount: number
  refundedCount: number
  forfeitedCount: number
  totalHeldAmount: number
}
