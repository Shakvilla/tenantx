// Documentation: /docs/reports/reports-flow.md

'use client'

// React Imports
import { useState, useEffect, useMemo, useRef } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

// Component Imports
import DateRangeFilter from '@/components/reports/DateRangeFilter'
import ReportSummaryCards from '@/components/reports/ReportSummaryCards'
import ExportButtons from '@/components/reports/ExportButtons'
import { LineChart, BarChart, DonutChart } from '@/components/reports/ReportCharts'

// API Imports
import { getInvoiceStats, getInvoices, type InvoiceStats, type Invoice } from '@/lib/api/invoices'

// Type Imports
import type { DateRange, ReportSummary } from '@/types/reports/reportTypes'

type Props = {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
}

/** Group a list of items by month, summing a numeric field. Returns sorted [{date, value}] */
function groupByMonth<T>(
  items: T[],
  getDate: (item: T) => string,
  getValue: (item: T) => number
): { date: string; value: number }[] {
  const map: Record<string, { display: string; value: number }> = {}

  items.forEach(item => {
    const d = new Date(getDate(item))

    if (isNaN(d.getTime())) return
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const display = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

    if (!map[sortKey]) map[sortKey] = { display, value: 0 }
    map[sortKey].value += getValue(item)
  })

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { display, value }]) => ({ date: display, value }))
}

const EarningsReport = ({ dateRange, onDateRangeChange }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null)

  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getInvoiceStats(), getInvoices()])
      .then(([s, inv]) => {
        setStats(s)
        setInvoices(inv)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Filter invoices by dateRange
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (!inv.issuedDate) return false
      const d = new Date(inv.issuedDate)

      if (isNaN(d.getTime())) return false
      if (dateRange.startDate && d < dateRange.startDate) return false
      if (dateRange.endDate && d > dateRange.endDate) return false

      return true
    })
  }, [invoices, dateRange])

  // Revenue trend: amount per month
  const trends = useMemo(
    () => groupByMonth(filteredInvoices, inv => inv.issuedDate, inv => inv.amount),
    [filteredInvoices]
  )

  // Revenue by property
  const byProperty = useMemo(() => {
    const map: Record<string, number> = {}

    filteredInvoices.forEach(inv => {
      const name = inv.propertyName || 'Unknown'

      map[name] = (map[name] || 0) + inv.amount
    })

    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [filteredInvoices])

  // Payment status donut — from stats (all-time counts)
  const paymentStatus = useMemo(() => {
    if (!stats) return []

    return [
      { label: 'Paid', value: stats.paid },
      { label: 'Pending', value: stats.pending },
      { label: 'Overdue', value: stats.overdue },
      { label: 'Draft', value: stats.draft },
      { label: 'Cancelled', value: stats.cancelled }
    ].filter(s => s.value > 0)
  }, [stats])

  const totalRevenue = stats?.totalAmount ?? 0
  const paidRevenue = stats?.paidAmount ?? 0
  const pendingRevenue = stats?.outstandingAmount ?? 0
  const averageRevenue = stats && stats.total > 0 ? Math.round(totalRevenue / stats.total) : 0

  const summaries: ReportSummary[] = [
    {
      label: 'Total Revenue',
      value: `₵${totalRevenue.toLocaleString()}`,
      icon: 'ri-money-dollar-circle-line',
      color: 'success'
    },
    {
      label: 'Paid Revenue',
      value: `₵${paidRevenue.toLocaleString()}`,
      icon: 'ri-checkbox-circle-line',
      color: 'success'
    },
    {
      label: 'Outstanding',
      value: `₵${pendingRevenue.toLocaleString()}`,
      icon: 'ri-time-line',
      color: 'warning'
    },
    {
      label: 'Avg per Invoice',
      value: `₵${averageRevenue.toLocaleString()}`,
      icon: 'ri-bar-chart-line',
      color: 'info'
    }
  ]

  const tableData = [
    { name: 'Total Revenue', value: `₵${totalRevenue.toLocaleString()}` },
    { name: 'Paid Revenue', value: `₵${paidRevenue.toLocaleString()}` },
    { name: 'Outstanding', value: `₵${pendingRevenue.toLocaleString()}` },
    { name: 'Avg per Invoice', value: `₵${averageRevenue.toLocaleString()}` }
  ]

  return (
    <Box ref={contentRef} className='flex flex-col gap-6'>
      <Box className='flex items-center justify-between'>
        <Typography variant='h5'>Earnings Report</Typography>
        <ExportButtons title='Earnings Report' data={tableData} filename='earnings-report' contentRef={contentRef} />
      </Box>

      <DateRangeFilter dateRange={dateRange} onDateRangeChange={onDateRangeChange} />

      {loading ? (
        <Box className='flex justify-center py-10'>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <ReportSummaryCards summaries={summaries} />

          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              <LineChart
                title='Revenue Trends'
                data={trends}
                dataKey='Revenue'
                color='success'
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <DonutChart title='Payment Status' data={paymentStatus} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <BarChart title='Revenue by Property' data={byProperty} color='success' />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}

export default EarningsReport
