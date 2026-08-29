import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const push = vi.fn()

vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/lib/api/subscription-plans-admin', () => ({ getAdminPlans: vi.fn() }))

import { getAdminPlans } from '@/lib/api/subscription-plans-admin'
import PlanList from '@/views/admin/plans/PlanList'

const plans = [
  {
    id: 'plan-1',
    code: 'PRO',
    name: 'PRO',
    displayName: 'Pro',
    status: 'ACTIVE' as const,
    entryPrice: '0.00',
    pricePerUnit: '30.0000',
    subscriberCount: 12,
    popular: true
  },
  {
    id: 'plan-2',
    code: 'EXPERIMENT',
    name: 'EXPERIMENT',
    displayName: 'Experiment',
    status: 'DRAFT' as const,
    entryPrice: '150.00',
    pricePerUnit: '9.0000',
    subscriberCount: 0,
    popular: false
  }
]

describe('PlanList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAdminPlans as any).mockResolvedValue(plans)
  })

  it('shows DRAFT plans — the admin list must not filter by active', async () => {
    // Slice A's review found the admin list sharing findAllByActiveTrue() with the public
    // pricing page, so a DRAFT plan appeared in no listing at all. This is why that was fixed.
    render(<PlanList />)

    expect(await screen.findByText('Experiment')).toBeInTheDocument()
    expect(screen.getByText('DRAFT')).toBeInTheDocument()
  })

  it('shows a price that tells plans apart, not a zero for every one', async () => {
    // The column previously quoted each plan at ONE unit, and every plan's first unit is
    // free — so it read 0 for all three and distinguished nothing.
    render(<PlanList />)

    const pro = (await screen.findByText('Pro')).closest('tr')

    expect(pro).toHaveTextContent('GH₵30.00/unit')
  })

  it('shows the live subscriber count per plan', async () => {
    render(<PlanList />)

    const row = (await screen.findByText('Pro')).closest('tr')

    expect(row).toHaveTextContent('12')
  })

  it('opens the editor for a plan', async () => {
    render(<PlanList />)
    fireEvent.click(await screen.findByRole('button', { name: /edit Pro/i }))

    expect(push).toHaveBeenCalledWith('/admin/subscriptions/plans/plan-1')
  })

  it('duplicating opens the editor prefilled from the source plan', async () => {
    render(<PlanList />)
    fireEvent.click(await screen.findByRole('button', { name: /duplicate Pro/i }))

    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/subscriptions/plans/new?from=plan-1'))
  })

  it('offers a way to create a plan from scratch', async () => {
    render(<PlanList />)
    fireEvent.click(await screen.findByRole('button', { name: /new plan/i }))

    expect(push).toHaveBeenCalledWith('/admin/subscriptions/plans/new')
  })
})
