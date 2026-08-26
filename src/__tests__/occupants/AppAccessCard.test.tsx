import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

import AppAccessCard from '@/views/occupants/view/AppAccessCard'

/**
 * The landlord portal never mentioned that tenants can already use the app.
 *
 * Their account is provisioned the moment they are added, and they sign in with
 * the email or phone on their record. Nothing said so, which is why the
 * Maintenance page's "requests from tenants" read as a promise the product was
 * not keeping — the loop existed and the landlord could not start it.
 */
const writeText = vi.fn(async (_text: string) => {})

// navigator.clipboard is a getter-only property in happy-dom.
Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })

describe('AppAccessCard', () => {
  beforeEach(() => {
    writeText.mockClear()
  })

  it('names the identifier the tenant will actually sign in with', () => {
    render(<AppAccessCard name='Akosua Boateng' email='akosua.boateng@gmail.com' phone='0244 118 227' />)

    expect(screen.getByText('akosua.boateng@gmail.com')).toBeTruthy()
  })

  it('falls back to the phone number for a tenant with no email', () => {
    render(<AppAccessCard name='Yaa Asantewaa' phone='0201445908' />)

    expect(screen.getByText('0201445908')).toBeTruthy()
  })

  it('says plainly when a tenant cannot sign in at all', () => {
    render(<AppAccessCard name='Kofi Mensah' />)

    expect(screen.getByText(/neither an email address nor a phone number/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /copy message/i })).toBeNull()
  })

  it('copies a message that carries the identifier and the first-time password step', async () => {
    render(<AppAccessCard name='Yaa Asantewaa' phone='0201445908' />)

    const { default: userEvent } = await import('@testing-library/user-event')

    await userEvent.click(screen.getByRole('button', { name: /copy message/i }))

    const copied = writeText.mock.calls[0][0]

    expect(copied).toContain('0201445908')
    // The flow really does ask for a password on first sign-in — see
    // OtpServiceImpl.setPassword. Saying "no password needed" would be the same
    // kind of false reassurance the agreement dialog used to give.
    expect(copied).toMatch(/choose a password/i)
    expect(copied).toContain('Yaa')
  })
})
