// ---- Enums ----

export type LedgerEntryType = 'CREDIT' | 'DEBIT'

export type LedgerCategory =
  // Credits
  | 'RENT_COLLECTED'
  | 'SERVICE_CHARGE_COLLECTED'
  | 'WATER_COLLECTED'
  | 'ELECTRICITY_COLLECTED'
  | 'PENALTY_COLLECTED'
  | 'SECURITY_DEPOSIT_COLLECTED'
  | 'ADVANCE_RENT_COLLECTED'
  | 'AD_HOC_COLLECTED'
  | 'ADMIN_CREDIT'
  | 'REFUND_REVERSAL'
  | 'WITHDRAWAL_REVERSAL'
  // Debits
  | 'WITHDRAWAL_INITIATED'
  | 'PLATFORM_FEE'
  | 'REFUND_ISSUED'
  | 'ADMIN_DEBIT'

export type WalletStatus = 'ACTIVE' | 'SUSPENDED' | 'FROZEN'
export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
export type LedgerEntryStatus = 'PENDING' | 'COMPLETED' | 'REVERSED' | 'FAILED'
export type MomoNetwork = 'MTN' | 'AIRTELTIGO' | 'TELECEL'

// ---- Response shapes ----

export interface WalletResponse {
  id: string
  currency: string
  status: WalletStatus
  balance: number
  pendingBalance: number
  totalEarned: number
  totalWithdrawn: number
  linkedMomoNumber: string | null
  linkedMomoNetwork: MomoNetwork | null
  createdAt: string
}

export interface LedgerEntryResponse {
  id: string
  entryType: LedgerEntryType
  category: LedgerCategory
  amount: number
  currency: string
  runningBalance: number
  status: LedgerEntryStatus
  effectiveDate: string   // ISO date YYYY-MM-DD
  invoiceId: string | null
  invoiceNumber: string | null
  propertyId: string | null
  propertyName: string | null
  unitId: string | null
  unitNumber: string | null
  occupantId: string | null
  occupantName: string | null
  description: string | null
  createdAt: string
}

export interface LedgerPageResponse {
  entries: LedgerEntryResponse[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface WithdrawalResponse {
  id: string
  amount: number
  currency: string
  payoutMethod: 'MOMO' | 'BANK'
  momoNumber: string | null
  momoNetwork: MomoNetwork | null
  status: WithdrawalStatus
  failureReason: string | null
  initiatedAt: string
  completedAt: string | null
}

// ---- Request shapes ----

export interface WithdrawalRequest {
  amount: number
  momoNumber: string
  momoNetwork: MomoNetwork
}

export interface UpdateLinkedMomoRequest {
  momoNumber: string
  momoNetwork: MomoNetwork
}

// ---- Display helpers ----

export const CATEGORY_LABELS: Record<LedgerCategory, string> = {
  RENT_COLLECTED:             'Rent',
  SERVICE_CHARGE_COLLECTED:   'Service Charge',
  WATER_COLLECTED:            'Water',
  ELECTRICITY_COLLECTED:      'Electricity',
  PENALTY_COLLECTED:          'Late Penalty',
  SECURITY_DEPOSIT_COLLECTED: 'Security Deposit',
  ADVANCE_RENT_COLLECTED:     'Advance Rent',
  AD_HOC_COLLECTED:           'Other Payment',
  ADMIN_CREDIT:               'Admin Credit',
  REFUND_REVERSAL:            'Refund Reversal',
  WITHDRAWAL_REVERSAL:        'Withdrawal Reversal',
  WITHDRAWAL_INITIATED:       'Withdrawal',
  PLATFORM_FEE:               'Platform Fee',
  REFUND_ISSUED:              'Refund',
  ADMIN_DEBIT:                'Admin Debit',
}

export const MOMO_NETWORKS: { value: MomoNetwork; label: string }[] = [
  { value: 'MTN',       label: 'MTN Mobile Money' },
  { value: 'AIRTELTIGO', label: 'AirtelTigo Money' },
  { value: 'TELECEL',   label: 'Telecel Cash' },
]
