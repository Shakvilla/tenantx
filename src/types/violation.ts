// ─── Violation types ────────────────────────────────────────────────────────

export type ViolationCategory =
  | 'SUBLETTING'
  | 'PROPERTY_DAMAGE'
  | 'UNAUTHORIZED_RENOVATION'
  | 'PROHIBITED_PETS'
  | 'NOISE'
  | 'NON_PAYMENT'
  | 'OTHER'

export type ViolationSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

export type ViolationStatus =
  | 'OPEN'
  | 'WARNING_ISSUED'
  | 'FINE_ASSESSED'
  | 'RESOLVED'
  | 'ESCALATED'

export type FineStatus = 'NONE' | 'PENDING' | 'PAID' | 'WAIVED'

export interface ViolationSummary {
  id: string
  occupantId: string
  category: ViolationCategory
  severity: ViolationSeverity
  title: string
  status: ViolationStatus
  fineAmount: number | null
  fineStatus: FineStatus
  reportedAt: string
}

export interface Violation extends ViolationSummary {
  unitId: string | null
  propertyId: string | null
  description: string | null
  reportedByName: string | null
  warningIssuedAt: string | null
  resolvedAt: string | null
  escalatedAt: string | null
  resolutionNotes: string | null
  escalationNotes: string | null
  createdAt: string
  updatedAt: string | null
}

export interface CreateViolationRequest {
  occupantId: string
  category: ViolationCategory
  severity?: ViolationSeverity
  title: string
  description?: string
  reportedByName?: string
}
