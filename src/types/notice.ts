// ─── Notice types ───────────────────────────────────────────────────────────

export type NoticeType =
  | 'RENT_DUE'
  | 'LATE_PAYMENT'
  | 'LEASE_EXPIRY'
  | 'RENT_REVIEW'
  | 'INSPECTION'
  | 'TERMINATION'
  | 'EVICTION'
  | 'WARNING'
  | 'GENERAL'

export type NoticeStatus = 'SENT' | 'DELIVERED' | 'ACKNOWLEDGED'

export type NoticeChannel = 'SMS' | 'IN_APP' | 'WHATSAPP'

export interface NoticeSummary {
  id: string
  occupantId: string
  type: NoticeType
  title: string
  deliveryMethod: string
  status: NoticeStatus
  sourceType: string | null
  issuedByName: string | null
  issuedAt: string
  acknowledgedAt: string | null
}

export interface Notice extends NoticeSummary {
  unitId: string | null
  propertyId: string | null
  body: string
  sourceId: string | null
  createdAt: string
  updatedAt: string | null
}

export interface IssueNoticeRequest {
  occupantId: string
  type: NoticeType
  title: string
  body: string
  deliveryMethods: NoticeChannel[]
  issuedByName?: string
}
