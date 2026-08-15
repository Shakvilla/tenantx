// ── Enums ─────────────────────────────────────────────────────────────────────

export type UtilityType           = 'ELECTRICITY' | 'WATER'
export type MeterType             = 'PREPAID' | 'POSTPAID'
export type PaymentResponsibility = 'LANDLORD' | 'CARETAKER' | 'TENANT'
export type BillSplitMethod       = 'EQUAL' | 'MANUAL' | 'BY_OCCUPANT'
export type BillStatus            = 'UNPAID' | 'PAID'

// ── Meters ────────────────────────────────────────────────────────────────────

export interface UnitSummary {
  unitId: string
  unitNo: string
}

export interface UtilityMeterResponse {
  id:                    string
  propertyId:            string
  propertyName:          string | null
  meterNumber:           string
  utilityType:           UtilityType
  meterType:             MeterType
  paymentResponsibility: PaymentResponsibility
  splitMethod:           BillSplitMethod
  notes:                 string | null
  unitCount:             number
  units:                 UnitSummary[]
  createdAt:             string
  updatedAt:             string | null
}

export interface CreateUtilityMeterRequest {
  propertyId:            string
  meterNumber:           string
  utilityType:           UtilityType
  meterType?:            MeterType
  paymentResponsibility?: PaymentResponsibility
  splitMethod?:          BillSplitMethod
  notes?:                string
  unitIds?:              string[]
}

export interface UpdateUtilityMeterRequest {
  meterNumber?:           string
  paymentResponsibility?: PaymentResponsibility
  splitMethod?:           BillSplitMethod
  notes?:                 string
}

// ── Bills ─────────────────────────────────────────────────────────────────────

export interface BillSplitResponse {
  unitId:       string
  unitNo:       string | null
  occupantId:   string | null
  occupantName: string | null
  shareAmount:  number
  sharePct:     number | null
}

export interface UtilityBillResponse {
  id:                  string
  meterId:             string
  meterNumber:         string
  utilityType:         UtilityType
  propertyName:        string | null
  billingPeriodStart:  string
  billingPeriodEnd:    string
  previousReading:     number | null
  currentReading:      number | null
  unitsConsumed:       number | null
  amount:              number
  status:              BillStatus
  paidAt:              string | null
  paidBy:              PaymentResponsibility | null
  splitMethod:         BillSplitMethod
  notes:               string | null
  splits:              BillSplitResponse[]
  createdAt:           string
  updatedAt:           string | null
}

export interface ManualSplit {
  unitId: string
  amount: number
}

export interface CreateUtilityBillRequest {
  meterId:            string
  billingPeriodStart: string
  billingPeriodEnd:   string
  previousReading?:   number
  currentReading?:    number
  amount:             number
  splitMethod?:       BillSplitMethod
  notes?:             string
  manualSplits?:      ManualSplit[]
}

export interface PayBillRequest {
  paidBy: PaymentResponsibility
}

// ── Tokens ────────────────────────────────────────────────────────────────────

export interface UtilityTokenResponse {
  id:             string
  meterId:        string
  meterNumber:    string
  propertyName:   string | null
  purchasedAt:    string
  tokenNumber:    string | null
  unitsPurchased: number | null
  amountPaid:     number
  purchasedBy:    PaymentResponsibility
  notes:          string | null
  createdAt:      string
}

export interface CreateUtilityTokenRequest {
  meterId:         string
  purchasedAt?:    string
  tokenNumber?:    string
  unitsPurchased?: number
  amountPaid:      number
  purchasedBy?:    PaymentResponsibility
  notes?:          string
}
