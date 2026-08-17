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

  it('shows cash/cheque payment options when recording, and removes that control entirely when switching to request payment', async () => {
    render(<AddAdvanceRentDrawer open onClose={() => {}} occupantId='o1' unitId='u1' />)

    // Default mode is "record" — opening the Select must actually list cash/cheque
    // (this opens the menu for real, rather than asserting an option role is
    // absent while no menu is open anywhere, which can never fail).
    await userEvent.click(screen.getByLabelText(/payment method/i))
    expect(screen.getByRole('option', { name: /cash/i })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /cheque/i })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('option', { name: /^cash$/i }))

    // Switching to "request payment" swaps the whole control out — the
    // payment-method field disappears rather than merely losing some options.
    await userEvent.click(screen.getByRole('radio', { name: /request payment/i }))
    expect(screen.queryByLabelText(/payment method/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^network/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/momo number/i)).toBeInTheDocument()

    // ...and switching back to "record" restores it.
    await userEvent.click(screen.getByRole('radio', { name: /already received/i }))
    expect(screen.getByLabelText(/payment method/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/momo number/i)).not.toBeInTheDocument()
  })

  it('asks for the occupant MoMo number when requesting payment through the platform', async () => {
    render(<AddAdvanceRentDrawer open onClose={() => {}} occupantId='o1' unitId='u1' />)
    await userEvent.click(screen.getByRole('radio', { name: /request payment/i }))

    expect(screen.getByLabelText(/momo number/i)).toBeInTheDocument()
  })

  it('labels the gateway network "Telecel" but still sends the backend\'s VODAFONE wire value', async () => {
    const { advanceRentsApi } = await import('@/lib/api/advanceRents')
    render(<AddAdvanceRentDrawer open onClose={() => {}} occupantId='o1' unitId='u1' />)

    await userEvent.click(screen.getByRole('radio', { name: /request payment/i }))
    await userEvent.click(screen.getByLabelText(/^network/i))
    expect(screen.getByRole('option', { name: /telecel/i })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /vodafone/i })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('option', { name: /telecel/i }))

    await userEvent.type(screen.getByLabelText(/monthly rent/i), '1000')
    await userEvent.type(screen.getByLabelText(/momo number/i), '0244778899')
    await userEvent.click(screen.getByRole('button', { name: /request payment/i }))

    await waitFor(() =>
      expect(advanceRentsApi.initiatePayment).toHaveBeenCalledWith(
        expect.objectContaining({ mobileNetwork: 'VODAFONE' })
      )
    )
  })

  it('shows a waiting state making clear the occupant must approve, and that the request is saved as pending (not silently dropped)', async () => {
    const { advanceRentsApi } = await import('@/lib/api/advanceRents')
    render(<AddAdvanceRentDrawer open onClose={() => {}} occupantId='o1' unitId='u1' />)

    await userEvent.click(screen.getByRole('radio', { name: /request payment/i }))
    await userEvent.type(screen.getByLabelText(/monthly rent/i), '1000')
    await userEvent.type(screen.getByLabelText(/momo number/i), '0244778899')
    await userEvent.click(screen.getByRole('button', { name: /request payment/i }))

    await waitFor(() => expect(advanceRentsApi.initiatePayment).toHaveBeenCalled())
    expect(screen.getByText(/approve.*phone/i)).toBeInTheDocument()
    expect(screen.getByText(/saved as pending/i)).toBeInTheDocument()
    expect(screen.queryByText(/nothing is recorded/i)).not.toBeInTheDocument()
  })

  it('rejects more months than the landlord allows', async () => {
    render(<AddAdvanceRentDrawer open onClose={() => {}} occupantId='o1' unitId='u1' />)
    await userEvent.clear(screen.getByLabelText(/months/i))
    await userEvent.type(screen.getByLabelText(/months/i), '24')

    expect(await screen.findByText(/at most 12/i)).toBeInTheDocument()
  })

  it('disables submit and shows an error when Months Covered is cleared, rather than silently allowing monthsCovered: 0', async () => {
    render(<AddAdvanceRentDrawer open onClose={() => {}} occupantId='o1' unitId='u1' />)
    await userEvent.type(screen.getByLabelText(/monthly rent/i), '1000')
    await userEvent.clear(screen.getByLabelText(/months/i))

    expect(await screen.findByText(/enter a valid number of months/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /record advance/i })).toBeDisabled()
  })
})
