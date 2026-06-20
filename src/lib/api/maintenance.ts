/**
 * Maintenance API Client
 * Covers: maintenance requests, maintainers, categories, comments, parts
 */

import { apiGet, apiPost, apiPut, apiDelete, API_BASE } from './client'

const BASE = `${API_BASE}/maintenance`

// ---------------------------------------------------------------------------
// Shared pagination meta
// ---------------------------------------------------------------------------
export interface PaginationMeta {
  hasNext: boolean
  cursor?: string | null
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T
  meta: {
    pagination: PaginationMeta
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: { code: string; message: string }
}

// ---------------------------------------------------------------------------
// Category types
// ---------------------------------------------------------------------------
export interface MaintenanceCategory {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCategoryPayload {
  name: string
  description?: string
  icon?: string
}

export interface UpdateCategoryPayload {
  name?: string
  description?: string
  icon?: string
  isActive?: boolean
}

// ---------------------------------------------------------------------------
// Maintainer types
// ---------------------------------------------------------------------------
export interface Maintainer {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  companyName?: string | null
  specializations?: string[]
  status: string
  rating?: number | null
  totalJobs?: number
  completedJobs?: number
  insuranceExpiryDate?: string | null
  taxId?: string | null
  isCompliant?: boolean
  createdAt: string
  updatedAt: string
}

export interface MaintainerStats {
  total: number
  active: number
  inactive: number
}

export interface CreateMaintainerPayload {
  name: string
  email?: string
  phone?: string
  companyName?: string
  specializations?: string[]
  insuranceExpiryDate?: string
  taxId?: string
}

export interface UpdateMaintainerPayload {
  name?: string
  email?: string
  phone?: string
  companyName?: string
  specializations?: string[]
  status?: string
  rating?: number
  insuranceExpiryDate?: string
  taxId?: string
  isCompliant?: boolean
}

// ---------------------------------------------------------------------------
// Maintenance request types
// ---------------------------------------------------------------------------
export interface MaintenanceRequest {
  id: string
  requestNumber?: string | null
  title: string
  description: string
  categoryId?: string | null
  subCategory?: string | null
  priority: string
  status: string
  propertyId?: string | null
  unitId?: string | null
  occupantId?: string | null
  maintainerId?: string | null
  requestedBy?: string | null
  assignedTo?: string | null
  approvedBy?: string | null
  scheduledDate?: string | null
  targetResolutionDate?: string | null
  completedDate?: string | null
  isSlaBreached?: boolean
  permissionToEnter?: boolean
  entryInstructions?: string | null
  preferredTimeSlots?: string[]
  estimatedCost?: number | null
  actualCost?: number | null
  billableTo?: string | null
  currency?: string | null
  images?: string[]
  imageFileIds?: string[]
  notes?: string | null
  version?: number
  createdAt: string
  updatedAt: string
}

export interface MaintenanceRequestStats {
  total: number
  byStatus: Record<string, number>
  byPriority: Record<string, number>
  slaBreached: number
  avgResolutionTimeHours: number
  openRequests: number
  completedThisMonth: number
}

export interface CreateMaintenanceRequestPayload {
  title: string
  description: string
  priority?: string
  propertyId: string
  unitId?: string
  occupantId?: string
  categoryId?: string
  subCategory?: string
  permissionToEnter?: boolean
  entryInstructions?: string
  preferredTimeSlots?: string[]
  estimatedCost?: number
  billableTo?: string
  currency?: string
  images?: string[]
  imageFileIds?: string[]
  notes?: string
}

export interface UpdateMaintenanceRequestPayload {
  title?: string
  description?: string
  priority?: string
  propertyId?: string
  unitId?: string
  occupantId?: string
  categoryId?: string
  subCategory?: string
  permissionToEnter?: boolean
  entryInstructions?: string
  preferredTimeSlots?: string[]
  estimatedCost?: number
  billableTo?: string
  currency?: string
  images?: string[]
  imageFileIds?: string[]
  notes?: string
}

// ---------------------------------------------------------------------------
// Comment types
// ---------------------------------------------------------------------------
export interface MaintenanceComment {
  id: string
  maintenanceRequestId: string
  authorId: string
  authorName: string
  content: string
  visibility?: string | null
  attachments?: string[]
  createdAt: string
  updatedAt: string
}

export interface CreateCommentPayload {
  content: string
  visibility?: 'internal' | 'public'
  attachments?: string[]
}

// ---------------------------------------------------------------------------
// Part types
// ---------------------------------------------------------------------------
export interface MaintenancePartItem {
  id: string
  maintenanceRequestId: string
  partName: string
  quantity: number
  unitCost: number
  totalCost: number
  notes?: string | null
  createdAt: string
}

export interface CreatePartPayload {
  partName: string
  quantity: number
  unitCost: number
  notes?: string
}

// ---------------------------------------------------------------------------
// Query options
// ---------------------------------------------------------------------------
export interface RequestQuery {
  cursor?: string
  size?: number
  sort?: string
  statuses?: string[]
}

export interface MaintainerQuery {
  cursor?: string
  size?: number
  sort?: string
}

// ---------------------------------------------------------------------------
// Category endpoints
// ---------------------------------------------------------------------------

export async function getMaintenanceCategories(activeOnly = true, tenantId?: string): Promise<MaintenanceCategory[]> {
  const headers = tenantId ? { 'X-Tenant-ID': tenantId } : undefined
  return apiGet<MaintenanceCategory[]>(`${BASE}/categories?activeOnly=${activeOnly}`, { headers })
}

export async function createMaintenanceCategory(data: CreateCategoryPayload): Promise<MaintenanceCategory> {
  return apiPost<MaintenanceCategory>(`${BASE}/categories`, data)
}

export async function updateMaintenanceCategory(id: string, data: UpdateCategoryPayload): Promise<MaintenanceCategory> {
  return apiPut<MaintenanceCategory>(`${BASE}/categories/${id}`, data)
}

export async function deleteMaintenanceCategory(id: string): Promise<void> {
  return apiDelete<void>(`${BASE}/categories/${id}`)
}

// ---------------------------------------------------------------------------
// Maintainer endpoints
// ---------------------------------------------------------------------------

export async function getMaintainers(query: MaintainerQuery = {}, tenantId?: string): Promise<PaginatedResponse<Maintainer[]>> {
  const params = new URLSearchParams()
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.size) params.set('size', String(query.size))
  if (query.sort) params.set('sort', query.sort)
  const qs = params.toString()
  const headers = tenantId ? { 'X-Tenant-ID': tenantId } : undefined
  return apiGet<PaginatedResponse<Maintainer[]>>(`${BASE}/maintainers${qs ? `?${qs}` : ''}`, { headers })
}

export async function getMaintainerById(id: string): Promise<Maintainer> {
  return apiGet<Maintainer>(`${BASE}/maintainers/${id}`)
}

export async function createMaintainer(data: CreateMaintainerPayload): Promise<Maintainer> {
  return apiPost<Maintainer>(`${BASE}/maintainers`, data)
}

export async function updateMaintainer(id: string, data: UpdateMaintainerPayload): Promise<Maintainer> {
  return apiPut<Maintainer>(`${BASE}/maintainers/${id}`, data)
}

export async function deleteMaintainer(id: string): Promise<void> {
  return apiDelete<void>(`${BASE}/maintainers/${id}`)
}

// ---------------------------------------------------------------------------
// Maintenance request endpoints
// ---------------------------------------------------------------------------

export async function getMaintenanceRequests(query: RequestQuery = {}): Promise<PaginatedResponse<MaintenanceRequest[]>> {
  const params = new URLSearchParams()
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.size) params.set('size', String(query.size))
  if (query.sort) params.set('sort', query.sort)
  if (query.statuses?.length) query.statuses.forEach(s => params.append('statuses', s))
  const qs = params.toString()
  return apiGet<PaginatedResponse<MaintenanceRequest[]>>(`${BASE}/requests${qs ? `?${qs}` : ''}`)
}

