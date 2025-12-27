/**
 * Base API client with authentication handling using Axios
 */
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import axios, { AxiosError } from 'axios'

// Create axios instance with default config
const apiClient = axios.create({
  withCredentials: true, // Always include cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Handle 401 unauthorized responses by logging out and redirecting
 */
async function handleUnauthorized(): Promise<void> {
  // Clear any local storage auth data
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')

    // Call logout API to clear cookies
    try {
      await axios.post('/api/v1/auth/logout')
    } catch {
      // Ignore logout errors
    }

    // Redirect to login
    window.location.href = '/login'
  }
}

// Response interceptor to handle 401 errors globally
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await handleUnauthorized()
      throw new Error('Session expired. Please log in again.')
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
export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  try {
    const response = await apiClient.post<T>(url, data)

    
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
export async function apiPatch<T>(url: string, data: unknown): Promise<T> {
  try {
    const response = await apiClient.patch<T>(url, data)

    
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
export async function apiPut<T>(url: string, data: unknown): Promise<T> {
  try {
    const response = await apiClient.put<T>(url, data)

    
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
