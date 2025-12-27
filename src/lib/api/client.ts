/**
 * Base API client with authentication handling
 */

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
      await fetch('/api/v1/auth/logout', { method: 'POST' })
    } catch {
      // Ignore logout errors
    }

    // Redirect to login
    window.location.href = '/login'
  }
}

/**
 * Wrapper for fetch that handles 401 responses
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Always include cookies
  })

  // Handle 401 Unauthorized
  if (response.status === 401) {
    await handleUnauthorized()
    throw new Error('Session expired. Please log in again.')
  }

  return response
}

/**
 * Helper for GET requests
 */
export async function apiGet<T>(url: string): Promise<T> {
  const response = await apiFetch(url)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.error?.message || error.message || 'Request failed')
  }

  return response.json()
}

/**
 * Helper for POST requests
 */
export async function apiPost<T>(url: string, data?: unknown): Promise<T> {
  const response = await apiFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.error?.message || error.message || 'Request failed')
  }

  return response.json()
}

/**
 * Helper for PATCH requests
 */
export async function apiPatch<T>(url: string, data: unknown): Promise<T> {
  const response = await apiFetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.error?.message || error.message || 'Request failed')
  }

  return response.json()
}

/**
 * Helper for PUT requests
 */
export async function apiPut<T>(url: string, data: unknown): Promise<T> {
  const response = await apiFetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.error?.message || error.message || 'Request failed')
  }

  return response.json()
}

/**
 * Helper for DELETE requests
 */
export async function apiDelete(url: string): Promise<void> {
  const response = await apiFetch(url, {
    method: 'DELETE',
  })

  if (!response.ok && response.status !== 204) {
    const error = await response.json().catch(() => ({ message: response.statusText }))
    throw new Error(error.error?.message || error.message || 'Request failed')
  }
}
