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
import { getExpenses, getExpenseConfigs, type Expense, type ExpenseConfig } from '@/lib/api/expenses'

// Type Imports
import type { DateRange, ReportSummary } from '@/types/reports/reportTypes'

// Util Imports
import { toApiDateParams } from '@/utils/reports/dateUtils'

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

  const [expenses, setExpenses] = useState<Expense[]>([])
  const [configs, setConfigs] = useState<ExpenseConfig[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const { startDate, endDate } = toApiDateParams(dateRange, 'date')

    // Both the summary tiles and the charts are derived from the same date-filtered
    // expense list, so they stay consistent when the range changes (the /stats endpoint
    // is all-time only, which previously made the tiles ignore the filter).
    Promise.all([getExpenses({ startDate, endDate }), getExpenseConfigs(false)])
      .then(([exp, cfg]) => {
        setExpenses(exp)
        setConfigs(cfg)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [dateRange])

  // Expense trend: amount per month
  const trends = useMemo(
    () => groupByMonth(expenses, exp => exp.date, exp => exp.amount),
    [expenses]
  )

  // Monthly comparison bar chart (same data as trends — bar view). BarChart expects
  // { label, value }, while groupByMonth (shared with the line chart) returns
  // { date, value }; map the field across rather than renaming groupByMonth's output,
  // since LineChart's own prop type is `{ date, value }[]` and already matches it.
  const monthlyComparison = useMemo(() => trends.map(t => ({ label: t.date, value: t.value })), [trends])

  // By category: group by the expense item's configured category (Administrative /
  // Occupancy / Maintenance / Utilities / Other), not the item name.
  const byCategory = useMemo(() => {
    const categoryByConfigId: Record<string, string> = {}
    configs.forEach(c => { if (c.category) categoryByConfigId[c.id] = c.category })

    const map: Record<string, number> = {}

    expenses.forEach(exp => {
      const category = (exp.expenseConfigId && categoryByConfigId[exp.expenseConfigId]) || 'Other'
      const label = category.charAt(0) + category.slice(1).toLowerCase()

      map[label] = (map[label] || 0) + exp.amount
    })

    return Object.entries(map)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [expenses, configs])

  // Summary tiles are computed from the same date-filtered list as the charts.
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses])
  const paidExpenses = useMemo(
    () => expenses.filter(e => e.status === 'PAID').reduce((s, e) => s + e.amount, 0),
    [expenses]
  )
  const unpaidExpenses = useMemo(
    () => expenses.filter(e => e.status === 'UNPAID').reduce((s, e) => s + e.amount, 0),
    [expenses]
  )
  const averageExpense = expenses.length > 0 ? Math.round(totalExpenses / expenses.length) : 0

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
