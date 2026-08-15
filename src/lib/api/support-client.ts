/**
 * Support API client — tenant submission endpoints at /api/v1/support
 * Both endpoints are permitAll (no auth required) but apiClient attaches
 * the Bearer token automatically when available.
 */

import { apiClient, API_BASE } from './client'

const BASE = `${API_BASE}/support`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH'
export type FeedbackCategory = 'GENERAL' | 'BILLING' | 'MAINTENANCE' | 'FEATURE_REQUEST' | 'OTHER'

export interface SubmitTicketRequest {
  tenantId: string
  submitterEmail: string
  subject: string
  body: string
  priority: TicketPriority
}

export interface SubmitFeedbackRequest {
  tenantId: string
  submitterEmail: string
  rating: number          // 1–5
  category: FeedbackCategory
  message: string
}

export interface TicketDto {
  id: string
  tenantId: string
  submitterEmail: string
  subject: string
  body: string
  status: string
  priority: string
  assignedTo: string | null
  resolvedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface FeedbackDto {
  id: string
  tenantId: string
  submitterEmail: string
  rating: number
  category: string
  message: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function submitTicket(payload: SubmitTicketRequest): Promise<TicketDto> {
  const res = await apiClient.post<TicketDto>(`${BASE}/tickets`, payload)
  return res.data
}

export async function submitFeedback(payload: SubmitFeedbackRequest): Promise<FeedbackDto> {
  const res = await apiClient.post<FeedbackDto>(`${BASE}/feedback`, payload)
  return res.data
}
