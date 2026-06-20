/**
 * Expenses API Client
 * Covers: expense configs and expenses
 */

import { apiGet, apiPost, apiPut, apiDelete, API_BASE } from './client'
import { getStoredTenantId } from './storage'

const BASE = `${API_BASE}`

// ---------------------------------------------------------------------------
// Expense Config types
// ---------------------------------------------------------------------------

export interface ExpenseConfig {
  id: string
  item: string
  category?: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string | null
}

export interface CreateExpenseConfigPayload {
  item: string
  category?: string
}

export interface UpdateExpenseConfigPayload {
  item?: string
  category?: string
  isActive?: boolean
}

// ---------------------------------------------------------------------------
// Expense types
// ---------------------------------------------------------------------------

export interface Expense {
  id: string
  item: string
  expenseConfigId?: string | null
  propertyId?: string | null
  propertyName?: string | null
  unitId?: string | null
  unitNo?: string | null
  date: string
  amount: number
  currency: string
  responsibility: 'OWNER' | 'TENANT'
  status: 'PAID' | 'UNPAID' | 'PENDING'
  description?: string | null
  imageUrl?: string | null
  imageFileId?: string | null
  createdAt: string
  updatedAt?: string | null
}

export interface CreateExpensePayload {
  item: string
  expenseConfigId?: string
  propertyId?: string
  unitId?: string
  date: string
  amount: number
  currency?: string
  responsibility?: string
  status?: string
  description?: string
  imageUrl?: string
  imageFileId?: string
}

export interface UpdateExpensePayload {
  item?: string
  expenseConfigId?: string
  propertyId?: string
  unitId?: string
  date?: string
  amount?: number
  currency?: string
  responsibility?: string
  status?: string
  description?: string
  imageUrl?: string
  imageFileId?: string
}

export interface ExpenseStats {
  total: number
  paid: number
  unpaid: number
  pending: number
  totalAmount: number
  paidAmount: number
  unpaidAmount: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function tenantHeader() {
  const tid = getStoredTenantId()
  return tid ? { 'X-Tenant-ID': tid } : {}
}

// ---------------------------------------------------------------------------
// Expense Config API
// ---------------------------------------------------------------------------

export async function getExpenseConfigs(activeOnly = true): Promise<ExpenseConfig[]> {
  return apiGet(`${BASE}/expense-configs?activeOnly=${activeOnly}`, {
    headers: tenantHeader()
  })
}

export async function createExpenseConfig(data: CreateExpenseConfigPayload): Promise<ExpenseConfig> {
  return apiPost(`${BASE}/expense-configs`, data, {
    headers: tenantHeader()
  })
}

export async function updateExpenseConfig(id: string, data: UpdateExpenseConfigPayload): Promise<ExpenseConfig> {
  return apiPut(`${BASE}/expense-configs/${id}`, data, {
    headers: tenantHeader()
  })
}

export async function deleteExpenseConfig(id: string): Promise<void> {
  return apiDelete(`${BASE}/expense-configs/${id}`, {
    headers: tenantHeader()
  })
}

// ---------------------------------------------------------------------------
// Expenses API
// ---------------------------------------------------------------------------

export async function getExpenses(query: { propertyId?: string; status?: string } = {}): Promise<Expense[]> {
  const params = new URLSearchParams()
  if (query.propertyId) params.set('propertyId', query.propertyId)
  if (query.status) params.set('status', query.status)
  const qs = params.toString()
  return apiGet(`${BASE}/expenses${qs ? `?${qs}` : ''}`, {
    headers: tenantHeader()
  })
}

export async function getExpenseById(id: string): Promise<Expense> {
  return apiGet(`${BASE}/expenses/${id}`, {
    headers: tenantHeader()
  })
}

export async function createExpense(data: CreateExpensePayload): Promise<Expense> {
  return apiPost(`${BASE}/expenses`, data, {
    headers: tenantHeader()
  })
}

export async function updateExpense(id: string, data: UpdateExpensePayload): Promise<Expense> {
  return apiPut(`${BASE}/expenses/${id}`, data, {
    headers: tenantHeader()
  })
}

export async function deleteExpense(id: string): Promise<void> {
  return apiDelete(`${BASE}/expenses/${id}`, {
    headers: tenantHeader()
  })
}

export async function getExpenseStats(): Promise<ExpenseStats> {
  return apiGet(`${BASE}/expenses/stats`, {
    headers: tenantHeader()
  })
}
