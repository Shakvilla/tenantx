import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import OtpChallengeForm from '@/components/auth/OtpChallengeForm'

function renderForm(overrides: Partial<React.ComponentProps<typeof OtpChallengeForm>> = {}) {
  const props = {
    channel: 'EMAIL' as const,
    maskedTarget: 'j***@example.com',
    isSubmitting: false,
    error: null,
    onSubmit: vi.fn(),
    onStartOver: vi.fn(),
    ...overrides
  }

  render(<OtpChallengeForm {...props} />)

  return props
}

describe('OtpChallengeForm', () => {
  it('shows where the code was sent, without the full address', () => {
    renderForm()

    expect(screen.getByText(/j\*\*\*@example\.com/)).toBeInTheDocument()
  })

  it('submits the code with rememberDevice true by default', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.type(screen.getByLabelText(/verification code/i), '123456')
    await user.click(screen.getByRole('button', { name: /verify/i }))

    expect(props.onSubmit).toHaveBeenCalledWith('123456', true)
  })

  it('submits rememberDevice false when the box is unchecked', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.click(screen.getByRole('checkbox', { name: /remember this device/i }))
    await user.type(screen.getByLabelText(/verification code/i), '123456')
    await user.click(screen.getByRole('button', { name: /verify/i }))

    expect(props.onSubmit).toHaveBeenCalledWith('123456', false)
  })

  it('will not submit a code shorter than six digits', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.type(screen.getByLabelText(/verification code/i), '123')

    expect(screen.getByRole('button', { name: /verify/i })).toBeDisabled()
    expect(props.onSubmit).not.toHaveBeenCalled()
  })

  it('renders the error it is given', () => {
    renderForm({ error: 'That code isn’t valid.' })

    expect(screen.getByText(/that code isn’t valid/i)).toBeInTheDocument()
  })

  // A path that cannot resend must not show a resend control at all. A disabled one would
  // imply a temporary state and invite the user to wait for something that never arrives.
  it('offers resend only when the caller can resend', () => {
    const { unmount } = render(
      <OtpChallengeForm
        channel='EMAIL' maskedTarget='a***@b.com' isSubmitting={false} error={null}
        onSubmit={vi.fn()} onStartOver={vi.fn()} onResend={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /send a new code/i })).toBeInTheDocument()
    unmount()

    renderForm()
    expect(screen.queryByRole('button', { name: /send a new code/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start over/i })).toBeInTheDocument()
  })
})
