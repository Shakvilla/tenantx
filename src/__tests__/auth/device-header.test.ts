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
  it('a real selectTenant request carries the device id', async () => {
    const seen = captureRequests()

    // getStoredToken() (src/lib/api/storage.ts) only accepts a structurally-valid JWT
    // (header.payload.signature) — a plain string like 'global-token' fails isValidJwt() and
    // getStoredToken() silently returns null, which would make this assert the wrong thing
    // ('Bearer null'). Three dot-separated segments is all isValidJwt() checks.
    localStorage.setItem('auth_token', 'header.payload.global-token-signature')

    // apiClient's request interceptor is left registered here — this is the real, unmodified
    // production path. It asserts what actually goes over the wire when selectTenant runs,
    // regardless of which of the interceptor or selectTenant's own headers object is what
    // supplies X-Device-Id.
    const { selectTenant } = await import('@/lib/api/auth-client')

    await selectTenant('tenant-1')

    expect(headerOf(seen[0], 'X-Device-Id')).toBe(getDeviceId())
    expect(headerOf(seen[0], 'Authorization')).toBe('Bearer header.payload.global-token-signature')
  })

  it("selectTenant's own headers object carries the device id, so it survives an interceptor change", async () => {
    const seen = captureRequests()

    localStorage.setItem('auth_token', 'header.payload.global-token-signature')

    // This is a defense-in-depth check, not an integration assertion: apiClient's request
    // interceptor (client.ts) is the production mechanism that puts X-Device-Id on every
    // client-side request, including this one — the test above already proves that. Clearing
    // the interceptor here isolates what selectTenant's own explicit headers object supplies on
    // its own, so a regression in that object (e.g. someone deletes the 'X-Device-Id' entry) is
    // caught even though it's currently masked in production by the interceptor. Confirmed by
    // mutation-testing: removing selectTenant's own header line left the test above green until
    // the interceptor was cleared here. Authorization is already explicit in the headers object,
    // so clearing the interceptor doesn't remove anything this call still needs.
    const { apiClient } = await import('@/lib/api/client')
    apiClient.interceptors.request.clear()

    const { selectTenant } = await import('@/lib/api/auth-client')

    await selectTenant('tenant-1')

    expect(headerOf(seen[0], 'X-Device-Id')).toBe(getDeviceId())
    expect(headerOf(seen[0], 'Authorization')).toBe('Bearer header.payload.global-token-signature')
  })
})
