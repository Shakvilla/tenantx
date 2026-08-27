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

export interface OccupantAddress {
  country?: string
  state?: string
  city?: string
  zipCode?: string
  address?: string
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
  occupation?: string | null
  familyMembersCount?: number | null
  dob?: string | null
  previousAddress?: OccupantAddress | null
  permanentAddress?: OccupantAddress | null
  documents?: string[] | null
  ghanaCardId?: string | null
  idType?: string | null
  createdAt: string
  updatedAt: string

  // Joined relations (if present)
  property?: { id: string; name: string } | null
  unit?: { id: string; unitNo: string } | null
}

interface OccupantQuery {
  /** 'summary' returns only the fields the dashboard table renders — no PII (audit #7). */
  view?: 'summary'
  search?: string
  status?: string
  propertyId?: string
  size?: number
  cursor?: string
  sort?: string
  startDate?: string
  endDate?: string
}

export interface CreateOccupantPayload {
  firstName: string
  lastName: string
  /**
   * Optional. Most Ghanaian tenants have a phone and no email address, and the backend has
   * never required one — CreateOccupantRequest validates the format if present and nothing
   * more. Marking it required here forced landlords to invent addresses.
   */
  email?: string
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
  occupation?: string
  familyMembersCount?: number
  dob?: string
  previousAddress?: OccupantAddress
  permanentAddress?: OccupantAddress
  documents?: string[]
  ghanaCardId?: string
  idType?: string
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
  occupation?: string
  familyMembersCount?: number
  dob?: string
  previousAddress?: OccupantAddress
  permanentAddress?: OccupantAddress
  documents?: string[]
  ghanaCardId?: string
  idType?: string
}

/**
 * Get list of occupants with cursor-based pagination and filters
 */
export async function getOccupants(
  tenantId: string,
  query: OccupantQuery = {}
): Promise<ApiResponse<OccupantRecord[]>> {
  const params = new URLSearchParams()

  if (query.view) params.set('view', query.view)
  if (query.size) params.set('size', query.size.toString())
  if (query.search) params.set('search', query.search)
  if (query.status) params.set('status', query.status)
  if (query.propertyId) params.set('propertyId', query.propertyId)
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.sort) params.set('sort', query.sort)
  if (query.startDate) params.set('startDate', query.startDate)
  if (query.endDate) params.set('endDate', query.endDate)

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

/**
 * Look up an occupant by email within the current tenant. Returns null if none exists.
 */
export async function getOccupantByEmail(tenantId: string, email: string): Promise<OccupantRecord | null> {
  try {
    return await apiGet(`${API_BASE}/occupants/by-email?email=${encodeURIComponent(email)}`, {
      headers: { 'X-Tenant-ID': tenantId }
    })
  } catch {
    return null
  }
}

/** Find occupants in this tenant matching the given email and/or phone (either may be blank). */
export async function lookupOccupants(tenantId: string, email: string, phone: string): Promise<OccupantRecord[]> {
  const params = new URLSearchParams()

  if (email) params.set('email', email)
  if (phone) params.set('phone', phone)
  if (![...params].length) return []

  try {
    const res = await apiGet<OccupantRecord[]>(`${API_BASE}/occupants/lookup?${params.toString()}`, {
      headers: { 'X-Tenant-ID': tenantId }
    })

    return Array.isArray(res) ? res : []
  } catch {
    return []
  }
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
    ? `/yiliora/${tenantId}/occupants/${occupantId}`
    : `/yiliora/${tenantId}/occupants`

  const [uploaded] = await uploadImages([file], { folder })

  return { url: uploaded.url, fileId: uploaded.fileId }
}
