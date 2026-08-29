import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const push = vi.fn()

let searchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams
}))

vi.mock('@/lib/api/subscription-plans-admin', async () => {
  const actual = await vi.importActual<any>('@/lib/api/subscription-plans-admin')

  return {
    ...actual,
    getPlanDetail: vi.fn(),
    savePlan: vi.fn(),
    getPriceCurve: vi.fn(),
    getGrantableFeatures: vi.fn()
  }
})

import {
  getPlanDetail,
  savePlan,
  getPriceCurve,
  getGrantableFeatures,
  PlanImpactRequired
} from '@/lib/api/subscription-plans-admin'
import PlanEditorForm from '@/views/admin/plans/PlanEditorForm'

const detail = {
  id: 'plan-1',
  code: 'STANDARD',
  name: 'STANDARD',
  displayName: 'Standard',
  description: 'A plan',
  status: 'ACTIVE' as const,
  billingMetric: 'UNITS' as const,
  pricingMode: 'GRADUATED' as const,
  currency: 'GHS',
  maxQty: null,
  selfServeMaxQty: null,
  isPublic: true,
  sortOrder: 1,
  tiers: [{ fromQty: 1, toQty: null, flatPrice: '0.00', perUnitPrice: '30.00' }],
  cycles: [{ cycle: 'MONTHLY' as const, discountPct: '0.0000', enabled: true }],
  featureKeys: ['EXPENSES'],
  popular: true,
  marketingFeatures: ['Unlimited properties'],
  subscriberCount: 12
}

const impact = {
  warnings: ['pricing changes for 12 active subscriber(s) at their next renewal'],
  affectedSubscribers: 12,
  impactHash: 'abc123'
}

const save = () => fireEvent.click(screen.getByRole('button', { name: /save/i }))

describe('PlanEditorForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    searchParams = new URLSearchParams()
    ;(getPlanDetail as any).mockResolvedValue(detail)
    ;(getPriceCurve as any).mockResolvedValue({ points: [], monotonic: true, risingAt: [] })
    ;(getGrantableFeatures as any).mockResolvedValue([
      { key: 'EXPENSES', label: 'Expenses', note: null }
    ])
  })

  it('loads the plan, including the marketing fields the backend prerequisite restored', async () => {
    render(<PlanEditorForm planId='plan-1' />)

    expect(await screen.findByDisplayValue('Standard')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Unlimited properties')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /most popular/i })).toBeChecked()
  })

  it('saves without an acknowledgement first, then navigates away', async () => {
    ;(savePlan as any).mockResolvedValue(detail)

    render(<PlanEditorForm planId='plan-1' />)
    await screen.findByDisplayValue('Standard')
    save()

    await waitFor(() => expect(savePlan).toHaveBeenCalled())
    expect((savePlan as any).mock.calls[0][1].acknowledgement).toBeUndefined()
    await waitFor(() => expect(push).toHaveBeenCalledWith('/admin/subscriptions'))
  })

  it('opens the impact dialog on a 409 rather than saving', async () => {
    ;(savePlan as any).mockRejectedValue(new PlanImpactRequired(impact))

    render(<PlanEditorForm planId='plan-1' />)
    await screen.findByDisplayValue('Standard')
    save()

    expect(await screen.findByRole('dialog')).toHaveTextContent(impact.warnings[0])
    expect(push).not.toHaveBeenCalled()
  })

  it('replays with the hash the server returned when the admin confirms', async () => {
    ;(savePlan as any)
      .mockRejectedValueOnce(new PlanImpactRequired(impact))
      .mockResolvedValueOnce(detail)

    render(<PlanEditorForm planId='plan-1' />)
    await screen.findByDisplayValue('Standard')
    save()

    fireEvent.click(await screen.findByRole('button', { name: /confirm/i }))

    await waitFor(() => expect(savePlan).toHaveBeenCalledTimes(2))
    expect((savePlan as any).mock.calls[1][1].acknowledgement).toEqual({
      impactHash: 'abc123',
      affectedSubscribers: 12
    })
  })

  it('offers reload, not another Confirm, when the replay is itself refused', async () => {
    ;(savePlan as any)
      .mockRejectedValueOnce(new PlanImpactRequired(impact))
      .mockRejectedValueOnce(new PlanImpactRequired({ ...impact, impactHash: 'moved' }))

    render(<PlanEditorForm planId='plan-1' />)
    await screen.findByDisplayValue('Standard')
    save()

    fireEvent.click(await screen.findByRole('button', { name: /confirm/i }))

    // The plan moved underneath. Replaying the same hash cannot succeed.
    expect(await screen.findByRole('button', { name: /reload/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^confirm/i })).not.toBeInTheDocument()
  })

  it('renders a 422 as an error, never as something confirmable', async () => {
    ;(savePlan as any).mockRejectedValue({
      response: { status: 422, data: { message: 'tier table has a gap between 10 and 20' } }
    })

    render(<PlanEditorForm planId='plan-1' />)
    await screen.findByDisplayValue('Standard')
    save()

    // A hard block is not consent-able. Offering Confirm would be a button that cannot work.
    expect(await screen.findByText(/gap between 10 and 20/i)).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

it('duplicating prefills from the source plan but clears its identity', async () => {
    searchParams = new URLSearchParams('from=plan-1')

    render(<PlanEditorForm planId={null} />)

    // The pricing is what is worth copying; the code and name are not, and reusing the
    // code would be refused as a duplicate anyway.
    expect(await screen.findByDisplayValue('30.00')).toBeInTheDocument()
    expect(screen.getByLabelText(/^code/i)).toHaveValue('')
    expect(screen.getByLabelText(/^status/i)).toHaveTextContent('DRAFT')
  })

  it('a duplicate POSTs a new plan rather than overwriting the source', async () => {
    searchParams = new URLSearchParams('from=plan-1')
    ;(savePlan as any).mockResolvedValue(detail)

    render(<PlanEditorForm planId={null} />)
    await screen.findByDisplayValue('30.00')
    save()

    await waitFor(() => expect(savePlan).toHaveBeenCalled())
    expect((savePlan as any).mock.calls[0][0]).toBeNull()
  })

  it('posts a new plan when there is no id', async () => {
    ;(savePlan as any).mockResolvedValue(detail)

    render(<PlanEditorForm planId={null} />)
    save()

    await waitFor(() => expect(savePlan).toHaveBeenCalled())
    expect((savePlan as any).mock.calls[0][0]).toBeNull()
    expect(getPlanDetail).not.toHaveBeenCalled()
  })
})
