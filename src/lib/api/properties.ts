/**
 * Properties API Client
 * Handles all API calls for properties and units
 */

import { apiGet, apiPost, apiPatch, apiDelete, API_BASE } from './client'
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

export async function getProperties(query: PropertyQuery = {}): Promise<PaginatedResponse<Property>> {
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

  return apiGet(`${API_BASE}/properties${qs ? `?${qs}` : ''}`)
}

/**
 * Get a single property by ID.
 */
export async function getPropertyById(id: string): Promise<ApiResponse<Property>> {
  return apiGet(`${API_BASE}/properties/${id}`)
}

/**
 * Get the property assigned to the currently-authenticated occupant.
 *
 * API: GET /properties/my-property
 * Guide: Section 4.3
 */
export async function getMyProperty(): Promise<ApiResponse<Property>> {
  return apiGet(`${API_BASE}/properties/my-property`)
}

/**
 * Create a new property.
 *
 * API: POST /properties
 * Guide: Section 4.1
 */
export async function createProperty(data: Partial<Property>): Promise<ApiResponse<Property>> {
  return apiPost(`${API_BASE}/properties`, data)
}

/**
 * Update a property.
 */
export async function updateProperty(id: string, data: Partial<Property>): Promise<ApiResponse<Property>> {
  return apiPatch(`${API_BASE}/properties/${id}`, data)
}

/**
 * Delete a property.
 */
export async function deleteProperty(id: string): Promise<void> {
  return apiDelete(`${API_BASE}/properties/${id}`)
}

/**
 * Get property statistics.
 * 
 * NOTE: The backend returns a raw object without the ApiResponse wrapper.
 * We manually wrap it and map the fields to match the PropertyStats interface.
 */
export async function getPropertyStats(): Promise<ApiResponse<PropertyStats>> {
  try {
    const rawData = await apiGet<any>(`${API_BASE}/properties/stats`)

    // Map backend fields to frontend PropertyStats interface
    // Backend: { totalProperties, occupiedUnits, vacantUnits, damagedUnits }
    const mappedStats: PropertyStats = {
      total: rawData.totalProperties || 0,
      active: rawData.totalProperties || 0, // Fallback if active not provided
      inactive: 0,
      maintenance: rawData.damagedUnits || 0,
      totalUnits: (rawData.occupiedUnits || 0) + (rawData.vacantUnits || 0),
      occupiedUnits: rawData.occupiedUnits || 0,
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
  thumbnailIndex?: number
}

/**
 * Save a property as draft (incomplete form).
 */
export async function saveDraft(data: DraftPayload): Promise<ApiResponse<Property>> {
  return apiPost(`${API_BASE}/properties/drafts`, data)
}

/**
 * Update an existing property draft.
 */
export async function updateDraft(id: string, data: DraftPayload): Promise<ApiResponse<Property>> {
  return apiPatch(`${API_BASE}/properties/drafts`, { id, ...data })
}

// ---------------------------------------------------------------------------
// Image upload
// ---------------------------------------------------------------------------

interface UploadedImage {
  path: string
  url: string
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
 * Upload property images to storage.
 * @param files - Array of files to upload
 * @param propertyId - Optional property ID to organize files
 */
export async function uploadPropertyImages(files: File[], propertyId?: string): Promise<UploadResponse> {
  const formData = new FormData()

  files.forEach(file => {
    formData.append('files', file)
  })

  if (propertyId) {
    formData.append('propertyId', propertyId)
  }

  // Use axios directly (not apiClient) to avoid default Content-Type header
  // axios will automatically set Content-Type: multipart/form-data with boundary
  const { default: axios } = await import('axios')

  const response = await axios.post<UploadResponse>(`${API_BASE}/properties/upload`, formData, {
    withCredentials: true,
    headers: {
      // Don't set Content-Type - let axios detect from FormData
    }
  })

  return response.data
}

// ---------------------------------------------------------------------------
// Re-export types for consumers
// ---------------------------------------------------------------------------
export type { ApiResponse, PaginatedResponse, PropertyQuery }
