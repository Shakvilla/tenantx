import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { act } from 'react'

import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/lib/api/admin-auth-client', async () => {
  const actual = await vi.importActual<any>('@/lib/api/admin-auth-client')

  return {
    ...actual,
    adminLogin: vi.fn(),
    verifyAdminLoginOtp: vi.fn(),
    getAdminMe: vi.fn(),
    adminLogout: vi.fn()
  }
})

// AdminAuthContext imports getStoredAdminToken/clearStoredAdminToken from admin-storage, not
// from admin-auth-client — a separate module that must be mocked separately for the token to be
// observably cleared.
vi.mock('@/lib/api/admin-storage', async () => {
  const actual = await vi.importActual<any>('@/lib/api/admin-storage')

  return {
    ...actual,
    getStoredAdminToken: vi.fn(() => null),
    clearStoredAdminToken: vi.fn()
  }
})

import { adminLogin, verifyAdminLoginOtp, getAdminMe } from '@/lib/api/admin-auth-client'
import { clearStoredAdminToken } from '@/lib/api/admin-storage'

const CHALLENGE = { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }
const PROFILE = { id: 'a1', email: 'admin@example.com', fullName: 'Admin', permissions: [], roles: [] }

let api: ReturnType<typeof useAdminAuth>

function Probe() {
  api = useAdminAuth()

  return null
}

function renderProvider() {
  render(<AdminAuthProvider><Probe /></AdminAuthProvider>)
}

describe('AdminAuthContext login-OTP branch', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('enters the challenge state without authenticating', async () => {
    ;(adminLogin as any).mockResolvedValue(CHALLENGE)

    renderProvider()
    let result: any
    await act(async () => { result = await api.adminLogin('admin@example.com', 'pw') })

    expect(result.otpRequired).toBe(true)
    expect(api.needsOtp).toBe(true)
    expect(api.isAdminAuthenticated).toBe(false)
    expect(getAdminMe).not.toHaveBeenCalled()
  })

  it('authenticates after verifying, fetching the profile exactly as an unchallenged login does', async () => {
    ;(adminLogin as any).mockResolvedValue(CHALLENGE)
    ;(verifyAdminLoginOtp as any).mockResolvedValue({ accessToken: 'admin-token' })
    ;(getAdminMe as any).mockResolvedValue(PROFILE)

    renderProvider()
    await act(async () => { await api.adminLogin('admin@example.com', 'pw') })
    await act(async () => { await api.verifyOtp('123456', true) })

    await waitFor(() => expect(api.isAdminAuthenticated).toBe(true))
    expect(api.adminUser?.email).toBe('admin@example.com')
    expect(api.needsOtp).toBe(false)
  })

  it('passes rememberDevice through', async () => {
    ;(adminLogin as any).mockResolvedValue(CHALLENGE)
    ;(verifyAdminLoginOtp as any).mockRejectedValue({ response: { status: 400, data: { code: 'OTP_INVALID' } } })

    renderProvider()
    await act(async () => { await api.adminLogin('admin@example.com', 'pw') })
    await act(async () => { await api.verifyOtp('123456', false) })

    expect(verifyAdminLoginOtp).toHaveBeenCalledWith('pending', '123456', false)
  })

  it('drops the challenge and reports startOver when the code is exhausted', async () => {
    ;(adminLogin as any).mockResolvedValue(CHALLENGE)
    ;(verifyAdminLoginOtp as any).mockRejectedValue({
      response: { status: 400, data: { code: 'OTP_ATTEMPTS_EXHAUSTED' } }
    })

    renderProvider()
    await act(async () => { await api.adminLogin('admin@example.com', 'pw') })
    let result: any
    await act(async () => { result = await api.verifyOtp('123456', true) })

    expect(result.startOver).toBe(true)
    expect(api.needsOtp).toBe(false)
  })

  // I-3: verifyAdminLoginOtp stores admin_token before returning (admin-auth-client.ts), so by
  // the time getAdminMe runs the CORRECT code has already been accepted. Before the fix, a
  // getAdminMe failure here was fed to otpErrorMessage — a correct code rendered "That code
  // isn't valid" (or, on a 403, cleared the challenge) while a valid token sat in storage with
  // no session ever established from it client-side.
  it('does not blame the code when the profile fetch fails after a correct verify, and clears the stray token', async () => {
    ;(adminLogin as any).mockResolvedValue(CHALLENGE)
    ;(verifyAdminLoginOtp as any).mockResolvedValue({ accessToken: 'admin-token' })
    ;(getAdminMe as any).mockRejectedValue({ response: { status: 403, data: { code: 'FORBIDDEN' } } })

    renderProvider()
    await act(async () => { await api.adminLogin('admin@example.com', 'pw') })

    let result: any
    await act(async () => { result = await api.verifyOtp('123456', true) })

    expect(result.success).toBe(false)
    expect(result.error).not.toMatch(/code isn.t valid|sign-in attempt has expired/i)
    expect(result.startOver).toBe(true)

    // Not authenticated client-side, and the stray token must not be left behind for a session
    // that was never actually established.
    expect(api.isAdminAuthenticated).toBe(false)
    expect(api.adminUser).toBeNull()
    expect(clearStoredAdminToken).toHaveBeenCalled()
  })
})
