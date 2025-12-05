// Documentation: /docs/reports/reports-flow.md

'use client'

// React Imports
import { useState, useRef, useMemo } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Component Imports
import DateRangeFilter from '@/components/reports/DateRangeFilter'
import ReportSummaryCards from '@/components/reports/ReportSummaryCards'
import ExportButtons from '@/components/reports/ExportButtons'
import { LineChart, BarChart, DonutChart } from '@/components/reports/ReportCharts'

// Type Imports
import type { DateRange, ExpensesReportData, ReportSummary } from '@/types/reports/reportTypes'

type Props = {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
}

const ExpensesReport = ({ dateRange, onDateRangeChange }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null)

  // Mock data - replace with actual API call
  const reportData: ExpensesReportData = useMemo(() => {
    const trends = []
    const startDate = dateRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = dateRange.endDate || new Date()

    // Ensure valid date range
    if (startDate && endDate && startDate <= endDate) {
      const currentDate = new Date(startDate)
      let iterationCount = 0
      const maxIterations = 100

      while (currentDate <= endDate && iterationCount < maxIterations) {
        trends.push({
          date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          amount: Math.floor(Math.random() * 5000) + 2000
        })
        currentDate.setDate(currentDate.getDate() + 7)
        iterationCount++
      }
    }

    // Ensure we have at least some data
    if (trends.length === 0) {
      trends.push({
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: 5000
      })
    }

    return {
      totalExpenses: 125000,
      paidExpenses: 98000,
      unpaidExpenses: 27000,
      averageExpense: 2500,
      trends,
      byCategory: [
        { label: 'Maintenance', value: 45000 },
        { label: 'Utilities', value: 35000 },
        { label: 'Insurance', value: 25000 },
        { label: 'Other', value: 20000 }
      ],
      monthlyComparison: [
        { month: 'Jan', amount: 12000 },
        { month: 'Feb', amount: 15000 },
        { month: 'Mar', amount: 18000 },
        { month: 'Apr', amount: 14000 },
        { month: 'May', amount: 16000 },
        { month: 'Jun', amount: 20000 }
      ]
    }
  }, [dateRange])

  const summaries: ReportSummary[] = useMemo(
    () => [
      {
        label: 'Total Expenses',
        value: `₵${reportData.totalExpenses.toLocaleString()}`,
        change: 8.5,
        changeType: 'increase',
        icon: 'ri-money-dollar-circle-line',
        color: 'error'
      },
      {
        label: 'Paid Expenses',
        value: `₵${reportData.paidExpenses.toLocaleString()}`,
        change: 5.2,
        changeType: 'increase',
        icon: 'ri-checkbox-circle-line',
        color: 'success'
      },
      {
        label: 'Unpaid Expenses',
        value: `₵${reportData.unpaidExpenses.toLocaleString()}`,
        change: -3.1,
        changeType: 'decrease',
        icon: 'ri-close-circle-line',
        color: 'warning'
      },
      {
        label: 'Average Expense',
        value: `₵${reportData.averageExpense.toLocaleString()}`,
        change: 2.3,
        changeType: 'increase',
        icon: 'ri-bar-chart-line',
        color: 'info'
      }
    ],
    [reportData]
  )

  const tableData = useMemo(
    () => [
      { name: 'Total Expenses', value: `₵${reportData.totalExpenses.toLocaleString()}` },
      { name: 'Paid Expenses', value: `₵${reportData.paidExpenses.toLocaleString()}` },
      { name: 'Unpaid Expenses', value: `₵${reportData.unpaidExpenses.toLocaleString()}` },
      { name: 'Average Expense', value: `₵${reportData.averageExpense.toLocaleString()}` }
    ],
    [reportData]
  )

  return (
    <Box ref={contentRef} className='flex flex-col gap-6'>
      <Box className='flex items-center justify-between'>
        <Typography variant='h5'>Expenses Report</Typography>
        <ExportButtons title='Expenses Report' data={tableData} filename='expenses-report' contentRef={contentRef} />
      </Box>

      <DateRangeFilter dateRange={dateRange} onDateRangeChange={onDateRangeChange} />

      <ReportSummaryCards summaries={summaries} />

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <LineChart
            title='Expense Trends'
            data={reportData.trends}
            dataKey='Amount'
            color='error'
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DonutChart title='Expenses by Category' data={reportData.byCategory} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <BarChart title='Monthly Comparison' data={reportData.monthlyComparison} color='error' />
        </Grid>
      </Grid>
    </Box>
  )
}

export default ExpensesReport

