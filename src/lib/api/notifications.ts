/**
 * Notifications API Client
 * Covers: listing notifications with filters, resending failed notifications
 */

import { apiGet, apiPost, apiPatch, API_BASE } from './client'

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export type NotificationType = 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'

export type NotificationStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED'

// ---------------------------------------------------------------------------
// Notification type — mirrors NotificationResponseDto
// ---------------------------------------------------------------------------
export interface Notification {
  id: string
  tenantId: string
  recipientAddress: string
  subject?: string | null
  type: NotificationType
  status: NotificationStatus
  retryCount: number
  nextRetryAt?: string | null
  failureReason?: string | null
  providerMessageId?: string | null
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------
export interface PaginationMeta {
  hasNext: boolean
  cursor?: string | null
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T
  meta: { pagination: PaginationMeta }
}

// ---------------------------------------------------------------------------
// Query options — mirrors controller @RequestParam fields
// ---------------------------------------------------------------------------
export interface NotificationQuery {
  status?: NotificationStatus
  type?: NotificationType
  recipientAddress?: string
  /** ISO-8601 instant string, e.g. "2025-01-01T00:00:00Z" */
  startDate?: string
  /** ISO-8601 instant string */
  endDate?: string
  cursor?: string
  size?: number
  sort?: string
}

// ---------------------------------------------------------------------------
// Endpoints  —  /api/v1/notifications
// ---------------------------------------------------------------------------
const BASE = `${API_BASE}/notifications`

export async function getNotifications(query: NotificationQuery = {}): Promise<PaginatedResponse<Notification[]>> {
  const params = new URLSearchParams()
  if (query.status) params.set('status', query.status)
  if (query.type) params.set('type', query.type)
  if (query.recipientAddress) params.set('recipientAddress', query.recipientAddress)
  if (query.startDate) params.set('startDate', query.startDate)
  if (query.endDate) params.set('endDate', query.endDate)
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.size) params.set('size', String(query.size))
  if (query.sort) params.set('sort', query.sort)
  const qs = params.toString()
  return apiGet<PaginatedResponse<Notification[]>>(`${BASE}${qs ? `?${qs}` : ''}`)
}

/** Resend a failed or undelivered notification by ID */
export async function resendNotification(id: string): Promise<void> {
  return apiPost<void>(`${BASE}/${id}/resend`, {})
}

// ── SMS Reminder Log ─────────────────────────────────────────────────────────

export interface ReminderLogEntry {
  id: string
  phoneNumber: string
  reminderType: string   // e.g. RENT_DUE, OVERDUE, ADVANCE_RENT
  channel: string        // SMS | WHATSAPP
  status: string         // SENT | FAILED
  sentAt: string
  failureReason?: string | null
  invoiceId?: string | null
}

export interface ReminderLogPage {
  content: ReminderLogEntry[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export async function getReminderLog(params?: {
  page?: number
  size?: number
}): Promise<ReminderLogPage> {
  const q = new URLSearchParams()
  if (params?.page !== undefined) q.set('page', String(params.page))
  if (params?.size !== undefined)  q.set('size',  String(params.size))
  return apiGet<ReminderLogPage>(`${API_BASE}/reminders/log${q.toString() ? `?${q}` : ''}`)
}

// ── In-App Notification Inbox ────────────────────────────────────────────────

export interface InAppNotification {
  id: string
  tenantId: string
  userId: string
  title: string
  body: string | null
  entityType: string | null
  entityId: string | null
  read: boolean
  readAt: string | null
  createdAt: string
}

export interface InAppNotificationsPage {
  content: InAppNotification[]
  totalElements: number
  totalPages: number
  number: number   // current page
  size: number
}

export async function getInAppNotifications(params?: {
  page?: number
  size?: number
  unreadOnly?: boolean
}): Promise<InAppNotificationsPage> {
  const q = new URLSearchParams()
  if (params?.page !== undefined)    q.set('page', String(params.page))
  if (params?.size !== undefined)    q.set('size', String(params.size))
  if (params?.unreadOnly)            q.set('unreadOnly', 'true')
  return apiGet<InAppNotificationsPage>(`${API_BASE}/in-app-notifications?${q}`)
}

export async function getInAppUnreadCount(): Promise<number> {
  const res = await apiGet<{ count: number }>(`${API_BASE}/in-app-notifications/unread-count`)
  return res.count
}

export async function markInAppNotificationRead(id: string): Promise<void> {
  return apiPatch<void>(`${API_BASE}/in-app-notifications/${id}/read`, {})
}

export async function markAllInAppNotificationsRead(): Promise<void> {
  return apiPatch<void>(`${API_BASE}/in-app-notifications/read-all`, {})
}
