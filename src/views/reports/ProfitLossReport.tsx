'use client'

// React Imports
import { useState, useEffect, useRef } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import Grid from '@mui/material/Grid2'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

// Component Imports
import DateRangeFilter from '@/components/reports/DateRangeFilter'
import ReportSummaryCards from '@/components/reports/ReportSummaryCards'
import ExportButtons from '@/components/reports/ExportButtons'

// API / Types
import { getProfitLoss } from '@/lib/api/profitLoss'
import { getProperties } from '@/lib/api/properties'
import { getStoredTenantId } from '@/lib/api/storage'
import type { ProfitLossResponse } from '@/types/profitLoss'
import type { DateRange, ReportSummary } from '@/types/reports/reportTypes'

// Utils
import { toApiDateParams } from '@/utils/reports/dateUtils'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'

type Props = {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
}

const money = (n: number) =>
  `GHS ${Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const ProfitLossReport = ({ dateRange, onDateRangeChange }: Props) => {
  const contentRef = useRef<HTMLDivElement>(null)
  const [data, setData]       = useState<ProfitLossResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  // '' means the whole portfolio.
  const [propertyId, setPropertyId] = useState('')
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    const tenantId = getStoredTenantId()

    if (!tenantId) return

    getProperties(tenantId, { size: 100 })
      .then(res => setProperties(((res as any)?.data ?? []).map((p: any) => ({ id: p.id, name: p.name }))))
      .catch(() => setProperties([]))
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    const { startDate, endDate } = toApiDateParams(dateRange, 'date')

    getProfitLoss(startDate, endDate, propertyId || undefined)
      .then(setData)
      .catch((err: any) => setError(err?.message ?? 'Failed to load profit & loss report'))
      .finally(() => setLoading(false))
  }, [dateRange, propertyId])

  const profitable = (data?.netProfit ?? 0) >= 0

  const summaries: ReportSummary[] = data
    ? [
        { label: 'Total Income',   value: money(data.totalIncome),   icon: 'ri-arrow-down-circle-line', color: 'success' },
        { label: 'Total Expenses', value: money(data.totalExpenses), icon: 'ri-arrow-up-circle-line',   color: 'error' },
        { label: 'Net Profit',     value: money(data.netProfit),     icon: 'ri-line-chart-line',        color: profitable ? 'success' : 'error' },
        { label: 'Profit Margin',  value: `${data.profitMargin ?? 0}%`, icon: 'ri-percent-line',        color: profitable ? 'info' : 'warning' },
      ]
    : []

  const tableData = data
    ? [
        { Metric: 'Total Income',   Value: money(data.totalIncome) },
        { Metric: 'Total Expenses', Value: money(data.totalExpenses) },
        { Metric: 'Net Profit',     Value: money(data.netProfit) },
        { Metric: 'Profit Margin',  Value: `${data.profitMargin}%` },
        { Metric: 'Occupancy Rate', Value: `${data.occupancyRate}%` },
      ]
    : []

  return (
    <Box ref={contentRef} className='flex flex-col gap-6'>
      <Box className='flex items-center justify-between'>
        <Typography variant='h5'>Profit &amp; Loss</Typography>
        <ExportButtons title='Profit and Loss Report' data={tableData} filename='profit-loss-report' contentRef={contentRef} />
      </Box>

      <DateRangeFilter dateRange={dateRange} onDateRangeChange={onDateRangeChange} />

      {/*
        Per-property P&L. The GRA report two tabs away already broke down by property; this one
        added Adenta and East Legon together and offered no way to separate them, so a landlord
        could not tell which property was carrying the other.
      */}
      {properties.length > 1 && (
        <TextField
          select
          size='small'
          label='Property'
          value={propertyId}
          onChange={e => setPropertyId(e.target.value)}
          sx={{ maxWidth: 280 }}
        >
          <MenuItem value=''>All properties</MenuItem>
          {properties.map(p => (
            <MenuItem key={p.id} value={p.id}>
              {p.name}
            </MenuItem>
          ))}
        </TextField>
      )}

      {error && <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box className='flex justify-center py-10'>
          <CircularProgress />
        </Box>
      ) : data ? (
        <>
          <ReportSummaryCards summaries={summaries} />

          <Grid container spacing={4}>
            {/* ── Occupancy ─────────────────────────────────────────── */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent className='flex flex-col gap-4'>
                  <Box className='flex items-center justify-between'>
                    <Typography variant='h6'>Occupancy Rate</Typography>
                    <Typography variant='h4' fontWeight={700} color={data.occupancyRate >= 80 ? 'success.main' : 'warning.main'}>
                      {data.occupancyRate}%
                    </Typography>
                  </Box>

                  <LinearProgress
                    variant='determinate'
                    value={Math.min(Number(data.occupancyRate) || 0, 100)}
                    color={data.occupancyRate >= 80 ? 'success' : 'warning'}
                    sx={{ height: 8, borderRadius: 4 }}
                  />

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant='caption' color='text.secondary'>Occupied</Typography>
                      <Typography variant='h6'>{data.occupiedUnits}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant='caption' color='text.secondary'>Vacant</Typography>
                      <Typography variant='h6'>{data.vacantUnits}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant='caption' color='text.secondary'>Total Units</Typography>
                      <Typography variant='h6'>{data.totalUnits}</Typography>
                    </Grid>
                  </Grid>

                  <Typography variant='caption' color='text.secondary'>
                    Occupancy is a current snapshot, not an average over the selected period.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* ── Profit summary ─────────────────────────────────────── */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Card>
                <CardContent className='flex flex-col gap-3'>
                  <Typography variant='h6'>
                    {profitable ? 'Profitable this period' : 'Operating at a loss this period'}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {data.from} → {data.to}
                  </Typography>

                  <Box className='flex items-center justify-between'>
                    <Typography variant='body2'>Income</Typography>
                    <Typography variant='body2' fontWeight={600} color='success.main'>{money(data.totalIncome)}</Typography>
                  </Box>
                  <Box className='flex items-center justify-between'>
                    <Typography variant='body2'>Expenses</Typography>
                    <Typography variant='body2' fontWeight={600} color='error.main'>− {money(data.totalExpenses)}</Typography>
                  </Box>
                  <Box className='flex items-center justify-between' sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                    <Typography variant='body1' fontWeight={700}>Net Profit</Typography>
                    <Typography variant='body1' fontWeight={700} color={profitable ? 'success.main' : 'error.main'}>
                      {money(data.netProfit)}
                    </Typography>
                  </Box>

                  <Typography variant='caption' color='text.secondary'>
                    Income counts paid invoices issued in this period; expenses count paid expenses dated in it.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      ) : null}
    </Box>
  )
}

export default ProfitLossReport
