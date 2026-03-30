/**
 * Base API client with authentication handling using Axios
 */
import type { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import axios, { AxiosError } from 'axios'

import { getStoredRefreshToken, getStoredTenantId, setStoredTokens, getStoredToken } from './storage';

// ---------------------------------------------------------------------------
// Base URL and apiClient config
// ---------------------------------------------------------------------------
export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1'

// Create axios instance with default config
const apiClient = axios.create({
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---------------------------------------------------------------------------
// Request Interceptor — attach auth headers automatically
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window === 'undefined') return config

  const token = getStoredToken()
  const tenantId = getStoredTenantId()

  if (token && !config.headers?.Authorization) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  if (tenantId && !config.headers?.['X-Tenant-ID']) {
    config.headers.set('X-Tenant-ID', tenantId)
  }

  return config
})

// ---------------------------------------------------------------------------
// Response Interceptor — handle 401 with token refresh
// ---------------------------------------------------------------------------
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

function processQueue(error: unknown | null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve()
    }
  })
  failedQueue = []
}

async function handleUnauthorized(message?: string): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('tenant_id')
    document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax'
    document.cookie = 'tenant_id=; path=/; max-age=0; SameSite=Lax'

    // Emit event instead of hard redirect. AuthContext will catch this and logout with reason.
    window.dispatchEvent(
      new CustomEvent('AUTH_SESSION_EXPIRED', {
        detail: { message }
      })
    )
  }
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue until the token refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => apiClient(originalRequest))
      }

      isRefreshing = true

      // Notify UI that a refresh is starting
      window.dispatchEvent(new CustomEvent('AUTH_REFRESHING', { detail: { isRefreshing: true } }))

      try {
        const tenantId = getStoredTenantId()
        const refreshToken = getStoredRefreshToken()

        if (!refreshToken) {
          throw new Error('No refresh token')
        }

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        }, {
          headers: {
            'X-Tenant-ID': tenantId
          }
        })

        setStoredTokens(data.accessToken, data.refreshToken)
        
        // Update the original request's Authorization header with the new token
        originalRequest.headers.set('Authorization', `Bearer ${data.accessToken}`)
        
        processQueue(null)

        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError)
        await handleUnauthorized('Your session has expired. Please log in again.')

        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false

        // Notify UI that a refresh has ended
        window.dispatchEvent(new CustomEvent('AUTH_REFRESHING', { detail: { isRefreshing: false } }))
      }
    }

    if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('AUTH_FORBIDDEN', {
            detail: { 
              message: getErrorMessage(error) || 'You do not have permission to access this resource.' 
            }
          })
        )
      }
    }

    return Promise.reject(error)
  }
)

/**
 * Extract error message from axios error
 */
function getErrorMessage(error: AxiosError): string {
  const data = error.response?.data as { error?: { message?: string }; message?: string } | undefined


return data?.error?.message || data?.message || error.message || 'Request failed'
}

/**
 * Wrapper for axios requests that handles errors consistently
 */
export async function apiFetch(
  url: string,
  options: AxiosRequestConfig = {}
): Promise<AxiosResponse> {
  return apiClient.request({
    url,
    ...options,
  })
}

/**
 * Helper for GET requests
 */
export async function apiGet<T>(url: string): Promise<T> {
  try {
    const response = await apiClient.get<T>(url)


return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(getErrorMessage(error))
    }

    throw error
  }
}

/**
 * Helper for POST requests
 */
export async function apiPost<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.post<T>(url, data, config)


return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(getErrorMessage(error))
    }

    throw error
  }
}

/**
 * Helper for PATCH requests
 */
export async function apiPatch<T>(url: string, data: unknown, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.patch<T>(url, data, config)


return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(getErrorMessage(error))
    }

    throw error
  }
}

/**
 * Helper for PUT requests
 */
export async function apiPut<T>(url: string, data: unknown, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.put<T>(url, data, config)


return response.data
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(getErrorMessage(error))
    }

    throw error
  }
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete(url: string): Promise<void> {
  try {
    await apiClient.delete(url)
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status !== 204) {
      throw new Error(getErrorMessage(error))
    }


    // For non-AxiosError, rethrow unless it's a 204
    if (!(error instanceof AxiosError)) {
      throw error
    }
  }
}

// Export the axios instance for advanced use cases
export { apiClient }
