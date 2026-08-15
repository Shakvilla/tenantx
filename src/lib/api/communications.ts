/**
 * Communications API Client
 * Handles all API calls for messages, notices, and communications
 */

import { apiGet, apiPost, apiPatch, apiDelete, API_BASE } from './client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CommunicationItem = {
  id: string
  subject: string
  from: string
  to: string
  message: string
  date: string
  type: 'email' | 'sms' | 'notification' | 'message'
  status: 'sent' | 'delivered' | 'read' | 'failed'
  occupantId?: string
  occupantName?: string
  propertyId?: string
  propertyName?: string
  unitId?: string
  unitNo?: string
  createdAt: string
}

export type CreateCommunicationRequest = {
  subject: string
  toName: string
  message: string
  type: 'email' | 'sms' | 'notification' | 'message'
  occupantId?: string
  occupantName?: string
  propertyId?: string
  propertyName?: string
  unitId?: string
  unitNo?: string
}

export type SendNoticeRequest = {
  subject: string
  message: string
  recipientNames: string[]
  propertyId?: string
  propertyName?: string
  unitId?: string
  unitNo?: string
}

export type CommunicationStats = {
  total: number
  sent: number
  delivered: number
  read: number
  failed: number
}

// ---------------------------------------------------------------------------
// API Functions
// ---------------------------------------------------------------------------

/** Fetch all communications, optionally filtered by type or status */
export async function getCommunications(params?: {
  type?: string
  status?: string
}): Promise<CommunicationItem[]> {
  const query = new URLSearchParams()
  if (params?.type) query.set('type', params.type)
  if (params?.status) query.set('status', params.status)
  const qs = query.toString()
  return apiGet<CommunicationItem[]>(`${API_BASE}/communications${qs ? `?${qs}` : ''}`)
}

/** Fetch a single communication by ID */
export async function getCommunicationById(id: string): Promise<CommunicationItem> {
  return apiGet<CommunicationItem>(`${API_BASE}/communications/${id}`)
}

/** Send a new message or reply */
export async function createCommunication(
  request: CreateCommunicationRequest
): Promise<CommunicationItem> {
  return apiPost<CommunicationItem>(`${API_BASE}/communications`, request)
}

/**
 * Send a notice to multiple recipients.
 * Creates one communication record per recipient.
 */
export async function sendNotice(
  request: SendNoticeRequest
): Promise<CommunicationItem[]> {
  return apiPost<CommunicationItem[]>(`${API_BASE}/communications/notice`, request)
}

/** Update the status of a communication (sent → delivered → read) */
export async function updateCommunicationStatus(
  id: string,
  status: 'sent' | 'delivered' | 'read' | 'failed'
): Promise<CommunicationItem> {
  return apiPatch<CommunicationItem>(`${API_BASE}/communications/${id}/status`, { status })
}

/** Delete a communication */
export async function deleteCommunication(id: string): Promise<void> {
  return apiDelete(`${API_BASE}/communications/${id}`)
}

/** Get communication stats */
export async function getCommunicationStats(): Promise<CommunicationStats> {
  return apiGet<CommunicationStats>(`${API_BASE}/communications/stats`)
}
