import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams()
}))

// Login.tsx calls these unconditionally on every render, regardless of which branch (form /
// workspace-selection / OTP challenge) ends up on screen. useImageVariant in particular reaches
// into MUI's useColorScheme, which needs a CssVarsProvider this test doesn't set up — mocked out
// so the test exercises the OTP-gating logic, not the theme plumbing.
vi.mock('@core/hooks/useSettings', () => ({ useSettings: () => ({ settings: { skin: 'default' } }) }))
vi.mock('@core/hooks/useImageVariant', () => ({ useImageVariant: () => '/mock.png' }))

// AuthShell renders the branding column (Logo -> useVerticalNav / usePlatformBranding), none of
// which is under test here and none of which has a provider in this tree. A passthrough keeps
// the real OtpChallengeForm / WorkspaceSelection children on screen, which is what the
// assertions below actually need.
vi.mock('@/components/auth/AuthShell', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}))

vi.mock('@/lib/api/auth-client', async () => {
  const actual = await vi.importActual<any>('@/lib/api/auth-client')

  return {
    ...actual,
    globalLogin: vi.fn(),
    selectTenant: vi.fn(),
    verifySelectTenantOtp: vi.fn(),
    getCurrentUser: vi.fn().mockResolvedValue({ success: false, data: null }),
    getStoredToken: vi.fn(() => null),
    getStoredTenantId: vi.fn(() => null)
  }
})

import { globalLogin, selectTenant } from '@/lib/api/auth-client'
import { AuthProvider } from '@/contexts/AuthContext'
import LoginV2 from '@/views/Login'

const CHALLENGE = { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }

const WORKSPACE_A = { tenantId: 't-1', tenantName: 'Atkaada', role: 'OWNER', userType: 'LANDLORD' }
const WORKSPACE_B = { tenantId: 't-2', tenantName: 'Norgha', role: 'STAFF', userType: 'LANDLORD' }

function renderLogin() {
  render(
    <AuthProvider>
      <LoginV2 mode='light' />
    </AuthProvider>
  )
}

async function submitPassword() {
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'landlord@example.com' } })
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'correct-horse' } })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))

    // handleSubmit's own await chain (globalLogin -> selectTenant) needs a turn of the
    // microtask queue to settle before this act() block closes.
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('Login OTP gating', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  // C-1, auto-select path: a single workspace makes login() call handleSelectWorkspace directly.
  // Before the fix, handleSelectWorkspace's challenge branch returned the same
  // { success: true } as a real session, and handleSubmit's gate on `!needsWorkspaceSelection`
  // (a stale closure, always false) let it through — router.push fired a moment after the
  // challenge screen appeared, unmounting AuthProvider (it's mounted per route group) and
  // destroying the in-memory pendingToken with it.
  it('does not navigate away from a single-workspace login that raises a challenge', async () => {
    ;(globalLogin as any).mockResolvedValue({
      success: true,
      data: { firstTimeLogin: false, workspaces: [WORKSPACE_A] }
    })
    ;(selectTenant as any).mockResolvedValue({ success: true, data: CHALLENGE })

    renderLogin()
    await submitPassword()

    await waitFor(() => expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument())

    // Give the auto-select branch's setTimeout(..., 100) a chance to fire if the gate were
    // absent — this is exactly the timing window the bug lived in.
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    expect(push).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument()
  })

  // C-1, explicit workspace-selection path: two workspaces render WorkspaceSelection; picking
  // one calls handleWorkspaceSelect, whose own unconditional `router.push` was the other site
  // that needed gating.
  it('does not navigate away from an explicit workspace selection that raises a challenge', async () => {
    ;(globalLogin as any).mockResolvedValue({
      success: true,
      data: { firstTimeLogin: false, workspaces: [WORKSPACE_A, WORKSPACE_B] }
    })
    ;(selectTenant as any).mockResolvedValue({ success: true, data: CHALLENGE })

    renderLogin()
    await submitPassword()

    await waitFor(() => expect(screen.getByText(WORKSPACE_A.tenantName)).toBeInTheDocument())

    fireEvent.click(screen.getByText(WORKSPACE_A.tenantName))

    await waitFor(() => expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument())

    expect(push).not.toHaveBeenCalled()
  })
})
