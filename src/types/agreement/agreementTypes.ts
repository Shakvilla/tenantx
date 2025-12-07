// Documentation: /docs/agreement/agreement-module.md

export type AgreementStatus = 'active' | 'expired' | 'pending' | 'terminated'
export type AgreementType = 'lease' | 'contract' | 'other'
export type PaymentFrequency = 'monthly' | 'quarterly' | 'yearly' | 'one-time'

export type Agreement = {
  id: number
  agreementNumber: string
  type: AgreementType
  status: AgreementStatus
  tenantId?: number | string
  tenantName: string
  tenantAvatar?: string
  propertyId?: number | string
  propertyName: string
  unitId?: number | string
  unitNo: string
  startDate: string
  endDate: string
  signedDate?: string
  expiryDate?: string
  amount: string
  rent?: string
  securityDeposit?: string
  lateFee?: string
  paymentFrequency?: PaymentFrequency
  terms?: string
  conditions?: string
  duration?: string
  renewalOptions?: string
  documentUrl?: string
  attachments?: string[]
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}

export type AgreementWithAction = Agreement & {
  action?: string
}

export type AgreementFormDataType = {
  agreementNumber: string
  type: AgreementType
  status: AgreementStatus
  tenantId: string
  propertyId: string
  unitId: string
  startDate: string
  endDate: string
  signedDate: string
  amount: string
  rent: string
  securityDeposit: string
  lateFee: string
  paymentFrequency: PaymentFrequency
  terms: string
  conditions: string
  duration: string
  renewalOptions: string
  documentFile: File | null
}

