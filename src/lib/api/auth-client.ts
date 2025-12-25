/**
 * Auth API Client
 * Client-side functions to interact with the authentication API endpoints.
 */

const API_BASE = '/api/v1/auth'

// Types
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

// Token management
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

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// API Functions

export async function loginUser(
  email: string,
  password: string
): Promise<ApiResponse<AuthResponse>> {
  const res = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  const data = await res.json()

  if (data.success && data.data) {
    setStoredTokens(data.data.token, data.data.refreshToken)
  }

  return data
}

export async function registerUser(payload: {
  email: string
  password: string
  name: string
  phone?: string
  tenantName: string
}): Promise<ApiResponse<AuthResponse>> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const data = await res.json()

  if (data.success && data.data) {
    setStoredTokens(data.data.token, data.data.refreshToken)
  }

  return data
}

export async function logoutUser(): Promise<ApiResponse<null>> {
  try {
    const res = await fetch(`${API_BASE}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })

    clearStoredTokens()

    // Logout returns 204 No Content, so no JSON to parse
    if (res.status === 204 || res.status === 200) {
      return { success: true, data: null }
    }

    // If there's an error response, try to parse it
    const data = await res.json()
    return data
  } catch {
    // Even if the API call fails, clear local tokens
    clearStoredTokens()
    return { success: true, data: null }
  }
}


export async function getCurrentUser(): Promise<
  ApiResponse<{ user: AuthUser; tenant: AuthTenant }>
> {
  const token = getStoredToken()
  if (!token) {
    return { success: false, data: null, error: { code: 'NO_TOKEN', message: 'Not authenticated' } }
  }

  const res = await fetch(`${API_BASE}/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  })

  return res.json()
}

export async function updateProfile(payload: {
  name?: string
  phone?: string
  avatarUrl?: string
}): Promise<ApiResponse<{ id: string; name: string; phone?: string; avatarUrl?: string }>> {
  const res = await fetch(`${API_BASE}/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  })

  return res.json()
}

export async function forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
  const res = await fetch(`${API_BASE}/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })

  return res.json()
}
