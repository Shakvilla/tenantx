export type DocumentType = {
  id: number
  propertyName: string
  propertyImage?: string
  unitNo: string
  tenantName: string
  tenantAvatar?: string
  documentImage?: string
  documentType: 'ID Card' | 'Passport' | 'Lease Agreement' | 'Contract' | 'Other'
  status: 'accepted' | 'rejected' | 'pending'
}

