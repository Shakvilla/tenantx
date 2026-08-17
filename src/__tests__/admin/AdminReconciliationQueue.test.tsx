import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/api/admin-auth-client', () => ({
  getTenantReconciliationQueue: vi.fn(),
  resolvePaymentReconciliation: vi.fn()
}))

/**
 * Granting only `platform:wallet:adjust` — the authority the backend actually guards the
 * resolve endpoint with — rather than a blanket `() => true`. Asking for the wrong authority
 * therefore fails every test that expects the action to be offered, instead of passing here
 * and 403-ing in production.
 */
const auth = vi.hoisted(() => ({ granted: true }))

vi.mock('@/contexts/AdminAuthContext', () => ({
  useAdminAuth: () => ({
    hasPermission: (p: string) => auth.granted && p === 'platform:wallet:adjust'
  })
}))

import AdminReconciliationQueue from '@/views/admin/AdminReconciliationQueue'
import {
  getTenantReconciliationQueue,
  resolvePaymentReconciliation,
  type AdminPaymentSummary
} from '@/lib/api/admin-auth-client'

const TENANT = '11111111-1111-1111-1111-111111111111'

/**
 * A payment the gateway took but never confirmed back in time. The months are
 * still owed and still free, so completing the settlement is legitimate — this
 * is the only shape of row on which the credit may be issued.
 */
const creditableRow: AdminPaymentSummary = {
  id: 'pay-creditable',
  invoiceId: null,
  invoiceNumber: null,
  occupantName: 'Ama Mensah',
  amount: 12000,
  currency: 'GHS',
  paymentMethod: 'MOBILE_MONEY',
  status: 'PAID',
  failureReason: null,
  needsReconciliation: true,
  reconciliationReason: 'Gateway never confirmed within the polling window; the advance was written off.',
  reconciliation: {
    outcome: 'CREDITABLE',
    resolvable: true,
    creditable: true,
    explanation:
      'The months this payment bought are still owed and still free. Resolving it will issue the '
      + 'monthly invoices and credit the landlord GHS 12,000.00 as gateway money.'
  },
  flaggedForReconciliationAt: '2026-08-02T09:15:00',
  paymentDate: '2026-08-01',
  createdAt: '2026-08-01T08:00:00'
}

/**
 * The landlord called the request off. Crediting this one would put real
 * withdrawable money in their wallet for an order that no longer exists — the
 * backend refuses it, and the row must not offer the action at all.
 */
const abandonedRow: AdminPaymentSummary = {
  id: 'pay-abandoned',
  invoiceId: null,
  invoiceNumber: null,
  occupantName: 'Kwame Boateng',
  amount: 8400,
  currency: 'GHS',
  paymentMethod: 'MOBILE_MONEY',
  status: 'PAID',
  failureReason: null,
  needsReconciliation: true,
  reconciliationReason: 'Landlord cancelled the advance while the gateway prompt was still live.',
  reconciliation: {
    outcome: 'ADVANCE_ABANDONED',
    resolvable: false,
    creditable: false,
    explanation:
      'The landlord cancelled this advance rent request, so the months were never sold and nothing '
      + 'is owed for them. Refund the occupant in the gateway’s own console instead.'
  },
  flaggedForReconciliationAt: '2026-08-03T11:00:00',
  paymentDate: '2026-08-03',
  createdAt: '2026-08-03T10:30:00'
}

/** A late webhook already booked this one — only the flag is stale. */
const alreadySettledRow: AdminPaymentSummary = {
  id: 'pay-stale-flag',
  invoiceId: null,
  invoiceNumber: null,
  occupantName: 'Efua Sarpong',
  amount: 5000,
  currency: 'GHS',
  paymentMethod: 'MOBILE_MONEY',
  status: 'PAID',
  failureReason: null,
  needsReconciliation: true,
  reconciliationReason: 'Poll gave up before the gateway answered.',
  reconciliation: {
    outcome: 'ALREADY_SETTLED',
    resolvable: true,
    creditable: false,
    explanation:
      'A later gateway confirmation already settled this payment — the invoices and the wallet '
      + 'credit exist. Only the flag is stale; resolving it moves no money.'
  },
  flaggedForReconciliationAt: '2026-08-04T11:00:00',
  paymentDate: '2026-08-04',
  createdAt: '2026-08-04T10:30:00'
}

function page(items: AdminPaymentSummary[]) {
  return { items, total: items.length, page: 0, size: 20 }
}

function rowFor(occupant: string): HTMLElement {
  const cell = screen.getByText(occupant)
  const row = cell.closest('tr')

  if (!row) throw new Error(`No table row rendered for ${occupant}`)

  return row as HTMLElement
}

