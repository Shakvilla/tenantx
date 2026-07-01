/**
 * Admin API client — separate Axios instance for /api/v1/admin/* endpoints.
 *
 * Key differences from the landlord apiClient:
 *  - Attaches admin_token (not auth_token)
 *  - Never sends X-Tenant-ID header
 *  - No refresh-token flow (admin sessions are non-refreshable for now)
 *  - 401 on admin routes → clear admin token + dispatch ADMIN_SESSION_EXPIRED
 */

import axios from 'axios'
import type { AxiosInstance } from 'axios'

import { getStoredAdminToken, setStoredAdminToken, clearStoredAdminToken } from './admin-storage'

const ADMIN_API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1')
  .replace(/\/api\/v1$/, '') + '/api/v1/admin'

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const adminClient: AxiosInstance = axios.create({
  baseURL: ADMIN_API_BASE,
  headers: { 'Content-Type': 'application/json' }
})

adminClient.interceptors.request.use(config => {
  const token = getStoredAdminToken()
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

adminClient.interceptors.response.use(
  res => res,
  error => {
    if (error.response?.status === 401) {
      clearStoredAdminToken()
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ADMIN_SESSION_EXPIRED'))
      }
    }
    return Promise.reject(error)
  }
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminLoginResponse {
  accessToken: string
  refreshToken: string | null
  tokenType: string
  expiresIn: number
  expiresAt: string
  user: null
}

export interface AdminProfile {
  id: string
  email: string
  fullName: string
  active: boolean
  roles: string[]
  permissions: string[]
}

export interface TenantRecord {
  id: string
  tenant_id: string
  name: string
  description: string | null
  active: boolean
  createdAt: string
  ownerEmail: string | null
  ownerName: string | null
}

export interface AdminRecord {
  id: string
  email: string
  fullName: string
  active: boolean
  createdAt: string
  lastLoginAt: string | null
  roles: string[]
  mfaRequired: boolean
}

export interface RoleRecord {
  id: string
  name: string
  description: string | null
  permissions: string[]
  createdAt?: string
}

export interface CreateAdminPayload {
  email: string
  fullName: string
  password: string
  roleNames?: string[]
}

export interface CreateTenantPayload {
  name: string
  tenantId: string
  description?: string
}

/** tenant_id is immutable after creation and must not be sent on updates */
export interface UpdateTenantPayload {
  name?: string
  description?: string
  active?: boolean
}

export interface PaginatedResponse<T> {
  data: T
  cursor: string | null
  hasMore: boolean
  total?: number
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function adminGet<T>(path: string): Promise<T> {
  const res = await adminClient.get<T>(path)
  return res.data
}

async function adminPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await adminClient.post<T>(path, body)
  return res.data
}

async function adminPut<T>(path: string, body: unknown): Promise<T> {
  const res = await adminClient.put<T>(path, body)
  return res.data
}

async function adminDelete<T = void>(path: string): Promise<T> {
  const res = await adminClient.delete<T>(path)
  return res.data
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  // Call directly (no auth header needed for login)
  const res = await axios.post<AdminLoginResponse>(`${ADMIN_API_BASE}/auth/login`, { email, password })
  setStoredAdminToken(res.data.accessToken)
  return res.data
}

export async function getAdminMe(): Promise<AdminProfile> {
  return adminGet<AdminProfile>('/auth/me')
}

export function adminLogout(): void {
  clearStoredAdminToken()
}

export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<void> {
  await adminPut('/auth/change-password', { currentPassword, newPassword })
}

// ---------------------------------------------------------------------------
// Tenants (landlord accounts)
// ---------------------------------------------------------------------------

export async function getAdminTenants(cursor?: string, size = 50): Promise<PaginatedResponse<TenantRecord[]>> {
  const params = new URLSearchParams({ size: String(size) })
  if (cursor) params.set('cursor', cursor)
  return adminGet<PaginatedResponse<TenantRecord[]>>(`/tenants?${params}`)
}

export async function getAdminTenant(id: string): Promise<TenantRecord> {
  return adminGet<TenantRecord>(`/tenants/${id}`)
}

export async function createAdminTenant(payload: CreateTenantPayload): Promise<TenantRecord> {
  return adminPost<TenantRecord>('/tenants', payload)
}

export async function updateAdminTenant(id: string, payload: UpdateTenantPayload): Promise<TenantRecord> {
  return adminPut<TenantRecord>(`/tenants/${id}`, payload)
}

export async function deactivateAdminTenant(id: string): Promise<void> {
  return adminDelete(`/tenants/${id}`)
}

export async function exportTenantsCsv(): Promise<void> {
  const res = await adminClient.get('/tenants/export', { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `tenants-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export async function reactivateAdminTenant(id: string): Promise<TenantRecord> {
  return adminPut<TenantRecord>(`/tenants/${id}/reactivate`, {})
}

/** Hard-delete tenant and ALL data — irreversible. confirmTenantId must match the tenant's slug. */
export async function offboardTenant(id: string, confirmTenantId: string): Promise<void> {
  await adminClient.delete(`/tenants/${id}/offboard`, { data: { confirmTenantId } })
}

export interface DirectMessageResponse {
  recipientEmail: string
  recipientName: string
  message: string
}

/** Send a direct email to the tenant's primary admin contact. */
export async function sendAdminDirectMessage(
  id: string,
  subject: string,
  body: string
): Promise<DirectMessageResponse> {
  return adminPost<DirectMessageResponse>(`/tenants/${id}/message`, { subject, body })
}

export interface PasswordResetResponse {
  recipientEmail: string
  recipientName: string
  message: string
}

/** Trigger a password reset OTP email for the tenant's primary admin user. */
export async function resetTenantPassword(id: string): Promise<PasswordResetResponse> {
  return adminPost<PasswordResetResponse>(`/tenants/${id}/reset-password`, {})
}

// ---------------------------------------------------------------------------
// System admins
// ---------------------------------------------------------------------------

export async function getSystemAdmins(cursor?: string, size = 50): Promise<PaginatedResponse<AdminRecord[]>> {
  const params = new URLSearchParams({ size: String(size) })
  if (cursor) params.set('cursor', cursor)
  return adminGet<PaginatedResponse<AdminRecord[]>>(`/system-admins?${params}`)
}

export async function getSystemAdmin(id: string): Promise<AdminRecord> {
  return adminGet<AdminRecord>(`/system-admins/${id}`)
}

export async function createSystemAdmin(payload: CreateAdminPayload): Promise<AdminRecord> {
  return adminPost<AdminRecord>('/system-admins', payload)
}

export async function deactivateSystemAdmin(id: string): Promise<void> {
  return adminDelete(`/system-admins/${id}`)
}

export async function reactivateSystemAdmin(id: string): Promise<AdminRecord> {
  return adminPut<AdminRecord>(`/system-admins/${id}/reactivate`, {})
}

export async function resetSystemAdminPassword(id: string, newPassword: string): Promise<void> {
  return adminPost<void>(`/system-admins/${id}/reset-password`, { newPassword })
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

export async function getRoles(): Promise<RoleRecord[]> {
  return adminGet<RoleRecord[]>('/roles')
}

export async function assignAdminRole(adminId: string, roleName: string): Promise<void> {
  return adminPost<void>(`/system-admins/${adminId}/roles`, { roleName })
}

export async function removeAdminRole(adminId: string, roleName: string): Promise<void> {
  return adminDelete(`/system-admins/${adminId}/roles/${roleName}`)
}

export async function setAdminMfaRequired(adminId: string, required: boolean): Promise<AdminRecord> {
  return adminPut<AdminRecord>(`/system-admins/${adminId}/mfa-required`, { required })
}

export interface CreateRolePayload {
  name: string
  description?: string
  permissionNames?: string[]
}

export async function createRole(payload: CreateRolePayload): Promise<RoleRecord> {
  return adminPost<RoleRecord>('/roles', payload)
}

export async function updateRolePermissions(roleId: string, permissionNames: string[]): Promise<RoleRecord> {
  return adminPut<RoleRecord>(`/roles/${roleId}/permissions`, permissionNames)
}

export async function deleteRole(roleId: string): Promise<void> {
  return adminDelete(`/roles/${roleId}`)
}

export interface PermissionRecord {
  id: string
  name: string
  description: string | null
}

export async function getPermissions(): Promise<PermissionRecord[]> {
  return adminGet<PermissionRecord[]>('/permissions')
}

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

export interface AnnouncementDto {
  id: string
  title: string
  message: string
  severity: 'info' | 'warning' | 'error' | 'success'
  active: boolean
  expiresAt: string | null
  /** ISO-8601 datetime when this announcement should start showing. null = immediate. */
  scheduledAt: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAnnouncementPayload {
  title: string
  message: string
  severity?: string
  active?: boolean
  expiresAt?: string
  /** datetime-local value (YYYY-MM-DDTHH:mm) or empty string to clear. */
  scheduledAt?: string
}

export async function getAnnouncements(): Promise<AnnouncementDto[]> {
  return adminGet<AnnouncementDto[]>('/announcements')
}

export async function createAnnouncement(payload: CreateAnnouncementPayload): Promise<AnnouncementDto> {
  return adminPost<AnnouncementDto>('/announcements', payload)
}

export async function updateAnnouncement(id: string, payload: Partial<CreateAnnouncementPayload>): Promise<AnnouncementDto> {
  return adminPut<AnnouncementDto>(`/announcements/${id}`, payload)
}

export async function deleteAnnouncement(id: string): Promise<void> {
  return adminDelete(`/announcements/${id}`)
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export interface MessagingResult {
  sent: number
  failed: number
  errors: string[]
}

export async function sendTargetedMessage(
  tenantIds: string[],
  subject: string,
  body: string
): Promise<MessagingResult> {
  return adminPost<MessagingResult>('/messaging/targeted', { tenantIds, subject, body })
}

export async function broadcastMessage(subject: string, body: string): Promise<MessagingResult> {
  return adminPost<MessagingResult>('/messaging/broadcast', { subject, body })
}

export interface MessageLogDto {
  id: string
  messageType: 'TARGETED' | 'BROADCAST'
  subject: string
  bodyPreview: string | null
  recipientCount: number
  sentCount: number
  failedCount: number
  sentBy: string | null
  sentAt: string
}

export interface MessageLogPage {
  data: MessageLogDto[]
  total: number
  page: number
  size: number
}

export async function getMessageHistory(page = 0, size = 20): Promise<MessageLogPage> {
  return adminGet<MessageLogPage>(`/messaging/history?page=${page}&size=${size}`)
}

// ---------------------------------------------------------------------------
// Subscription plans
// ---------------------------------------------------------------------------

export interface FeatureInfo {
  label: string
  enabled: boolean
}

export interface SubscriptionPlanDto {
  id: string
  name: string           // "FREE" | "BASIC" | "PRO"
  displayName: string
  pricePerUnit: number
  freeUnitCap: number | null
  transactionFeePct: number | null
  active: boolean
  popular: boolean
  features: Record<string, FeatureInfo>
  marketingFeatures: string[]
  subscriberCount: number
}

export interface UpdatePlanRequestDto {
  displayName: string
  pricePerUnit: number
  freeUnitCap: number | null
  transactionFeePct: number | null
  featureFlags: Record<string, boolean>
  active: boolean
  popular?: boolean
  marketingFeatures?: string[]
}

export interface TenantSubscriptionDto {
  plan: string
  displayName: string
  status: string
  unitCap: number | null
  pricePerUnit: number
  transactionFeePct: number | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  pendingDowngradePlan: string | null
  cancelledAt: string | null
  features: Record<string, boolean>
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlanDto[]> {
  return adminGet<SubscriptionPlanDto[]>('/subscription-plans')
}

export async function updateSubscriptionPlan(planId: string, payload: UpdatePlanRequestDto): Promise<SubscriptionPlanDto> {
  return adminPut<SubscriptionPlanDto>(`/subscription-plans/${planId}`, payload)
}

export async function getAdminTenantSubscription(tenantId: string): Promise<TenantSubscriptionDto> {
  return adminGet<TenantSubscriptionDto>(`/subscription-plans/tenants/${tenantId}/subscription`)
}

export async function overrideTenantSubscription(tenantId: string, planName: string): Promise<TenantSubscriptionDto> {
  return adminPost<TenantSubscriptionDto>(`/subscription-plans/tenants/${tenantId}/subscription/override`, { planName })
}

export interface PlanChangeDto {
  id: string
  tenantId: string
  fromPlan: string | null
  toPlan: string
  changedBy: string | null
  reason: string | null
  changedAt: string
}

export async function getTenantPlanHistory(tenantId: string): Promise<PlanChangeDto[]> {
  return adminGet<PlanChangeDto[]>(`/subscription-plans/tenants/${tenantId}/plan-history`)
}

export interface UpcomingRenewalDto {
  tenantId: string
  tenantName: string
  planName: string
  planDisplayName: string
  pricePerUnit: number
  renewalDate: string   // ISO date
}

export async function getUpcomingRenewals(days: 7 | 14 | 30 = 30): Promise<UpcomingRenewalDto[]> {
  return adminGet<UpcomingRenewalDto[]>(`/subscription-plans/renewals?days=${days}`)
}

// ---------------------------------------------------------------------------
// Admin KPI
// ---------------------------------------------------------------------------

export interface MonthlyDataPoint {
  month: string
  mrr: number
}

export interface PlanDistributionPoint {
  planName: string   // 'FREE' | 'BASIC' | 'PRO'
  count: number
}

export interface GrowthHistoryPoint {
  month: string
  newTenants: number
  churned: number
}

export interface AdminKpiDto {
  mrrCurrentMonth: number
  mrrPreviousMonth: number
  arrCurrentYear: number
  arrPreviousYear: number
  mrrLast12Months: MonthlyDataPoint[]
  activeTenants: number
  totalTenants: number
  newSignUpsThisMonth: number
  newSignUpsPreviousMonth: number
  churnedThisMonth: number
  churnRateThisMonth: number
  outstandingInvoicesAmount: number
  collectionRateThisMonth: number
  failedPaymentsLast7Days: number
  planDistribution: PlanDistributionPoint[]
  growthHistory12Months: GrowthHistoryPoint[]
}

export async function getAdminKpis(): Promise<AdminKpiDto> {
  return adminGet<AdminKpiDto>('/kpi')
}

// ---------------------------------------------------------------------------
// Tenant snapshot
// ---------------------------------------------------------------------------

export interface AdminTenantSnapshotDto {
  propertyCount: number
  totalUnits: number
  occupiedUnits: number
  teamMemberCount: number
}

export async function getAdminTenantSnapshot(tenantUuid: string): Promise<AdminTenantSnapshotDto> {
  return adminGet<AdminTenantSnapshotDto>(`/tenants/${tenantUuid}/snapshot`)
}

// ---------------------------------------------------------------------------
// Admin Invoices
// ---------------------------------------------------------------------------

export interface AdminInvoiceDto {
  id: string
  tenantId: string
  tenantName: string
  planName: string
  targetPlanName: string | null
  invoiceType: 'RENEWAL' | 'UPGRADE'
  totalAmount: number
  unitCount: number
  pricePerUnit: number
  periodStart: string
  periodEnd: string
  status: 'PENDING' | 'PAID' | 'FAILED' | 'VOID'
  paidAt: string | null
  failureReason: string | null
  retryCount: number
  nextRetryAt: string | null
  createdAt: string
  voidedAt: string | null
  voidedBy: string | null
  voidReason: string | null
}

export interface PagedInvoiceResponse {
  data: AdminInvoiceDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasMore: boolean
}

export async function getAdminInvoices(
  status?: string,
  page = 0,
  size = 50
): Promise<PagedInvoiceResponse> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (status) params.set('status', status)
  return adminGet<PagedInvoiceResponse>(`/invoices?${params}`)
}

export async function getTenantInvoices(
  tenantId: string,
  page = 0,
  size = 20
): Promise<PagedInvoiceResponse> {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  return adminGet<PagedInvoiceResponse>(`/invoices/by-tenant/${tenantId}?${params}`)
}

export async function getAdminFailedInvoices(): Promise<AdminInvoiceDto[]> {
  return adminGet<AdminInvoiceDto[]>('/invoices/failed')
}

export async function getAdminDelinquentInvoices(): Promise<AdminInvoiceDto[]> {
  return adminGet<AdminInvoiceDto[]>('/invoices/delinquent')
}

export async function adminRetryInvoice(invoiceId: string): Promise<void> {
  await adminClient.post(`/invoices/${invoiceId}/retry`)
}

export async function adminVoidInvoice(invoiceId: string, reason?: string): Promise<AdminInvoiceDto> {
  return adminPost<AdminInvoiceDto>(`/invoices/${invoiceId}/void`, { reason: reason ?? null })
}

/** Download PAID invoices as CSV. Optionally filter by ISO date range (YYYY-MM-DD). */
export async function exportRevenueCsv(start?: string, end?: string): Promise<void> {
  const params = new URLSearchParams()
  if (start) params.set('start', start)
  if (end)   params.set('end', end)
  const res = await adminClient.get(`/invoices/export?${params}`, { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `revenue-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// System Health
// ---------------------------------------------------------------------------

export interface JobStatusDto {
  jobKey: string
  displayName: string
  scheduleDescription: string
  lastRunAt: string | null
  lastRunSuccess: boolean | null
  lastRunDurationMs: number | null
  successCount: number
  failureCount: number
  nextRunAt: string | null
}

export interface FailureReasonDto {
  reason: string
  count: number
}

export interface ReddeHealthDto {
  totalAttempts30d: number
  successCount30d: number
  failureCount30d: number
  successRate30d: number
  topFailureReasons: FailureReasonDto[]
}

// status: 'UP' | 'DOWN' | 'DEGRADED' | 'UNCONFIGURED'
export interface ServiceStatusDto {
  name: string
  key: string
  status: 'UP' | 'DOWN' | 'DEGRADED' | 'UNCONFIGURED'
  detail: string
}

export interface FlywayInfoDto {
  currentVersion: string
  description: string
  installedOn: string | null
  appliedCount: number
  pendingCount: number
}

export interface NotifChannelStatDto {
  sent: number
  delivered: number
  failed: number
  pending: number
  total: number
}

export interface NotifDailyPointDto {
  date: string        // yyyy-MM-dd
  emailCount: number
  smsCount: number
}

export interface NotifStatsDto {
  email: NotifChannelStatDto
  sms: NotifChannelStatDto
  whatsapp: NotifChannelStatDto
  dailyTrend: NotifDailyPointDto[]  // last 7 days, oldest first
}

export interface SystemHealthResponse {
  jobs: JobStatusDto[]
  reddeHealth: ReddeHealthDto
  /** Distinct tenant users with a successful login in the last 30 minutes. */
  activeSessionsApprox: number
  // --- new ---
  services: ServiceStatusDto[]
  flyway: FlywayInfoDto
  notifStats: NotifStatsDto
}

export async function getSystemHealth(): Promise<SystemHealthResponse> {
  return adminGet<SystemHealthResponse>('/system/health')
}

// ---------------------------------------------------------------------------
// System Notifications (admin-level resend for failed deliveries)
// ---------------------------------------------------------------------------

export interface SystemNotificationDto {
  id: string
  tenantId: string
  recipientAddress: string
  subject?: string | null
  type: string           // EMAIL | SMS | PUSH | IN_APP
  status: string         // PENDING | SENT | DELIVERED | FAILED | RETRYING | CANCELLED
  retryCount: number
  failureReason?: string | null
  createdAt: string
  updatedAt: string
}

export interface SystemNotificationPage {
  content: SystemNotificationDto[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export async function getSystemNotifications(params?: {
  status?: string
  type?: string
  page?: number
  size?: number
}): Promise<SystemNotificationPage> {
  const q = new URLSearchParams()
  if (params?.status) q.set('status', params.status)
  if (params?.type)   q.set('type',   params.type)
  if (params?.page !== undefined) q.set('page', String(params.page))
  if (params?.size !== undefined) q.set('size', String(params.size))
  return adminGet<SystemNotificationPage>(`/system/notifications${q.toString() ? `?${q}` : ''}`)
}

export async function resendSystemNotification(id: string): Promise<void> {
  return adminPost<void>(`/system/notifications/${id}/resend`, {})
}

// ---------------------------------------------------------------------------
// Tenant Notes
// ---------------------------------------------------------------------------

export interface TenantNoteDto {
  id: string
  tenantId: string
  body: string
  authorId: string
  authorName: string
  createdAt: string
}

export async function getTenantNotes(tenantId: string): Promise<TenantNoteDto[]> {
  return adminGet<TenantNoteDto[]>(`/tenants/${tenantId}/notes`)
}

export async function addTenantNote(tenantId: string, body: string): Promise<TenantNoteDto> {
  return adminPost<TenantNoteDto>(`/tenants/${tenantId}/notes`, { body })
}

export async function deleteTenantNote(tenantId: string, noteId: string): Promise<void> {
  return adminDelete(`/tenants/${tenantId}/notes/${noteId}`)
}

// ---------------------------------------------------------------------------
// Tenant Feature Flag Overrides
// ---------------------------------------------------------------------------

export interface FeatureFlagStatus {
  featureKey: string
  planDefault: boolean
  overrideEnabled: boolean | null   // null = no override
  effectiveEnabled: boolean
}

export async function getTenantFeatureFlags(tenantId: string): Promise<FeatureFlagStatus[]> {
  return adminGet<FeatureFlagStatus[]>(`/tenants/${tenantId}/feature-flags`)
}

export async function setTenantFeatureFlagOverride(
  tenantId: string,
  featureKey: string,
  enabled: boolean
): Promise<FeatureFlagStatus> {
  return adminPut<FeatureFlagStatus>(`/tenants/${tenantId}/feature-flags/${featureKey}`, { enabled })
}

export async function removeTenantFeatureFlagOverride(tenantId: string, featureKey: string): Promise<void> {
  return adminDelete(`/tenants/${tenantId}/feature-flags/${featureKey}`)
}

// ---------------------------------------------------------------------------
// Reports (Domain 07)
// ---------------------------------------------------------------------------

export interface FunnelStageDto {
  label: string
  count: number
  pctOfRegistered: number
  pctOfPrevious: number
}

export interface FunnelReportDto {
  stages: FunnelStageDto[]
  generatedAt: string
}

export interface PlanChangeSummaryDto {
  fromPlan: string
  toPlan: string
  count: number
  direction: 'UPGRADE' | 'DOWNGRADE' | 'LATERAL' | 'UNKNOWN'
}

export interface PlanChangesReportDto {
  changes: PlanChangeSummaryDto[]
  totalUpgrades: number
  totalDowngrades: number
  totalLateral: number
  start: string
  end: string
}

export interface SummaryReportDto {
  newTenants: number
  revenue: number
  cancelledSubscriptions: number
  delinquentChurns: number
  planUpgrades: number
  planDowngrades: number
  start: string
  end: string
}

export async function getFunnelReport(): Promise<FunnelReportDto> {
  return adminGet<FunnelReportDto>('/reports/funnel')
}

export async function getPlanChangesReport(start: string, end: string): Promise<PlanChangesReportDto> {
  return adminGet<PlanChangesReportDto>(`/reports/plan-changes?start=${start}&end=${end}`)
}

export async function getSummaryReport(start: string, end: string): Promise<SummaryReportDto> {
  return adminGet<SummaryReportDto>(`/reports/summary?start=${start}&end=${end}`)
}

export interface RevenueByPlanCell {
  month: string
  planName: string
  revenue: number
}

export interface RevenueByPlanDto {
  months: string[]
  cells: RevenueByPlanCell[]
}

export async function getRevenueByPlan(months = 12): Promise<RevenueByPlanDto> {
  return adminGet<RevenueByPlanDto>(`/reports/revenue-by-plan?months=${months}`)
}

export function buildSummaryExportUrl(start: string, end: string): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1')
    .replace(/\/api\/v1$/, '') + '/api/v1/admin'
  return `${base}/reports/summary/export?start=${start}&end=${end}`
}

// ---------------------------------------------------------------------------
// Support & Feedback (Domain 08)
// ---------------------------------------------------------------------------

export interface TicketDto {
  id: string
  tenantId: string
  submitterEmail: string
  subject: string
  body: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assignedTo: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface TicketPageDto {
  content: TicketDto[]
  totalElements: number
  totalPages: number
  page: number
}

export interface TicketCountsDto {
  OPEN: number
  IN_PROGRESS: number
  RESOLVED: number
  CLOSED: number
}

export interface FeedbackDto {
  id: string
  tenantId: string
  submitterEmail: string
  rating: number
  category: string
  message: string | null
  createdAt: string
}

export interface FeedbackPageDto {
  content: FeedbackDto[]
  totalElements: number
  totalPages: number
  page: number
}

export interface FeedbackSummaryDto {
  averageRating: number
  totalCount: number
  distribution: Record<string, number>   // "1".."5" → count
}

export async function getAdminTickets(params: {
  status?: string; priority?: string; tenantId?: string; search?: string; page?: number; size?: number
}): Promise<TicketPageDto> {
  const q = new URLSearchParams()
  if (params.status)   q.set('status',   params.status)
  if (params.priority) q.set('priority', params.priority)
  if (params.tenantId) q.set('tenantId', params.tenantId)
  if (params.search)   q.set('search',   params.search)
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  return adminGet<TicketPageDto>(`/support/tickets?${q}`)
}

export async function getTicketCounts(): Promise<TicketCountsDto> {
  return adminGet<TicketCountsDto>('/support/tickets/counts')
}

export async function getAdminTicket(id: string): Promise<TicketDto> {
  return adminGet<TicketDto>(`/support/tickets/${id}`)
}

export async function updateTicket(id: string, update: {
  status?: string; priority?: string; assignToMe?: boolean
}): Promise<TicketDto> {
  return adminClient.patch(`/support/tickets/${id}`, update).then(r => r.data)
}

export async function getAdminFeedback(params: {
  category?: string; tenantId?: string; page?: number; size?: number
}): Promise<FeedbackPageDto> {
  const q = new URLSearchParams()
  if (params.category) q.set('category', params.category)
  if (params.tenantId) q.set('tenantId', params.tenantId)
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  return adminGet<FeedbackPageDto>(`/support/feedback?${q}`)
}

export async function getFeedbackSummary(): Promise<FeedbackSummaryDto> {
  return adminGet<FeedbackSummaryDto>('/support/feedback/summary')
}

// ---------------------------------------------------------------------------
// Domain 09 — Login History
// ---------------------------------------------------------------------------

export interface LoginHistoryItem {
  id: string
  userId: string | null
  email: string
  ipAddress: string | null
  userAgent: string | null
  success: boolean
  failureReason: string | null
  createdAt: string
}

export interface LoginHistoryPage {
  items: LoginHistoryItem[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}

export async function getTenantLoginHistory(
  tenantId: string,
  params: { success?: boolean; from?: string; to?: string; page?: number; size?: number }
): Promise<LoginHistoryPage> {
  const q = new URLSearchParams()
  if (params.success !== undefined) q.set('success', String(params.success))
  if (params.from) q.set('from', params.from)
  if (params.to)   q.set('to',   params.to)
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 20))
  return adminGet<LoginHistoryPage>(`/tenants/${tenantId}/login-history?${q}`)
}

// ---------------------------------------------------------------------------
// Domain 09 — API Key Management
// ---------------------------------------------------------------------------

export interface ApiKeyDto {
  id: string
  name: string
  keyPrefix: string
  active: boolean
  lastUsedAt: string | null
  expiresAt: string | null
  createdAt: string
}

export interface ApiKeyCreatedDto extends ApiKeyDto {
  key: string   // plaintext — shown once only
}

export async function getTenantApiKeys(tenantId: string): Promise<ApiKeyDto[]> {
  return adminGet<ApiKeyDto[]>(`/tenants/${tenantId}/api-keys`)
}

export async function generateTenantApiKey(
  tenantId: string,
  payload: { name: string; expiresAt?: string | null }
): Promise<ApiKeyCreatedDto> {
  return adminPost<ApiKeyCreatedDto>(`/tenants/${tenantId}/api-keys`, payload)
}

export async function revokeTenantApiKey(tenantId: string, keyId: string): Promise<void> {
  return adminDelete(`/tenants/${tenantId}/api-keys/${keyId}`)
}

// ---------------------------------------------------------------------------
// Domain 10 — Platform Settings
// ---------------------------------------------------------------------------

export interface PlatformSettingDto {
  settingKey:   string
  settingValue: string
  description:  string | null
  category:     string
  updatedAt:    string | null
  updatedBy:    string | null
}

/** Returns all platform settings grouped by category. */
export async function getPlatformSettings(): Promise<Record<string, PlatformSettingDto[]>> {
  return adminGet<Record<string, PlatformSettingDto[]>>('/platform-settings')
}

/**
 * Update a single setting value. Dots in the key are encoded as __ in the URL
 * (the backend controller decodes them back).
 */
export async function updatePlatformSetting(key: string, value: string): Promise<PlatformSettingDto> {
  const encodedKey = key.replace(/\./g, '__')
  return adminPut<PlatformSettingDto>(`/platform-settings/${encodedKey}`, { value })
}

// ---------------------------------------------------------------------------
// Admin Audit Log
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  id: string
  adminId: string | null
  adminEmail: string
  action: string
  entityType: string | null
  entityId: string | null
  detail: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
}

export interface AuditLogPage {
  data: AuditLogEntry[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasMore: boolean
}

export async function getAuditLog(params: {
  adminEmail?: string
  entityType?: string
  action?: string
  from?: string
  to?: string
  page?: number
  size?: number
}): Promise<AuditLogPage> {
  const q = new URLSearchParams()
  if (params.adminEmail) q.set('adminEmail', params.adminEmail)
  if (params.entityType) q.set('entityType', params.entityType)
  if (params.action)     q.set('action',     params.action)
  if (params.from)       q.set('from',       params.from)
  if (params.to)         q.set('to',         params.to)
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 50))
  return adminGet<AuditLogPage>(`/audit-log?${q}`)
}

// ---------------------------------------------------------------------------
// Fee Ledger
// ---------------------------------------------------------------------------

export interface FeeLedgerEntryDto {
  id: string
  tenantId: string
  sourceType: string
  sourceId: string
  grossAmount: number
  feeRate: number
  feeAmount: number
  currency: string
  status: 'CAPTURED' | 'SETTLED' | 'REVERSED'
  settledAt: string | null
  createdAt: string
}

export interface PagedLedgerResponse {
  data: FeeLedgerEntryDto[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasMore: boolean
}

export interface FeeLedgerSummary {
  totalCaptured: number
  totalSettled: number
  last30Days: number
  last7Days: number
}

export async function getFeeLedgerEntries(params: {
  tenantId?: string
  status?: string
  page?: number
  size?: number
}): Promise<PagedLedgerResponse> {
  const q = new URLSearchParams()
  if (params.tenantId) q.set('tenantId', params.tenantId)
  if (params.status)   q.set('status',   params.status)
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 50))
  return adminGet<PagedLedgerResponse>(`/fee-ledger?${q}`)
}

export async function getFeeLedgerSummary(): Promise<FeeLedgerSummary> {
  return adminGet<FeeLedgerSummary>('/fee-ledger/summary')
}

export async function settleFeeEntry(id: string): Promise<FeeLedgerEntryDto> {
  return adminPost<FeeLedgerEntryDto>(`/fee-ledger/${id}/settle`)
}

export interface BatchSettleResponse {
  settledCount: number
  totalAmount: number
}

export async function settleBatch(tenantId?: string): Promise<BatchSettleResponse> {
  const q = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : ''
  return adminPost<BatchSettleResponse>(`/fee-ledger/settle-batch${q}`)
}

// ---------------------------------------------------------------------------
// Domain 09 — Data Export (GDPR)
// ---------------------------------------------------------------------------

export async function exportTenantData(tenantId: string): Promise<void> {
  const res = await adminClient.post(
    `/tenants/${tenantId}/export`,
    {},
    { responseType: 'blob' }
  )
  const url = URL.createObjectURL(res.data)
  const a   = document.createElement('a')
  const cd  = res.headers['content-disposition'] ?? ''
  const m   = cd.match(/filename="?([^"]+)"?/)
  a.href     = url
  a.download = m ? m[1] : `tenantx_export_${tenantId}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// ---------------------------------------------------------------------------
// Domain 01 (P2) — Impersonate Tenant
// ---------------------------------------------------------------------------

export interface TenantUserDto {
  id:       string
  email:    string
  fullName: string
  role:     string
  active:   boolean
}

export interface ImpersonateResponse {
  accessToken:     string
  expiresAt:       string
  targetUserId:    string
  targetUserEmail: string
  targetTenantId:  string
  impersonatedBy:  string
}

export interface ImpersonationLogDto {
  id:               string
  adminId:          string
  adminEmail:       string
  targetTenantId:   string
  targetUserId:     string
  targetUserEmail:  string
  reason:           string | null
  impersonatedAt:   string
  tokenExpiresAt:   string
}

export interface ImpersonationLogPage {
  items:      ImpersonationLogDto[]
  page:       number
  size:       number
  totalItems: number
  totalPages: number
}

export async function getTenantUsers(tenantId: string): Promise<TenantUserDto[]> {
  return adminGet<TenantUserDto[]>(`/tenants/${tenantId}/users`)
}

export async function impersonateTenant(
  tenantId: string,
  userId: string,
  reason?: string
): Promise<ImpersonateResponse> {
  return adminPost<ImpersonateResponse>(`/tenants/${tenantId}/impersonate`, { userId, reason })
}

export async function getImpersonationLog(
  tenantId: string,
  page = 0,
  size = 25
): Promise<ImpersonationLogPage> {
  return adminGet<ImpersonationLogPage>(
    `/tenants/${tenantId}/impersonate/log?page=${page}&size=${size}`
  )
}

// ---------------------------------------------------------------------------
// Domain 01 (P2) — Session Management
// ---------------------------------------------------------------------------

export interface SessionDto {
  familyId:          string
  userId:            string
  ipAddress:         string | null
  userAgent:         string | null
  issuedAt:          string
  expiresAt:         string
  absoluteExpiresAt: string
}

export async function getTenantSessions(tenantId: string): Promise<SessionDto[]> {
  return adminGet<SessionDto[]>(`/tenants/${tenantId}/sessions`)
}

export async function terminateSession(tenantId: string, familyId: string): Promise<void> {
  await adminDelete(`/tenants/${tenantId}/sessions/${familyId}`)
}

export async function terminateAllSessions(tenantId: string): Promise<{ terminated: number }> {
  return adminDelete<{ terminated: number }>(`/tenants/${tenantId}/sessions`)
}

// ---------------------------------------------------------------------------
// Tenant Deep Visibility — Properties, Units, Occupants, Team, Wallet
// ---------------------------------------------------------------------------

export interface AdminPropertySummary {
  id:            string
  name:          string
  type:          string
  status:        string
  city:          string | null
  region:        string | null
  totalUnits:    number
  occupiedUnits: number
  createdAt:     string | null
}

export interface AdminUnitSummary {
  id:           string
  unitNo:       string
  type:         string
  status:       string        // available | occupied
  rent:         number
  currency:     string
  propertyName: string | null
  propertyId:   string | null
  createdAt:    string | null
}

export interface AdminOccupantSummary {
  id:          string
  firstName:   string
  lastName:    string
  email:       string
  phone:       string
  status:      string
  unitNo:      string | null
  unitId:      string | null
  propertyId:  string | null
  moveInDate:  string | null
  moveOutDate: string | null
}

export interface AdminTeamMemberSummary {
  id:        string
  fullName:  string
  email:     string
  role:      string
  active:    boolean
  createdAt: string | null
}

export interface AdminWalletSummary {
  id:                string
  currency:          string
  status:            string    // ACTIVE | SUSPENDED | FROZEN
  balance:           number
  pendingBalance:    number
  totalEarned:       number
  totalWithdrawn:    number
  linkedMomoNumber:  string | null
  linkedMomoNetwork: string | null
}

export interface AdminPagedProperties {
  items: AdminPropertySummary[]
  total: number
  page:  number
  size:  number
}

export interface AdminPagedUnits {
  items: AdminUnitSummary[]
  total: number
  page:  number
  size:  number
}

export interface AdminPagedOccupants {
  items: AdminOccupantSummary[]
  total: number
  page:  number
  size:  number
}

export interface AdminPagedTeam {
  items: AdminTeamMemberSummary[]
  total: number
  page:  number
  size:  number
}

export async function getTenantProperties(
  tenantId: string, page = 0, size = 20
): Promise<AdminPagedProperties> {
  return adminGet<AdminPagedProperties>(`/tenants/${tenantId}/properties?page=${page}&size=${size}`)
}

export async function getTenantUnits(
  tenantId: string, page = 0, size = 20
): Promise<AdminPagedUnits> {
  return adminGet<AdminPagedUnits>(`/tenants/${tenantId}/units?page=${page}&size=${size}`)
}

export async function getTenantOccupants(
  tenantId: string, page = 0, size = 20
): Promise<AdminPagedOccupants> {
  return adminGet<AdminPagedOccupants>(`/tenants/${tenantId}/occupants?page=${page}&size=${size}`)
}

export async function getTenantTeam(
  tenantId: string, page = 0, size = 20
): Promise<AdminPagedTeam> {
  return adminGet<AdminPagedTeam>(`/tenants/${tenantId}/team?page=${page}&size=${size}`)
}

export async function getTenantWallet(tenantId: string): Promise<AdminWalletSummary | null> {
  try {
    return await adminGet<AdminWalletSummary>(`/tenants/${tenantId}/wallet`)
  } catch (e: any) {
    if (e?.response?.status === 404) return null
    throw e
  }
}

/** Freeze a tenant's wallet — blocks withdrawals and credits. */
export async function freezeTenantWallet(tenantId: string): Promise<AdminWalletSummary> {
  return adminPost<AdminWalletSummary>(`/tenants/${tenantId}/wallet/freeze`, {})
}

/** Restore a frozen/suspended wallet to ACTIVE. */
export async function unfreezeTenantWallet(tenantId: string): Promise<AdminWalletSummary> {
  return adminPost<AdminWalletSummary>(`/tenants/${tenantId}/wallet/unfreeze`, {})
}

export interface AdminWalletAdjustRequest {
  type:    'CREDIT' | 'DEBIT'
  amount:  number
  reason?: string
}

/** Apply a manual admin credit or debit to a tenant's wallet. */
export async function adjustTenantWallet(
  tenantId: string,
  req: AdminWalletAdjustRequest
): Promise<AdminWalletSummary> {
  return adminPost<AdminWalletSummary>(`/tenants/${tenantId}/wallet/adjust`, req)
}

// ---------------------------------------------------------------------------
// Tenant Deep Visibility — Agreements, Payments, Inspections, Maintenance
// ---------------------------------------------------------------------------

export interface AdminAgreementSummary {
  id:               string
  agreementNumber:  string | null
  type:             string | null
  status:           string | null
  occupantName:     string | null
  propertyName:     string | null
  unitNo:           string | null
  startDate:        string | null
  endDate:          string | null
  signedDate:       string | null
  rent:             number | null
  totalAmount:      number | null
  currency:         string | null
  paymentFrequency: string | null
  createdAt:        string | null
}

export interface AdminPaymentSummary {
  id:            string
  invoiceId:     string | null
  invoiceNumber: string | null
  occupantName:  string | null
  amount:        number
  currency:      string | null
  paymentMethod: string | null
  status:        string | null
  failureReason: string | null
  paymentDate:   string | null
  createdAt:     string | null
}

export interface AdminInspectionSummary {
  id:            string
  unitNo:        string | null
  propertyName:  string | null
  type:          string | null
  status:        string | null
  inspectionDate: string | null
  signedOffDate:  string | null
  inspectorName:  string | null
  createdAt:      string | null
}

export interface AdminMaintenanceSummary {
  id:            string
  requestNumber: string | null
  title:         string | null
  priority:      string | null
  status:        string | null
  estimatedCost: number | null
  actualCost:    number | null
  currency:      string | null
  isSlaBreached: boolean
  scheduledDate: string | null
  completedDate: string | null
  createdAt:     string | null
}

export interface AdminPagedAgreements  { items: AdminAgreementSummary[];  total: number; page: number; size: number }
export interface AdminPagedPayments    { items: AdminPaymentSummary[];    total: number; page: number; size: number }
export interface AdminPagedInspections { items: AdminInspectionSummary[]; total: number; page: number; size: number }
export interface AdminPagedMaintenance { items: AdminMaintenanceSummary[]; total: number; page: number; size: number }

export async function getTenantAgreements(
  tenantId: string, page = 0, size = 20
): Promise<AdminPagedAgreements> {
  return adminGet<AdminPagedAgreements>(`/tenants/${tenantId}/agreements?page=${page}&size=${size}`)
}

export async function getTenantPayments(
  tenantId: string, page = 0, size = 20
): Promise<AdminPagedPayments> {
  return adminGet<AdminPagedPayments>(`/tenants/${tenantId}/payments?page=${page}&size=${size}`)
}

export async function getTenantInspections(
  tenantId: string, page = 0, size = 20
): Promise<AdminPagedInspections> {
  return adminGet<AdminPagedInspections>(`/tenants/${tenantId}/inspections?page=${page}&size=${size}`)
}

export async function getTenantMaintenance(
  tenantId: string, page = 0, size = 20
): Promise<AdminPagedMaintenance> {
  return adminGet<AdminPagedMaintenance>(`/tenants/${tenantId}/maintenance?page=${page}&size=${size}`)
}

// ── Rental Analytics ─────────────────────────────────────────────────────────

export interface AdminRentalRevenueDto {
  labels: string[]
  invoiced: number[]
  collected: number[]
}

export interface AdminOccupancyDto {
  totalUnits: number
  occupiedUnits: number
  occupancyRate: number
}

export interface AdminTopTenantItem {
  tenantId: string
  tenantName: string
  revenue: number
}

export interface AdminTopTenantsDto {
  items: AdminTopTenantItem[]
}

export async function getRentalRevenue(months = 12): Promise<AdminRentalRevenueDto> {
  return adminGet<AdminRentalRevenueDto>(`/reports/rental-revenue?months=${months}`)
}

export async function getOccupancyStats(): Promise<AdminOccupancyDto> {
  return adminGet<AdminOccupancyDto>('/reports/occupancy')
}

export async function getTopTenants(months = 12): Promise<AdminTopTenantsDto> {
  return adminGet<AdminTopTenantsDto>(`/reports/top-tenants?months=${months}`)
}

// ---------------------------------------------------------------------------
// Platform User Management — cross-tenant (Domain 10 P2)
// ---------------------------------------------------------------------------

export interface AdminUserRecord {
  id:          string
  fullName:    string
  email:       string
  companyName: string
  role:        string
  tenantId:    string
  active:      boolean
  createdAt:   string
}

export interface PagedAdminUsers {
  items: AdminUserRecord[]
  total: number
  page:  number
  size:  number
}

export interface GetAdminUsersParams {
  tenantId?: string
  role?:     string
  active?:   boolean
  search?:   string
  page?:     number
  size?:     number
}

/** List all platform users with optional filtering and pagination. */
export async function getAdminUsers(params: GetAdminUsersParams = {}): Promise<PagedAdminUsers> {
  const q = new URLSearchParams()
  if (params.tenantId !== undefined) q.set('tenantId', params.tenantId)
  if (params.role     !== undefined) q.set('role',     params.role)
  if (params.active   !== undefined) q.set('active',   String(params.active))
  if (params.search   !== undefined && params.search !== '') q.set('search', params.search)
  q.set('page', String(params.page ?? 0))
  q.set('size', String(params.size ?? 50))
  return adminGet<PagedAdminUsers>(`/users?${q}`)
}

/** Get a single platform user by UUID. */
export async function getAdminUser(id: string): Promise<AdminUserRecord> {
  return adminGet<AdminUserRecord>(`/users/${id}`)
}

/** Deactivate a user — blocks login. Returns the updated record. */
export async function deactivateAdminUser(id: string): Promise<AdminUserRecord> {
  const res = await adminClient.patch<AdminUserRecord>(`/users/${id}/deactivate`)
  return res.data
}

/** Reactivate a previously deactivated user. Returns the updated record. */
export async function reactivateAdminUser(id: string): Promise<AdminUserRecord> {
  const res = await adminClient.patch<AdminUserRecord>(`/users/${id}/reactivate`)
  return res.data
}

/**
 * Trigger a password reset OTP email for a specific user.
 * Reuses the forgot-password flow — no password is changed server-side.
 */
export async function resetAdminUserPassword(id: string): Promise<PasswordResetResponse> {
  return adminPost<PasswordResetResponse>(`/users/${id}/reset-password`, {})
}