export async function getMaintenanceRequestById(id: string): Promise<MaintenanceRequest> {
  return apiGet<MaintenanceRequest>(`${BASE}/requests/${id}`)
}

export async function createMaintenanceRequest(data: CreateMaintenanceRequestPayload): Promise<MaintenanceRequest> {
  return apiPost<MaintenanceRequest>(`${BASE}/requests`, data)
}

export async function updateMaintenanceRequest(id: string, data: UpdateMaintenanceRequestPayload): Promise<MaintenanceRequest> {
  return apiPut<MaintenanceRequest>(`${BASE}/requests/${id}`, data)
}

export async function updateMaintenanceRequestStatus(id: string, status: string): Promise<MaintenanceRequest> {
  return apiPut<MaintenanceRequest>(`${BASE}/requests/${id}/status`, { status })
}

export async function deleteMaintenanceRequest(id: string): Promise<void> {
  return apiDelete<void>(`${BASE}/requests/${id}`)
}

export async function assignMaintainerToRequest(requestId: string, maintainerId: string): Promise<MaintenanceRequest> {
  return apiPut<MaintenanceRequest>(`${BASE}/requests/${requestId}/assign`, { maintainerId })
}

export async function getMaintenanceRequestStats(): Promise<MaintenanceRequestStats> {
  return apiGet<MaintenanceRequestStats>(`${BASE}/requests/stats`)
}

