// Task 7-9: the backend now sends `alternateChannel` on a login-OTP challenge (and on resend).
// These tests pin the wiring that populates OtpChallengeForm's already-built `alternateChannel`
// prop from that signal — through AuthContext (landlord) and AdminAuthContext (admin) into
// Login.tsx / AdminLoginView.tsx. OtpChallengeForm itself is untouched and already covered by
// src/__tests__/auth/channel-switch.test.tsx; this file proves the plumbing around it, not the
// control itself.

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams()
}))
vi.mock('@core/hooks/useSettings', () => ({ useSettings: () => ({ settings: { skin: 'default' } }) }))
vi.mock('@core/hooks/useImageVariant', () => ({ useImageVariant: () => '/mock.png' }))
vi.mock('@mui/material/useMediaQuery', () => ({ default: () => false }))
vi.mock('@components/layout/shared/Logo', () => ({ default: () => <span>Logo</span> }))
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
    resendSelectTenantOtp: vi.fn(),
    getCurrentUser: vi.fn().mockResolvedValue({ success: false, data: null }),
    getStoredToken: vi.fn(() => null),
    getStoredTenantId: vi.fn(() => null)
  }
})

vi.mock('@/lib/api/admin-auth-client', async () => {
  const actual = await vi.importActual<any>('@/lib/api/admin-auth-client')

  return {
    ...actual,
    adminLogin: vi.fn(),
    verifyAdminLoginOtp: vi.fn(),
    resendAdminOtp: vi.fn(),
    getAdminMe: vi.fn(),
    getStoredAdminToken: vi.fn(() => null),
    clearStoredAdminToken: vi.fn(),
    adminLogout: vi.fn()
  }
})

import { globalLogin, selectTenant, resendSelectTenantOtp } from '@/lib/api/auth-client'
import { adminLogin, resendAdminOtp } from '@/lib/api/admin-auth-client'
import { AuthProvider } from '@/contexts/AuthContext'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import LoginV2 from '@/views/Login'
import AdminLoginView from '@/views/admin/AdminLoginView'

const WORKSPACE_A = { tenantId: 't-1', tenantName: 'Atkaada', role: 'OWNER', userType: 'LANDLORD' }

const CHALLENGE_WITH_ALTERNATE = {
  otpRequired: true,
  pendingToken: 'pending',
  channel: 'EMAIL',
  maskedTarget: 'a***@b.com',
  alternateChannel: { channel: 'SMS', maskedTarget: '***4072' }
}

const CHALLENGE_NO_ALTERNATE = {
  otpRequired: true,
  pendingToken: 'pending',
  channel: 'EMAIL',
  maskedTarget: 'a***@b.com',
  alternateChannel: null
}

const SWITCHED_CHALLENGE = {
  otpRequired: true,
  pendingToken: 'pending',
  channel: 'SMS',
  maskedTarget: '***4072',
  alternateChannel: { channel: 'EMAIL', maskedTarget: 'a***@b.com' }
}

async function submitLoginPassword() {
  fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'landlord@example.com' } })
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'correct-horse' } })
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /log in/i }))
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe('Login — alternateChannel wiring', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders the switch from the challenge response, and switching updates the displayed channel', async () => {
    ;(globalLogin as any).mockResolvedValue({
      success: true,
      data: { firstTimeLogin: false, workspaces: [WORKSPACE_A] }
    })
    ;(selectTenant as any).mockResolvedValue({ success: true, data: CHALLENGE_WITH_ALTERNATE })
    ;(resendSelectTenantOtp as any).mockResolvedValue({ success: true, data: SWITCHED_CHALLENGE })

    render(
      <AuthProvider>
        <LoginV2 mode='light' />
      </AuthProvider>
    )

    await submitLoginPassword()

    await waitFor(() => expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument())

    const switchButton = screen.getByRole('button', { name: /send to \*\*\*4072 instead/i })

    const user = userEvent.setup()
    await user.click(switchButton)

    // The resend endpoint is called with the pendingToken and the alternate channel's own
    // `channel` value — never inferred, only forwarded.
    expect(resendSelectTenantOtp).toHaveBeenCalledWith('pending', 'SMS')

    // The screen now reflects the fresh challenge: new channel copy, new masked target, and the
    // switch control now points back the other way.
    await waitFor(() =>
      expect(screen.getByText(/text message to/i)).toBeInTheDocument()
    )
    expect(screen.getByText('***4072')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send to a\*\*\*@b\.com instead/i })).toBeInTheDocument()
  })

  it('renders no switch when the challenge carries no alternateChannel', async () => {
    ;(globalLogin as any).mockResolvedValue({
      success: true,
      data: { firstTimeLogin: false, workspaces: [WORKSPACE_A] }
    })
    ;(selectTenant as any).mockResolvedValue({ success: true, data: CHALLENGE_NO_ALTERNATE })

    render(
      <AuthProvider>
        <LoginV2 mode='light' />
      </AuthProvider>
    )

    await submitLoginPassword()

    await waitFor(() => expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument())

    expect(screen.queryByRole('button', { name: /instead/i })).not.toBeInTheDocument()
  })
})

describe('AdminLoginView — alternateChannel wiring', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  async function submitAdminPassword() {
    fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pw' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in to admin panel/i }))
    await waitFor(() => expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument())
  }

  it('renders the switch from the challenge response, and switching updates the displayed channel', async () => {
    ;(adminLogin as any).mockResolvedValue(CHALLENGE_WITH_ALTERNATE)
    ;(resendAdminOtp as any).mockResolvedValue(SWITCHED_CHALLENGE)

    render(
      <AdminAuthProvider>
        <AdminLoginView />
      </AdminAuthProvider>
    )

    await submitAdminPassword()

    const switchButton = screen.getByRole('button', { name: /send to \*\*\*4072 instead/i })

    const user = userEvent.setup()
    await user.click(switchButton)

    expect(resendAdminOtp).toHaveBeenCalledWith('pending', 'SMS')

    await waitFor(() =>
      expect(screen.getByText(/text message to/i)).toBeInTheDocument()
    )
    expect(screen.getByText('***4072')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send to a\*\*\*@b\.com instead/i })).toBeInTheDocument()
  })

  it('renders no switch when the challenge carries no alternateChannel', async () => {
    ;(adminLogin as any).mockResolvedValue(CHALLENGE_NO_ALTERNATE)

    render(
      <AdminAuthProvider>
        <AdminLoginView />
      </AdminAuthProvider>
    )

    await submitAdminPassword()

    expect(screen.queryByRole('button', { name: /instead/i })).not.toBeInTheDocument()
  })
})
