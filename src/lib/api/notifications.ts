/**
 * Notifications API Client
 * Covers: listing notifications with filters, resending failed notifications
 */

import { apiGet, apiPost, API_BASE } from './client'

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
