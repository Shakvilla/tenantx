import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api/admin-auth-client', () => ({
  adminClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() }
}))

import { adminClient } from '@/lib/api/admin-auth-client'
import { savePlan, getPlanDetail, PlanImpactRequired, type PlanWriteBody } from '@/lib/api/subscription-plans-admin'

const body = {
  code: 'STANDARD',
  name: 'STANDARD',
  displayName: 'Standard',
  description: null,
  status: 'ACTIVE',
  billingMetric: 'UNITS',
  pricingMode: 'GRADUATED',
  currency: 'GHS',
  maxQty: null,
  selfServeMaxQty: null,
  isPublic: true,
  sortOrder: 0,
  tiers: [{ fromQty: 1, toQty: null, flatPrice: '0.00', perUnitPrice: '30.00' }],
  cycles: [{ cycle: 'MONTHLY', discountPct: '0.0000', enabled: true }],
  featureKeys: ['EXPENSES'],
  popular: false,
  marketingFeatures: []
} satisfies PlanWriteBody

describe('savePlan', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws PlanImpactRequired carrying the impact when the server refuses with 409', async () => {
    const impact = {
      warnings: ['pricing changes for 12 active subscriber(s) at their next renewal'],
      affectedSubscribers: 12,
      impactHash: 'abc123'
    }

    ;(adminClient.put as any).mockRejectedValue({ response: { status: 409, data: impact } })

    await expect(savePlan('plan-1', body)).rejects.toBeInstanceOf(PlanImpactRequired)
  })

  it('carries the hash through, so the caller can replay what it was shown', async () => {
    const impact = { warnings: ['x'], affectedSubscribers: 3, impactHash: 'deadbeef' }

    ;(adminClient.put as any).mockRejectedValue({ response: { status: 409, data: impact } })

    await expect(savePlan('plan-1', body)).rejects.toMatchObject({ impact })
  })

  it('does not convert a 422 into an impact — a hard block is not confirmable', async () => {
    ;(adminClient.put as any).mockRejectedValue({
      response: { status: 422, data: { message: 'tier table has a gap' } }
    })

    await expect(savePlan('plan-1', body)).rejects.not.toBeInstanceOf(PlanImpactRequired)
  })

  it('POSTs when the id is null and PUTs when it is not', async () => {
    ;(adminClient.post as any).mockResolvedValue({ data: { id: 'new' } })
    await savePlan(null, body)
    expect(adminClient.post).toHaveBeenCalled()
    expect(adminClient.put).not.toHaveBeenCalled()

    vi.clearAllMocks()
    ;(adminClient.put as any).mockResolvedValue({ data: { id: 'plan-1' } })
    await savePlan('plan-1', body)
    expect(adminClient.put).toHaveBeenCalled()
    expect(adminClient.post).not.toHaveBeenCalled()
  })

  it('sends the acknowledgement when one is supplied', async () => {
    ;(adminClient.put as any).mockResolvedValue({ data: { id: 'plan-1' } })
    await savePlan('plan-1', { ...body, acknowledgement: { impactHash: 'abc123', affectedSubscribers: 12 } })

    expect((adminClient.put as any).mock.calls[0][1]).toMatchObject({
      acknowledgement: { impactHash: 'abc123', affectedSubscribers: 12 }
    })
  })
})

describe('getPlanDetail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns the plan as the server sent it, cycles included', async () => {
    // Cycles are the reason the detail endpoint exists: a PUT built from a response
    // missing them deletes every cycle row and renews annual subscribers at full price.
    const detail = { ...body, id: 'plan-1', subscriberCount: 4 }

    ;(adminClient.get as any).mockResolvedValue({ data: detail })

    await expect(getPlanDetail('plan-1')).resolves.toMatchObject({
      cycles: [{ cycle: 'MONTHLY', discountPct: '0.0000', enabled: true }]
    })
  })
})
