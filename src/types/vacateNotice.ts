// ── Enums ────────────────────────────────────────────────────────────────────

export type VacateNoticeStatus =
  | 'NOTICE_GIVEN'
  | 'CONFIRMED'
  | 'MOVED_OUT'
  | 'COMPLETED'

// ── Requests ─────────────────────────────────────────────────────────────────

export interface CreateVacateNoticeRequest {
  unitId: string
  propertyId?: string
  unitNo?: string
  propertyName?: string
  occupantId?: string
  occupantName?: string
  noticeDate: string          // ISO date: YYYY-MM-DD
  expectedMoveOut: string     // ISO date
  noticeReason?: string
  notes?: string
}

export interface ConfirmVacateRequest {
  notes?: string
}

export interface MoveOutRequest {
  actualMoveOut?: string      // ISO date
  keysReturned: boolean
  keysReturnedDate?: string
  keysReturnedTo?: string
  inspectionId?: string
  notes?: string
}

export interface CompleteVacateRequest {
  notes?: string
}

// ── Responses ────────────────────────────────────────────────────────────────

export interface VacateNoticeResponse {
  id: string
  unitId: string
  propertyId: string | null
  unitNo: string | null
  propertyName: string | null
  occupantId: string | null
  occupantName: string | null
  status: VacateNoticeStatus
  noticeDate: string
  expectedMoveOut: string
  actualMoveOut: string | null
  keysReturned: boolean
  keysReturnedDate: string | null
  keysReturnedTo: string | null
  noticeReason: string | null
  notes: string | null
  inspectionId: string | null
  confirmedAt: string | null
  movedOutAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string | null
}

export interface VacateNoticeSummary {
  id: string
  unitId: string
  unitNo: string | null
  propertyName: string | null
  occupantName: string | null
  status: VacateNoticeStatus
  noticeDate: string
  expectedMoveOut: string
  actualMoveOut: string | null
  keysReturned: boolean
  inspectionId: string | null
  createdAt: string
}
