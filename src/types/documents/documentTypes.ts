export type DocumentType = {
  id: string
  propertyName?: string
  propertyId?: string
  unitNo?: string
  unitId?: string
  agreementId?: string
  agreementNumber?: string
  tenantName?: string
  occupantId?: string
  tenantAvatar?: string
  documentImage?: string
  fileUrl?: string
  fileName?: string
  fileId?: string
  documentType: string
  status: 'accepted' | 'rejected' | 'pending'
  rejectReason?: string
}
