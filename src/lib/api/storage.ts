/**
 * Shared storage utility for authentication tokens and cookies.
 * Used by both the API client and auth services to ensure consistency.
 */

const TOKEN_KEY = 'auth_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const TENANT_ID_KEY = 'tenant_id'
const USER_ROLE_KEY = 'user_role'
const USER_TYPE_KEY = 'user_type'

/** Returns true only if the string has exactly the header.payload.signature structure of a JWT */
function isValidJwt(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.split('.').length === 3
}

/**
 * Reads a JWT's own `exp` claim (Unix seconds) without verifying the signature —
 * used only to size the auth cookie's max-age so it can't outlive the token it holds.
 * Previously the cookie was hardcoded to 24h regardless of the token's real ~15min
 * lifetime, so a stale-but-present cookie passed middleware's presence-only check long
 * after the token had actually expired, silently deferring the "you're logged out"
 * moment to whenever the next API call happened to fire.
 */
function decodeJwtExpiry(token: string): number | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64))

    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

/** Cookie max-age (seconds) that matches the token's real expiry, with a 60s floor and a 24h fallback. */
function maxAgeForToken(token: string): number {
  const exp = decodeJwtExpiry(token)

  if (exp === null) return 86400

  return Math.max(60, exp - Math.floor(Date.now() / 1000))
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null

  // Check cookies FIRST (as they are the source of truth for the middleware)
  const cookieValue = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${TOKEN_KEY}=`))
    ?.split('=')[1]

  if (cookieValue) {
    const decoded = decodeURIComponent(cookieValue)

    if (!isValidJwt(decoded)) {
      // Stale or corrupted cookie — wipe it so we don't keep sending garbage to the backend
      deleteCookie(TOKEN_KEY)
      localStorage.removeItem(TOKEN_KEY)
      return null
    }

    // Sync localStorage if it's missing or different
    if (localStorage.getItem(TOKEN_KEY) !== decoded) {
      localStorage.setItem(TOKEN_KEY, decoded)
    }

    return decoded
  }

  const stored = localStorage.getItem(TOKEN_KEY)

  if (!isValidJwt(stored)) {
    // e.g. "undefined", "null", or any other non-JWT string stored by accident
    localStorage.removeItem(TOKEN_KEY)
    return null
  }

  return stored
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

  if (!isValidJwt(token)) {
    console.warn('[storage] setStoredTokens called with an invalid access token — ignoring.')
    return
  }

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)

  const maxAge = maxAgeForToken(token)

  setCookie(TOKEN_KEY, token, maxAge)

  // Also refresh the tenant_id cookie if it exists, matching the token's real expiry —
  // both cookies gate middleware auth together, so they must expire together too.
  const currentTenantId = getStoredTenantId()

  if (currentTenantId) {
    setCookie(TENANT_ID_KEY, currentTenantId, maxAge)
  }
}

export function setStoredTenantId(tenantId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TENANT_ID_KEY, tenantId)

  // Match whatever token is currently stored so both cookies expire together —
  // falls back to the default if no token is available yet (e.g. called before login completes).
  const currentToken = getStoredToken()

  setCookie(TENANT_ID_KEY, tenantId, currentToken ? maxAgeForToken(currentToken) : undefined)
}

export function getStoredUserRole(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(USER_ROLE_KEY) ?? ''
}

export function setStoredUserRole(role: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_ROLE_KEY, role)
}

export function getStoredUserType(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(USER_TYPE_KEY) ?? ''
}

export function setStoredUserType(userType: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(USER_TYPE_KEY, userType)
}

export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TENANT_ID_KEY)
  localStorage.removeItem(USER_ROLE_KEY)
  localStorage.removeItem(USER_TYPE_KEY)
  deleteCookie(TOKEN_KEY)
  deleteCookie(TENANT_ID_KEY)
}
