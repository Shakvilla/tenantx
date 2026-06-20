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
import {
  getMaintenanceRequestStats,
  getMaintenanceRequests,
  type MaintenanceRequestStats,
  type MaintenanceRequest
} from '@/lib/api/maintenance'

// Type Imports
import type { DateRange, ReportSummary } from '@/types/reports/reportTypes'

type Props = {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
}

/** Group items by month, counting occurrences. Returns sorted [{date, value}] */
function groupByMonthCount<T>(
  items: T[],
  getDate: (item: T) => string
): { date: string; value: number }[] {
  const map: Record<string, { display: string; value: number }> = {}

  items.forEach(item => {
    const d = new Date(getDate(item))

    if (isNaN(d.getTime())) return
    const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const display = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })

    if (!map[sortKey]) map[sortKey] = { display, value: 0 }
    map[sortKey].value += 1
  })

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { display, value }]) => ({ date: display, value }))
}

/** Capitalise first letter of each word, replace underscores with spaces */
function formatLabel(key: string): string {
  return key
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

const MaintenanceReport = ({ dateRange, onDateRangeChange }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null)

  const [stats, setStats] = useState<MaintenanceRequestStats | null>(null)
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getMaintenanceRequestStats(),
      getMaintenanceRequests({ size: 500 }).then(res => res.data)
    ])
      .then(([s, reqs]) => {
        setStats(s)
        setRequests(reqs)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Filter by dateRange using createdAt
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      if (!req.createdAt) return false
      const d = new Date(req.createdAt)

      if (isNaN(d.getTime())) return false
      if (dateRange.startDate && d < dateRange.startDate) return false
      if (dateRange.endDate && d > dateRange.endDate) return false

      return true
    })
  }, [requests, dateRange])

  // Trend: requests per month
  const trends = useMemo(
    () => groupByMonthCount(filteredRequests, req => req.createdAt),
    [filteredRequests]
  )

  // Status distribution donut — from stats (all-time byStatus map)
  const statusDistribution = useMemo(() => {
    if (!stats?.byStatus) return []

    return Object.entries(stats.byStatus)
      .map(([key, value]) => ({ label: formatLabel(key), value }))
      .filter(s => s.value > 0)
  }, [stats])

  // Priority bar chart — from stats byPriority map
  const byPriority = useMemo(() => {
    if (!stats?.byPriority) return []

    return Object.entries(stats.byPriority)
      .map(([key, value]) => ({ label: formatLabel(key), value }))
      .filter(s => s.value > 0)
  }, [stats])

  const totalRequests = stats?.total ?? 0
  const completedRequests = stats?.byStatus?.['COMPLETED'] ?? stats?.completedThisMonth ?? 0
  const openRequests = stats?.openRequests ?? 0
  const inProgressRequests = stats?.byStatus?.['IN_PROGRESS'] ?? 0

  const summaries: ReportSummary[] = [
    {
      label: 'Total Requests',
      value: totalRequests,
      icon: 'ri-tools-line',
      color: 'primary'
    },
    {
      label: 'Open Requests',
      value: openRequests,
      icon: 'ri-time-line',
      color: 'warning'
    },
    {
      label: 'Completed (Month)',
      value: stats?.completedThisMonth ?? 0,
      icon: 'ri-checkbox-circle-line',
      color: 'success'
    },
    {
      label: 'In Progress',
      value: inProgressRequests,
      icon: 'ri-loader-line',
      color: 'info'
    }
  ]

  const tableData = [
    { name: 'Total Requests', value: totalRequests },
    { name: 'Open Requests', value: openRequests },
    { name: 'Completed This Month', value: stats?.completedThisMonth ?? 0 },
    { name: 'In Progress', value: inProgressRequests }
  ]

  return (
    <Box ref={contentRef} className='flex flex-col gap-6'>
      <Box className='flex items-center justify-between'>
        <Typography variant='h5'>Maintenance Report</Typography>
        <ExportButtons title='Maintenance Report' data={tableData} filename='maintenance-report' contentRef={contentRef} />
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
                title='Request Trends'
                data={trends}
                dataKey='Requests'
                color='primary'
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <DonutChart title='Status Distribution' data={statusDistribution} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <BarChart title='Requests by Priority' data={byPriority} color='info' />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}

export default MaintenanceReport
