import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'

import { AuthProvider, useAuth } from '@/contexts/AuthContext'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }))
vi.mock('@/lib/api/auth-client', async () => {
  const actual = await vi.importActual<any>('@/lib/api/auth-client')

  return {
    ...actual,
    selectTenant: vi.fn(),
    verifySelectTenantOtp: vi.fn(),
    resendSelectTenantOtp: vi.fn(),
    getCurrentUser: vi.fn().mockResolvedValue({ success: false, data: null }),
    getStoredToken: vi.fn(() => null),
    getStoredTenantId: vi.fn(() => null)
  }
})

import { selectTenant, verifySelectTenantOtp, resendSelectTenantOtp } from '@/lib/api/auth-client'

const WORKSPACE = { tenantId: 't-1', tenantName: 'Atkaada', role: 'OWNER', userType: 'LANDLORD' }

let api: ReturnType<typeof useAuth>

function Probe() {
  api = useAuth()

  return <div data-testid='needs-otp'>{String(api.needsOtp)}</div>
}

function renderProvider() {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  )
}

describe('AuthContext login-OTP branch', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('enters the challenge state and stores no session', async () => {
    ;(selectTenant as any).mockResolvedValue({
      success: true,
      data: { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }
    })

    renderProvider()
    await act(async () => { await api.selectWorkspace(WORKSPACE as any) })

    await waitFor(() => expect(screen.getByTestId('needs-otp')).toHaveTextContent('true'))
    expect(api.isAuthenticated).toBe(false)
    expect(api.otpChallenge?.pendingToken).toBe('pending')
    expect(api.otpChallenge?.workspace.tenantId).toBe('t-1')
  })

  // The success path after a challenge must be the SAME path as an unchallenged login, or the
  // two drift and only one of them stays correct.
  it('lands in the identical authenticated state after verifying', async () => {
    ;(selectTenant as any).mockResolvedValue({
      success: true,
      data: { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }
    })
    ;(verifySelectTenantOtp as any).mockResolvedValue({
      success: true,
      data: {
        accessToken: 'tenant-token', refreshToken: 'refresh', tokenType: 'Bearer',
        expiresIn: 3600, expiresAt: '', user: { id: 'u1', email: 'a@b.com', fullName: 'A B', companyName: '', active: true, createdAt: '' }
      }
    })

    renderProvider()
    await act(async () => { await api.selectWorkspace(WORKSPACE as any) })
    await act(async () => { await api.verifyOtp('123456', true) })

    await waitFor(() => expect(api.isAuthenticated).toBe(true))
    expect(api.needsOtp).toBe(false)
    expect(api.tenant?.id).toBe('t-1')
    expect(api.user?.role).toBe('OWNER')
    expect(api.user?.userType).toBe('LANDLORD')

    // Middleware treats a user as authenticated only when BOTH cookies exist. The OTP path
    // skips selectTenant's own setStoredTenantId call — it returned a challenge and bailed
    // out before reaching it — so without an explicit call here the landlord verifies
    // successfully and is redirected straight back to /login.
    expect(localStorage.getItem('tenant_id')).toBe('t-1')
  })

  it('passes rememberDevice through to the verify call', async () => {
    ;(selectTenant as any).mockResolvedValue({
      success: true,
      data: { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }
    })
    ;(verifySelectTenantOtp as any).mockResolvedValue({ success: false, data: null, error: { code: 'X', message: 'no' } })

    renderProvider()
    await act(async () => { await api.selectWorkspace(WORKSPACE as any) })
    await act(async () => { await api.verifyOtp('123456', false) })

    expect(verifySelectTenantOtp).toHaveBeenCalledWith('pending', '123456', false)
  })

  // Task 8: resend now hits /select-tenant/verify-otp/resend on the pendingToken alone, rather
  // than re-running selectTenant (which needed no credentials either, but re-checked device
  // trust from scratch — a resend must not do that, it only reissues a code on the existing
  // challenge).
  it('resend uses the pendingToken, not select-tenant', async () => {
    ;(selectTenant as any).mockResolvedValue({
      success: true,
      data: { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }
    })
    ;(resendSelectTenantOtp as any).mockResolvedValue({
      success: true,
      data: { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }
    })

    renderProvider()
    await act(async () => { await api.selectWorkspace(WORKSPACE as any) })
    await act(async () => { await api.resendOtp() })

    expect(selectTenant).toHaveBeenCalledTimes(1)
    expect(resendSelectTenantOtp).toHaveBeenCalledWith('pending', undefined)
  })

  it('resend forwards an explicit channel choice', async () => {
    ;(selectTenant as any).mockResolvedValue({
      success: true,
      data: { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }
    })
    ;(resendSelectTenantOtp as any).mockResolvedValue({
      success: true,
      data: { otpRequired: true, pendingToken: 'pending', channel: 'SMS', maskedTarget: '***4072' }
    })

    renderProvider()
    await act(async () => { await api.selectWorkspace(WORKSPACE as any) })
    await act(async () => { await api.resendOtp('SMS') })

    expect(resendSelectTenantOtp).toHaveBeenCalledWith('pending', 'SMS')
    expect(api.otpChallenge?.channel).toBe('SMS')
    expect(api.otpChallenge?.maskedTarget).toBe('***4072')
  })

  // A resend failure (429 send-budget, a disallowed channel, etc.) used to be swallowed
  // entirely — no state change, no message, "Send a new code" looked like it did nothing. It
  // must now come back through otpErrorMessage so the caller has something to show.
  it('resend surfaces a failure instead of swallowing it', async () => {
    ;(selectTenant as any).mockResolvedValue({
      success: true,
      data: { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }
    })
    ;(resendSelectTenantOtp as any).mockResolvedValue({
      success: false,
      data: null,
      rawError: { response: { status: 429, data: {} } }
    })

    renderProvider()
    await act(async () => { await api.selectWorkspace(WORKSPACE as any) })

    let resendResult: any
    await act(async () => { resendResult = await api.resendOtp() })

    expect(resendResult.success).toBe(false)
    expect(resendResult.error).toMatch(/too many/i)

    // The stale challenge must survive an unrelated resend failure — the user can still submit
    // the code they already have.
    expect(api.needsOtp).toBe(true)
    expect(api.otpChallenge?.pendingToken).toBe('pending')
  })
})
