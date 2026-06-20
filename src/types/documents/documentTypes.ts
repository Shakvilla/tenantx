export type DocumentType = {
  id: string
  propertyName?: string
  propertyId?: string
  unitNo?: string
  unitId?: string
  tenantName?: string
  occupantId?: string
  tenantAvatar?: string
  documentImage?: string
  fileUrl?: string
  fileName?: string
  documentType: string
  status: 'accepted' | 'rejected' | 'pending'
  rejectReason?: string
}
