// Documentation: /docs/subscription-plans/subscription-plans-module.md

export type PlanTier = 'free' | 'basic' | 'pro' | 'enterprise'
export type BillingCycle = 'monthly' | 'quarterly' | 'yearly'
export type PlanStatus = 'active' | 'inactive' | 'archived'

export type SubscriptionPlan = {
  id: number
  name: string
  tier: PlanTier
  description: string
  status: PlanStatus
  price: string
  currency: string
  billingCycle: BillingCycle
  trialPeriod: number // days
  maxProperties: number
  maxTenants: number
  maxUnits: number
  maxDocuments: number
  maxUsers: number
  features: string[]
  isPopular: boolean
  createdAt?: string
  updatedAt?: string
  createdBy?: string
}

export type SubscriptionPlanWithAction = SubscriptionPlan & {
  action?: string
}

export type PlanFormDataType = {
  name: string
  tier: PlanTier
  description: string
  status: PlanStatus
  price: string
  currency: string
  billingCycle: BillingCycle
  trialPeriod: string
  maxProperties: string
  maxTenants: string
  maxUnits: string
  maxDocuments: string
  maxUsers: string
  features: string[]
  isPopular: boolean
}

