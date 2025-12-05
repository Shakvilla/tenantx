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
import type { DateRange, TenantsReportData, ReportSummary } from '@/types/reports/reportTypes'

type Props = {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
}

const TenantsReport = ({ dateRange, onDateRangeChange }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null)

  // Mock data - replace with actual API call
  const reportData: TenantsReportData = useMemo(() => {
    // Generate sample data based on date range
    const trends = []
    const startDate = dateRange.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = dateRange.endDate || new Date()

    // Ensure valid date range
    if (startDate && endDate && startDate <= endDate) {
      const currentDate = new Date(startDate)
      let iterationCount = 0
      const maxIterations = 100 // Prevent infinite loops

      while (currentDate <= endDate && iterationCount < maxIterations) {
        trends.push({
          date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          active: Math.floor(Math.random() * 50) + 400,
          inactive: Math.floor(Math.random() * 20) + 50
        })
        currentDate.setDate(currentDate.getDate() + 7)
        iterationCount++
      }
    }

    // Ensure we have at least some data
    if (trends.length === 0) {
      trends.push({
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        active: 450,
        inactive: 80
      })
    }

    return {
      totalTenants: 530,
      activeTenants: 450,
      inactiveTenants: 80,
      occupancyRate: 85,
      newTenants: 25,
      trends,
      distribution: [
        { label: 'Active', value: 450 },
        { label: 'Inactive', value: 80 }
      ],
      leaseStatus: [
        { label: 'Active Lease', value: 450 },
        { label: 'Expired', value: 50 },
        { label: 'Pending', value: 30 }
      ]
    }
  }, [dateRange])

  const summaries: ReportSummary[] = useMemo(
    () => [
      {
        label: 'Total Tenants',
        value: reportData.totalTenants,
        change: 5.2,
        changeType: 'increase',
        icon: 'ri-group-line',
        color: 'primary'
      },
      {
        label: 'Active Tenants',
        value: reportData.activeTenants,
        change: 3.1,
        changeType: 'increase',
        icon: 'ri-user-check-line',
        color: 'success'
      },
      {
        label: 'Occupancy Rate',
        value: `${reportData.occupancyRate}%`,
        change: 2.5,
        changeType: 'increase',
        icon: 'ri-home-line',
        color: 'info'
      },
      {
        label: 'New Tenants',
        value: reportData.newTenants,
        change: -2.3,
        changeType: 'decrease',
        icon: 'ri-user-add-line',
        color: 'warning'
      }
    ],
    [reportData]
  )

  const tableData = useMemo(
    () => [
      { name: 'Total Tenants', value: reportData.totalTenants },
      { name: 'Active Tenants', value: reportData.activeTenants },
      { name: 'Inactive Tenants', value: reportData.inactiveTenants },
      { name: 'Occupancy Rate', value: `${reportData.occupancyRate}%` },
      { name: 'New Tenants', value: reportData.newTenants }
    ],
    [reportData]
  )

  return (
    <Box ref={contentRef} className='flex flex-col gap-6'>
      <Box className='flex items-center justify-between'>
        <Typography variant='h5'>Tenants Report</Typography>
        <ExportButtons title='Tenants Report' data={tableData} filename='tenants-report' contentRef={contentRef} />
      </Box>

      <DateRangeFilter dateRange={dateRange} onDateRangeChange={onDateRangeChange} />

      <ReportSummaryCards summaries={summaries} />

      <Grid container spacing={4}>
        <Grid size={{ xs: 12, md: 8 }}>
          <LineChart
            title='Tenant Trends'
            data={reportData.trends.map(t => ({ date: t.date, value: t.active }))}
            dataKey='Active Tenants'
            color='primary'
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <DonutChart title='Tenant Distribution' data={reportData.distribution} />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <BarChart title='Lease Status' data={reportData.leaseStatus} color='info' />
        </Grid>
      </Grid>
    </Box>
  )
}

export default TenantsReport

