import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/api/subscription-plans-admin', () => ({ getPriceCurve: vi.fn() }))

import { getPriceCurve } from '@/lib/api/subscription-plans-admin'
import PriceCurve from '@/views/admin/plans/PriceCurve'

const falling = {
  points: [
    { quantity: 10, amount: '150.00', effectiveUnitPrice: '15.0000', salesLed: false },
    { quantity: 25, amount: '240.00', effectiveUnitPrice: '9.6000', salesLed: false }
  ],
  monotonic: true,
  risingAt: []
}

const rising = {
  points: [
    { quantity: 10, amount: '50.00', effectiveUnitPrice: '5.0000', salesLed: false },
    { quantity: 25, amount: '800.00', effectiveUnitPrice: '32.0000', salesLed: false }
  ],
  monotonic: false,
  risingAt: [25]
}

describe('PriceCurve', () => {
  beforeEach(() => vi.clearAllMocks())

  it('names the band where the rate goes up', async () => {
    ;(getPriceCurve as any).mockResolvedValue(rising)

    render(<PriceCurve planId='plan-1' />)

    // A chart alone does not make a rising per-unit cost obvious, and this is the one
    // mistake the endpoint exists to catch — so it has to be said in words, inside the
    // warning itself rather than merely somewhere on the page.
    const warning = await screen.findByRole('alert')

    expect(warning).toHaveTextContent(/goes up/i)
    expect(warning).toHaveTextContent(/25 unit/)
  })

  it('stays quiet when the curve falls', async () => {
    ;(getPriceCurve as any).mockResolvedValue(falling)

    render(<PriceCurve planId='plan-1' />)

    // Rendered as money, not as the raw NUMERIC(12,4) the wire carries.
    expect(await screen.findByText('GH₵15.00')).toBeInTheDocument()
    expect(screen.queryByText(/more per unit/i)).not.toBeInTheDocument()
  })

  it('says the curve reflects the saved plan, not unsaved edits', async () => {
    ;(getPriceCurve as any).mockResolvedValue(falling)

    render(<PriceCurve planId='plan-1' />)

    // The endpoint prices the plan as STORED. Without this label an admin would read the
    // curve as a preview of the table they are editing.
    expect(await screen.findByText(/unsaved edits are not reflected/i)).toBeInTheDocument()
  })

  it('renders nothing to fetch against for an unsaved plan', () => {
    render(<PriceCurve planId={null} />)

    expect(getPriceCurve).not.toHaveBeenCalled()
    expect(screen.getByText(/once the plan is saved/i)).toBeInTheDocument()
  })
})
