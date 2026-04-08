/**
 * Units API Client
 * Handles all API calls for units
 */

import { apiGet, apiPost, apiPatch, apiDelete, API_BASE } from './client'
import type { Unit } from '@/types/property'

// ---------------------------------------------------------------------------
// API Response types
// ---------------------------------------------------------------------------
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
      cursor?: string
      total?: number
    }
  }
  error?: {
    code: string
    message: string
  }
}

interface UnitQuery {
  size?: number
  sort?: string
  cursor?: string
  propertyId?: string
  status?: string
  minRent?: number
  maxRent?: number
}

// ---------------------------------------------------------------------------
// Units API Functions
// ---------------------------------------------------------------------------

/**
 * Get units for a specific property.
 * API: GET /properties/{propertyId}/units
 * Guide: Section 5.2
 */
export async function getUnitsByProperty(
  tenantId: string,
  propertyId: string,
  query: UnitQuery = {}
): Promise<PaginatedResponse<Unit>> {
  const params = new URLSearchParams()

  if (query.size) params.set('size', query.size.toString())
  if (query.sort) params.set('sort', query.sort)
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.status) params.set('status', query.status)

  const qs = params.toString()

  return apiGet(`${API_BASE}/properties/${propertyId}/units${qs ? `?${qs}` : ''}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Get all units across all properties (with optional filters).
 */
export async function getAllUnits(tenantId: string, query: UnitQuery = {}): Promise<PaginatedResponse<Unit>> {
  const params = new URLSearchParams()

  if (query.size) params.set('size', query.size.toString())
  if (query.sort) params.set('sort', query.sort)
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.propertyId) params.set('propertyId', query.propertyId)
  if (query.status) params.set('status', query.status)
  if (query.minRent) params.set('minRent', query.minRent.toString())
  if (query.maxRent) params.set('maxRent', query.maxRent.toString())

  const qs = params.toString()
  const url = `${API_BASE}/units${qs ? `?${qs}` : ''}`

  try {
    const response = await apiGet<any>(url, {
      headers: { 'X-Tenant-ID': tenantId }
    })

    // Defensive check: If response is already an array, backend is returning raw list
    if (Array.isArray(response)) {
      return {
        success: true,
        data: response,
        meta: {
          pagination: {
            hasNext: false,
            total: response.length
          }
        }
      }
    }

    // If response has success: false, it's already an ApiResponse-like object
    if (response && response.success === false) {
      return response as PaginatedResponse<Unit>
    }

    // If response has data but no success field, it might be a partial PaginatedResponse
    if (response && response.data && !('success' in response)) {
      return {
        success: true,
        data: response.data,
        meta: response.meta || { pagination: { hasNext: false } }
      }
    }

    // If it's a raw object with no data field but looks like a unit or unit list
    // (Wait, if it's not an array and doesn't have data, it's likely a single unit or an error)
    if (response && !response.data && !Array.isArray(response) && typeof response === 'object') {
      // Check if it's an error from Spring Cloud Gateway or similar
      if (response.status && response.status >= 400) {
        throw new Error(response.message || 'Backend returned an error')
      }
    }

    return response as PaginatedResponse<Unit>
  } catch (error: any) {
    console.error(`getAllUnits failed for URL [${url}]:`, error)

    return {
      success: false,
      data: [],
      meta: { pagination: { hasNext: false } },
      error: {
        code: 'UNITS_FETCH_ERROR',
        message: error.message || 'Failed to fetch units'
      }
    } as any
  }
}

/**
 * Get globally available units (status = 'available' only).
 * API: GET /units/available
 * Guide: Section 5.3
 */
export async function getAvailableUnits(tenantId: string, query: UnitQuery = {}): Promise<PaginatedResponse<Unit>> {
  const params = new URLSearchParams()

  if (query.propertyId) params.set('propertyId', query.propertyId)
  if (query.size) params.set('size', query.size.toString())

  const qs = params.toString()

  return apiGet(`${API_BASE}/units/available${qs ? `?${qs}` : ''}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Get a single unit by ID
 */
export async function getUnitById(tenantId: string, id: string): Promise<ApiResponse<Unit>> {
  return apiGet(`${API_BASE}/units/${id}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Create a new unit for a property
 * Guide: Section 5.1
 */
export async function createUnit(
  tenantId: string,
  propertyId: string,
  data: Partial<Unit>
): Promise<ApiResponse<Unit>> {
  try {
    const response = await apiPost<any>(`${API_BASE}/properties/${propertyId}/units`, data, {
      headers: { 'X-Tenant-ID': tenantId }
    })

    if (response && response.success === false) return response as ApiResponse<Unit>

    // Backend returned the unit object directly (no envelope)
    if (response && response.id) return { success: true, data: response as Unit }

    if (response && response.data) return { success: true, data: response.data as Unit }

    return { success: true, data: response as Unit }
  } catch (error: any) {
    return { success: false, data: null, error: { code: 'CREATE_UNIT_ERROR', message: error.message || 'Failed to create unit' } }
  }
}

/**
 * Update an existing unit
 */
export async function updateUnit(tenantId: string, id: string, data: Partial<Unit>): Promise<ApiResponse<Unit>> {
  try {
    const response = await apiPatch<any>(`${API_BASE}/units/${id}`, data, {
      headers: { 'X-Tenant-ID': tenantId }
    })

    if (response && response.success === false) return response as ApiResponse<Unit>

    if (response && response.id) return { success: true, data: response as Unit }

    if (response && response.data) return { success: true, data: response.data as Unit }

    return { success: true, data: response as Unit }
  } catch (error: any) {
    return { success: false, data: null, error: { code: 'UPDATE_UNIT_ERROR', message: error.message || 'Failed to update unit' } }
  }
}

/**
 * Delete a unit
 */
export async function deleteUnit(tenantId: string, id: string): Promise<void> {
  return apiDelete(`${API_BASE}/units/${id}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

// Re-export types
export type { Unit, UnitQuery, PaginatedResponse, ApiResponse }
