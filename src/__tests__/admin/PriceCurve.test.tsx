import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/api/subscription-plans-admin', () => ({ getPriceCurve: vi.fn() }))

import { getPriceCurve } from '@/lib/api/subscription-plans-admin'
import PriceCurve from '@/views/admin/plans/PriceCurve'

const falling = {
  points: [
    { quantity: 10, amount: '150.00', effectiveUnitPrice: '15.0000', unitRate: '0.0000', salesLed: false },
    { quantity: 25, amount: '240.00', effectiveUnitPrice: '9.6000', unitRate: '9.0000', salesLed: false }
  ],
  monotonic: true,
  risingAt: []
}

const rising = {
  points: [
    { quantity: 10, amount: '50.00', effectiveUnitPrice: '5.0000', unitRate: '5.0000', salesLed: false },
    { quantity: 25, amount: '800.00', effectiveUnitPrice: '32.0000', unitRate: '32.0000', salesLed: false }
  ],
  monotonic: false,
  risingAt: [25]
}

// PRO's real table: five units free, then 30. The average climbs while the rate never moves —
// the shape that misled three readers and produced two wrong monotonicity implementations.
const freeAllowance = {
  points: [
    { quantity: 5, amount: '0.00', effectiveUnitPrice: '0.0000', unitRate: '0.0000', salesLed: false },
    { quantity: 10, amount: '150.00', effectiveUnitPrice: '15.0000', unitRate: '30.0000', salesLed: false },
    { quantity: 250, amount: '7350.00', effectiveUnitPrice: '29.4000', unitRate: '30.0000', salesLed: false }
  ],
  monotonic: true,
  risingAt: []
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

  it('labels the average as an average and shows the flat rate beside it', async () => {
    ;(getPriceCurve as any).mockResolvedValue(freeAllowance)

    render(<PriceCurve planId='plan-1' />)

    // "Per unit" over an average is what caused the misreading. The header must not promise
    // a rate, and the real rate has to be visible rather than inferred from a rising column.
    expect(await screen.findByRole('columnheader', { name: /average per unit/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /^rate$/i })).toBeInTheDocument()

    // Flat rate where the average climbs — the whole point of the second column.
    expect(screen.getAllByText('GH₵30.00')).toHaveLength(2)

    // The averages still render, so nothing was replaced.
    expect(screen.getByText('GH₵15.00')).toBeInTheDocument()
    expect(screen.getByText('GH₵29.40')).toBeInTheDocument()
  })

})
