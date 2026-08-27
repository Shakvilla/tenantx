import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'

vi.mock('@/lib/api/advanceRents', () => ({
  advanceRentsApi: {
    getByOccupant: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
    cancelPending: vi.fn(),
    getLimits: vi.fn(),
    initiatePayment: vi.fn()
  }
}))

import AdvanceRentSection from '@/views/tenants/view/AdvanceRentSection'
import { advanceRentsApi } from '@/lib/api/advanceRents'
import type { AdvanceRentResponse, AdvanceRentLimits, AdvancePaymentInitiated } from '@/types/advanceRent'

const pendingRecord: AdvanceRentResponse = {
  id: 'ar-1',
  occupantId: 'o1',
  occupantName: 'Jane Doe',
  unitId: 'u1',
  unitNo: 'A1',
  propertyId: 'p1',
  propertyName: 'Sunset Apartments',

  totalAmount: 12000,
  monthlyRent: 1000,
  monthsCovered: 12,
  invoiceCount: 0,
  remainingBalance: 0,
  currency: 'GHS',

  periodStart: '2026-08-16',
  periodEnd: '2027-08-16',

  monthsRemaining: 12,
  percentageUsed: 0,

  status: 'PENDING',
  paymentMethod: null,
  paymentReference: null,
  notes: null,

  createdAt: '2026-08-16T00:00:00Z',
  updatedAt: null
}

const cancelledRecord: AdvanceRentResponse = {
  ...pendingRecord,
  id: 'ar-2',
  status: 'CANCELLED',
  remainingBalance: 0
}

const failedRecord: AdvanceRentResponse = {
  ...pendingRecord,
  id: 'ar-3',
  status: 'FAILED',
  remainingBalance: 0
}

const activeRecord: AdvanceRentResponse = {
  ...pendingRecord,
  id: 'ar-4',
  status: 'ACTIVE',
  invoiceCount: 12,
  remainingBalance: 12000,
  monthsRemaining: 10,
  percentageUsed: 15
}

const limitsFixture: AdvanceRentLimits = { minMonths: 1, maxMonths: 12, occupantSelfServiceEnabled: false }
const initiatedFixture: AdvancePaymentInitiated = { advanceRentId: 'ar-9', paymentTransactionId: 'p1', status: 'PENDING' }

describe('AdvanceRentSection — PENDING status rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(advanceRentsApi.getByOccupant).mockResolvedValue([pendingRecord, cancelledRecord])
  })

  it('renders a PENDING advance with its own distinct status, not the CANCELLED fallback', async () => {
    render(<AdvanceRentSection occupantId='o1' unitId='u1' />)

    // The PENDING row must read as "waiting on the occupant", not the raw
    // enum text and not silently reuse CANCELLED's "default" grey chip.
    await waitFor(() => expect(screen.getByText(/waiting on occupant/i)).toBeInTheDocument())

    // The zero remaining balance for a PENDING record must not read as an
    // advance that has been used up — nothing has been collected yet. (The
    // CANCELLED fixture below legitimately still shows "% of period elapsed",
    // so this only asserts PENDING's own row took the different branch.)
    expect(screen.getByText(/nothing collected yet/i)).toBeInTheDocument()

    // The other record keeps its own plain label, proving PENDING isn't
    // just relabeling everything.
    expect(screen.getByText('CANCELLED')).toBeInTheDocument()
  })

  it('renders a FAILED advance with its own banner and label, distinct from EXPIRED', async () => {
    vi.mocked(advanceRentsApi.getByOccupant).mockResolvedValue([failedRecord])
    render(<AdvanceRentSection occupantId='o1' unitId='u1' />)

    await waitFor(() => expect(screen.getByText(/not collected/i)).toBeInTheDocument())
    expect(screen.getByText(/gateway payment did not go through/i)).toBeInTheDocument()
    expect(screen.getByText(/nothing collected yet/i)).toBeInTheDocument()

    // FAILED is a dead end, same as CANCELLED — no cancel/abandon action of any kind.
    expect(screen.queryByRole('button', { name: /cancel|abandon/i })).not.toBeInTheDocument()
  })

  it('refetches the list once a gateway payment has been started, so the new PENDING row appears without reopening the drawer', async () => {
    render(<AdvanceRentSection occupantId='o1' unitId='u1' />)
    await waitFor(() => expect(advanceRentsApi.getByOccupant).toHaveBeenCalledTimes(1))

    vi.mocked(advanceRentsApi.getLimits).mockResolvedValue(limitsFixture)
    vi.mocked(advanceRentsApi.initiatePayment).mockResolvedValue(initiatedFixture)

    const { default: userEvent } = await import('@testing-library/user-event')
    await userEvent.click(screen.getAllByRole('button', { name: /record advance/i })[0])
    await userEvent.click(screen.getByRole('radio', { name: /request payment/i }))
    await userEvent.type(screen.getByLabelText(/monthly rent/i), '1000')
    await userEvent.type(screen.getByLabelText(/momo number/i), '0244778899')
    await userEvent.click(screen.getByRole('button', { name: /request payment/i }))

    // Not an exact count: the row is PENDING, so the 5-second poll is armed and can land
    // a third fetch on a loaded machine. What matters is that the list refetched at all,
    // without the drawer being reopened.
    await waitFor(() => expect(vi.mocked(advanceRentsApi.getByOccupant).mock.calls.length).toBeGreaterThanOrEqual(2))
  })
})

