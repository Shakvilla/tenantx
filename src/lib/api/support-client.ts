import { apiGet, apiPost } from '@/lib/api/client';
import type { SupportTicket, TicketReply, TicketPageResponse } from '@/types/support';

// ---------------------------------------------------------------------------
// Types (keep backward-compatible aliases)
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
// API functions (new conversation support endpoints — uses axios with
// automatic X-Tenant-ID + Authorization headers from the shared apiClient)
// ---------------------------------------------------------------------------

export const supportClient = {
  async getMyTickets(email: string, status?: string, page = 0, size = 20): Promise<TicketPageResponse> {
    const params = new URLSearchParams({ email, page: String(page), size: String(size) })
    if (status) params.set('status', status)
    return apiGet<TicketPageResponse>(`/support/tickets/my?${params}`)
  },

  async getTicketDetail(id: string, email: string): Promise<SupportTicket & { replies: TicketReply[] }> {
    return apiGet<SupportTicket & { replies: TicketReply[] }>(`/support/tickets/${id}?email=${encodeURIComponent(email)}`)
  },

  async postReply(ticketId: string, senderEmail: string, senderName: string, message: string): Promise<TicketReply> {
    return apiPost<TicketReply>(`/support/tickets/${ticketId}/replies`, { senderEmail, senderName, message })
  },

  async getReplies(ticketId: string, after?: string): Promise<TicketReply[]> {
    const params = new URLSearchParams()
    if (after) params.set('after', after)
    return apiGet<TicketReply[]>(`/support/tickets/${ticketId}/replies?${params}`)
  },

  async createTicket(data: {
    tenantId: string
    submitterEmail: string
    subject: string
    body: string
    priority?: string
    category?: string
  }): Promise<SupportTicket> {
    return apiPost<SupportTicket>('/admin/support/tickets', data)
  }
}

// ---------------------------------------------------------------------------
// Backward-compatible function exports for existing views
// ---------------------------------------------------------------------------

export async function submitTicket(payload: SubmitTicketRequest): Promise<TicketDto> {
  return apiPost<TicketDto>('/support/tickets', payload)
}

export async function submitFeedback(payload: SubmitFeedbackRequest): Promise<FeedbackDto> {
  return apiPost<FeedbackDto>('/feedback', payload)
}
