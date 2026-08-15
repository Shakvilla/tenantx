/**
 * Units API Client
 * Handles all API calls for units
 */

import { apiGet, apiPost, apiPatch, apiDelete, API_BASE } from './client'
import { getStoredToken, getStoredTenantId } from './storage'
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
  bedrooms?: number
  bathrooms?: number
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
 * Backend always returns the standard { success, data, meta } envelope
 * (see PaginatedResponseDto on UnitController#getAllUnits), so no
 * response-shape normalisation is needed here.
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
  if (query.bedrooms) params.set('bedrooms', query.bedrooms.toString())
  if (query.bathrooms) params.set('bathrooms', query.bathrooms.toString())

  const qs = params.toString()

  return apiGet(`${API_BASE}/units${qs ? `?${qs}` : ''}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
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
  try {
    const response = await apiGet<any>(`${API_BASE}/units/${id}`, {
      headers: { 'X-Tenant-ID': tenantId }
    })

    if (response && response.success === false) return response as ApiResponse<Unit>
    if (response && response.id) return { success: true, data: response as Unit }
    if (response && response.data) return { success: true, data: response.data as Unit }

    return { success: false, data: null, error: { code: 'NOT_FOUND', message: 'Unit not found' } }
  } catch (error: any) {
    return { success: false, data: null, error: { code: 'GET_UNIT_ERROR', message: error.message || 'Failed to fetch unit' } }
  }
}

/**
 * All units this occupant currently occupies within the tenant.
 * API: GET /units/by-occupant/{occupantId}
 * Backend returns a bare JSON array (no envelope).
 */
export async function getUnitsByOccupant(tenantId: string, occupantId: string): Promise<Unit[]> {
  try {
    const res = await apiGet<Unit[]>(`${API_BASE}/units/by-occupant/${occupantId}`, {
      headers: { 'X-Tenant-ID': tenantId }
    })

    return Array.isArray(res) ? res : []
  } catch {
    return []
  }
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

// ---------------------------------------------------------------------------
// Image upload
// ---------------------------------------------------------------------------

interface UploadedImage {
  path: string
  url: string
  fileId: string
}

interface UploadResponse {
  success: boolean
  data: {
    images: UploadedImage[]
    count: number
  } | null
  error?: {
    code: string
    message: string
  }
}

/**
 * Upload unit images to ImageKit CDN.
 * Files are uploaded directly from the browser to ImageKit using a
 * short-lived auth token from the Spring Boot backend.
 */
export async function uploadUnitImages(
  tenantId: string,
  files: File[],
  unitId?: string
): Promise<UploadResponse> {
  try {
    const { uploadImages } = await import('@/lib/imagekit')

    const folder = unitId
      ? `/yiliora/${tenantId}/units/${unitId}`
      : `/yiliora/${tenantId}/units`

    const uploaded = await uploadImages(files, { folder })

    return {
      success: true,
      data: {
        images: uploaded.map(f => ({ path: f.filePath, url: f.url, fileId: f.fileId })),
        count: uploaded.length
      }
    }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: {
        code: 'UPLOAD_FAILED',
        message: error.message ?? 'Failed to upload images'
      }
    }
  }
}

/**
 * Downloads all units for the current tenant as a CSV file.
 */
export async function exportUnitsCsv(): Promise<void> {
  const token = getStoredToken() ?? ''
  const tenantId = getStoredTenantId() ?? ''

  const res = await fetch(`${API_BASE}/units/export`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    }
  })

  if (!res.ok) throw new Error('Failed to export units')

  const blob = await res.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = href
  a.download = `units-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(href)
}

// Re-export types
export type { Unit, UnitQuery, PaginatedResponse, ApiResponse, UploadResponse }