describe('AdvanceRentSection — abandoning a PENDING request', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('offers an "abandon" action on a PENDING row, worded distinctly from cancelling an active advance, and refreshes after it succeeds', async () => {
    vi.mocked(advanceRentsApi.getByOccupant).mockResolvedValue([pendingRecord])
    vi.mocked(advanceRentsApi.cancelPending).mockResolvedValue(undefined)
    // happy-dom doesn't implement window.confirm, so there's nothing for
    // vi.spyOn to wrap — assign a fresh mock directly instead.
    const confirmSpy = vi.fn().mockReturnValue(true)
    window.confirm = confirmSpy

    render(<AdvanceRentSection occupantId='o1' unitId='u1' occupantName='Jane Doe' />)
    await waitFor(() => expect(screen.getByText(/waiting on occupant/i)).toBeInTheDocument())

    const abandonButton = screen.getByRole('button', { name: /abandon/i })
    await (await import('@testing-library/user-event')).default.click(abandonButton)

    // The confirmation wording must not read like the "Cancel advance record"
    // dialog for an ACTIVE advance — that one talks about voiding paid
    // invoices and clawing back a wallet credit, which is wrong here: nothing
    // was ever collected for a PENDING request.
    expect(confirmSpy).toHaveBeenCalledWith(expect.stringMatching(/hasn.t (approved|paid)|not yet (approved|paid)|abandon/i))
    expect(confirmSpy).toHaveBeenCalledWith(expect.not.stringMatching(/void .*invoice|wallet credit/i))

    await waitFor(() => expect(advanceRentsApi.cancelPending).toHaveBeenCalledWith('ar-1'))
    await waitFor(() => expect(advanceRentsApi.getByOccupant).toHaveBeenCalledTimes(2))
  })

  it('does not call cancelPending if the landlord declines the confirmation', async () => {
    vi.mocked(advanceRentsApi.getByOccupant).mockResolvedValue([pendingRecord])
    window.confirm = vi.fn().mockReturnValue(false)

    render(<AdvanceRentSection occupantId='o1' unitId='u1' />)
    await waitFor(() => expect(screen.getByText(/waiting on occupant/i)).toBeInTheDocument())

    await (await import('@testing-library/user-event')).default.click(screen.getByRole('button', { name: /abandon/i }))

    expect(advanceRentsApi.cancelPending).not.toHaveBeenCalled()
  })

  it('does not offer the abandon action on ACTIVE records — those use the existing cancel action', async () => {
    vi.mocked(advanceRentsApi.getByOccupant).mockResolvedValue([activeRecord])
    render(<AdvanceRentSection occupantId='o1' unitId='u1' />)

    await waitFor(() => expect(screen.getByText(/₵12000.00 advance/i)).toBeInTheDocument())
    expect(screen.queryByRole('button', { name: /abandon/i })).not.toBeInTheDocument()
    expect(document.querySelector('[aria-label="Cancel advance record"]')).toBeInTheDocument()
  })
})

describe('AdvanceRentSection — polling while PENDING', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('polls getByOccupant on an interval while any row is PENDING, and stops once nothing is pending', async () => {
    vi.useFakeTimers()
    vi.mocked(advanceRentsApi.getByOccupant).mockResolvedValue([pendingRecord])

    render(<AdvanceRentSection occupantId='o1' unitId='u1' />)

    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(advanceRentsApi.getByOccupant).toHaveBeenCalledTimes(1)

    // Still PENDING — the next tick should trigger another fetch.
    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
    expect(advanceRentsApi.getByOccupant).toHaveBeenCalledTimes(2)

    // The gateway just confirmed the payment — the polled response now has
    // no PENDING rows left, so polling should stop making further calls.
    vi.mocked(advanceRentsApi.getByOccupant).mockResolvedValue([activeRecord])
    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
    expect(advanceRentsApi.getByOccupant).toHaveBeenCalledTimes(3)

    await act(async () => { await vi.advanceTimersByTimeAsync(20000) })
    expect(advanceRentsApi.getByOccupant).toHaveBeenCalledTimes(3)
  })

  it('does not poll at all when there are no PENDING rows to begin with', async () => {
    vi.useFakeTimers()
    vi.mocked(advanceRentsApi.getByOccupant).mockResolvedValue([activeRecord])

    render(<AdvanceRentSection occupantId='o1' unitId='u1' />)

    await act(async () => { await vi.advanceTimersByTimeAsync(0) })
    expect(advanceRentsApi.getByOccupant).toHaveBeenCalledTimes(1)

    await act(async () => { await vi.advanceTimersByTimeAsync(20000) })
    expect(advanceRentsApi.getByOccupant).toHaveBeenCalledTimes(1)
  })
})
