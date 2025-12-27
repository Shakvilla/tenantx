/**
 * Properties API Client
 * Handles all API calls for properties and units
 */

import { apiGet, apiPost, apiPatch, apiDelete } from './client'
import type { Property, PropertyStats } from '@/types/property'

// API Response types
interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: {
    code: string
    message: string
  }
}

interface ListResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

interface PropertyQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  type?: string
  region?: string
  district?: string
}

/**
 * Get list of properties with pagination and filters
 */
export async function getProperties(query: PropertyQuery = {}): Promise<ListResponse<Property>> {
  const params = new URLSearchParams()
  
  if (query.page) params.set('page', query.page.toString())
  if (query.pageSize) params.set('pageSize', query.pageSize.toString())
  if (query.search) params.set('search', query.search)
  if (query.status) params.set('status', query.status)
  if (query.type) params.set('type', query.type)
  if (query.region) params.set('region', query.region)
  if (query.district) params.set('district', query.district)

  return apiGet(`/api/v1/properties?${params.toString()}`)
}

/**
 * Get a single property by ID
 */
export async function getPropertyById(id: string): Promise<ApiResponse<Property>> {
  return apiGet(`/api/v1/properties/${id}`)
}

/**
 * Create a new property
 */
export async function createProperty(data: Partial<Property>): Promise<ApiResponse<Property>> {
  return apiPost('/api/v1/properties', data)
}

/**
 * Update a property
 */
export async function updateProperty(id: string, data: Partial<Property>): Promise<ApiResponse<Property>> {
  return apiPatch(`/api/v1/properties/${id}`, data)
}

/**
 * Delete a property
 */
export async function deleteProperty(id: string): Promise<void> {
  return apiDelete(`/api/v1/properties/${id}`)
}

/**
 * Get property statistics
 */
export async function getPropertyStats(): Promise<ApiResponse<PropertyStats>> {
  return apiGet('/api/v1/properties/stats')
}

// Unit type for property units list
export interface PropertyUnit {
  id: string
  unit_no: string
  type: string
  status: 'available' | 'occupied' | 'maintenance' | 'reserved'
  rent: number
  deposit?: number
  bedrooms?: number
  bathrooms?: number
  size_sqft?: number
  tenant_record_id?: string
  tenant_record?: {
    id: string
    first_name: string
    last_name: string
  }
}

interface UnitsListResponse {
  success: boolean
  data: PropertyUnit[]
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}

/**
 * Get units for a specific property
 */
export async function getPropertyUnits(propertyId: string, page = 1, pageSize = 10): Promise<UnitsListResponse> {
  return apiGet(`/api/v1/properties/${propertyId}/units?page=${page}&pageSize=${pageSize}`)
}

// Create unit payload
export interface CreateUnitPayload {
  unitNo: string
  type: 'studio' | '1br' | '2br' | '3br' | '4br+' | 'commercial' | 'office' | 'retail'
  rent: number
  deposit?: number
  floor?: number
  bedrooms?: number
  bathrooms?: number
  sizeSqft?: number
  status?: 'available' | 'occupied' | 'maintenance' | 'reserved'
  amenities?: string[]
}

// Update unit payload (partial)
export interface UpdateUnitPayload {
  unitNo?: string
  type?: 'studio' | '1br' | '2br' | '3br' | '4br+' | 'commercial' | 'office' | 'retail'
  rent?: number
  deposit?: number
  floor?: number
  bedrooms?: number
  bathrooms?: number
  sizeSqft?: number
  status?: 'available' | 'occupied' | 'maintenance' | 'reserved'
  amenities?: string[]
}

/**
 * Create a new unit for a property
 */
export async function createUnit(propertyId: string, data: CreateUnitPayload): Promise<ApiResponse<PropertyUnit>> {
  return apiPost(`/api/v1/properties/${propertyId}/units`, data)
}

/**
 * Update an existing unit
 */
export async function updateUnit(unitId: string, data: UpdateUnitPayload): Promise<ApiResponse<PropertyUnit>> {
  return apiPatch(`/api/v1/units/${unitId}`, data)
}

/**
 * Delete a unit
 */
export async function deleteUnit(unitId: string): Promise<void> {
  return apiDelete(`/api/v1/units/${unitId}`)
}


// Draft payload type for client-side
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
 * Save a property as draft (incomplete form)
 */
export async function saveDraft(data: DraftPayload): Promise<ApiResponse<Property>> {
  return apiPost('/api/v1/properties/drafts', data)
}

/**
 * Update an existing property draft
 */
export async function updateDraft(id: string, data: DraftPayload): Promise<ApiResponse<Property>> {
  return apiPatch('/api/v1/properties/drafts', { id, ...data })
}

// Image upload types
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
 * Upload property images to storage
 * @param files - Array of files to upload
 * @param propertyId - Optional property ID to organize files
 */
export async function uploadPropertyImages(
  files: File[],
  propertyId?: string
): Promise<UploadResponse> {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })

  if (propertyId) {
    formData.append('propertyId', propertyId)
  }

  // Use axios directly (not apiClient) to avoid default Content-Type header
  // axios will automatically set Content-Type: multipart/form-data with boundary
  const { default: axios } = await import('axios')

  const response = await axios.post<UploadResponse>('/api/v1/properties/upload', formData, {
    withCredentials: true,
    headers: {
      // Don't set Content-Type - let axios detect from FormData
    },
  })

  return response.data
}
