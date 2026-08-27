import { render, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Export buttons pull in heavy PDF/XLSX deps, and ApexCharts does not render under happy-dom —
// neither is relevant to which date range the data calls are given.
vi.mock('@/components/reports/ExportButtons', () => ({ default: () => null }))
vi.mock('react-apexcharts', () => ({ default: () => null }))

vi.mock('@/lib/api/invoices', () => ({
  getInvoiceStats: vi.fn(),
  getInvoices: vi.fn()
}))

import EarningsReport from '@/views/reports/EarningsReport'
import { getInvoiceStats, getInvoices } from '@/lib/api/invoices'

/**
 * The tiles and the charts must read the same period.
 *
 * They used not to: the tiles called an unfiltered stats endpoint while the charts called a
 * filtered list. Setting the report to January — months before the account existed — left the
 * four headline figures showing current numbers above a chart that correctly said "No data
 * available". A landlord comparing this August with last August got the same four numbers
 * whatever he picked.
 */
describe('EarningsReport date filtering', () => {
  // Implementations are set HERE, not in the vi.mock factory: vitest.config sets
  // `mockReset: true`, which wipes factory-declared implementations before every test. Left in
  // the factory, getInvoices returns undefined and the component throws on `items.forEach`.
  beforeEach(() => {
    vi.mocked(getInvoiceStats).mockResolvedValue({
      total: 0, draft: 0, pending: 0, partial: 0, paid: 0, overdue: 0, cancelled: 0,
      totalAmount: 0, paidAmount: 0, outstandingAmount: 0
    } as any)
    vi.mocked(getInvoices).mockResolvedValue([])
  })

  it('asks for the tiles and the charts over the identical range', async () => {
    render(
      <EarningsReport
        dateRange={{
          preset: 'custom',
          startDate: new Date('2026-01-01T00:00:00Z'),
          endDate: new Date('2026-01-31T00:00:00Z')
        }}
        onDateRangeChange={vi.fn()}
      />
    )

    await waitFor(() => expect(getInvoiceStats).toHaveBeenCalled())

    const statsArgs = vi.mocked(getInvoiceStats).mock.calls[0][0]
    const listArgs = vi.mocked(getInvoices).mock.calls[0][0]

    expect(statsArgs).toMatchObject({ startDate: '2026-01-01', endDate: '2026-01-31' })
    expect(statsArgs?.startDate).toBe(listArgs?.startDate)
    expect(statsArgs?.endDate).toBe(listArgs?.endDate)
  })
})
