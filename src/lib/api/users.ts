/**
 * Users & RBAC API Client
 * Covers: users, tenant roles, permissions, role assignment
 */

import { apiGet, apiPost, apiPut, apiDelete, API_BASE } from './client'

// ---------------------------------------------------------------------------
// Shared pagination
// ---------------------------------------------------------------------------
export interface PaginationMeta {
  hasNext: boolean
  cursor?: string | null
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T
  meta: { pagination: PaginationMeta }
}

// ---------------------------------------------------------------------------
// User types — mirrors UserResponseDto
// ---------------------------------------------------------------------------
export interface User {
  id: string
  email: string
  fullName: string
  companyName?: string | null
  active: boolean
  createdAt: string
}

export interface CreateUserPayload {
  email: string
  fullName: string
  password: string
  companyName?: string
}

export interface UpdateUserPayload {
  fullName?: string
  email?: string
}

// ---------------------------------------------------------------------------
// Role types — mirrors TenantRoleDto
// ---------------------------------------------------------------------------
export interface TenantRole {
  id: string
  tenantId: string
  name: string
  description?: string | null
  isDefault: boolean
  permissionCodes: string[]
  createdAt: string
}

export interface CreateRolePayload {
  name: string
  description?: string
  isDefault?: boolean
  permissionCodes?: string[]
}

export interface UpdateRolePayload {
  name?: string
  description?: string
  isDefault?: boolean
  permissionCodes?: string[]
}

// ---------------------------------------------------------------------------
// Permission types — mirrors TenantPermissionDto
// ---------------------------------------------------------------------------
export interface TenantPermission {
  id: string
  code: string
  description?: string | null
  module: string
  createdAt: string
}

// ---------------------------------------------------------------------------
// Role assignment
// ---------------------------------------------------------------------------
export interface UserRoleAssignmentPayload {
  userId: string
  roleId: string
}

// ---------------------------------------------------------------------------
// Query options
// ---------------------------------------------------------------------------
export interface UserQuery {
  cursor?: string
  size?: number
  sort?: string
}

export interface RoleQuery {
  cursor?: string
  size?: number
}

// ---------------------------------------------------------------------------
// User endpoints  —  /api/v1/users
// ---------------------------------------------------------------------------
const USERS_BASE = `${API_BASE}/users`

export async function getUsers(query: UserQuery = {}): Promise<PaginatedResponse<User[]>> {
  const params = new URLSearchParams()
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.size) params.set('size', String(query.size))
  if (query.sort) params.set('sort', query.sort)
  const qs = params.toString()
  return apiGet<PaginatedResponse<User[]>>(`${USERS_BASE}${qs ? `?${qs}` : ''}`)
}

export async function getCurrentUser(): Promise<User> {
  return apiGet<User>(`${USERS_BASE}/me`)
}

export async function getUserById(id: string): Promise<User> {
  return apiGet<User>(`${USERS_BASE}/${id}`)
}

export async function createUser(data: CreateUserPayload): Promise<User> {
  return apiPost<User>(USERS_BASE, data)
}

export async function updateUser(id: string, data: UpdateUserPayload): Promise<User> {
  return apiPut<User>(`${USERS_BASE}/${id}`, data)
}

/** Soft-deletes (deactivates) a user */
export async function deactivateUser(id: string): Promise<void> {
  return apiDelete<void>(`${USERS_BASE}/${id}`)
}

// ---------------------------------------------------------------------------
// Role endpoints  —  /api/v1/roles
// ---------------------------------------------------------------------------
const ROLES_BASE = `${API_BASE}/roles`

export async function getRoles(query: RoleQuery = {}): Promise<PaginatedResponse<TenantRole[]>> {
  const params = new URLSearchParams()
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.size) params.set('size', String(query.size))
  const qs = params.toString()
  return apiGet<PaginatedResponse<TenantRole[]>>(`${ROLES_BASE}${qs ? `?${qs}` : ''}`)
}

export async function getRoleById(id: string): Promise<TenantRole> {
  return apiGet<TenantRole>(`${ROLES_BASE}/${id}`)
}

export async function createRole(data: CreateRolePayload): Promise<TenantRole> {
  return apiPost<TenantRole>(ROLES_BASE, data)
}

export async function updateRole(id: string, data: UpdateRolePayload): Promise<TenantRole> {
  return apiPut<TenantRole>(`${ROLES_BASE}/${id}`, data)
}

export async function deleteRole(id: string): Promise<void> {
  return apiDelete<void>(`${ROLES_BASE}/${id}`)
}

/** Get all roles assigned to a specific user */
export async function getUserRoles(userId: string, query: RoleQuery = {}): Promise<PaginatedResponse<TenantRole[]>> {
  const params = new URLSearchParams()
  if (query.cursor) params.set('cursor', query.cursor)
  if (query.size) params.set('size', String(query.size))
  const qs = params.toString()
  return apiGet<PaginatedResponse<TenantRole[]>>(`${ROLES_BASE}/users/${userId}${qs ? `?${qs}` : ''}`)
}

export async function assignRoleToUser(data: UserRoleAssignmentPayload): Promise<void> {
  return apiPost<void>(`${ROLES_BASE}/assign`, data)
}

export async function removeRoleFromUser(data: UserRoleAssignmentPayload): Promise<void> {
  return apiPost<void>(`${ROLES_BASE}/unassign`, data)
}

// ---------------------------------------------------------------------------
// Permission endpoints  —  /api/v1/permissions
// ---------------------------------------------------------------------------
const PERMISSIONS_BASE = `${API_BASE}/permissions`

export async function getPermissions(): Promise<TenantPermission[]> {
  return apiGet<TenantPermission[]>(PERMISSIONS_BASE)
}

export async function getPermissionsByModule(module: string): Promise<TenantPermission[]> {
  return apiGet<TenantPermission[]>(`${PERMISSIONS_BASE}/module/${module}`)
}
