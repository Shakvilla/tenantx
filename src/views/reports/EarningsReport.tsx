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
import type { DateRange, EarningsReportData, ReportSummary } from '@/types/reports/reportTypes'

type Props = {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
}

const EarningsReport = ({ dateRange, onDateRangeChange }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null)

  // Mock data - replace with actual API call
  const reportData: EarningsReportData = useMemo(() => {
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
          amount: Math.floor(Math.random() * 10000) + 5000
        })
        currentDate.setDate(currentDate.getDate() + 7)
        iterationCount++
      }
    }

    // Ensure we have at least some data
    if (trends.length === 0) {
      trends.push({
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: 10000
      })
    }

    return {
      totalRevenue: 450000,
      paidRevenue: 380000,
      pendingRevenue: 70000,
      averageRevenue: 8500,
      trends,
      byProperty: [
        { label: 'Property A', value: 150000 },
        { label: 'Property B', value: 120000 },
        { label: 'Property C', value: 100000 },
        { label: 'Property D', value: 80000 }
      ],
      paymentStatus: [
        { label: 'Paid', value: 380000 },
        { label: 'Pending', value: 50000 },
        { label: 'Overdue', value: 20000 }
      ]
    }
  }, [dateRange])

  const summaries: ReportSummary[] = useMemo(
    () => [
      {
        label: 'Total Revenue',
        value: `₵${reportData.totalRevenue.toLocaleString()}`,
        change: 12.5,
        changeType: 'increase',
        icon: 'ri-money-dollar-circle-line',
        color: 'success'
      },
      {
        label: 'Paid Revenue',
        value: `₵${reportData.paidRevenue.toLocaleString()}`,
        change: 8.3,
        changeType: 'increase',
        icon: 'ri-checkbox-circle-line',
        color: 'success'
      },
      {
        label: 'Pending Revenue',
        value: `₵${reportData.pendingRevenue.toLocaleString()}`,
        change: -5.2,
        changeType: 'decrease',
        icon: 'ri-time-line',
        color: 'warning'
      },
      {
        label: 'Average Revenue',
        value: `₵${reportData.averageRevenue.toLocaleString()}`,
        change: 4.1,
        changeType: 'increase',
        icon: 'ri-bar-chart-line',
        color: 'info'
      }
    ],
    [reportData]
  )

  const tableData = useMemo(
    () => [
      { name: 'Total Revenue', value: `₵${reportData.totalRevenue.toLocaleString()}` },
      { name: 'Paid Revenue', value: `₵${reportData.paidRevenue.toLocaleString()}` },
      { name: 'Pending Revenue', value: `₵${reportData.pendingRevenue.toLocaleString()}` },
      { name: 'Average Revenue', value: `₵${reportData.averageRevenue.toLocaleString()}` }
    ],
    [reportData]
  )

  return (
    <Box ref={contentRef} className='flex flex-col gap-6'>
      <Box className='flex items-center justify-between'>
        <Typography variant='h5'>Earnings Report</Typography>
        <ExportButtons title='Earnings Report' data={tableData} filename='earnings-report' contentRef={contentRef} />
      </Box>

      <DateRangeFilter dateRange={dateRange} onDateRangeChange={onDateRangeChange} />

      <ReportSummaryCards summaries={summaries} />

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <LineChart
            title='Revenue Trends'
            data={reportData.trends}
            dataKey='Revenue'
            color='success'
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DonutChart title='Payment Status' data={reportData.paymentStatus} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <BarChart title='Revenue by Property' data={reportData.byProperty} color='success' />
        </Grid>
      </Grid>
    </Box>
  )
}

export default EarningsReport

