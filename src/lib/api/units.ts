/**
 * Units API Client
 * Handles all API calls for units
 */

import { apiGet, apiPost, apiPatch, apiDelete } from './client'
import type { Unit } from '@/types/property'

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

interface UnitQuery {
  page?: number
  pageSize?: number
  propertyId?: string
  status?: string
  minRent?: number
  maxRent?: number
}

/**
 * Get units for a property
 */
export async function getUnitsByProperty(
  propertyId: string,
  query: { page?: number; pageSize?: number } = {}
): Promise<ListResponse<Unit>> {
  const params = new URLSearchParams()
  
  if (query.page) params.set('page', query.page.toString())
  if (query.pageSize) params.set('pageSize', query.pageSize.toString())

  return apiGet(`/api/v1/properties/${propertyId}/units?${params.toString()}`)
}

/**
 * Get all units across all properties (with optional filters)
 */
export async function getAllUnits(query: UnitQuery = {}): Promise<ListResponse<Unit>> {
  const params = new URLSearchParams()
  
  if (query.page) params.set('page', query.page.toString())
  if (query.pageSize) params.set('pageSize', query.pageSize.toString())
  if (query.propertyId) params.set('propertyId', query.propertyId)
  if (query.status) params.set('status', query.status)
  if (query.minRent) params.set('minRent', query.minRent.toString())
  if (query.maxRent) params.set('maxRent', query.maxRent.toString())

  return apiGet(`/api/v1/units?${params.toString()}`)
}

/**
 * Get available units across all properties (status = 'available' only)
 */
export async function getAvailableUnits(query: UnitQuery = {}): Promise<ListResponse<Unit>> {
  const params = new URLSearchParams()
  
  if (query.page) params.set('page', query.page.toString())
  if (query.pageSize) params.set('pageSize', query.pageSize.toString())
  if (query.propertyId) params.set('propertyId', query.propertyId)
  if (query.minRent) params.set('minRent', query.minRent.toString())
  if (query.maxRent) params.set('maxRent', query.maxRent.toString())

  return apiGet(`/api/v1/units/available?${params.toString()}`)
}

/**
 * Get a single unit by ID
 */
export async function getUnitById(id: string): Promise<ApiResponse<Unit>> {
  return apiGet(`/api/v1/units/${id}`)
}

/**
 * Create a new unit for a property
 */
export async function createUnit(propertyId: string, data: Partial<Unit>): Promise<ApiResponse<Unit>> {
  return apiPost(`/api/v1/properties/${propertyId}/units`, data)
}

/**
 * Update a unit
 */
export async function updateUnit(id: string, data: Partial<Unit>): Promise<ApiResponse<Unit>> {
  return apiPatch(`/api/v1/units/${id}`, data)
}

/**
 * Delete a unit
 */
export async function deleteUnit(id: string): Promise<void> {
  return apiDelete(`/api/v1/units/${id}`)
}
