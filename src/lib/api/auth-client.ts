/**
 * Auth API Client Stub
 * 
 * TODO: Replace with actual API calls to your new backend
 * This file provides type definitions and stub functions for development.
 */

// Types - preserved for your new backend
export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  avatarUrl?: string
  phone?: string
}

export interface AuthTenant {
  id: string
  name: string
  subdomain?: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  expiresAt: number
  user: AuthUser
  tenant: AuthTenant
}

export interface ApiResponse<T> {
  success: boolean
  data: T | null
  error?: {
    code: string
    message: string
  }
}

// Token management stubs
const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredTokens(token: string, refreshToken: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
}

export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// API stub functions - TODO: implement with your backend

export async function loginUser(
  _email: string,
  _password: string
): Promise<ApiResponse<AuthResponse>> {
  // TODO: Call your backend login API
  return {
    success: false,
    data: null,
    error: { code: 'NOT_IMPLEMENTED', message: 'Backend not connected' },
  }
}

export async function registerUser(_payload: {
  email: string
  password: string
  name: string
  phone?: string
  tenantName: string
}): Promise<ApiResponse<AuthResponse>> {
  // TODO: Call your backend register API
  return {
    success: false,
    data: null,
    error: { code: 'NOT_IMPLEMENTED', message: 'Backend not connected' },
  }
}

export async function logoutUser(): Promise<ApiResponse<null>> {
  clearStoredTokens()
  return { success: true, data: null }
}

export async function getCurrentUser(): Promise<
  ApiResponse<{ user: AuthUser; tenant: AuthTenant }>
> {
  // TODO: Call your backend to get current user
  return {
    success: false,
    data: null,
    error: { code: 'NOT_IMPLEMENTED', message: 'Backend not connected' },
  }
}

export async function updateProfile(_payload: {
  name?: string
  phone?: string
  avatarUrl?: string
}): Promise<ApiResponse<{ id: string; name: string; phone?: string; avatarUrl?: string }>> {
  // TODO: Call your backend to update profile
  return {
    success: false,
    data: null,
    error: { code: 'NOT_IMPLEMENTED', message: 'Backend not connected' },
  }
}

export async function forgotPassword(_email: string): Promise<ApiResponse<{ message: string }>> {
  // TODO: Call your backend forgot password API
  return {
    success: false,
    data: null,
    error: { code: 'NOT_IMPLEMENTED', message: 'Backend not connected' },
  }
}
