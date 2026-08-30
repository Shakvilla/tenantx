import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

vi.mock('@/lib/api/subscription-plans-admin', async () => {
  const actual = await vi.importActual<any>('@/lib/api/subscription-plans-admin')

  return {
    ...actual,
    getAdminPlans: vi.fn(),
    getPlanDetail: vi.fn(),
    savePlan: vi.fn(),
    deletePlan: vi.fn()
  }
})

import { getAdminPlans, getPlanDetail, savePlan, deletePlan } from '@/lib/api/subscription-plans-admin'
import PlanList from '@/views/admin/plans/PlanList'

const unused = {
  id: 'plan-unused', code: 'SCRATCH', name: 'SCRATCH', displayName: 'Scratch Plan',
  status: 'DRAFT' as const, pricePerUnit: '0', entryPrice: '0', subscriberCount: 0
}

const inUse = { ...unused, id: 'plan-live', displayName: 'Pro Plan', status: 'ACTIVE' as const, subscriberCount: 12 }

describe('PlanList actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(getAdminPlans as any).mockResolvedValue([unused, inUse])
  })

  it('deletes a plan nobody has ever been on', async () => {
    ;(deletePlan as any).mockResolvedValue(undefined)

    render(<PlanList />)
    fireEvent.click(await screen.findByLabelText(/delete scratch plan/i))
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => expect(deletePlan).toHaveBeenCalledWith('plan-unused'))
  })

  it('warns before deleting a plan with history, because the server will refuse it', async () => {
    render(<PlanList />)
    fireEvent.click(await screen.findByLabelText(/delete pro plan/i))

    // The invoices of everyone who was ever on it are only readable while the plan exists.
    expect(screen.getByText(/12 subscriber\(s\) have been on this plan/i)).toBeInTheDocument()
    expect(screen.getByText(/archive it instead/i)).toBeInTheDocument()
  })

  it("shows the server's own refusal rather than a generic error", async () => {
    ;(deletePlan as any).mockRejectedValue({
      response: { status: 422, data: { message: 'cannot delete the plan new signups are placed on; make another plan the signup default first' } }
    })

    render(<PlanList />)
    fireEvent.click(await screen.findByLabelText(/delete scratch plan/i))
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))

    // That message tells the admin what to do next; "something went wrong" would not.
    expect(await screen.findByText(/make another plan the signup default first/i)).toBeInTheDocument()
  })

  it('archives through an ordinary save, so guard rails and audit still apply', async () => {
    ;(getPlanDetail as any).mockResolvedValue({
      ...unused, tiers: [], cycles: [], featureKeys: [], marketingFeatures: []
    })
    ;(savePlan as any).mockResolvedValue({})

    render(<PlanList />)
    fireEvent.click(await screen.findByLabelText(/archive scratch plan/i))
    fireEvent.click(screen.getByRole('button', { name: /^archive$/i }))

    await waitFor(() => expect(savePlan).toHaveBeenCalled())

    const [planId, body] = (savePlan as any).mock.calls[0]

    expect(planId).toBe('plan-unused')
    expect(body.status).toBe('ARCHIVED')
    // Loaded from the detail first: a partial body would delete tiers, cycles and feature flags.
    expect(body).toHaveProperty('cycles')
    expect(body).toHaveProperty('tiers')
  })

  it('offers no archive action on an already-archived plan', async () => {
    ;(getAdminPlans as any).mockResolvedValue([{ ...unused, status: 'ARCHIVED' as const }])

    render(<PlanList />)
    await screen.findByLabelText(/delete scratch plan/i)

    expect(screen.queryByLabelText(/archive scratch plan/i)).not.toBeInTheDocument()
  })
})
