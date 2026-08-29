import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import CycleEditor from '@/views/admin/plans/CycleEditor'
import type { PlanCycle } from '@/lib/api/subscription-plans-admin'

const cycles: PlanCycle[] = [
  { cycle: 'MONTHLY', discountPct: '0.0000', enabled: true },
  { cycle: 'ANNUAL', discountPct: '0.1700', enabled: true }
]

describe('CycleEditor', () => {
  it('renders a row for every billing cycle, including ones the plan has not configured', () => {
    render(<CycleEditor value={cycles} onChange={vi.fn()} />)

    expect(screen.getByText('MONTHLY')).toBeInTheDocument()
    expect(screen.getByText('QUARTERLY')).toBeInTheDocument()
    expect(screen.getByText('ANNUAL')).toBeInTheDocument()
  })

  it('will not let MONTHLY be disabled — a plan with no enabled cycle cannot be billed', () => {
    render(<CycleEditor value={cycles} onChange={vi.fn()} />)

    expect(screen.getByRole('checkbox', { name: /enable MONTHLY/i })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: /enable ANNUAL/i })).not.toBeDisabled()
  })

  it('reports a discount change against the cycle it belongs to', () => {
    const onChange = vi.fn()

    render(<CycleEditor value={cycles} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/ANNUAL discount/i), { target: { value: '0.2000' } })

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ cycle: 'ANNUAL', discountPct: '0.2000' })])
    )
  })

  it('always emits MONTHLY, so the server never receives an empty cycle list', () => {
    const onChange = vi.fn()

    // An empty list would DELETE every cycle row server-side and renew annual
    // subscribers at full price, so the editor must never produce one.
    render(<CycleEditor value={[]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('checkbox', { name: /enable QUARTERLY/i }))

    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ cycle: 'MONTHLY', enabled: true })])
    )
  })
})
