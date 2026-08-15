/**
 * Properties API Client
 * Handles all API calls for properties and units
 */

import { apiGet, apiPost, apiPatch, apiPut, apiDelete, API_BASE } from './client'
import { getStoredToken, getStoredTenantId } from './storage'
import type { Property, PropertyStats } from '@/types/property'

// ---------------------------------------------------------------------------
// API Response types (aligned with backend guide)
// ---------------------------------------------------------------------------

/**
 * Standard single-object response from the backend.
 */
interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: {
    code: string
    message: string
  }
}

/**
 * Paginated list response using cursor-based pagination as mandated
 * by the backend guide (Section 11 — Implementation Safeguards).
 */
interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    pagination: {
      page?: number
      pageSize?: number
      total?: number
      totalPages?: number
      hasNext: boolean
      hasPrev?: boolean
      cursor?: string | null
    }
  }
  error?: {
    code: string
    message: string
  }
}

// ---------------------------------------------------------------------------
// Query types
// ---------------------------------------------------------------------------

interface PropertyQuery {
  size?: number
  sort?: string // e.g. "id,asc"
  cursor?: string | null // opaque cursor for next page
  search?: string
  status?: string
  type?: string
  region?: string
  district?: string
}

// ---------------------------------------------------------------------------
// Properties CRUD
// ---------------------------------------------------------------------------

/**
 * Get list of properties with cursor-based pagination and filters.
 *
 * API: GET /properties
 * Guide: Section 4.2
 */

