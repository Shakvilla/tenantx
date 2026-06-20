/**
 * Invoices API Client
 */

import { apiGet, apiPost, apiPut, apiPatch, apiDelete, API_BASE } from './client'
import { getStoredTenantId } from './storage'

const BASE = `${API_BASE}`

const tenantHeader = () => ({ 'X-Tenant-ID': getStoredTenantId() })

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
  status: 'DRAFT' | 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
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

export async function getInvoices(params?: { status?: string }): Promise<Invoice[]> {
  const query = params?.status ? `?status=${params.status}` : ''
  return apiGet(`${BASE}/invoices${query}`, { headers: tenantHeader() })
}

export async function getInvoiceById(id: string): Promise<Invoice> {
  return apiGet(`${BASE}/invoices/${id}`, { headers: tenantHeader() })
}

export async function createInvoice(data: CreateInvoicePayload): Promise<Invoice> {
  return apiPost(`${BASE}/invoices`, data, { headers: tenantHeader() })
}

export async function updateInvoice(id: string, data: UpdateInvoicePayload): Promise<Invoice> {
  return apiPut(`${BASE}/invoices/${id}`, data, { headers: tenantHeader() })
}

export async function updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
  return apiPatch(`${BASE}/invoices/${id}/status`, { status }, { headers: tenantHeader() })
}

export async function deleteInvoice(id: string): Promise<void> {
  return apiDelete(`${BASE}/invoices/${id}`, { headers: tenantHeader() })
}

export async function getInvoiceStats(): Promise<InvoiceStats> {
  return apiGet(`${BASE}/invoices/stats`, { headers: tenantHeader() })
}
