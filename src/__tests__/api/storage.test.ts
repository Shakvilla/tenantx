import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { setStoredTokens, setStoredTenantId } from '@/lib/api/storage'

/** Builds a structurally-valid JWT (header.payload.signature) with the given payload — no real signing needed since storage.ts never verifies it, only decodes the payload for its own `exp` claim. */
function fakeJwt(payload: Record<string, unknown>): string {
  const base64url = (obj: object) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  return `${base64url({ alg: 'none' })}.${base64url(payload)}.signature`
}

describe('storage — session cookies sized to session lifetime (7 days), not access token expiry', () => {
  let cookieWrites: string[]

  beforeEach(() => {
    cookieWrites = []
    localStorage.clear()

    // document.cookie's setter never exposes attributes back on read (browser semantics),
    // so the only way to assert on max-age is to capture the literal string written.
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => cookieWrites.map(w => w.split(';')[0]).join('; '),
      set: (value: string) => {
        cookieWrites.push(value)
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('sizes the auth_token cookie to the session lifetime (7 days), not the access token expiry', () => {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const token = fakeJwt({ sub: 'user-1', exp: nowSeconds + 900 }) // 15 min access token

    setStoredTokens(token, 'refresh-token-abc')

    const authCookieWrite = cookieWrites.find(w => w.startsWith('auth_token='))
    expect(authCookieWrite).toBeDefined()

    const maxAgeMatch = authCookieWrite!.match(/max-age=(\d+)/)
    expect(maxAgeMatch).not.toBeNull()

    const maxAge = Number(maxAgeMatch![1])

    // Cookie must be sized to the SESSION (refresh token = 7 days = 604800s), NOT the
    // access token (15 min = 900s). The old bug tied the cookie to the access token,
    // so middleware redirected to /login before the axios 401→refresh interceptor could fire.
    expect(maxAge).toBe(604800)
  })

  it('keeps the tenant_id cookie in sync with the session lifetime (7 days)', () => {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const token = fakeJwt({ sub: 'user-1', exp: nowSeconds + 900 })

    // Simulate the real call order: tenant_id already set (e.g. from a prior session),
    // then tokens refresh — the tenant_id cookie must be re-issued with the session lifetime too.
    setStoredTenantId('tenant-abc')
    cookieWrites = [] // reset — only care about what setStoredTokens itself writes

    setStoredTokens(token, 'refresh-token-abc')

    const tenantCookieWrite = cookieWrites.find(w => w.startsWith('tenant_id='))
    expect(tenantCookieWrite).toBeDefined()

    const maxAge = Number(tenantCookieWrite!.match(/max-age=(\d+)/)![1])
    // Both cookies must be sized to the session (7 days), not the access token (15 min).
    expect(maxAge).toBe(604800)
  })

  it('sets session cookie to 7 days even when the token has no exp claim', () => {
    const token = fakeJwt({ sub: 'user-1' }) // no exp

    setStoredTokens(token, 'refresh-token-abc')

    const authCookieWrite = cookieWrites.find(w => w.startsWith('auth_token='))
    const maxAge = Number(authCookieWrite!.match(/max-age=(\d+)/)![1])
    // Session cookie is always 7 days regardless of token expiry (no exp → still 604800).
    expect(maxAge).toBe(604800)
  })

  it('sets session cookie to 7 days even for an already-expired token', () => {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const token = fakeJwt({ sub: 'user-1', exp: nowSeconds - 500 }) // already expired

    setStoredTokens(token, 'refresh-token-abc')

    const authCookieWrite = cookieWrites.find(w => w.startsWith('auth_token='))
    const maxAge = Number(authCookieWrite!.match(/max-age=(\d+)/)![1])
    // Session cookie is always 7 days — even for an expired token, because middleware only
    // checks presence and the axios interceptor will handle the 401 → refresh flow.
    expect(maxAge).toBe(604800)
  })

  it('ignores a structurally invalid token entirely (no cookie writes)', () => {
    setStoredTokens('not-a-real-jwt', 'refresh-token-abc')
    expect(cookieWrites).toHaveLength(0)
  })
})
