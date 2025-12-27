/**
 * Properties API Client
 * Handles all API calls for properties and units
 */

import { apiFetch, apiGet, apiPost, apiPatch, apiDelete } from './client'
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

