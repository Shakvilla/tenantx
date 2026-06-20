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
import { getOccupantStats, getOccupants, type OccupantStats, type OccupantRecord } from '@/lib/api/occupants'
import { getPropertyStats } from '@/lib/api/properties'
import { getStoredTenantId } from '@/lib/api/storage'

// Type Imports
import type { DateRange, ReportSummary } from '@/types/reports/reportTypes'

type Props = {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
}

/** Group occupants by month of createdAt, counting new additions per month */
function groupByMonthCount(
  items: OccupantRecord[],
  getDate: (item: OccupantRecord) => string
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

const TenantsReport = ({ dateRange, onDateRangeChange }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null)

  const [occupantStats, setOccupantStats] = useState<OccupantStats | null>(null)
  const [occupants, setOccupants] = useState<OccupantRecord[]>([])
  const [occupancyRate, setOccupancyRate] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tenantId = getStoredTenantId()

    if (!tenantId) {
      setLoading(false)

      return
    }

    setLoading(true)

    Promise.all([
      getOccupantStats(tenantId),
      getOccupants(tenantId, { size: 500 }),
      getPropertyStats(tenantId)
    ])
      .then(([oStats, occupantsRes, propStatsRes]) => {
        setOccupantStats(oStats)
        setOccupants(occupantsRes.data ?? [])
        setOccupancyRate(propStatsRes.data?.occupancyRate ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Filter occupants by dateRange using createdAt
  const filteredOccupants = useMemo(() => {
    return occupants.filter(occ => {
      if (!occ.createdAt) return false
      const d = new Date(occ.createdAt)

      if (isNaN(d.getTime())) return false
      if (dateRange.startDate && d < dateRange.startDate) return false
      if (dateRange.endDate && d > dateRange.endDate) return false

      return true
    })
  }, [occupants, dateRange])

  // New tenants per month trend
  const trends = useMemo(
    () => groupByMonthCount(filteredOccupants, occ => occ.createdAt),
    [filteredOccupants]
  )

  // Distribution donut: Active vs Inactive vs Pending
  const distribution = useMemo(() => {
    if (!occupantStats) return []

    return [
      { label: 'Active', value: occupantStats.active },
      { label: 'Inactive', value: occupantStats.inactive },
      { label: 'Pending', value: occupantStats.pending }
    ].filter(s => s.value > 0)
  }, [occupantStats])

  // Lease status bar chart from occupant stats
  const leaseStatus = useMemo(() => {
    if (!occupantStats) return []

    return [
      { label: 'Active', value: occupantStats.active },
      { label: 'Pending', value: occupantStats.pending },
      { label: 'Inactive', value: occupantStats.inactive }
    ]
  }, [occupantStats])

  const totalTenants = occupantStats?.total ?? 0
  const activeTenants = occupantStats?.active ?? 0

  const summaries: ReportSummary[] = [
    {
      label: 'Total Tenants',
      value: totalTenants,
      icon: 'ri-group-line',
      color: 'primary'
    },
    {
      label: 'Active Tenants',
      value: activeTenants,
      icon: 'ri-user-check-line',
      color: 'success'
    },
    {
      label: 'Occupancy Rate',
      value: `${occupancyRate}%`,
      icon: 'ri-home-line',
      color: 'info'
    },
    {
      label: 'Pending',
      value: occupantStats?.pending ?? 0,
      icon: 'ri-user-add-line',
      color: 'warning'
    }
  ]

  const tableData = [
    { name: 'Total Tenants', value: totalTenants },
    { name: 'Active Tenants', value: activeTenants },
    { name: 'Inactive Tenants', value: occupantStats?.inactive ?? 0 },
    { name: 'Occupancy Rate', value: `${occupancyRate}%` },
    { name: 'Pending', value: occupantStats?.pending ?? 0 }
  ]

  return (
    <Box ref={contentRef} className='flex flex-col gap-6'>
      <Box className='flex items-center justify-between'>
        <Typography variant='h5'>Tenants Report</Typography>
        <ExportButtons title='Tenants Report' data={tableData} filename='tenants-report' contentRef={contentRef} />
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
                title='New Tenants per Month'
                data={trends}
                dataKey='New Tenants'
                color='primary'
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <DonutChart title='Tenant Distribution' data={distribution} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <BarChart title='Status Breakdown' data={leaseStatus} color='info' />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  )
}

export default TenantsReport
