import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'

const push = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@core/hooks/useSettings', () => ({ useSettings: () => ({ settings: { skin: 'default' } }) }))
vi.mock('@mui/material/useMediaQuery', () => ({ default: () => false }))
vi.mock('@components/layout/shared/Logo', () => ({ default: () => <span>Logo</span> }))
vi.mock('@/lib/api/admin-auth-client', async () => {
  const actual = await vi.importActual<any>('@/lib/api/admin-auth-client')

  return {
    ...actual,
    adminLogin: vi.fn(),
    verifyAdminLoginOtp: vi.fn(),
    getAdminMe: vi.fn(),
    getStoredAdminToken: vi.fn(() => null),
    clearStoredAdminToken: vi.fn(),
    adminLogout: vi.fn()
  }
})

import { adminLogin } from '@/lib/api/admin-auth-client'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import AdminLoginView from '@/views/admin/AdminLoginView'

const CHALLENGE = { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }

function renderView() {
  render(
    <AdminAuthProvider>
      <AdminLoginView />
    </AdminAuthProvider>
  )
}

describe('AdminLoginView login-OTP branch', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders the challenge instead of navigating to /admin or showing "Invalid credentials"', async () => {
    ;(adminLogin as any).mockResolvedValue(CHALLENGE)

    renderView()

    fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: 'admin@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pw' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in to admin panel/i }))

    await waitFor(() => expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument())

    // A challenge is not a failed password check — the vague failure message must not appear.
    expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument()

    // A challenge mints no session — falling through to the success branch would navigate an
    // unverified admin straight into the console.
    expect(push).not.toHaveBeenCalledWith('/admin')
  })
})
