import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import { setStoredTokens, setStoredTenantId } from '@/lib/api/storage'

/** Builds a structurally-valid JWT (header.payload.signature) with the given payload — no real signing needed since storage.ts never verifies it, only decodes the payload for its own `exp` claim. */
function fakeJwt(payload: Record<string, unknown>): string {
  const base64url = (obj: object) => btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

  return `${base64url({ alg: 'none' })}.${base64url(payload)}.signature`
}

describe('storage — cookie max-age tracks the token\'s real expiry', () => {
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

  it('sizes the auth_token cookie to the JWT\'s own exp claim, not a fixed 24h', () => {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const token = fakeJwt({ sub: 'user-1', exp: nowSeconds + 900 }) // 15 min, matches real backend config

    setStoredTokens(token, 'refresh-token-abc')

    const authCookieWrite = cookieWrites.find(w => w.startsWith('auth_token='))
    expect(authCookieWrite).toBeDefined()

    const maxAgeMatch = authCookieWrite!.match(/max-age=(\d+)/)
    expect(maxAgeMatch).not.toBeNull()

    const maxAge = Number(maxAgeMatch![1])

    // Should land close to 900s, and — the actual bug being fixed — nowhere near the old 86400 default.
    expect(maxAge).toBeGreaterThan(800)
    expect(maxAge).toBeLessThanOrEqual(900)
    expect(maxAge).not.toBe(86400)
  })

  it('keeps the tenant_id cookie in sync with the same expiry as the token', () => {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const token = fakeJwt({ sub: 'user-1', exp: nowSeconds + 900 })

    // Simulate the real call order: tenant_id already set (e.g. from a prior session),
    // then tokens refresh — the tenant_id cookie must be re-issued with the new expiry too.
    setStoredTenantId('tenant-abc')
    cookieWrites = [] // reset — only care about what setStoredTokens itself writes

    setStoredTokens(token, 'refresh-token-abc')

    const tenantCookieWrite = cookieWrites.find(w => w.startsWith('tenant_id='))
    expect(tenantCookieWrite).toBeDefined()

    const maxAge = Number(tenantCookieWrite!.match(/max-age=(\d+)/)![1])
    expect(maxAge).toBeGreaterThan(800)
    expect(maxAge).toBeLessThanOrEqual(900)
  })

  it('falls back to the 24h default if the token has no exp claim', () => {
    const token = fakeJwt({ sub: 'user-1' }) // no exp

    setStoredTokens(token, 'refresh-token-abc')

    const authCookieWrite = cookieWrites.find(w => w.startsWith('auth_token='))
    const maxAge = Number(authCookieWrite!.match(/max-age=(\d+)/)![1])
    expect(maxAge).toBe(86400)
  })

  it('floors max-age at 60s for an already-expired or near-expiry token, never a negative/zero value', () => {
    const nowSeconds = Math.floor(Date.now() / 1000)
    const token = fakeJwt({ sub: 'user-1', exp: nowSeconds - 500 }) // already expired

    setStoredTokens(token, 'refresh-token-abc')

    const authCookieWrite = cookieWrites.find(w => w.startsWith('auth_token='))
    const maxAge = Number(authCookieWrite!.match(/max-age=(\d+)/)![1])
    expect(maxAge).toBe(60)
  })

  it('ignores a structurally invalid token entirely (no cookie writes)', () => {
    setStoredTokens('not-a-real-jwt', 'refresh-token-abc')
    expect(cookieWrites).toHaveLength(0)
  })
})
