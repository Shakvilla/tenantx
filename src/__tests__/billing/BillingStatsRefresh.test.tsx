import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/invoices', () => ({ getInvoiceStats: vi.fn() }))

import BillingStatsCard from '@/views/billing/BillingStatsCard'
import { getInvoiceStats } from '@/lib/api/invoices'
import { BILLING_CHANGED } from '@/lib/api/events'

const stats = (overdue: number) => ({
  total: 3, draft: 0, pending: 0, partial: 1, paid: 1, overdue,
  cancelled: 0, totalAmount: 15600, paidAmount: 14800, outstandingAmount: 800
})

/**
 * The tiles loaded once on mount and never again. A landlord who raised an invoice while the
 * page was open kept seeing the old counts — "Overdue Invoices: 0" for a bill seven weeks past
 * due — and pressing Refresh did not help, because Refresh reloads the table beneath the tiles,
 * not the tiles. Only a full page load corrected it, which is not something anyone thinks to do
 * when the number simply looks wrong.
 */
describe('BillingStatsCard refresh', () => {
  beforeEach(() => {
    vi.resetAllMocks()

    // Re-established here, not relied on from setup.ts. vitest.config sets `mockReset: true`,
    // which wipes the implementation of the shared window.matchMedia mock before every test —
    // it then returns undefined and MUI's useMediaQuery throws on `.matches`. Any test that
    // renders a responsive component hits this.
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => false
      })
    })

    vi.mocked(getInvoiceStats).mockResolvedValue(stats(0) as any)
  })

  it('reloads when billing data changes elsewhere', async () => {
    render(<BillingStatsCard />)
    await waitFor(() => expect(getInvoiceStats).toHaveBeenCalledTimes(1))

    // An invoice is created, or a payment recorded from another screen entirely.
    // 7, not 1 — three tiles legitimately show "1" (partial, paid, overdue), so a distinctive
    // value is the only way to prove the RENDER updated rather than just the fetch firing.
    vi.mocked(getInvoiceStats).mockResolvedValue(stats(7) as any)
    window.dispatchEvent(new CustomEvent(BILLING_CHANGED))

    await waitFor(() => expect(getInvoiceStats).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('7')).toBeInTheDocument()
  })

  it('says the totals may be stale rather than leaving old numbers looking current', async () => {
    vi.mocked(getInvoiceStats).mockRejectedValue(new Error('network'))

    render(<BillingStatsCard />)

    expect(await screen.findByText(/could not be refreshed/i)).toBeInTheDocument()
  })

  it('stops listening once unmounted', async () => {
    const { unmount } = render(<BillingStatsCard />)
    await waitFor(() => expect(getInvoiceStats).toHaveBeenCalledTimes(1))

    unmount()
    window.dispatchEvent(new CustomEvent(BILLING_CHANGED))

    expect(getInvoiceStats).toHaveBeenCalledTimes(1)
  })
})
