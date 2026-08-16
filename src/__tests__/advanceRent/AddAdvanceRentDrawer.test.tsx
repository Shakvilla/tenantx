import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AddAdvanceRentDrawer from '@/views/tenants/view/AddAdvanceRentDrawer'

vi.mock('@/lib/api/advanceRents', () => ({
  advanceRentsApi: {
    getLimits: vi.fn(),
    create: vi.fn(),
    initiatePayment: vi.fn()
  }
}))

describe('AddAdvanceRentDrawer', () => {
  // vitest.config.ts sets `mockReset: true`, which wipes mock implementations
  // (not just call history) before every test — so resolved values set inside
  // the vi.mock factory above are gone by the time the first test runs. Set
  // them here instead, matching the pattern used elsewhere in this repo (see
  // AddInvoiceDialog.prefill.test.tsx).
  beforeEach(async () => {
    vi.clearAllMocks()
    const { advanceRentsApi } = await import('@/lib/api/advanceRents')
    vi.mocked(advanceRentsApi.getLimits).mockResolvedValue({ minMonths: 1, maxMonths: 12, occupantSelfServiceEnabled: false })
    vi.mocked(advanceRentsApi.initiatePayment).mockResolvedValue({ advanceRentId: 'a1', paymentTransactionId: 'p1', status: 'PENDING' })
  })

  it('offers cash and cheque when recording a payment already received', async () => {
    render(<AddAdvanceRentDrawer open onClose={() => {}} occupantId='o1' unitId='u1' />)
    await userEvent.click(screen.getByRole('radio', { name: /already received/i }))

    await userEvent.click(screen.getByLabelText(/payment method/i))
    expect(screen.getByRole('option', { name: /cash/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /cheque/i })).toBeInTheDocument()
  })

  it('asks for the occupant MoMo number when requesting payment through the platform', async () => {
    render(<AddAdvanceRentDrawer open onClose={() => {}} occupantId='o1' unitId='u1' />)
    await userEvent.click(screen.getByRole('radio', { name: /request payment/i }))

    expect(screen.getByLabelText(/momo number/i)).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /cash/i })).not.toBeInTheDocument()
  })

  it('shows a waiting state making clear the occupant must approve', async () => {
    const { advanceRentsApi } = await import('@/lib/api/advanceRents')
    render(<AddAdvanceRentDrawer open onClose={() => {}} occupantId='o1' unitId='u1' />)

    await userEvent.click(screen.getByRole('radio', { name: /request payment/i }))
    await userEvent.type(screen.getByLabelText(/monthly rent/i), '1000')
    await userEvent.type(screen.getByLabelText(/momo number/i), '0244778899')
    await userEvent.click(screen.getByRole('button', { name: /request payment/i }))

    await waitFor(() => expect(advanceRentsApi.initiatePayment).toHaveBeenCalled())
    expect(screen.getByText(/approve.*phone/i)).toBeInTheDocument()
  })

  it('rejects more months than the landlord allows', async () => {
    render(<AddAdvanceRentDrawer open onClose={() => {}} occupantId='o1' unitId='u1' />)
    await userEvent.clear(screen.getByLabelText(/months/i))
    await userEvent.type(screen.getByLabelText(/months/i), '24')

    expect(await screen.findByText(/at most 12/i)).toBeInTheDocument()
  })
})
