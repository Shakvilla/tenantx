export type GuarantorRelationship =
  | 'PARENT'
  | 'SIBLING'
  | 'SPOUSE'
  | 'FRIEND'
  | 'COLLEAGUE'
  | 'OTHER'

export interface GuarantorResponse {
  id: string
  occupantId: string
  occupantName: string | null
  firstName: string
  lastName: string
  fullName: string
  phone: string | null
  email: string | null
  relationship: GuarantorRelationship
  employerName: string | null
  jobTitle: string | null
  workAddress: string | null
  notes: string | null
  createdAt: string
  updatedAt: string | null
}

export interface CreateGuarantorRequest {
  occupantId: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
  relationship?: GuarantorRelationship
  employerName?: string
  jobTitle?: string
  workAddress?: string
  notes?: string
}

export interface UpdateGuarantorRequest {
  firstName?: string
  lastName?: string
  phone?: string
  email?: string
  relationship?: GuarantorRelationship
  employerName?: string
  jobTitle?: string
  workAddress?: string
  notes?: string
}
