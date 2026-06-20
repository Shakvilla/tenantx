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
import { getExpenseStats, getExpenses, type ExpenseStats, type Expense } from '@/lib/api/expenses'

// Type Imports
import type { DateRange, ReportSummary } from '@/types/reports/reportTypes'

type Props = {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
}

/** Group items by month, summing a numeric field. Returns sorted [{date, value}] */
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

const ExpensesReport = ({ dateRange, onDateRangeChange }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null)

  const [stats, setStats] = useState<ExpenseStats | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getExpenseStats(), getExpenses()])
      .then(([s, exp]) => {
        setStats(s)
        setExpenses(exp)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Filter by dateRange
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      if (!exp.date) return false
      const d = new Date(exp.date)

      if (isNaN(d.getTime())) return false
      if (dateRange.startDate && d < dateRange.startDate) return false
      if (dateRange.endDate && d > dateRange.endDate) return false

      return true
    })
  }, [expenses, dateRange])

  // Expense trend: amount per month
  const trends = useMemo(
    () => groupByMonth(filteredExpenses, exp => exp.date, exp => exp.amount),
    [filteredExpenses]
  )

  // Monthly comparison bar chart (same data as trends — bar view)
  const monthlyComparison = trends

  // By category: group by expense item name
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {}

    filteredExpenses.forEach(exp => {
      const name = exp.item || 'Other'

      map[name] = (map[name] || 0) + exp.amount
    })

    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [filteredExpenses])

  const totalExpenses = stats?.totalAmount ?? 0
  const paidExpenses = stats?.paidAmount ?? 0
  const unpaidExpenses = stats?.unpaidAmount ?? 0
  const averageExpense = stats && stats.total > 0 ? Math.round(totalExpenses / stats.total) : 0

  const summaries: ReportSummary[] = [
    {
      label: 'Total Expenses',
      value: `₵${totalExpenses.toLocaleString()}`,
      icon: 'ri-money-dollar-circle-line',
      color: 'error'
    },
    {
      label: 'Paid Expenses',
      value: `₵${paidExpenses.toLocaleString()}`,
      icon: 'ri-checkbox-circle-line',
      color: 'success'
    },
    {
      label: 'Unpaid Expenses',
      value: `₵${unpaidExpenses.toLocaleString()}`,
      icon: 'ri-close-circle-line',
      color: 'warning'
    },
    {
      label: 'Avg per Expense',
      value: `₵${averageExpense.toLocaleString()}`,
      icon: 'ri-bar-chart-line',
      color: 'info'
    }
  ]

  const tableData = [
    { name: 'Total Expenses', value: `₵${totalExpenses.toLocaleString()}` },
    { name: 'Paid Expenses', value: `₵${paidExpenses.toLocaleString()}` },
    { name: 'Unpaid Expenses', value: `₵${unpaidExpenses.toLocaleString()}` },
    { name: 'Avg per Expense', value: `₵${averageExpense.toLocaleString()}` }
  ]

  return (
    <Box ref={contentRef} className='flex flex-col gap-6'>
      <Box className='flex items-center justify-between'>
        <Typography variant='h5'>Expenses Report</Typography>
        <ExportButtons title='Expenses Report' data={tableData} filename='expenses-report' contentRef={contentRef} />
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
                title='Expense Trends'
                data={trends}
                dataKey='Amount'
                color='error'
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <DonutChart title='Expenses by Type' data={byCategory} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <BarChart title='Monthly Comparison' data={monthlyComparison} color='error' />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}

export default ExpensesReport
