import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import PhoneVerificationCard from '@/components/auth/PhoneVerificationCard'

function renderCard(overrides: Partial<React.ComponentProps<typeof PhoneVerificationCard>> = {}) {
  const props = {
    currentPhone: null,
    isVerified: false,
    onSubmitPhone: vi.fn().mockResolvedValue({ expiresInSeconds: 600 }),
    onVerifyPhone: vi.fn().mockResolvedValue(undefined),
    onVerified: vi.fn(),
    ...overrides
  }

  render(<PhoneVerificationCard {...props} />)

  return props
}

describe('PhoneVerificationCard', () => {
  // A prompt that reads as mandatory generates support tickets for a step nobody has to take:
  // email delivery has no switch and always works.
  it('says plainly that verifying is optional', () => {
    renderCard()

    expect(screen.getByText(/optional/i)).toBeInTheDocument()
  })

  it('rejects a malformed number locally, without spending a send', async () => {
    const user = userEvent.setup()
    const props = renderCard()

    await user.type(screen.getByLabelText(/phone number/i), '123')
    await user.click(screen.getByRole('button', { name: /send code/i }))

    expect(props.onSubmitPhone).not.toHaveBeenCalled()
    expect(screen.getByText(/7 to 16 digits/i)).toBeInTheDocument()
  })

  it('submits a valid number and moves to the code step', async () => {
    const user = userEvent.setup()
    const props = renderCard()

    await user.type(screen.getByLabelText(/phone number/i), '+233241234567')
    await user.click(screen.getByRole('button', { name: /send code/i }))

    expect(props.onSubmitPhone).toHaveBeenCalledWith('+233241234567')
    expect(await screen.findByLabelText(/verification code/i)).toBeInTheDocument()
  })

  it('will not submit a code that is not exactly six digits', async () => {
    const user = userEvent.setup()

    renderCard()
    await user.type(screen.getByLabelText(/phone number/i), '+233241234567')
    await user.click(screen.getByRole('button', { name: /send code/i }))
    await user.type(await screen.findByLabelText(/verification code/i), '12345')

    expect(screen.getByRole('button', { name: /^verify$/i })).toBeDisabled()
  })

  it('reports success upward after verifying', async () => {
    const user = userEvent.setup()
    const props = renderCard()

    await user.type(screen.getByLabelText(/phone number/i), '+233241234567')
    await user.click(screen.getByRole('button', { name: /send code/i }))
    await user.type(await screen.findByLabelText(/verification code/i), '123456')
    await user.click(screen.getByRole('button', { name: /^verify$/i }))

    expect(props.onVerifyPhone).toHaveBeenCalledWith('123456')
    expect(props.onVerified).toHaveBeenCalled()
  })

  it('shows a verified number with a way to change it', async () => {
    const user = userEvent.setup()

    renderCard({ currentPhone: '+233241234567', isVerified: true })

    expect(screen.getByText(/verified/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /change number/i }))
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
  })
})
