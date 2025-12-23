import type { User } from '@supabase/supabase-js'

/**
 * Authentication context returned by authenticate functions.
 */
export interface AuthContext {
  user: User
  tenantId: string
  role: string
}

/**
 * Tenant context for database operations.
 */
export interface TenantContext {
  tenantId: string
}

/**
 * JWT claims structure.
 */
export interface JWTClaims {
  sub: string // User ID
  email?: string
  tenant_id?: string
  role?: string
  iat: number
  exp: number
}

/**
 * User roles enum.
 */
export enum UserRole {
  VIEWER = 'viewer',
  USER = 'user',
  MANAGER = 'manager',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

/**
 * Login request payload.
 */
export interface LoginRequest {
  email: string
  password: string
  tenantId?: string
}

/**
 * Login response payload.
 */
export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    name: string
    role: string
  }
  tenant: {
    id: string
    name: string
  }
}

/**
 * Register request payload.
 */
export interface RegisterRequest {
  email: string
  password: string
  name: string
  tenantName?: string
}

/**
 * Current user response.
 */
export interface CurrentUserResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    avatar_url?: string
  }
  tenants: Array<{
    id: string
    name: string
    role: string
  }>
}
