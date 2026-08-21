import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// The whole point of this file: SecuritySettingsView must seed the phone card from the SERVER's
// answer. It used to seed from AuthUser.phone, which no login or profile response ever set, so
// the card started blank for everyone — a landlord who typed their number during signup was
// asked for it again, and an already-verified user saw no sign of their verification and would
// redo it, spending one of only 3 hourly SMS sends to change nothing.
vi.mock('@/lib/api/auth-client', async () => {
  const actual = await vi.importActual<any>('@/lib/api/auth-client')

  return {
    ...actual,
    getMyLoginHistory: vi.fn(),
    getPhoneStatus: vi.fn(),
    logoutAllUser: vi.fn(),
    submitPhoneNumber: vi.fn(),
    verifyPhoneNumber: vi.fn()
  }
})

import { getMyLoginHistory, getPhoneStatus, submitPhoneNumber, verifyPhoneNumber } from '@/lib/api/auth-client'
import SecuritySettingsView from '@/views/settings/security/SecuritySettingsView'

describe('phone number pre-fill on the Security settings page', () => {
  // vitest.config sets mockReset, so every implementation has to be (re)established per test.
  beforeEach(() => {
    vi.mocked(getMyLoginHistory).mockResolvedValue({ items: [], totalItems: 0 } as any)
    vi.mocked(submitPhoneNumber).mockResolvedValue({ expiresInSeconds: 600 })
    vi.mocked(verifyPhoneNumber).mockResolvedValue(undefined)
  })

  // The mutation this pins: rendering PhoneVerificationCard before the status fetch resolves.
  // The card seeds its text field from `currentPhone` in a `useState` initialiser, which never
  // re-reads a prop that arrives later — so an ungated mount pins the field to empty for the
  // whole visit even though the fetch succeeds a tick later.
  it('pre-fills the field with the number already on file', async () => {
    vi.mocked(getPhoneStatus).mockResolvedValue({ phoneNumber: '+233241234567', verified: false })

    render(<SecuritySettingsView />)

    const field = await screen.findByLabelText(/phone number/i)

    await waitFor(() => expect(field).toHaveValue('+233241234567'))
  })

  it('shows an already-verified number as verified instead of asking for it again', async () => {
    vi.mocked(getPhoneStatus).mockResolvedValue({ phoneNumber: '+233241234567', verified: true })

    render(<SecuritySettingsView />)

    expect(await screen.findByText('Verified')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /change number/i })).toBeInTheDocument()

    // No entry form, and so no "Send code" button to burn one of the 3 hourly SMS sends on a
    // number the server already considers proved.
    expect(screen.queryByRole('button', { name: /send code/i })).not.toBeInTheDocument()
  })

  it('still offers the card when the status read fails, rather than hiding the feature', async () => {
    vi.mocked(getPhoneStatus).mockRejectedValue(new Error('network'))

    render(<SecuritySettingsView />)

    const field = await screen.findByLabelText(/phone number/i)

    expect(field).toHaveValue('')
    expect(screen.getByRole('button', { name: /send code/i })).toBeInTheDocument()
  })
})
