import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'

import { AuthProvider, useAuth } from '@/contexts/AuthContext'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }))
vi.mock('@/lib/api/auth-client', async () => {
  const actual = await vi.importActual<any>('@/lib/api/auth-client')

  return {
    ...actual,
    signupComplete: vi.fn(),
    getCurrentUser: vi.fn().mockResolvedValue({ success: false, data: null }),
    getStoredToken: vi.fn(() => null),
    getStoredTenantId: vi.fn(() => null)
  }
})

import { signupComplete } from '@/lib/api/auth-client'

let api: ReturnType<typeof useAuth>

function Probe() {
  api = useAuth()

  return (
    <div>
      <div data-testid='is-authenticated'>{String(api.isAuthenticated)}</div>
      <div data-testid='user-role'>{api.user?.role ?? ''}</div>
      <div data-testid='user-type'>{api.user?.userType ?? ''}</div>
    </div>
  )
}

function renderProvider() {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  )
}

// Final review, Important 2: Register.tsx used to call signupComplete (auth-client) directly and
// set NO local/context state — signupComplete only writes tokens. A brand-new landlord landed on
// /dashboard with AuthContext un-remounted, so it still read user: null, isAuthenticated: false,
// no workspace name, and SubscriptionContext never loaded — recovering only on a hard refresh.
// completeSignup (AuthContext) is the fix: it is now the ONLY path Register.tsx uses to finish
// signup, and this file pins that it performs the same state writes login()/verifyOtp() do.
describe('AuthContext.completeSignup', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('establishes a full authenticated session — user, tenant, role, userType — on success', async () => {
    ;(signupComplete as any).mockResolvedValue({
      success: true,
      data: {
        token: 'tenant-token',
        expiresIn: 3600,
        tenantId: 't-signup-1',
        tenantName: 'Atkaada Estates',
        userId: 'u-signup-1',
        email: 'new-landlord@example.com',
        createdAt: '2026-08-20T00:00:00Z'
      }
    })

    renderProvider()

    let result: any
    await act(async () => {
      result = await api.completeSignup({
        pendingToken: 'pending-signup-token',
        otp: '123456',
        rememberDevice: true,
        fullName: 'New Landlord'
      })
    })

    expect(result.success).toBe(true)

    await waitFor(() => expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true'))
    expect(screen.getByTestId('user-role')).toHaveTextContent('ADMIN')
    expect(screen.getByTestId('user-type')).toHaveTextContent('LANDLORD')

    expect(api.user?.id).toBe('u-signup-1')
    expect(api.user?.email).toBe('new-landlord@example.com')
    expect(api.user?.name).toBe('New Landlord')
    expect(api.tenant?.id).toBe('t-signup-1')
    expect(api.tenant?.name).toBe('Atkaada Estates')

    // The bootstrap useEffect on a later page load restores role/userType from storage — this is
    // exactly what a hard refresh relied on before this fix, and must keep working alongside it.
    expect(localStorage.getItem('user_role')).toBe('ADMIN')
    expect(localStorage.getItem('user_type')).toBe('LANDLORD')
  })

  it('leaves the caller unauthenticated and surfaces an error on a failed completion', async () => {
    ;(signupComplete as any).mockResolvedValue({
      success: false,
      data: null,
      rawError: { response: { status: 400, data: { code: 'OTP_INVALID', message: 'Wrong code' } } }
    })

    renderProvider()

    let result: any
    await act(async () => {
      result = await api.completeSignup({
        pendingToken: 'pending-signup-token',
        otp: '000000',
        rememberDevice: true,
        fullName: 'New Landlord'
      })
    })

    expect(result.success).toBe(false)
    expect(api.isAuthenticated).toBe(false)
    expect(api.user).toBeNull()
  })
})
