/**
 * Subscription API client — tenant-side endpoints at /api/v1/subscription
 * Uses the base apiClient which attaches Bearer token + X-Tenant-ID header.
 */

import { apiClient } from './client'

const BASE = '/subscription'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenantSubscriptionDto {
  plan: string           // "FREE" | "BASIC" | "PRO"
  displayName: string
  status: string         // "ACTIVE" | "PAST_DUE" | "CANCELLED" | "GRANDFATHERED"
  unitCount: number
  unitCap: number | null
  pricePerUnit: number
  transactionFeePct: number | null
  currentPeriodStart: string | null   // ISO date
  currentPeriodEnd: string | null     // ISO date
  pendingDowngradePlan: string | null
  cancelledAt: string | null
  features: Record<string, boolean>
}

export interface SubscriptionPlanPublicDto {
  id: string
  name: string
  displayName: string
  pricePerUnit: number
  freeUnitCap: number | null
  transactionFeePct: number | null
  active: boolean
  features: Record<string, boolean>
}

export interface SubscriptionInvoiceDto {
  id: string
  periodStart: string
  periodEnd: string
  unitCount: number
  pricePerUnit: number
  totalAmount: number
  status: string         // "PENDING" | "PAID" | "FAILED" | "VOID"
  invoiceType: string    // "UPGRADE" | "RENEWAL"
  paidAt: string | null
  reddeTransactionRef: string | null
  createdAt: string
}

export interface UpgradeRequestDto {
  targetPlan: string
  mobileNumber: string
}

export interface UpgradeInitiatedDto {
  invoiceId: string
  clientTransId: string
  status: string
  message: string
}

export interface DowngradeRequestDto {
  targetPlan: string
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function getMySubscription(): Promise<TenantSubscriptionDto> {
  const res = await apiClient.get<TenantSubscriptionDto>(BASE)
  return res.data
}

export async function getMyFeatures(): Promise<Record<string, boolean>> {
  const res = await apiClient.get<Record<string, boolean>>(`${BASE}/features`)
  return res.data
}

export async function getAvailablePlans(): Promise<SubscriptionPlanPublicDto[]> {
  const res = await apiClient.get<SubscriptionPlanPublicDto[]>(`${BASE}/plans`)
  return res.data
}

export async function initiateUpgrade(payload: UpgradeRequestDto): Promise<UpgradeInitiatedDto> {
  const res = await apiClient.post<UpgradeInitiatedDto>(`${BASE}/upgrade`, payload)
  return res.data
}

export async function scheduleDowngrade(targetPlan: string): Promise<void> {
  await apiClient.post(`${BASE}/downgrade`, { targetPlan })
}

export async function cancelSubscription(): Promise<void> {
  await apiClient.post(`${BASE}/cancel`)
}

export async function getMyInvoices(): Promise<SubscriptionInvoiceDto[]> {
  const res = await apiClient.get<SubscriptionInvoiceDto[]>(`${BASE}/invoices`)
  return res.data
}
