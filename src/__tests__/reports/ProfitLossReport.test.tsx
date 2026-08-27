import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('@/lib/api/profitLoss', () => ({ getProfitLoss: vi.fn() }))

// Export buttons pull in heavy PDF/XLSX deps that aren't relevant here.
vi.mock('@/components/reports/ExportButtons', () => ({ default: () => null }))

import ProfitLossReport from '@/views/reports/ProfitLossReport'
import { getProfitLoss } from '@/lib/api/profitLoss'
import type { DateRange } from '@/types/reports/reportTypes'

const dateRange: DateRange = {
  startDate: new Date('2026-07-01'),
  endDate: new Date('2026-07-31'),
  preset: 'custom',
}

describe('ProfitLossReport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getProfitLoss).mockResolvedValue({
      from: '2026-07-01', to: '2026-07-31',
      totalIncome: 10000, totalExpenses: 2500, netProfit: 7500, profitMargin: 75,
      occupiedUnits: 8, vacantUnits: 2, damagedUnits: 0, totalUnits: 10, occupancyRate: 80,
    })
  })

  it('renders net profit, margin and occupancy rate', async () => {
    render(<ProfitLossReport dateRange={dateRange} onDateRangeChange={() => {}} />)

    expect(await screen.findByText(/profitable this period/i)).toBeTruthy()
    expect(screen.getAllByText(/GHS 7,500\.00/).length).toBeGreaterThan(0)   // net profit
    expect(screen.getAllByText('80%').length).toBeGreaterThan(0)             // occupancy rate
    expect(screen.getAllByText('75%').length).toBeGreaterThan(0)             // margin
  })

  it('passes the date range to the API, with no property filter by default', async () => {
    render(<ProfitLossReport dateRange={dateRange} onDateRangeChange={() => {}} />)

    await screen.findByText(/profitable this period/i)

    // The third argument is the property filter. Undefined means "all properties",
    // which is what an unfiltered report must ask for.
    expect(getProfitLoss).toHaveBeenCalledWith('2026-07-01', '2026-07-31', undefined)
  })

  it('shows a loss state when expenses exceed income', async () => {
    vi.mocked(getProfitLoss).mockResolvedValue({
      from: '2026-07-01', to: '2026-07-31',
      totalIncome: 1000, totalExpenses: 2500, netProfit: -1500, profitMargin: -150,
      occupiedUnits: 1, vacantUnits: 9, damagedUnits: 0, totalUnits: 10, occupancyRate: 10,
    })

    render(<ProfitLossReport dateRange={dateRange} onDateRangeChange={() => {}} />)

    expect(await screen.findByText(/operating at a loss/i)).toBeTruthy()
  })
})
