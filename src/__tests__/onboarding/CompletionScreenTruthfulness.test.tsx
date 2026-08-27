import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import CompletionScreen from '@/views/onboarding/CompletionScreen'

/**
 * The screen used to claim, unconditionally, that "Your property, occupant, and first invoice are
 * ready. Your tenant will receive a notification." A field-test landlord who skipped occupant,
 * agreement and invoice was told all three were ready. None existed, and "View Invoice" dropped
 * him on the dashboard.
 *
 * A setup screen that congratulates you for work it did not do is worse than no screen at all:
 * the next thing the landlord does is go looking for the tenant he was told he has.
 */
describe('CompletionScreen truthfulness', () => {
  const noop = vi.fn()

  it('names only what was actually created', () => {
    render(
      <CompletionScreen onGoToDashboard={noop} onViewInvoice={noop} entityIds={{ propertyId: 'p1', unitId: 'u1' }} />
    )

    expect(screen.getByText(/your property/i)).toBeInTheDocument()
    expect(screen.queryByText(/tenant/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/invoice/i)).not.toBeInTheDocument()
  })

  it('says nothing was set up when every step was skipped', () => {
    render(<CompletionScreen onGoToDashboard={noop} onViewInvoice={noop} entityIds={{}} />)

    expect(screen.getByText(/setup skipped/i)).toBeInTheDocument()
    expect(screen.getByText(/you skipped every step/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /view invoice/i })).not.toBeInTheDocument()
  })

  it('offers View Invoice only when there is an invoice', () => {
    const { rerender } = render(
      <CompletionScreen onGoToDashboard={noop} onViewInvoice={noop} entityIds={{ propertyId: 'p1' }} />
    )

    expect(screen.queryByRole('button', { name: /view invoice/i })).not.toBeInTheDocument()

    rerender(
      <CompletionScreen
        onGoToDashboard={noop}
        onViewInvoice={noop}
        entityIds={{ propertyId: 'p1', occupantId: 'o1', invoiceId: 'i1' }}
      />
    )

    expect(screen.getByRole('button', { name: /view invoice/i })).toBeInTheDocument()
    expect(screen.getByText(/their first invoice/i)).toBeInTheDocument()
  })
})
