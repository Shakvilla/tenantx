/**
 * Tenants API Client
 * Handles all API calls for tenant (renter) management
 */

import { apiGet, apiPost, apiPatch, apiDelete } from './client'

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

// Tenant record type matching backend
export interface TenantRecord {
  id: string
  tenant_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  avatar?: string | null
  status: 'active' | 'inactive' | 'pending'
  property_id?: string | null
  unit_id?: string | null
  unit_no?: string | null
  move_in_date?: string | null
  move_out_date?: string | null
  emergency_contact?: {
    name?: string
    phone?: string
    relationship?: string
  } | null
  metadata?: Record<string, unknown> | null
  created_at: string
  updated_at: string
  // Joined relations
  property?: {
    id: string
    name: string
  } | null
  unit?: {
    id: string
    unit_no: string
  } | null
}

export interface TenantStats {
  total: number
  active: number
  inactive: number
  pending: number
}

interface TenantQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: string
  propertyId?: string
}

// Create/Update payload types
export interface CreateTenantPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  password?: string
  avatar?: string
  status?: 'active' | 'inactive' | 'pending'
  propertyId?: string
  unitId?: string
  unitNo?: string
  moveInDate?: string
  moveOutDate?: string
  emergencyContact?: {
    name?: string
    phone?: string
    relationship?: string
  }
  metadata?: {
    occupation?: string
    dob?: string
    familyMembersCount?: number
    permanentAddress?: {
      country?: string
      state?: string
      city?: string
      zipCode?: string
      address?: string
    }
    previousAddress?: {
      country?: string
      state?: string
      city?: string
      zipCode?: string
      address?: string
    }
  }
}

export interface UpdateTenantPayload {
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
  emergencyContact?: {
    name?: string
    phone?: string
    relationship?: string
  }
  metadata?: {
    occupation?: string
    dob?: string
    familyMembersCount?: number
    permanentAddress?: {
      country?: string
      state?: string
      city?: string
      zipCode?: string
      address?: string
    }
    previousAddress?: {
      country?: string
      state?: string
      city?: string
      zipCode?: string
      address?: string
    }
  }
}

/**
 * Get list of tenants with pagination and filters
 */
export async function getTenants(query: TenantQuery = {}): Promise<ListResponse<TenantRecord>> {
  const params = new URLSearchParams()
  
  if (query.page) params.set('page', query.page.toString())
  if (query.pageSize) params.set('pageSize', query.pageSize.toString())
  if (query.search) params.set('search', query.search)
  if (query.status) params.set('status', query.status)
  if (query.propertyId) params.set('propertyId', query.propertyId)

  return apiGet(`/api/v1/tenants?${params.toString()}`)
}

/**
 * Get a single tenant by ID
 */
export async function getTenantById(id: string): Promise<ApiResponse<TenantRecord>> {
  return apiGet(`/api/v1/tenants/${id}`)
}

/**
 * Create a new tenant
 */
export async function createTenant(data: CreateTenantPayload): Promise<ApiResponse<TenantRecord>> {
  return apiPost('/api/v1/tenants', data)
}

/**
 * Update an existing tenant
 */
export async function updateTenant(id: string, data: UpdateTenantPayload): Promise<ApiResponse<TenantRecord>> {
  return apiPatch(`/api/v1/tenants/${id}`, data)
}

/**
 * Delete a tenant
 */
export async function deleteTenant(id: string): Promise<void> {
  return apiDelete(`/api/v1/tenants/${id}`)
}

/**
 * Get tenant statistics
 */
export async function getTenantStats(): Promise<ApiResponse<TenantStats>> {
  return apiGet('/api/v1/tenants/stats')
}

/**
 * Upload a tenant image to Supabase storage
 * @param file - The file to upload
 * @param propertyName - The property name for folder organization
 * @param tenantName - The tenant name for folder organization
 * @param fileType - Type of file: 'avatar', 'ghanaCardFront', 'ghanaCardBack'
 */
export async function uploadTenantImage(
  file: File,
  propertyName: string,
  tenantName: string,
  fileType: 'avatar' | 'ghanaCardFront' | 'ghanaCardBack'
): Promise<ApiResponse<{ path: string; url: string; fileType: string }>> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('propertyName', propertyName)
  formData.append('tenantName', tenantName)
  formData.append('fileType', fileType)

  const response = await fetch('/api/v1/tenants/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data?.error?.message || 'Failed to upload image')
  }

  return data
}
