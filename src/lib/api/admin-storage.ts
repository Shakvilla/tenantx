/**
 * Storage helpers for system admin authentication.
 * Mirrors the pattern in storage.ts — tokens live in BOTH a cookie
 * (read by Next.js middleware for SSR route protection) and localStorage
 * (read by the admin Axios client for API requests).
 *
 * Key: admin_token
 * No tenant ID needed — admin calls go to /api/v1/admin/** with tenant="SYSTEM" in the JWT.
 */

import { maxAgeForToken } from './storage'

const ADMIN_TOKEN_KEY = 'admin_token'
const ADMIN_REFRESH_TOKEN_KEY = 'admin_refresh_token'

/** Returns true only if the value is a structurally valid JWT (3 dot-separated parts) */
function isValidJwt(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.split('.').length === 3
}

function setCookie(name: string, value: string, maxAgeSeconds = 86400): void {
  if (typeof document === 'undefined') return
  const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const secureFlag = isSecure ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`
}

function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`
}

export function getStoredAdminToken(): string | null {
  if (typeof window === 'undefined') return null

  // Cookie is source of truth for middleware
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${ADMIN_TOKEN_KEY}=`))
    ?.split('=')[1]

  if (cookieValue) {
    const decoded = decodeURIComponent(cookieValue)

    if (!isValidJwt(decoded)) {
      // Stale or corrupted cookie — wipe it
      deleteCookie(ADMIN_TOKEN_KEY)
      localStorage.removeItem(ADMIN_TOKEN_KEY)
      return null
    }

    if (localStorage.getItem(ADMIN_TOKEN_KEY) !== decoded) {
      localStorage.setItem(ADMIN_TOKEN_KEY, decoded)
    }
    return decoded
  }

  const stored = localStorage.getItem(ADMIN_TOKEN_KEY)

  if (!isValidJwt(stored)) {
    localStorage.removeItem(ADMIN_TOKEN_KEY)
    return null
  }

  return stored
}

export function setStoredAdminToken(token: string): void {
  if (typeof window === 'undefined') return
  if (!isValidJwt(token)) {
    console.warn('[admin-storage] setStoredAdminToken called with an invalid token — ignoring.')
    return
  }
  localStorage.setItem(ADMIN_TOKEN_KEY, token)

  // AUTH-L7-04: size the cookie to the token's real expiry (~15 min), not a fixed 24h. The admin
  // middleware (hasUnexpiredJwt) gates on the JWT's own exp claim, so cookie and token must not
  // drift; each successful refresh re-issues this cookie with a fresh expiry via setStoredAdminToken.
  setCookie(ADMIN_TOKEN_KEY, token, maxAgeForToken(token))
}

export function clearStoredAdminToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  deleteCookie(ADMIN_TOKEN_KEY)
  // The refresh token has no value without its access token, so clearing one clears both.
  clearStoredAdminRefreshToken()
}

/**
 * The admin refresh token lives in localStorage only — never in a cookie. It is only ever read
 * by the 401 → refresh interceptor, never by middleware, and must not be sent along with every
 * request the way the access-token cookie is. Mirrors the tenant refresh token's storage.
 */
export function getStoredAdminRefreshToken(): string | null {
  if (typeof window === 'undefined') return null

  return localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY)
}

export function setStoredAdminRefreshToken(refreshToken: string): void {
  if (typeof window === 'undefined') return
  if (!refreshToken) {
    console.warn('[admin-storage] setStoredAdminRefreshToken called with an empty token — ignoring.')
    return
  }
  localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken)
}

export function clearStoredAdminRefreshToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY)
}
