import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'

import { getDeviceId } from '@/lib/api/device-id'

/**
 * Captures the config of every request axios makes, from any instance, by replacing the
 * adapter. This is what lets one test cover both interceptor-based and bare-axios call sites
 * with the same assertion — which matters, because the difference between them is exactly the
 * bug this test exists to catch.
 */
function captureRequests() {
  const seen: { url?: string; headers: Record<string, unknown> }[] = []

  const adapter = vi.fn(async (config: any) => {
    seen.push({
      url: config.url,
      headers: Object.fromEntries(
        typeof config.headers?.toJSON === 'function'
          ? Object.entries(config.headers.toJSON())
          : Object.entries(config.headers ?? {})
      )
    })

    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  })

  axios.defaults.adapter = adapter

  return seen
}

function headerOf(entry: { headers: Record<string, unknown> }, name: string): unknown {
  const key = Object.keys(entry.headers).find(k => k.toLowerCase() === name.toLowerCase())

  return key ? entry.headers[key] : undefined
}

describe('X-Device-Id is sent from every call site', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('the tenant interceptor sends it', async () => {
    const seen = captureRequests()
    const { apiGet, API_BASE } = await import('@/lib/api/client')

    await apiGet(`${API_BASE}/properties`)

    expect(headerOf(seen[0], 'X-Device-Id')).toBe(getDeviceId())
  })

  it('the admin interceptor sends it', async () => {
    const seen = captureRequests()
    const { getAdminMe } = await import('@/lib/api/admin-auth-client')

    await getAdminMe()

    expect(headerOf(seen[0], 'X-Device-Id')).toBe(getDeviceId())
  })

  // adminLogin uses a bare axios.post and never touches adminClient's interceptor.
  it('adminLogin sends it despite bypassing the admin interceptor', async () => {
    const seen = captureRequests()
    const { adminLogin } = await import('@/lib/api/admin-auth-client')

    await adminLogin('someone@example.com', 'password')

    expect(headerOf(seen[0], 'X-Device-Id')).toBe(getDeviceId())
  })

  // selectTenant passes its own headers object, which can silently replace the interceptor's.
  it('selectTenant sends it alongside its explicit Authorization header', async () => {
    const seen = captureRequests()

    // getStoredToken() (src/lib/api/storage.ts) only accepts a structurally-valid JWT
    // (header.payload.signature) — a plain string like 'global-token' fails isValidJwt() and
    // getStoredToken() silently returns null, which would make this assert the wrong thing
    // ('Bearer null'). Three dot-separated segments is all isValidJwt() checks.
    localStorage.setItem('auth_token', 'header.payload.global-token-signature')

    // apiClient's own request interceptor (client.ts) also injects X-Device-Id unconditionally
    // on every client-side request, which would silently backfill a missing header here and
    // mask a regression in selectTenant's own explicit headers object — the exact thing this
    // test exists to catch (confirmed by mutation-testing: removing selectTenant's own header
    // line left this assertion green until the interceptor was cleared). Clearing it isolates
    // what selectTenant supplies itself; Authorization is already explicit in its headers
    // object, so clearing the interceptor doesn't remove anything this call still needs.
    const { apiClient } = await import('@/lib/api/client')
    apiClient.interceptors.request.clear()

    const { selectTenant } = await import('@/lib/api/auth-client')

    await selectTenant('tenant-1')

    expect(headerOf(seen[0], 'X-Device-Id')).toBe(getDeviceId())
    expect(headerOf(seen[0], 'Authorization')).toBe('Bearer header.payload.global-token-signature')
  })
})
