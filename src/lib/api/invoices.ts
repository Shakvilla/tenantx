/**
 * Invoices API Client
 */

import { apiGet, apiPost, apiPatch, apiDelete, API_BASE } from './client'

export interface Invoice {
  id: number
  invoiceNumber: string
  tenantName: string
  tenantEmail: string
  tenantAvatar?: string
  propertyName: string
  unitName: string
  amount: string
  issuedDate: string
  dueDate: string
  status: 'paid' | 'pending' | 'overdue' | 'draft' | 'cancelled'
  balance: string
  invoiceMonth?: string
  invoiceType?: string
  description?: string
  invoiceItems?: Array<{
    id: number
    description: string
    quantity: number
    price: number
  }>
}

interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: {
    code: string
    message: string
  }
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta?: {
    pagination: {
      hasNext: boolean
      total?: number
    }
  }
}

/**
 * Get all invoices
 */
export async function getInvoices(tenantId: string): Promise<PaginatedResponse<Invoice>> {
  return apiGet(`${API_BASE}/invoices`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(tenantId: string, id: string): Promise<ApiResponse<Invoice>> {
  return apiGet(`${API_BASE}/invoices/${id}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Create invoice
 */
export async function createInvoice(tenantId: string, data: Partial<Invoice>): Promise<ApiResponse<Invoice>> {
  return apiPost(`${API_BASE}/invoices`, data, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Update invoice
 */
export async function updateInvoice(tenantId: string, id: string, data: Partial<Invoice>): Promise<ApiResponse<Invoice>> {
  return apiPatch(`${API_BASE}/invoices/${id}`, data, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Delete invoice
 */
export async function deleteInvoice(tenantId: string, id: string): Promise<void> {
  return apiDelete(`${API_BASE}/invoices/${id}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}