export async function getProperties(tenantId: string, query: PropertyQuery = {}): Promise<PaginatedResponse<Property>> {
  const params = new URLSearchParams()

  if (query.size) params.set('size', query.size.toString())
  if (query.sort) params.set('sort', query.sort)
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.search) params.set('search', query.search)
  if (query.status) params.set('status', query.status)
  if (query.type) params.set('type', query.type)
  if (query.region) params.set('region', query.region)
  if (query.district) params.set('district', query.district)

  const qs = params.toString()

  return apiGet(`${API_BASE}/properties${qs ? `?${qs}` : ''}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Get a single property by ID (client-side — uses Axios interceptors).
 */
export async function getPropertyById(tenantId: string, id: string): Promise<ApiResponse<Property>> {
  return apiGet(`${API_BASE}/properties/${id}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Get the property assigned to the currently-authenticated occupant.
 *
 * API: GET /properties/my-property
 * Guide: Section 4.3
 */
export async function getMyProperty(tenantId: string): Promise<ApiResponse<Property>> {
  return apiGet(`${API_BASE}/properties/my-property`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Create a new property.
 *
 * API: POST /properties
 * Guide: Section 4.1
 *
 * NOTE: The backend returns PropertyResponse directly (no ApiResponse wrapper).
 * We wrap it here for consistency with the rest of the API layer.
 */
export async function createProperty(tenantId: string, data: Partial<Property>): Promise<ApiResponse<Property>> {
  try {
    const result = await apiPost<Property>(`${API_BASE}/properties`, data, {
      headers: { 'X-Tenant-ID': tenantId }
    })

    return { success: true, data: result }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: {
        code: 'CREATE_FAILED',
        message: error.message || 'Failed to create property'
      }
    }
  }
}

/**
 * Update a property.
 *
 * NOTE: Backend uses @PutMapping and returns PropertyResponse directly
 * (not wrapped in ApiResponse). We wrap it here for consistency.
 */
export async function updateProperty(
  tenantId: string,
  id: string,
  data: Partial<Property>
): Promise<ApiResponse<Property>> {
  try {
    const result = await apiPut<Property>(`${API_BASE}/properties/${id}`, data, {
      headers: { 'X-Tenant-ID': tenantId }
    })

    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: {
        code: 'UPDATE_FAILED',
        message: error.message || 'Failed to update property'
      }
    }
  }
}

/**
 * Delete a property.
 */
export async function deleteProperty(tenantId: string, id: string): Promise<void> {
  return apiDelete(`${API_BASE}/properties/${id}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Get property statistics.
 *
 * NOTE: The backend returns a raw object without the ApiResponse wrapper.
 * We manually wrap it and map the fields to match the PropertyStats interface.
 */
export async function getPropertyStats(tenantId: string): Promise<ApiResponse<PropertyStats>> {
  try {
    const rawData = await apiGet<any>(`${API_BASE}/properties/stats`, {
      headers: { 'X-Tenant-ID': tenantId }
    })

    // Map backend fields to frontend PropertyStats interface
    // Backend: { totalProperties, activeProperties, inactiveProperties,
    //            occupiedUnits, vacantUnits, damagedUnits, reservedUnits }
    const occupiedUnits = rawData.occupiedUnits || 0
    const vacantUnits = rawData.vacantUnits || 0
    const maintenance = rawData.damagedUnits || 0
    const reservedUnits = rawData.reservedUnits || 0

    const mappedStats: PropertyStats = {
      total: rawData.totalProperties || 0,
      active: rawData.activeProperties || 0,
      inactive: rawData.inactiveProperties || 0,
      maintenance,
      reservedUnits,
      vacantUnits,

      // All four statuses. This used to be occupied + vacant only, so units under
      // maintenance and units awaiting move-in were missing from the total — and the
      // occupancy rate below, computed from it, read high as a result.
      totalUnits: occupiedUnits + vacantUnits + maintenance + reservedUnits,
      occupiedUnits,
      occupancyRate: 0
    }

    // Calculate occupancy rate if possible
    if (mappedStats.totalUnits > 0) {
      mappedStats.occupancyRate = Math.round((mappedStats.occupiedUnits / mappedStats.totalUnits) * 100)
    }

    return {
      success: true,
      data: mappedStats
    }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: {
        code: 'STATS_FETCH_ERROR',
        message: error.message || 'Failed to fetch property statistics'
      }
    }
  }
}

// Unit functionality has been moved to units.ts

// ---------------------------------------------------------------------------
// Drafts
// ---------------------------------------------------------------------------

interface DraftPayload {
  name: string
  address?: {
    street?: string
    city?: string
    country?: string
  }
  type?: string
  ownership?: string
  region?: string
  district?: string
  gpsCode?: string
  description?: string
  condition?: string
  bedrooms?: number
  bathrooms?: number
  rooms?: number
  amenities?: string[]
  images?: string[]
  imageFileIds?: string[]
  thumbnailIndex?: number
  latitude?: number
  longitude?: number
  /** Null for a device capture: there is no geocoder place behind it. */
  placeId?: string | null
  /**
   * The device's reported radius of uncertainty in metres. Absent for a
   * geocoded address — that means unknown, not perfect.
   */
  accuracyMetres?: number
}

/**
 * Save a property as draft (incomplete form).
 *
 * NOTE: The backend returns PropertyResponse directly (no ApiResponse wrapper).
 * We wrap it here for consistency with the rest of the API layer.
 */
export async function saveDraft(tenantId: string, data: DraftPayload): Promise<ApiResponse<Property>> {
  try {
    const result = await apiPost<Property>(`${API_BASE}/properties/drafts`, data, {
      headers: { 'X-Tenant-ID': tenantId }
    })

    return { success: true, data: result }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'DRAFT_SAVE_FAILED', message: error.message || 'Failed to save draft' }
    }
  }
}

/**
 * Update an existing property draft.
 */
export async function updateDraft(tenantId: string, id: string, data: DraftPayload): Promise<ApiResponse<Property>> {
  try {
    const result = await apiPatch<Property>(`${API_BASE}/properties/drafts/${id}`, data, {
      headers: { 'X-Tenant-ID': tenantId }
    })

    return { success: true, data: result }
  } catch (error: any) {
    return {
      success: false,
      data: null,
      error: { code: 'DRAFT_UPDATE_FAILED', message: error.message || 'Failed to update draft' }
    }
  }
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
 * Upload property images to ImageKit CDN.
 * Files are uploaded directly from the browser to ImageKit using a
 * short-lived auth token from the Spring Boot backend.
 *
 * @param tenantId  - Used to scope the folder path (not sent to ImageKit)
 * @param files     - Array of image files to upload
 * @param propertyId - Optional property ID for sub-folder organisation
 */
export async function uploadPropertyImages(
  tenantId: string,
  files: File[],
  propertyId?: string
): Promise<UploadResponse> {
  try {
    const { uploadImages } = await import('@/lib/imagekit')

    const folder = propertyId
      ? `/yiliora/${tenantId}/properties/${propertyId}`
      : `/yiliora/${tenantId}/properties`

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
 * Downloads all properties for the current tenant as a CSV file.
 */
export async function exportPropertiesCsv(): Promise<void> {
  const token = getStoredToken() ?? ''
  const tenantId = getStoredTenantId() ?? ''

  const res = await fetch(`${API_BASE}/properties/export`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'X-Tenant-ID': tenantId
    }
  })

  if (!res.ok) throw new Error('Failed to export properties')

  const blob = await res.blob()
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')

  a.href = href
  a.download = `properties-export-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(href)
}

// ---------------------------------------------------------------------------
// Re-export types for consumers
// ---------------------------------------------------------------------------
export type { ApiResponse, PaginatedResponse, PropertyQuery }
