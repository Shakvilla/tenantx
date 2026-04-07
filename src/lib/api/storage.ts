/**
 * Shared storage utility for authentication tokens and cookies.
 * Used by both the API client and auth services to ensure consistency.
 */

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const TENANT_ID_KEY = 'tenant_id'

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null

  // Check cookies FIRST (as they are the source of truth for the middleware)
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${TOKEN_KEY}=`))
    ?.split('=')[1]

  if (cookieValue) {
    const decoded = decodeURIComponent(cookieValue)
    
    // Sync localStorage if it's missing or different
    if (localStorage.getItem(TOKEN_KEY) !== decoded) {
      localStorage.setItem(TOKEN_KEY, decoded)
    }
    
    return decoded
  }

  return localStorage.getItem(TOKEN_KEY)
}

export function getStoredRefreshToken(): string | null {
  if (typeof window === 'undefined') return null

  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredTenantId(): string | null {
  if (typeof window === 'undefined') return null

  // Check cookies FIRST
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${TENANT_ID_KEY}=`))
    ?.split('=')[1]

  if (cookieValue) {
    const decoded = decodeURIComponent(cookieValue)

    // Sync localStorage if it's missing or different
    if (localStorage.getItem(TENANT_ID_KEY) !== decoded) {
      localStorage.setItem(TENANT_ID_KEY, decoded)
    }

    return decoded
  }

  return localStorage.getItem(TENANT_ID_KEY)
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

export function setStoredTokens(token: string, refreshToken: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  setCookie(TOKEN_KEY, token)

  // Also refresh the tenant_id cookie if it exists to keep expiration in sync
  const currentTenantId = getStoredTenantId()

  if (currentTenantId) {
    setCookie(TENANT_ID_KEY, currentTenantId)
  }
}

export function setStoredTenantId(tenantId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TENANT_ID_KEY, tenantId)
  setCookie(TENANT_ID_KEY, tenantId)
}

export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TENANT_ID_KEY)
  deleteCookie(TOKEN_KEY)
  deleteCookie(TENANT_ID_KEY)
}
