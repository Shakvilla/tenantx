import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('@/lib/api/payments', () => ({
  paymentsApi: { getByInvoice: vi.fn() },
  openPaymentReceipt: vi.fn()
}))

import InvoicePaymentHistory from '@/views/billing/view/InvoicePaymentHistory'
import { paymentsApi, openPaymentReceipt } from '@/lib/api/payments'

describe('InvoicePaymentHistory receipt action', () => {
  beforeEach(() => {
    vi.mocked(paymentsApi.getByInvoice).mockResolvedValue([
      { id: 'p1', paymentMethod: 'MOBILE_MONEY', amount: 1500, status: 'PAID', paymentDate: '2026-07-12', createdAt: '2026-07-12', mobileNetwork: 'MTN', walletNumber: '0244', notes: null },
      { id: 'p2', paymentMethod: 'CASH', amount: 200, status: 'PENDING', paymentDate: null, createdAt: '2026-07-12', notes: null }
    ] as never)
    vi.mocked(openPaymentReceipt).mockResolvedValue(undefined)
  })

  it('shows a Receipt button only for completed payments and opens the receipt', async () => {
    render(<InvoicePaymentHistory invoiceId='inv-1' />)

    const buttons = await screen.findAllByRole('button', { name: /receipt/i })
    expect(buttons).toHaveLength(1) // only the PAID row

    fireEvent.click(buttons[0])
    await waitFor(() => expect(openPaymentReceipt).toHaveBeenCalledWith('p1'))
  })
})
