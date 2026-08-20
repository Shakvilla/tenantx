import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'

import { getDeviceId } from '@/lib/api/device-id'

function captureRequests() {
  const seen: { url?: string; data: any }[] = []

  axios.defaults.adapter = vi.fn(async (config: any) => {
    seen.push({ url: config.url, data: config.data ? JSON.parse(config.data) : undefined })

    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  })

  return seen
}

function respondWith(payload: unknown) {
  axios.defaults.adapter = vi.fn(async (config: any) => ({
    data: payload, status: 200, statusText: 'OK', headers: {}, config
  }))
}

describe('isOtpChallenge', () => {
  it('recognises a challenge and rejects a session', async () => {
    const { isOtpChallenge } = await import('@/lib/api/auth-client')

    expect(isOtpChallenge({ otpRequired: true, pendingToken: 't', channel: 'EMAIL', maskedTarget: 'a***@b.com' })).toBe(true)
    expect(isOtpChallenge({ accessToken: 'real-token', refreshToken: 'r' })).toBe(false)
    expect(isOtpChallenge(null)).toBe(false)
  })
})

describe('the challenge carries no session', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  // The invariant the whole feature rests on: a challenge must never leave a usable token
  // behind, or the OTP step is decorative.
  it('selectTenant stores nothing when challenged', async () => {
    respondWith({ otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' })
    localStorage.setItem('auth_token', 'global-token')

    const { selectTenant } = await import('@/lib/api/auth-client')
    const result = await selectTenant('tenant-1')

    expect(result.success).toBe(true)
    expect((result.data as any).otpRequired).toBe(true)
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(localStorage.getItem('tenant_id')).toBeNull()
    expect(document.cookie).not.toContain('tenant_id=')
  })

  it('adminLogin stores no admin token when challenged', async () => {
    respondWith({ otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' })

    const { adminLogin } = await import('@/lib/api/admin-auth-client')
    const result = await adminLogin('admin@example.com', 'password')

    expect((result as any).otpRequired).toBe(true)
    expect(localStorage.getItem('admin_token')).toBeNull()
  })
})

describe('verify calls', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('verifySelectTenantOtp posts the agreed body including rememberDevice', async () => {
    const seen = captureRequests()
    const { verifySelectTenantOtp } = await import('@/lib/api/auth-client')

    await verifySelectTenantOtp('pending-token', '123456', false)

    expect(seen[0].url).toContain('/global/auth/select-tenant/verify-otp')
    expect(seen[0].data).toEqual({
      pendingToken: 'pending-token',
      otp: '123456',
      deviceId: getDeviceId(),
      rememberDevice: false
    })
  })

  it('verifyAdminLoginOtp posts the agreed body including rememberDevice', async () => {
    const seen = captureRequests()
    const { verifyAdminLoginOtp } = await import('@/lib/api/admin-auth-client')

    await verifyAdminLoginOtp('pending-token', '654321', true)

    expect(seen[0].url).toContain('/auth/verify-otp')
    expect(seen[0].data).toEqual({
      pendingToken: 'pending-token',
      otp: '654321',
      deviceId: getDeviceId(),
      rememberDevice: true
    })
  })
})
