import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams()
}))

vi.mock('@core/hooks/useSettings', () => ({ useSettings: () => ({ settings: { skin: 'default' } }) }))
vi.mock('@core/hooks/useImageVariant', () => ({ useImageVariant: () => '/mock.png' }))

vi.mock('@/lib/api/auth-client', async () => {
  const actual = await vi.importActual<any>('@/lib/api/auth-client')

  return {
    ...actual,
    signupStart: vi.fn(),
    signupComplete: vi.fn()
  }
})

import { signupStart } from '@/lib/api/auth-client'
import { AuthProvider } from '@/contexts/AuthContext'
import Register from '@/views/Register'

function challenge() {
  return { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'n***@example.com' }
}

async function fillAndSubmitSignupForm(overrides: { phoneNumber?: string } = {}) {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Nana Owusu' } })
  fireEvent.change(screen.getByLabelText(/^email/i), { target: { value: 'nana@example.com' } })
  fireEvent.change(screen.getByLabelText(/company \/ organization name/i), { target: { value: 'Norgha Ltd' } })
  fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: 'Password1' } })
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'Password1' } })

  if (overrides.phoneNumber !== undefined) {
    fireEvent.change(screen.getByLabelText(/phone number/i), { target: { value: overrides.phoneNumber } })
  }

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await Promise.resolve()
    await Promise.resolve()
  })
}

function renderRegister() {
  render(
    <AuthProvider>
      <Register mode='light' />
    </AuthProvider>
  )
}

describe('Register — two-step signup with email verification', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('shows the code step after a successful start, and stores no token yet', async () => {
    ;(signupStart as any).mockResolvedValue({
      success: true,
      data: { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'n***@example.com' }
    })

    renderRegister()
    await fillAndSubmitSignupForm()

    expect(await screen.findByLabelText(/verification code/i)).toBeInTheDocument()
    expect(localStorage.getItem('auth_token'))
      .toBeNull() // a challenge carries no session — same invariant as the login paths
  })

  it('sends the phone number when supplied, and omits it when blank', async () => {
    ;(signupStart as any).mockResolvedValue({ success: true, data: challenge() })

    renderRegister()
    await fillAndSubmitSignupForm({ phoneNumber: '+233241234567' })

    expect(signupStart).toHaveBeenCalledWith(expect.objectContaining({ phoneNumber: '+233241234567' }))
  })

  it('rejects a malformed phone locally, without calling the API', async () => {
    renderRegister()
    await fillAndSubmitSignupForm({ phoneNumber: '123' })

    expect(signupStart).not.toHaveBeenCalled()
    expect(screen.getByText(/7 to 16 digits/i)).toBeInTheDocument()
  })

  // Device trust at signup is decided by the backend, not offered as a choice here: the user has
  // just proved control of the email on this device and there is nothing to opt out of yet.
  it('does not show a remember-this-device checkbox at signup', async () => {
    ;(signupStart as any).mockResolvedValue({ success: true, data: challenge() })

    renderRegister()
    await fillAndSubmitSignupForm()
    await screen.findByLabelText(/verification code/i)

    expect(screen.queryByRole('checkbox', { name: /remember this device/i })).not.toBeInTheDocument()
  })
})
