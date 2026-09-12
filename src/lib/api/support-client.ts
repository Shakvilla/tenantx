import { SupportTicket, TicketReply, TicketPageResponse } from '@/types/support';

const API_BASE = '/api/v1';

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
// API functions (new conversation support endpoints)
// ---------------------------------------------------------------------------

export const supportClient = {
  async getMyTickets(email: string, status?: string, page = 0, size = 20): Promise<TicketPageResponse> {
    const params = new URLSearchParams({ email, page: String(page), size: String(size) })
    if (status) params.set('status', status)
    const response = await fetch(`${API_BASE}/support/tickets/my?${params}`)
    if (!response.ok) throw new Error('Failed to fetch tickets')
    return response.json()
  },

  async getTicketDetail(id: string, email: string): Promise<SupportTicket & { replies: TicketReply[] }> {
    const response = await fetch(`${API_BASE}/support/tickets/${id}?email=${encodeURIComponent(email)}`)
    if (!response.ok) throw new Error('Failed to fetch ticket')
    return response.json()
  },

  async postReply(ticketId: string, senderEmail: string, senderName: string, message: string): Promise<TicketReply> {
    const response = await fetch(`${API_BASE}/support/tickets/${ticketId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderEmail, senderName, message }),
    })
    if (!response.ok) throw new Error('Failed to post reply')
    return response.json()
  },

  async getReplies(ticketId: string, after?: string): Promise<TicketReply[]> {
    const params = new URLSearchParams()
    if (after) params.set('after', after)
    const response = await fetch(`${API_BASE}/support/tickets/${ticketId}/replies?${params}`)
    if (!response.ok) throw new Error('Failed to fetch replies')
    return response.json()
  },

  async createTicket(data: {
    tenantId: string
    submitterEmail: string
    subject: string
    body: string
    priority?: string
    category?: string
  }): Promise<SupportTicket> {
    const response = await fetch(`${API_BASE}/admin/support/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) throw new Error('Failed to create ticket')
    return response.json()
  }
}

// ---------------------------------------------------------------------------
// Backward-compatible function exports for existing views
// ---------------------------------------------------------------------------

export async function submitTicket(payload: SubmitTicketRequest): Promise<TicketDto> {
  const response = await fetch(`${API_BASE}/support/tickets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('Failed to submit ticket')
  return response.json()
}

export async function submitFeedback(payload: SubmitFeedbackRequest): Promise<FeedbackDto> {
  const response = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('Failed to submit feedback')
  return response.json()
}