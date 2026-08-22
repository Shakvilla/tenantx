import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/payments', () => ({
  paymentsApi: { getNeedingAttention: vi.fn() }
}))

import PaymentsNeedingAttention from '@/views/billing/PaymentsNeedingAttention'
import { paymentsApi } from '@/lib/api/payments'
import type { PaymentResponse } from '@/types/payment'

const flagged = (over: Partial<PaymentResponse> = {}): PaymentResponse => ({
  id: 'pay-1',
  invoiceId: 'inv-1',
  invoiceNumber: 'INV-2026-001',
  occupantName: 'A. Mensah',
  amount: 2400,
  currency: 'GHS',
  paymentMethod: 'MOBILE_MONEY',
  // PAID on purpose: a flagged payment normally looks settled everywhere else, which is
  // the entire reason this panel exists.
  status: 'PAID',
  needsReconciliation: true,
  reconciliationReason: 'Gateway never confirmed within the polling window.',
  createdAt: '2026-08-01T10:00:00Z',
  ...over
})

const mocked = vi.mocked(paymentsApi.getNeedingAttention)

describe('PaymentsNeedingAttention', () => {
  beforeEach(() => {
    cleanup()
    vi.resetAllMocks()
  })

  it('renders nothing when no payment is flagged — the normal case', async () => {
    mocked.mockResolvedValue([])

    const { container } = render(<PaymentsNeedingAttention />)

    await waitFor(() => expect(mocked).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('surfaces a flagged payment with its amount, payer and reason', async () => {
    mocked.mockResolvedValue([flagged()])

    render(<PaymentsNeedingAttention />)

    expect(await screen.findByText('1 payment needs attention')).toBeInTheDocument()
    expect(screen.getByText(/A\. Mensah/)).toBeInTheDocument()
    expect(screen.getByText(/INV-2026-001/)).toBeInTheDocument()
    expect(
      screen.getByText('Gateway never confirmed within the polling window.')
    ).toBeInTheDocument()
    expect(screen.getByText(/2,400\.00/)).toBeInTheDocument()
  })

  it('pluralises rather than saying "1 payments"', async () => {
    mocked.mockResolvedValue([flagged(), flagged({ id: 'pay-2' })])

    render(<PaymentsNeedingAttention />)

    expect(await screen.findByText('2 payments need attention')).toBeInTheDocument()
  })

  /**
   * The panel offers no resolve control: completing one of these credits the landlord's
   * wallet and stays a platform-admin action. If a button ever appears here it would 403,
   * and worse, it would tell the landlord the money is theirs to recover unaided.
   */
  it('offers no action — it points at support instead', async () => {
    mocked.mockResolvedValue([flagged()])

    render(<PaymentsNeedingAttention />)

    await screen.findByText('1 payment needs attention')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText(/Contact TenantX support/)).toBeInTheDocument()
  })

  /**
   * A failed check must not look like "all clear". Rendering nothing here would make a
   * broken endpoint indistinguishable from a clean tenant — the exact invisibility the
   * reconciliation flag exists to prevent.
   */
  it('says the check did not run rather than silently rendering nothing', async () => {
    mocked.mockRejectedValue(new Error('boom'))

    render(<PaymentsNeedingAttention />)

    expect(
      await screen.findByText(/Could not check for payments needing attention/)
    ).toBeInTheDocument()
  })
})
