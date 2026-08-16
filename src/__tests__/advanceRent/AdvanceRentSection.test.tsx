import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/advanceRents', () => ({
  advanceRentsApi: {
    getByOccupant: vi.fn(),
    create: vi.fn(),
    cancel: vi.fn(),
    getLimits: vi.fn(),
    initiatePayment: vi.fn()
  }
}))

import AdvanceRentSection from '@/views/tenants/view/AdvanceRentSection'
import { advanceRentsApi } from '@/lib/api/advanceRents'

const pendingRecord = {
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

const cancelledRecord = {
  ...pendingRecord,
  id: 'ar-2',
  status: 'CANCELLED',
  remainingBalance: 0
}

describe('AdvanceRentSection — PENDING status rendering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(advanceRentsApi.getByOccupant).mockResolvedValue([pendingRecord, cancelledRecord] as never)
  })

  it('renders a PENDING advance with its own distinct status, not the CANCELLED fallback', async () => {
    render(<AdvanceRentSection occupantId='o1' unitId='u1' />)

    // The PENDING row must read as "waiting on the occupant", not the raw
    // enum text and not silently reuse CANCELLED's "default" grey chip.
    await waitFor(() => expect(screen.getByText(/waiting on occupant/i)).toBeInTheDocument())
    expect(screen.getByText(/waiting on occupant/i)).not.toEqual(screen.getByText('CANCELLED'))

    // The zero remaining balance for a PENDING record must not read as an
    // advance that has been used up — nothing has been collected yet. (The
    // CANCELLED fixture below legitimately still shows "% of period elapsed",
    // so this only asserts PENDING's own row took the different branch.)
    expect(screen.getByText(/nothing collected yet/i)).toBeInTheDocument()

    // The other record keeps its own plain label, proving PENDING isn't
    // just relabeling everything.
    expect(screen.getByText('CANCELLED')).toBeInTheDocument()
  })

  it('refetches the list once a gateway payment has been started, so the new PENDING row appears without reopening the drawer', async () => {
    render(<AdvanceRentSection occupantId='o1' unitId='u1' />)
    await waitFor(() => expect(advanceRentsApi.getByOccupant).toHaveBeenCalledTimes(1))

    vi.mocked(advanceRentsApi.getLimits).mockResolvedValue({ minMonths: 1, maxMonths: 12, occupantSelfServiceEnabled: false } as never)
    vi.mocked(advanceRentsApi.initiatePayment).mockResolvedValue({ advanceRentId: 'ar-3', paymentTransactionId: 'p1', status: 'PENDING' } as never)

    const { default: userEvent } = await import('@testing-library/user-event')
    await userEvent.click(screen.getAllByRole('button', { name: /record advance/i })[0])
    await userEvent.click(screen.getByRole('radio', { name: /request payment/i }))
    await userEvent.type(screen.getByLabelText(/monthly rent/i), '1000')
    await userEvent.type(screen.getByLabelText(/momo number/i), '0244778899')
    await userEvent.click(screen.getByRole('button', { name: /request payment/i }))

    await waitFor(() => expect(advanceRentsApi.getByOccupant).toHaveBeenCalledTimes(2))
  })
})
