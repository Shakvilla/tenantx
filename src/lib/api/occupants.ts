/**
 * Occupants API Client
 * Handles all API calls for occupant management
 */

import { apiGet, apiPost, apiPut, apiDelete, API_BASE } from './client'

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
  avatarFileId?: string | null
  status: 'active' | 'inactive' | 'pending'
  propertyId?: string | null
  propertyName?: string | null
  unitId?: string | null
  unitNo?: string | null
  moveInDate?: string | null
  moveOutDate?: string | null
  emergencyContact?: Record<string, any> | null
  documents?: string[] | null
  ghanaCardId?: string | null
  idType?: string | null
  idCardFrontUrl?: string | null
  idCardFrontFileId?: string | null
  idCardBackUrl?: string | null
  idCardBackFileId?: string | null
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
  avatarFileId?: string
  status?: 'active' | 'inactive' | 'pending'
  propertyId?: string
  unitId?: string
  unitNo?: string
  moveInDate?: string
  moveOutDate?: string
  emergencyContact?: Record<string, any>
  documents?: string[]
  ghanaCardId?: string
  idType?: string
  idCardFrontUrl?: string
  idCardFrontFileId?: string
  idCardBackUrl?: string
  idCardBackFileId?: string
}

export interface UpdateOccupantPayload {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  avatar?: string
  avatarFileId?: string
  status?: 'active' | 'inactive' | 'pending'
  propertyId?: string
  unitId?: string
  unitNo?: string
  moveInDate?: string
  moveOutDate?: string
  emergencyContact?: Record<string, any>
  documents?: string[]
  ghanaCardId?: string
  idType?: string
  idCardFrontUrl?: string
  idCardFrontFileId?: string
  idCardBackUrl?: string
  idCardBackFileId?: string
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
 * Backend returns OccupantResponse directly (no { success, data } wrapper)
 */
export async function getOccupantById(
  tenantId: string,
  id: string
): Promise<OccupantRecord> {
  return apiGet(`${API_BASE}/occupants/${id}`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Create a new occupant
 * Backend returns OccupantResponse directly (no { success, data } wrapper)
 */
export async function createOccupant(
  tenantId: string,
  data: CreateOccupantPayload
): Promise<OccupantRecord> {
  return apiPost(`${API_BASE}/occupants`, data, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Update an existing occupant (PUT — backend uses @PutMapping)
 * Backend returns OccupantResponse directly (no { success, data } wrapper)
 */
export async function updateOccupant(
  tenantId: string,
  id: string,
  data: UpdateOccupantPayload
): Promise<OccupantRecord> {
  return apiPut(`${API_BASE}/occupants/${id}`, data, {
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

export interface OccupantStats {
  total: number
  active: number
  inactive: number
  pending: number
}

/**
 * Get occupant stats for the current tenant
 */
export async function getOccupantStats(tenantId: string): Promise<OccupantStats> {
  return apiGet(`${API_BASE}/occupants/stats`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

/**
 * Get the current occupant's own profile (occupant-scoped JWT required)
 * Calls GET /api/v1/occupants/me
 */
export async function getMyOccupantProfile(tenantId: string): Promise<OccupantRecord> {
  return apiGet(`${API_BASE}/occupants/me`, {
    headers: { 'X-Tenant-ID': tenantId }
  })
}

export interface AvatarUploadResult {
  url: string
  fileId: string
}

/**
 * Upload a single avatar image for an occupant via ImageKit.
 */
export async function uploadOccupantAvatar(
  tenantId: string,
  file: File,
  occupantId?: string
): Promise<AvatarUploadResult> {
  const { uploadImages } = await import('@/lib/imagekit')
  const folder = occupantId
    ? `/tenantx/${tenantId}/occupants/${occupantId}`
    : `/tenantx/${tenantId}/occupants`
  const [uploaded] = await uploadImages([file], { folder })
  return { url: uploaded.url, fileId: uploaded.fileId }
}