describe('AdminReconciliationQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.granted = true
  })

  it('offers the settlement action on a creditable row, and spells out the credit before it is made', async () => {
    vi.mocked(getTenantReconciliationQueue).mockResolvedValue(page([creditableRow]))

    render(<AdminReconciliationQueue tenantId={TENANT} />)

    await waitFor(() => expect(screen.getByText('Ama Mensah')).toBeInTheDocument())

    const action = within(rowFor('Ama Mensah')).getByRole('button', { name: /complete settlement/i })

    expect(action).toBeEnabled()

    await userEvent.click(action)

    const dialog = await screen.findByRole('dialog')

    // The operator is told the three things that will happen, including the
    // exact amount that becomes withdrawable, before any request is sent.
    expect(within(dialog).getByText(/activate the advance/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/issue its monthly invoices as PAID/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/GHS 12,000\.00/)).toBeInTheDocument()
    expect(within(dialog).getByText(/withdrawable gateway money/i)).toBeInTheDocument()
    expect(within(dialog).getByRole('button', { name: /confirm & credit/i })).toBeInTheDocument()
  })

  it('does not offer a resolve action on a landlord-abandoned row, and says why on the row itself', async () => {
    vi.mocked(getTenantReconciliationQueue).mockResolvedValue(page([creditableRow, abandonedRow]))

    render(<AdminReconciliationQueue tenantId={TENANT} />)

    await waitFor(() => expect(screen.getByText('Kwame Boateng')).toBeInTheDocument())

    // Control: the same query does find the action on the creditable row, so the
    // absence asserted below is a real absence and not a query that never matches.
    expect(
      within(rowFor('Ama Mensah')).getByRole('button', { name: /complete settlement|clear stale flag/i })
    ).toBeInTheDocument()

    const abandoned = rowFor('Kwame Boateng')

    expect(
      within(abandoned).queryByRole('button', { name: /complete settlement|clear stale flag|resolve/i })
    ).toBeNull()

    // And the row carries the reason, so an operator does not have to click to learn it.
    expect(within(abandoned).getByText(/do not credit/i)).toBeInTheDocument()
    expect(within(abandoned).getByText(/the landlord cancelled this advance rent request/i)).toBeInTheDocument()
  })

  it('offers the stale-flag row a clearing action whose wording promises no money movement', async () => {
    vi.mocked(getTenantReconciliationQueue).mockResolvedValue(page([alreadySettledRow]))

    render(<AdminReconciliationQueue tenantId={TENANT} />)

    await waitFor(() => expect(screen.getByText('Efua Sarpong')).toBeInTheDocument())

    await userEvent.click(within(rowFor('Efua Sarpong')).getByRole('button', { name: /clear stale flag/i }))

    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).getByText(/moves no money/i)).toBeInTheDocument()

    // It must not reuse the crediting confirmation — that button exists on the
    // creditable path (asserted in the first test) and must not appear here.
    expect(within(dialog).queryByRole('button', { name: /confirm & credit/i })).toBeNull()
    expect(within(dialog).getByRole('button', { name: /confirm & clear flag/i })).toBeInTheDocument()
  })

  it("surfaces the server's own refusal text instead of a generic failure message", async () => {
    vi.mocked(getTenantReconciliationQueue).mockResolvedValue(page([creditableRow]))
    vi.mocked(resolvePaymentReconciliation).mockRejectedValue({
      response: {
        status: 409,
        data: {
          message:
            'Another advance now covers the months this payment was for. Refund this collection to '
            + 'the occupant in the gateway’s own console.'
        }
      }
    })

    render(<AdminReconciliationQueue tenantId={TENANT} />)

    await waitFor(() => expect(screen.getByText('Ama Mensah')).toBeInTheDocument())
    await userEvent.click(within(rowFor('Ama Mensah')).getByRole('button', { name: /complete settlement/i }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: /confirm & credit/i })
    )

    await waitFor(() =>
      expect(screen.getByText(/another advance now covers the months this payment was for/i)).toBeInTheDocument()
    )
  })

  it('reloads the queue after a successful resolve so the settled row disappears', async () => {
    vi.mocked(getTenantReconciliationQueue)
      .mockResolvedValueOnce(page([creditableRow]))
      .mockResolvedValue(page([]))

    vi.mocked(resolvePaymentReconciliation).mockResolvedValue({
      paymentId: creditableRow.id,
      outcome: 'SETTLED',
      walletCredited: true,
      invoicesForAdvance: 12,
      amount: 12000,
      resolvedBy: 'admin-uuid',
      resolvedAt: '2026-08-17T10:00:00',
      detail: 'Settlement completed.'
    })

    render(<AdminReconciliationQueue tenantId={TENANT} />)

    await waitFor(() => expect(screen.getByText('Ama Mensah')).toBeInTheDocument())
    expect(getTenantReconciliationQueue).toHaveBeenCalledTimes(1)

    await userEvent.click(within(rowFor('Ama Mensah')).getByRole('button', { name: /complete settlement/i }))
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: /confirm & credit/i })
    )

    await waitFor(() => expect(resolvePaymentReconciliation).toHaveBeenCalledWith(TENANT, creditableRow.id))
    await waitFor(() => expect(getTenantReconciliationQueue).toHaveBeenCalledTimes(2))

    // The refetched (now empty) page is what the operator ends up looking at.
    await waitFor(() => expect(screen.queryByText('Ama Mensah')).toBeNull())
    expect(screen.getByText(/no stranded payments/i)).toBeInTheDocument()

    // And the count actually issued comes from the server's answer, not a guess.
    expect(screen.getByText(/12 monthly invoices/i)).toBeInTheDocument()
  })

  it('carries the amount at stake and the reason it was flagged on the row itself', async () => {
    vi.mocked(getTenantReconciliationQueue).mockResolvedValue(page([creditableRow]))

    render(<AdminReconciliationQueue tenantId={TENANT} />)

    await waitFor(() => expect(screen.getByText('Ama Mensah')).toBeInTheDocument())

    const row = rowFor('Ama Mensah')

    // Exact-string matcher on purpose: the assessment sentence also mentions the figure, and
    // this must assert the row's own amount cell rather than accidentally matching that.
    expect(within(row).getByText('GHS 12,000.00')).toBeInTheDocument()
    expect(within(row).getByText(/gateway never confirmed within the polling window/i)).toBeInTheDocument()

    // The queue is scoped to the tenant being viewed, not some other id in scope.
    expect(getTenantReconciliationQueue).toHaveBeenCalledWith(TENANT, expect.any(Number), expect.any(Number))
  })

  it('withholds the settlement action from an operator lacking wallet-adjust rights, but still shows the row', async () => {
    vi.mocked(getTenantReconciliationQueue).mockResolvedValue(page([creditableRow]))

    // Control: with the authority granted, this exact query finds the action — so its absence
    // below is caused by the missing right and not by a query that never matches.
    render(<AdminReconciliationQueue tenantId={TENANT} />)
    await waitFor(() => expect(screen.getByText('Ama Mensah')).toBeInTheDocument())
    expect(within(rowFor('Ama Mensah')).getByRole('button', { name: /complete settlement/i })).toBeInTheDocument()

    cleanup()
    auth.granted = false

    render(<AdminReconciliationQueue tenantId={TENANT} />)
    await waitFor(() => expect(screen.getByText('Ama Mensah')).toBeInTheDocument())

    const row = rowFor('Ama Mensah')

    expect(within(row).queryByRole('button', { name: /complete settlement|clear stale flag|resolve/i })).toBeNull()

    // Read-only triage is still useful, so the row and its assessment stay visible.
    expect(within(row).getByText(/still owed and still free/i)).toBeInTheDocument()
    expect(within(row).getByText(/wallet-adjust/i)).toBeInTheDocument()
  })

  it('sends only one credit request when the confirm button is clicked twice', async () => {
    vi.mocked(getTenantReconciliationQueue).mockResolvedValue(page([creditableRow]))

    let release: (() => void) | undefined

    vi.mocked(resolvePaymentReconciliation).mockImplementation(
      () =>
        new Promise(resolve => {
          release = () =>
            resolve({
              paymentId: creditableRow.id,
              outcome: 'SETTLED',
              walletCredited: true,
              invoicesForAdvance: 12,
              amount: 12000,
              resolvedBy: 'admin-uuid',
              resolvedAt: '2026-08-17T10:00:00',
              detail: 'Settlement completed.'
            })
        })
    )

    render(<AdminReconciliationQueue tenantId={TENANT} />)

    await waitFor(() => expect(screen.getByText('Ama Mensah')).toBeInTheDocument())
    await userEvent.click(within(rowFor('Ama Mensah')).getByRole('button', { name: /complete settlement/i }))

    const confirm = within(await screen.findByRole('dialog')).getByRole('button', { name: /confirm & credit/i })

    await userEvent.click(confirm)
    await userEvent.click(confirm)

    expect(resolvePaymentReconciliation).toHaveBeenCalledTimes(1)

    release?.()
  })
})
