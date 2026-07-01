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

  // Inject X-Tenant-ID if not already set (don't override if caller set it explicitly)
  if (tenantId && !config.headers?.get('X-Tenant-ID')) {
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

async function handleUnauthorized(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('tenant_id')
    document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax'
    document.cookie = 'tenant_id=; path=/; max-age=0; SameSite=Lax'

    // Emit event — AuthContext will catch this and trigger a clean logout.
    window.dispatchEvent(new CustomEvent('AUTH_SESSION_EXPIRED'))
  }
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // Auth endpoints should never trigger token refresh — a 401 here means bad credentials, not expired session
    const requestUrl = originalRequest.url ?? ''

    const isAuthEndpoint = requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/signup') ||
      requestUrl.includes('/auth/select-tenant') ||
      requestUrl.includes('/auth/forgot-password') ||
      requestUrl.includes('/auth/request-otp') ||
      requestUrl.includes('/auth/verify-otp') ||
      requestUrl.includes('/auth/set-password') ||
      requestUrl.includes('/auth/refresh')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      // Only attempt refresh if we actually have a refresh token
      const refreshToken = getStoredRefreshToken()

      if (!refreshToken) {
        await handleUnauthorized()

        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Queue until the token refresh completes.
        // The rejection handler ensures SESSION_EXPIRED never surfaces as an unhandled
        // rejection — queued requests simply hang (same as the original request) while
        // the AUTH_SESSION_EXPIRED redirect is in flight.
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(
          () => apiClient(originalRequest),
          () => new Promise(() => {})
        )
      }

      isRefreshing = true

      // Notify UI that a refresh is starting
      window.dispatchEvent(new CustomEvent('AUTH_REFRESHING', { detail: { isRefreshing: true } }))

      try {
        const tenantId = getStoredTenantId()

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
        // Reject queued requests with a sentinel so components can detect session expiry
        const sessionExpiredError = new Error('SESSION_EXPIRED')
        processQueue(sessionExpiredError)
        await handleUnauthorized()

        // Return a promise that never settles — the redirect is in flight and will
        // unmount all components, so there's no need to surface this error to them.
        return new Promise(() => {})
      } finally {
        isRefreshing = false

        // Notify UI that a refresh has ended
        window.dispatchEvent(new CustomEvent('AUTH_REFRESHING', { detail: { isRefreshing: false } }))
      }
    }

    // ── Maintenance mode (503) ──────────────────────────────────────────────
    // When the platform is under maintenance the backend returns 503 for all
    // tenant-facing requests.  We handle it here once so individual callers
    // don't need to know about it.
    //
    // • GET requests (background data loads):  return a never-settling promise,
    //   identical to the SESSION_EXPIRED pattern.  Components stay in their
    //   loading/empty state without throwing — no console noise.
    //
    // • Mutation requests (POST/PATCH/PUT/DELETE):  throw the maintenance
    //   message so forms and buttons can surface it as an inline error.
    if (error.response?.status === 503) {
      if (originalRequest.method?.toLowerCase() === 'get') {
        return new Promise(() => {})
      }
      // For mutations, fall through so getErrorMessage() extracts the message
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
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.get<T>(url, config)
    return response.data
  } catch (error) {
    // SESSION_EXPIRED is thrown by queued requests when token refresh fails.
    // The redirect is already in flight — swallow silently so components don't flash errors.
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      return new Promise(() => {})
    }
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
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      return new Promise(() => {})
    }
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
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      return new Promise(() => {})
    }
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
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      return new Promise(() => {})
    }
    if (error instanceof AxiosError) {
      throw new Error(getErrorMessage(error))
    }
    throw error
  }
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete(url: string, config?: AxiosRequestConfig): Promise<void> {
  try {
    await apiClient.delete(url, config)
  } catch (error) {
    if (error instanceof Error && error.message === 'SESSION_EXPIRED') {
      return new Promise(() => {})
    }
    if (error instanceof AxiosError && error.response?.status !== 204) {
      throw new Error(getErrorMessage(error))
    }
    if (!(error instanceof AxiosError)) {
      throw error
    }
  }
}

// Export the axios instance for advanced use cases
export { apiClient }
