/**
 * Server-side API client for Next.js 15 Server Components.
 *
 * Uses `next/headers` (cookies) to retrieve auth credentials,
 * then delegates to native `fetch` so Next.js caching / revalidation works
 * out-of-the-box.
 *
 * This module must ONLY be imported in Server Components, Server Actions, or
 * Route Handlers — never from client code.
 */
import { cookies } from 'next/headers'

// ---------------------------------------------------------------------------
// Base URL (mirrors client.ts)
// ---------------------------------------------------------------------------
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface ServerFetchOptions extends Omit<RequestInit, 'headers'> {
  headers?: Record<string, string>
}

/**
 * Build authenticated headers from the cookie store.
 * Returns `null` if the required auth cookies are missing.
 */
async function getAuthHeaders(tenantId: string): Promise<Record<string, string> | null> {
  const cookieStore = await cookies()

  const authToken = cookieStore.get('auth_token')?.value

  if (!authToken) {
    console.warn('[serverApi] Missing auth_token cookie — request will be unauthenticated.')

    return null
  }

  return {
    Authorization: `Bearer ${authToken}`,
    'X-Tenant-ID': tenantId,
    'Content-Type': 'application/json',
  }
}

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Perform an authenticated GET request from a Server Component.
 *
 * @returns The parsed JSON body, or `null` when the request fails or the user
 *          is not authenticated.
 */
export async function serverApiGet<T>(
  tenantId: string,
  path: string,
  options: ServerFetchOptions = {},
): Promise<T | null> {
  const authHeaders = await getAuthHeaders(tenantId)

  if (!authHeaders) return null

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`

  try {
    const response = await fetch(url, {
      method: 'GET',
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error(`[serverApi] GET ${url} failed with status ${response.status}`)

      return null
    }

    const body = await response.json()

    // Handle standard { success, data } wrapper
    if (body && typeof body === 'object' && 'success' in body) {
      if (!body.success || body.data == null) {
        console.error(`[serverApi] GET ${url} returned unsuccessful or empty data:`, body)

        return null
      }

      return body.data as T
    }

    // If the response is an empty object, treat it as "no data"
    if (body && typeof body === 'object' && Object.keys(body).length === 0) {
      console.warn(`[serverApi] GET ${url} returned an empty object {}`)

      return null
    }

    // Fallback: return the raw body (some endpoints don't wrap in { success, data })
    return body as T
  } catch (error) {
    console.error(`[serverApi] GET ${url} threw an error:`, error)

    return null
  }
}

export { API_BASE as SERVER_API_BASE }
