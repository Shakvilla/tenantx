export type AgentStatus = 'active' | 'inactive' | 'suspended'
export type CommissionType = 'percentage' | 'fixed'
export type CommissionStatus = 'pending' | 'paid' | 'cancelled'

export type AgentType = {
  id: string
  name: string
  email: string | null
  phone: string
  gender: string | null
  dateOfBirth: string | null
  ghanaCardNumber: string | null
  location: string | null
  avatarUrl: string | null
  status: AgentStatus
  commissionType: CommissionType
  commissionRate: number
  primaryGuarantor: string | null
  primaryGuarantorPhone: string | null
  secondaryGuarantor: string | null
  secondaryGuarantorPhone: string | null
  createdAt: string
  updatedAt: string | null
}

export type AgentCommission = {
  id: string
  agentId: string
  agentName: string
  propertyId: string | null
  unitId: string | null
  occupantId: string | null
  invoiceId: string | null
  amount: number
  currency: string
  status: CommissionStatus
  commissionDate: string
  paidAt: string | null
  notes: string | null
  createdAt: string
}

export type AgentCommissionStats = {
  total: number
  pending: number
  paid: number
  cancelled: number
  totalAmount: number
  pendingAmount: number
  paidAmount: number
}

export type CreateAgentPayload = {
  name: string
  email?: string
  phone: string
  gender?: string
  dateOfBirth?: string
  ghanaCardNumber?: string
  location?: string
  status?: AgentStatus
  commissionType?: CommissionType
  commissionRate?: number
  primaryGuarantor?: string
  primaryGuarantorPhone?: string
  secondaryGuarantor?: string
  secondaryGuarantorPhone?: string
}

export type CreateCommissionPayload = {
  agentId: string
  propertyId?: string
  unitId?: string
  occupantId?: string
  invoiceId?: string
  amount: number
  currency?: string
  commissionDate: string
  notes?: string
}
