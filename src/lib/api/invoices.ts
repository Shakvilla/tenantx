/**
 * Invoices API Client
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete, API_BASE } from './client'
import { emitBillingChanged } from './events'
import { getStoredToken, getStoredTenantId } from './storage'

const BASE = `${API_BASE}`

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InvoiceItem {
  description: string
  quantity: number
  price: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  occupantId?: string | null
  occupantName?: string | null
  occupantEmail?: string | null
  propertyId?: string | null
  propertyName?: string | null
  unitId?: string | null
  unitNo?: string | null
  invoiceMonth?: string | null
  issuedDate: string          // ISO date YYYY-MM-DD
  dueDate: string             // ISO date YYYY-MM-DD
  amount: number
  balance: number
  currency: string
  status: 'DRAFT' | 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  invoiceType?: string | null
  description?: string | null
  invoiceItems?: InvoiceItem[]
  createdAt: string
  updatedAt?: string | null
}

export interface CreateInvoicePayload {
  occupantId?: string
  occupantName?: string
  occupantEmail?: string
  propertyId?: string
  propertyName?: string
  unitId?: string
  unitNo?: string
  invoiceMonth?: string
  issuedDate: string
  dueDate: string
  amount: number
  currency?: string
  status?: string
  invoiceType?: string
  description?: string
  invoiceItems?: InvoiceItem[]
}

export interface UpdateInvoicePayload {
  occupantId?: string
  occupantName?: string
  occupantEmail?: string
  propertyId?: string
  propertyName?: string
  unitId?: string
  unitNo?: string
  invoiceMonth?: string
  issuedDate?: string
  dueDate?: string
  amount?: number
  currency?: string
  status?: string
  invoiceType?: string
  description?: string
  invoiceItems?: InvoiceItem[]
}

export interface InvoiceStats {
  total: number
  draft: number
  pending: number
  partial: number
  paid: number
  overdue: number
  cancelled: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

export async function getInvoices(params?: {
  status?: string
  startDate?: string
  endDate?: string
}): Promise<Invoice[]> {
  const query = new URLSearchParams()

  if (params?.status) query.set('status', params.status)
  if (params?.startDate) query.set('startDate', params.startDate)
  if (params?.endDate) query.set('endDate', params.endDate)

  const qs = query.toString()

  return apiGet(`${BASE}/invoices${qs ? `?${qs}` : ''}`)
}

export async function getInvoiceById(id: string): Promise<Invoice> {
  return apiGet(`${BASE}/invoices/${id}`)
}

export async function createInvoice(data: CreateInvoicePayload): Promise<Invoice> {
  const created = await apiPost<Invoice>(`${BASE}/invoices`, data)

  emitBillingChanged()

  return created
}

export async function updateInvoice(id: string, data: UpdateInvoicePayload): Promise<Invoice> {
  const updated = await apiPut<Invoice>(`${BASE}/invoices/${id}`, data)

  emitBillingChanged()

  return updated
}

export async function updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
  const updated = await apiPatch<Invoice>(`${BASE}/invoices/${id}/status`, { status })

  emitBillingChanged()

  return updated
}

export async function deleteInvoice(id: string): Promise<void> {
  await apiDelete(`${BASE}/invoices/${id}`)
  emitBillingChanged()
}

/**
 * Invoice totals, optionally narrowed to a period by issued date.
 *
 * Omit the range for all-time figures (the Invoices page). Pass the landlord's chosen range for
 * the Earnings report — without it, those tiles reported all-time numbers beside charts that
 * were correctly filtered, so January showed the current figures.
 */
export async function getInvoiceStats(params?: {
  startDate?: string
  endDate?: string
}): Promise<InvoiceStats> {
  const qs = new URLSearchParams()

  if (params?.startDate) qs.set('startDate', params.startDate)
  if (params?.endDate) qs.set('endDate', params.endDate)

  const query = qs.toString()

  return apiGet(`${BASE}/invoices/stats${query ? `?${query}` : ''}`)
}

/**
 * Downloads all invoices for the current tenant as a CSV file.
 */
export async function exportInvoicesCsv(): Promise<void> {
  const token = getStoredToken() ?? ''
  const tenantId = getStoredTenantId() ?? ''

  const res = await fetch(`${BASE}/invoices/export`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    }
  })

  if (!res.ok) throw new Error('Failed to export invoices')

  const blob = await res.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = href
  a.download = `invoices-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(href)
}
