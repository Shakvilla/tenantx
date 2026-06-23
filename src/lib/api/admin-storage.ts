/**
 * Storage helpers for system admin authentication.
 * Mirrors the pattern in storage.ts — tokens live in BOTH a cookie
 * (read by Next.js middleware for SSR route protection) and localStorage
 * (read by the admin Axios client for API requests).
 *
 * Key: admin_token
 * No tenant ID needed — admin calls go to /api/v1/admin/** with tenant="SYSTEM" in the JWT.
 */

const ADMIN_TOKEN_KEY = 'admin_token'

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
    if (localStorage.getItem(ADMIN_TOKEN_KEY) !== decoded) {
      localStorage.setItem(ADMIN_TOKEN_KEY, decoded)
    }
    return decoded
  }

  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setStoredAdminToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
  setCookie(ADMIN_TOKEN_KEY, token)
}

export function clearStoredAdminToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  deleteCookie(ADMIN_TOKEN_KEY)
}
