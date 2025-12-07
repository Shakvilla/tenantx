// Documentation: /docs/subscription-plans/subscription-plans-module.md

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trial'

export type Subscription = {
  id: number
  userId: number | string
  planId: number
  planName: string
  status: SubscriptionStatus
  startDate: string
  endDate: string
  trialEndDate?: string
  autoRenew: boolean
  billingCycle: 'monthly' | 'quarterly' | 'yearly'
  amount: string
  currency: string
  createdAt?: string
  updatedAt?: string
}

export type SubscriptionUsage = {
  propertiesUsed: number
  propertiesLimit: number
  tenantsUsed: number
  tenantsLimit: number
  unitsUsed: number
  unitsLimit: number
  documentsUsed: number
  documentsLimit: number
  usersUsed: number
  usersLimit: number
}

