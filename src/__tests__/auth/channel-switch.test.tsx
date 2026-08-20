import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

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
    resendAdminOtp: vi.fn(),
    getAdminMe: vi.fn(),
    getStoredAdminToken: vi.fn(() => null),
    clearStoredAdminToken: vi.fn(),
    adminLogout: vi.fn()
  }
})

import OtpChallengeForm from '@/components/auth/OtpChallengeForm'
import { adminLogin, resendAdminOtp } from '@/lib/api/admin-auth-client'
import { AdminAuthProvider } from '@/contexts/AdminAuthContext'
import AdminLoginView from '@/views/admin/AdminLoginView'

const ADMIN_CHALLENGE = { otpRequired: true, pendingToken: 'p', channel: 'EMAIL', maskedTarget: 'a***@b.com' }

async function renderAdminChallenge() {
  ;(adminLogin as any).mockResolvedValue(ADMIN_CHALLENGE)

  render(
    <AdminAuthProvider>
      <AdminLoginView />
    </AdminAuthProvider>
  )

  fireEvent.change(screen.getByLabelText(/admin email/i), { target: { value: 'admin@example.com' } })
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'pw' } })
  fireEvent.click(screen.getByRole('button', { name: /sign in to admin panel/i }))

  await waitFor(() => expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument())
}

describe('OtpChallengeForm — channel switch', () => {
  it('offers the alternate channel and calls onSwitch when chosen', async () => {
    const onSwitch = vi.fn()
    const user = userEvent.setup()

    render(
      <OtpChallengeForm
        channel='SMS' maskedTarget='***4072' isSubmitting={false} error={null}
        onSubmit={vi.fn()} onStartOver={vi.fn()}
        alternateChannel={{ channel: 'EMAIL', maskedTarget: 'j***@example.com', onSwitch }}
      />
    )

    await user.click(screen.getByRole('button', { name: /send to j\*\*\*@example\.com instead/i }))
    expect(onSwitch).toHaveBeenCalled()
  })

  it('offers no switch when the policy does not allow one', () => {
    render(
      <OtpChallengeForm
        channel='EMAIL' maskedTarget='j***@example.com' isSubmitting={false} error={null}
        onSubmit={vi.fn()} onStartOver={vi.fn()}
      />
    )

    expect(screen.queryByRole('button', { name: /instead/i })).not.toBeInTheDocument()
  })
})

describe('AdminLoginView — resend without re-entering a password', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  // The admin path had no resend at all before this. It does now, because the pendingToken
  // already proves the password step — no credentials are held anywhere.
  it('the admin challenge can resend without re-entering a password', async () => {
    ;(resendAdminOtp as any).mockResolvedValue({ otpRequired: true, pendingToken: 'p', channel: 'EMAIL', maskedTarget: 'a***@b.com' })
    const user = userEvent.setup()

    await renderAdminChallenge()
    await user.click(screen.getByRole('button', { name: /send a new code/i }))

    expect(resendAdminOtp).toHaveBeenCalledWith('p', undefined)
    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument()
  })
})
