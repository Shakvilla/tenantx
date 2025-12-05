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
import type { DateRange, MaintenanceReportData, ReportSummary } from '@/types/reports/reportTypes'

type Props = {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
}

const MaintenanceReport = ({ dateRange, onDateRangeChange }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null)

  // Mock data - replace with actual API call
  const reportData: MaintenanceReportData = useMemo(() => {
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
          count: Math.floor(Math.random() * 20) + 10
        })
        currentDate.setDate(currentDate.getDate() + 7)
        iterationCount++
      }
    }

    // Ensure we have at least some data
    if (trends.length === 0) {
      trends.push({
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: 15
      })
    }

    return {
      totalRequests: 245,
      completedRequests: 180,
      pendingRequests: 45,
      inProgressRequests: 20,
      trends,
      statusDistribution: [
        { label: 'Completed', value: 180 },
        { label: 'Pending', value: 45 },
        { label: 'In Progress', value: 20 }
      ],
      byProperty: [
        { label: 'Property A', value: 85 },
        { label: 'Property B', value: 70 },
        { label: 'Property C', value: 55 },
        { label: 'Property D', value: 35 }
      ]
    }
  }, [dateRange])

  const summaries: ReportSummary[] = useMemo(
    () => [
      {
        label: 'Total Requests',
        value: reportData.totalRequests,
        change: 5.8,
        changeType: 'increase',
        icon: 'ri-tools-line',
        color: 'primary'
      },
      {
        label: 'Completed',
        value: reportData.completedRequests,
        change: 8.2,
        changeType: 'increase',
        icon: 'ri-checkbox-circle-line',
        color: 'success'
      },
      {
        label: 'Pending',
        value: reportData.pendingRequests,
        change: -3.5,
        changeType: 'decrease',
        icon: 'ri-time-line',
        color: 'warning'
      },
      {
        label: 'In Progress',
        value: reportData.inProgressRequests,
        change: 2.1,
        changeType: 'increase',
        icon: 'ri-loader-line',
        color: 'info'
      }
    ],
    [reportData]
  )

  const tableData = useMemo(
    () => [
      { name: 'Total Requests', value: reportData.totalRequests },
      { name: 'Completed', value: reportData.completedRequests },
      { name: 'Pending', value: reportData.pendingRequests },
      { name: 'In Progress', value: reportData.inProgressRequests }
    ],
    [reportData]
  )

  return (
    <Box ref={contentRef} className='flex flex-col gap-6'>
      <Box className='flex items-center justify-between'>
        <Typography variant='h5'>Maintenance Report</Typography>
        <ExportButtons title='Maintenance Report' data={tableData} filename='maintenance-report' contentRef={contentRef} />
      </Box>

      <DateRangeFilter dateRange={dateRange} onDateRangeChange={onDateRangeChange} />

      <ReportSummaryCards summaries={summaries} />

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <LineChart
            title='Request Trends'
            data={reportData.trends.map(t => ({ date: t.date, value: t.count }))}
            dataKey='Requests'
            color='primary'
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DonutChart title='Status Distribution' data={reportData.statusDistribution} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <BarChart title='Requests by Property' data={reportData.byProperty} color='info' />
        </Grid>
      </Grid>
    </Box>
  )
}

export default MaintenanceReport

