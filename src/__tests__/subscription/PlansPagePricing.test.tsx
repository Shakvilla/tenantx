import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

/**
 * The plans page must state what the landlord will actually be charged.
 *
 * It used to headline "GH₵ 30.00 / unit / month" beside "Units used 9 / ∞" and
 * stop there. Multiply those and you get ₵270; the invoice says ₵120, because
 * the first five units are free. Nothing on the screen bridged the two, so the
 * landlord's own arithmetic disagreed with his bill and he had no way to find
 * out which was right.
 */

vi.mock('@/lib/api/subscription-client', () => ({
  getMySubscription: vi.fn(),
  getMyFeatures: vi.fn(),
  getAvailablePlans: vi.fn(),
  initiateUpgrade: vi.fn(),
  scheduleDowngrade: vi.fn(),
  cancelSubscription: vi.fn(),
  getMyInvoices: vi.fn(),
  retryMyInvoice: vi.fn(),
  verifySubscriptionPayment: vi.fn(),
  payInvoiceFromWallet: vi.fn(),
  getManualPaymentDetails: vi.fn()
}))

// The page also reads the wallet balance to decide whether "pay from wallet" is
// offered. Not what this file is about, but leaving it live makes the run try to
// reach a backend and fill the output with connection errors.
vi.mock('@/lib/api/wallet', () => ({
  walletApi: { getWallet: vi.fn(async () => ({ balance: 0, availableBalance: 0, currency: 'GHS' })) }
}))

const subscription = {
  plan: 'PRO',
  displayName: 'Pro Plan',
  status: 'ACTIVE',
  unitCount: 9,
  unitCap: null,
  pricePerUnit: 30,
  transactionFeePct: 0.01,
  currentPeriodStart: '2026-08-23',
  currentPeriodEnd: '2026-09-23',
  pendingDowngradePlan: null,
  cancelledAt: null,
  features: {}
}

vi.mock('@/contexts/SubscriptionContext', () => ({
  useSubscription: () => ({
    subscription,
    features: {},
    isLoading: false,
    refresh: vi.fn(),
    hasFeature: () => true,
    isAtUnitCap: false
  })
}))

import SubscriptionPlansListTable from '@/views/subscription-plans/SubscriptionPlansListTable'
import { getAvailablePlans, getMyInvoices } from '@/lib/api/subscription-client'

const plan = (name: string, displayName: string, pricePerUnit: number, freeUnitCap: number | null) => ({
  id: name.toLowerCase(),
  name,
  displayName,
  pricePerUnit,
  freeUnitCap,
  transactionFeePct: 0.01,
  active: true,
  features: {},
  annualDiscountPct: null
})

describe('Subscription plans — what the landlord will pay', () => {
  beforeEach(() => {
    // mockReset in vitest.config wipes factory implementations; set them here.
    vi.mocked(getAvailablePlans).mockResolvedValue([
      plan('FREE', 'Free Plan', 0, 5),
      plan('BASIC', 'Basic Plan', 15, null),
      plan('PRO', 'Pro Plan', 30, null)
    ] as any)
    vi.mocked(getMyInvoices).mockResolvedValue([] as any)
  })

  it('states the real monthly charge, with the subtraction shown', async () => {
    render(<SubscriptionPlansListTable />)

    // 9 units on Pro: five free, four billed at ₵30 — ₵120, not ₵270.
    expect(await screen.findByText(/9 units, first 5 free: 4 × GH₵ 30\.00 = GH₵ 120\.00 a month/)).toBeTruthy()
  })

  it('prices each plan for the units this landlord actually has', async () => {
    render(<SubscriptionPlansListTable />)

    // Basic at ₵15 for the same four billable units.
    await waitFor(() => expect(screen.getByText(/You would pay GH₵ 60\.00 a month/)).toBeTruthy())
    expect(screen.getByText(/You would pay GH₵ 120\.00 a month/)).toBeTruthy()
  })

  it('never shows a figure that is just rate × unit count', async () => {
    render(<SubscriptionPlansListTable />)

    await screen.findAllByText(/GH₵ 120\.00 a month/)

    // ₵270 is the number the landlord worked out for himself and the number the
    // page must never agree with.
    expect(screen.queryByText(/GH₵ 270\.00/)).toBeNull()
  })
})
