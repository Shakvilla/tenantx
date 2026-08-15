/**
 * Subscription API client — tenant-side endpoints at /api/v1/subscription
 * Uses the base apiClient which attaches Bearer token + X-Tenant-ID header.
 */

import { apiClient, API_BASE } from './client'

const BASE = `${API_BASE}/subscription`

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

export interface FeatureInfo {
  label: string
  enabled: boolean
}

export interface SubscriptionPlanPublicDto {
  id: string
  name: string
  displayName: string
  pricePerUnit: number
  freeUnitCap: number | null
  transactionFeePct: number | null
  active: boolean
  features: Record<string, FeatureInfo>
  annualDiscountPct: number | null   // e.g. 0.15 = 15% off for annual billing; null = no annual option
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
  unitCount: number                   // total units the landlord wants to license; backend subtracts free cap to compute billable units
  mobileNumber?: string               // required when paymentMethod = 'MOMO'
  billingCycle: 'MONTHLY' | 'ANNUAL'
  paymentMethod: 'MOMO' | 'CARD' | 'MANUAL' | 'WALLET'
}

export interface UpgradeInitiatedDto {
  invoiceId: string
  clientTransId: string
  status: string
  message: string
  redirectUrl: string | null   // set for CARD payments — the Paystack checkout URL to redirect to
}

/** Platform bank details for the manual (bank-transfer) payment option. Keys match the setting suffix. */
export interface ManualPaymentDetails {
  bank_name?: string
  account_name?: string
  account_number?: string
  branch?: string
  enabled?: string   // 'true' | 'false', as stored
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

export async function retryMyInvoice(invoiceId: string): Promise<void> {
  await apiClient.post(`${BASE}/invoices/${invoiceId}/retry`)
}

export async function verifySubscriptionPayment(invoiceId: string): Promise<{ confirmed: boolean }> {
  const res = await apiClient.post<{ confirmed: boolean }>(`${BASE}/invoices/${invoiceId}/verify-payment`)
  return res.data
}

export async function payInvoiceFromWallet(invoiceId: string): Promise<void> {
  await apiClient.post(`${BASE}/invoices/${invoiceId}/pay-from-wallet`)
}

export async function getManualPaymentDetails(): Promise<ManualPaymentDetails> {
  const res = await apiClient.get<ManualPaymentDetails>(`${BASE}/manual-payment-details`)
  return res.data
}
