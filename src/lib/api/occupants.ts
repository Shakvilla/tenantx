/**
 * Occupants API Client
 * Handles all API calls for occupant management
 */

import { apiGet, apiPost, apiPatch, apiDelete, API_BASE } from './client'

interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: { code: string; message: string }
  meta?: {
    pagination?: { total?: number; cursor?: string; hasNext?: boolean }
  }
}

// Matches backend OccupantResponse — all camelCase
export interface OccupantRecord {
  id: string
  tenantId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar?: string | null
  status: 'active' | 'inactive' | 'pending'
  propertyId?: string | null
  unitId?: string | null
  unitNo?: string | null
  moveInDate?: string | null
  moveOutDate?: string | null
  emergencyContact?: Record<string, any> | null
  documents?: string[] | null
  createdAt: string
  updatedAt: string

  // Joined relations (if present)
  property?: { id: string; name: string } | null
  unit?: { id: string; unitNo: string } | null
}

interface OccupantQuery {
  search?: string
  status?: string
  propertyId?: string
  size?: number
  cursor?: string
  sort?: string
}

export interface CreateOccupantPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  avatar?: string
  status?: 'active' | 'inactive' | 'pending'
  propertyId?: string
  unitId?: string
  unitNo?: string
  moveInDate?: string
  moveOutDate?: string
  emergencyContact?: Record<string, any>
  documents?: string[]
}

export interface UpdateOccupantPayload {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  avatar?: string
  status?: 'active' | 'inactive' | 'pending'
  propertyId?: string
  unitId?: string
  unitNo?: string
  moveInDate?: string
  moveOutDate?: string
  emergencyContact?: Record<string, any>
  documents?: string[]
}

/**
 * Get list of occupants with cursor-based pagination and filters
 */
export async function getOccupants(
  tenantId: string,
  query: OccupantQuery = {}
): Promise<ApiResponse<OccupantRecord[]>> {
  const params = new URLSearchParams()

  if (query.size) params.set('size', query.size.toString())
  if (query.search) params.set('search', query.search)
  if (query.status) params.set('status', query.status)
  if (query.propertyId) params.set('propertyId', query.propertyId)
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.sort) params.set('sort', query.sort)

  return apiGet(`${API_BASE}/occupants?${params.toString()}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Get a single occupant by ID
 */
export async function getOccupantById(
  tenantId: string,
  id: string
): Promise<ApiResponse<OccupantRecord>> {
  return apiGet(`${API_BASE}/occupants/${id}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Create a new occupant
 */
export async function createOccupant(
  tenantId: string,
  data: CreateOccupantPayload
): Promise<ApiResponse<OccupantRecord>> {
  return apiPost(`${API_BASE}/occupants`, data, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Update an existing occupant
 */
export async function updateOccupant(
  tenantId: string,
  id: string,
  data: UpdateOccupantPayload
): Promise<ApiResponse<OccupantRecord>> {
  return apiPatch(`${API_BASE}/occupants/${id}`, data, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Delete an occupant
 */
export async function deleteOccupant(tenantId: string, id: string): Promise<void> {
  return apiDelete(`${API_BASE}/occupants/${id}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}
