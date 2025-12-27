/**
 * Auth API Client
 * Client-side functions to interact with the authentication API endpoints using Axios.
 */
import axios, { AxiosError } from 'axios'

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

function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken()

  return token ? { Authorization: `Bearer ${token}` } : {}
}

// API Functions

export async function loginUser(
  email: string,
  password: string
): Promise<ApiResponse<AuthResponse>> {
  try {
    const { data } = await axios.post<ApiResponse<AuthResponse>>(
      `${API_BASE}/login`,
      { email, password }
    )

    if (data.success && data.data) {
      setStoredTokens(data.data.token, data.data.refreshToken)
    }

    return data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return error.response.data as ApiResponse<AuthResponse>
    }

    
return {
      success: false,
      data: null,
      error: { code: 'NETWORK_ERROR', message: 'Failed to connect to server' },
    }
  }
}

export async function registerUser(payload: {
  email: string
  password: string
  name: string
  phone?: string
  tenantName: string
}): Promise<ApiResponse<AuthResponse>> {
  try {
    const { data } = await axios.post<ApiResponse<AuthResponse>>(
      `${API_BASE}/register`,
      payload
    )

    if (data.success && data.data) {
      setStoredTokens(data.data.token, data.data.refreshToken)
    }

    return data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return error.response.data as ApiResponse<AuthResponse>
    }

    
return {
      success: false,
      data: null,
      error: { code: 'NETWORK_ERROR', message: 'Failed to connect to server' },
    }
  }
}

export async function logoutUser(): Promise<ApiResponse<null>> {
  try {
    await axios.post(
      `${API_BASE}/logout`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      }
    )

    clearStoredTokens()
    
return { success: true, data: null }
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

  try {
    const { data } = await axios.get<ApiResponse<{ user: AuthUser; tenant: AuthTenant }>>(
      `${API_BASE}/me`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      }
    )

    return data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return error.response.data as ApiResponse<{ user: AuthUser; tenant: AuthTenant }>
    }

    
return {
      success: false,
      data: null,
      error: { code: 'NETWORK_ERROR', message: 'Failed to connect to server' },
    }
  }
}

export async function updateProfile(payload: {
  name?: string
  phone?: string
  avatarUrl?: string
}): Promise<ApiResponse<{ id: string; name: string; phone?: string; avatarUrl?: string }>> {
  try {
    const { data } = await axios.patch<
      ApiResponse<{ id: string; name: string; phone?: string; avatarUrl?: string }>
    >(`${API_BASE}/me`, payload, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })

    return data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return error.response.data as ApiResponse<{
        id: string
        name: string
        phone?: string
        avatarUrl?: string
      }>
    }

    
return {
      success: false,
      data: null,
      error: { code: 'NETWORK_ERROR', message: 'Failed to connect to server' },
    }
  }
}

export async function forgotPassword(email: string): Promise<ApiResponse<{ message: string }>> {
  try {
    const { data } = await axios.post<ApiResponse<{ message: string }>>(
      `${API_BASE}/forgot-password`,
      { email }
    )

    return data
  } catch (error) {
    if (error instanceof AxiosError && error.response?.data) {
      return error.response.data as ApiResponse<{ message: string }>
    }

    
return {
      success: false,
      data: null,
      error: { code: 'NETWORK_ERROR', message: 'Failed to connect to server' },
    }
  }
}
