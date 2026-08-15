import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

import OnboardCompletionScreen from '@/views/onboarding/steps/OnboardCompletionScreen'

describe('OnboardCompletionScreen', () => {
  it('shows the moved-in message and wires the next-step buttons', () => {
    const onCreateInvoice = vi.fn()
    const onViewTenant = vi.fn()

    render(
      <OnboardCompletionScreen
        activated
        occupantName='Kwabena Owusu'
        unitNo='100'
        onCreateInvoice={onCreateInvoice}
        onViewTenant={onViewTenant}
        onOnboardAnother={vi.fn()}
        onDone={vi.fn()}
      />
    )
    expect(screen.getByText(/moved into unit 100/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /create first invoice/i }))
    expect(onCreateInvoice).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: /view tenant/i }))
    expect(onViewTenant).toHaveBeenCalled()
  })

  it('shows a pending message when not activated', () => {
    render(
      <OnboardCompletionScreen
        activated={false}
        occupantName='Kwabena Owusu'
        unitNo='100'
        onCreateInvoice={vi.fn()}
        onViewTenant={vi.fn()}
        onOnboardAnother={vi.fn()}
        onDone={vi.fn()}
      />
    )
    expect(screen.getByText(/pending/i)).toBeInTheDocument()
  })
})