// ---------------------------------------------------------------------------
// Comment endpoints
// ---------------------------------------------------------------------------

export async function getComments(requestId: string, visibility?: string): Promise<MaintenanceComment[]> {
  const qs = visibility ? `?visibility=${visibility}` : ''
  return apiGet<MaintenanceComment[]>(`${BASE}/requests/${requestId}/comments${qs}`)
}

export async function addComment(requestId: string, data: CreateCommentPayload): Promise<MaintenanceComment> {
  return apiPost<MaintenanceComment>(`${BASE}/requests/${requestId}/comments`, data)
}

export async function deleteComment(commentId: string): Promise<void> {
  return apiDelete<void>(`${BASE}/comments/${commentId}`)
}

// ---------------------------------------------------------------------------
// Part endpoints
// ---------------------------------------------------------------------------

export async function getParts(requestId: string): Promise<MaintenancePartItem[]> {
  return apiGet<MaintenancePartItem[]>(`${BASE}/requests/${requestId}/parts`)
}

export async function addPart(requestId: string, data: CreatePartPayload): Promise<MaintenancePartItem> {
  return apiPost<MaintenancePartItem>(`${BASE}/requests/${requestId}/parts`, data)
}

export async function deletePart(partId: string): Promise<void> {
  return apiDelete<void>(`${BASE}/parts/${partId}`)
}

// ---------------------------------------------------------------------------
// Preventative Schedule types
// ---------------------------------------------------------------------------

export interface PreventativeSchedule {
  id: string
  title: string
  description?: string | null
  categoryId?: string | null
  propertyId: string
  unitId?: string | null
  priority: string
  frequency: string
  nextDueDate: string
  lastGeneratedAt?: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string | null
}

export interface CreatePreventativeSchedulePayload {
  title: string
  description?: string
  categoryId?: string
  propertyId: string
  unitId?: string
  priority?: string
  frequency: string
  nextDueDate: string
}

export interface UpdatePreventativeSchedulePayload {
  title?: string
  description?: string
  categoryId?: string
  propertyId?: string
  unitId?: string
  priority?: string
  frequency?: string
  nextDueDate?: string
  isActive?: boolean
}

export interface PreventativeScheduleQuery {
  cursor?: string
  size?: number
  sort?: string
}

// ---------------------------------------------------------------------------
// Preventative Schedule endpoints
// ---------------------------------------------------------------------------

export async function getPreventativeSchedules(
  query: PreventativeScheduleQuery = {}
): Promise<PaginatedResponse<PreventativeSchedule[]>> {
  const params = new URLSearchParams()
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.size) params.set('size', String(query.size))
  if (query.sort) params.set('sort', query.sort)
  const qs = params.toString()
  return apiGet<PaginatedResponse<PreventativeSchedule[]>>(
    `${BASE}/preventative-schedules${qs ? `?${qs}` : ''}`
  )
}

export async function getPreventativeScheduleById(id: string): Promise<PreventativeSchedule> {
  return apiGet<PreventativeSchedule>(`${BASE}/preventative-schedules/${id}`)
}

export async function createPreventativeSchedule(
  data: CreatePreventativeSchedulePayload
): Promise<PreventativeSchedule> {
  return apiPost<PreventativeSchedule>(`${BASE}/preventative-schedules`, data)
}

export async function updatePreventativeSchedule(
  id: string,
  data: UpdatePreventativeSchedulePayload
): Promise<PreventativeSchedule> {
  return apiPut<PreventativeSchedule>(`${BASE}/preventative-schedules/${id}`, data)
}

export async function deletePreventativeSchedule(id: string): Promise<void> {
  return apiDelete<void>(`${BASE}/preventative-schedules/${id}`)
}

// ---------------------------------------------------------------------------
// Image upload
// ---------------------------------------------------------------------------

export interface MaintenanceImageUploadResult {
  url: string
  fileId: string
}

/**
 * Upload one or more images for a maintenance request via ImageKit.
 */
export async function uploadMaintenanceImages(
  tenantId: string,
  files: File[],
  requestId?: string
): Promise<MaintenanceImageUploadResult[]> {
  const { uploadImages } = await import('@/lib/imagekit')
  const folder = requestId
    ? `/tenantx/${tenantId}/maintenance/${requestId}`
    : `/tenantx/${tenantId}/maintenance`
  const uploaded = await uploadImages(files, { folder })
  return uploaded.map(u => ({ url: u.url, fileId: u.fileId }))
}
