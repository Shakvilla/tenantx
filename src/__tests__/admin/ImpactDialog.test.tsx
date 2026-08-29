import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import ImpactDialog from '@/views/admin/plans/ImpactDialog'
import type { PlanImpact } from '@/lib/api/subscription-plans-admin'

const impact: PlanImpact = {
  warnings: [
    'pricing changes from [1-:0.00+30.0000] to [1-:0.00+45.0000] for 12 active subscriber(s) at their next renewal',
    'status changes from DRAFT to ACTIVE'
  ],
  affectedSubscribers: 12,
  impactHash: 'abc123'
}

describe('ImpactDialog', () => {
  it("renders the server's warnings verbatim, not a paraphrase", () => {
    render(<ImpactDialog impact={impact} stale={false} onConfirm={vi.fn()} onClose={vi.fn()} />)

    // The hash binds to what the SERVER computed. Friendlier copy would have the admin
    // confirming something other than what they read.
    expect(screen.getByText(impact.warnings[0])).toBeInTheDocument()
    expect(screen.getByText(impact.warnings[1])).toBeInTheDocument()
  })

  it('states how many subscribers are affected', () => {
    render(<ImpactDialog impact={impact} stale={false} onConfirm={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog')).toHaveTextContent(/12/)
  })

  it('confirms when the admin accepts', () => {
    const onConfirm = vi.fn()

    render(<ImpactDialog impact={impact} stale={false} onConfirm={onConfirm} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))

    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('offers reload rather than another Confirm when the acknowledgement was stale', () => {
    render(<ImpactDialog impact={impact} stale onConfirm={vi.fn()} onClose={vi.fn()} />)

    // A second 409 means the plan moved underneath — another admin edited it, or the
    // subscriber count changed. Replaying the same hash cannot succeed, so offering
    // Confirm again would be a button that is guaranteed to fail.
    expect(screen.queryByRole('button', { name: /^confirm/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
  })

  it('explains WHY a stale acknowledgement was refused', () => {
    render(<ImpactDialog impact={impact} stale onConfirm={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByRole('dialog')).toHaveTextContent(/changed/i)
  })

  it('renders nothing when there is no impact to confirm', () => {
    render(<ImpactDialog impact={null} stale={false} onConfirm={vi.fn()} onClose={vi.fn()} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
