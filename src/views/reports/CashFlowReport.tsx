'use client'

// React Imports
import { useState, useEffect, useRef } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Component Imports
import ReportSummaryCards from '@/components/reports/ReportSummaryCards'
import ExportButtons from '@/components/reports/ExportButtons'
import { FeatureGate } from '@/components/subscription/FeatureGate'

// API Imports
import { getCashFlowProjection } from '@/lib/api/cashflow'

// Util Imports
import { formatCurrency } from '@/utils/currency'

// Type Imports
import type { CashFlowResponse } from '@/types/cashflow'
import type { ReportSummary } from '@/types/reports/reportTypes'

// Dynamic import for ApexCharts (no SSR)
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

const LoadingSkeleton = () => (
  <Grid container spacing={5}>
    {/* Summary card skeletons */}
    <Grid item xs={12}>
      <Grid container spacing={4}>
        {[0, 1, 2, 3].map(i => (
          <Grid item key={i} xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Skeleton variant='text' width='60%' />
                <Skeleton variant='text' width='80%' height={40} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Grid>

    {/* Chart skeleton */}
    <Grid item xs={12}>
      <Card variant='outlined'>
        <CardContent>
          <Skeleton variant='text' width='30%' sx={{ mb: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    </Grid>

    {/* Table skeleton */}
    <Grid item xs={12}>
      <Card variant='outlined'>
        <CardContent>
          <Skeleton variant='text' width='40%' sx={{ mb: 2 }} />
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} variant='rectangular' height={40} sx={{ mb: 1, borderRadius: 1 }} />
          ))}
        </CardContent>
      </Card>
    </Grid>
  </Grid>
)

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const CashFlowReport = () => {
  const contentRef = useRef<HTMLDivElement>(null)

  const [data, setData] = useState<CashFlowResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getCashFlowProjection()
      .then(setData)
      .catch(err => setError(err?.message ?? 'Failed to load cash flow forecast'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSkeleton />

  if (error) {
    return <Alert severity='error' sx={{ mb: 4 }}>{error}</Alert>
  }

  if (!data) return null

  // Empty state check
  const months = data.months ?? []
  const isEmpty = months.length === 0 || months.every(m => m.totalExpected === 0)

  // ---------------------------------------------------------------------------
  // Summary cards
  // ---------------------------------------------------------------------------

  const summaries: ReportSummary[] = [
    {
      label: '12-Month Forecast',
      value: formatCurrency(data.totalExpected12Months),
      icon: 'ri-funds-line',
      color: 'primary',
    },
    {
      label: 'Monthly Average',
      value: formatCurrency(data.avgMonthlyExpected),
      icon: 'ri-calendar-line',
      color: 'success',
    },
    {
      label: 'Vacant Units',
      value: data.vacantUnits,
      icon: 'ri-home-2-line',
      color: 'warning',
    },
    {
      label: 'Total Units',
      value: data.totalUnits,
      icon: 'ri-building-2-line',
      color: 'info',
    },
  ]

  // ---------------------------------------------------------------------------
  // Chart config
  // ---------------------------------------------------------------------------

  const chartSeries = [
    {
      name: 'Advance Rent Renewals',
      data: months.map(m => m.advanceRentIncome),
    },
    {
      name: 'Regular Monthly Rent',
      data: months.map(m => m.regularRentIncome),
    },
  ]

  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
      parentHeightOffset: 0,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 4,
        columnWidth: '55%',
      },
    },
    colors: [
      'var(--mui-palette-primary-main)',
      'var(--mui-palette-success-main)',
    ],
    dataLabels: { enabled: false },
    stroke: { show: false },
    xaxis: {
      categories: months.map(m => m.monthLabel),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: 'var(--mui-palette-text-secondary)',
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: 'var(--mui-palette-text-secondary)',
          fontSize: '12px',
        },
        formatter: (val: number) => `GH₵${val.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val: number) =>
          `GH₵${val.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      labels: {
        colors: 'var(--mui-palette-text-primary)',
      },
    },
    grid: {
      borderColor: 'var(--mui-palette-divider)',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
    },
    fill: { opacity: 1 },
  }

  // ---------------------------------------------------------------------------
  // Export data
  // ---------------------------------------------------------------------------

  const exportData = months.map(m => ({
    Month: m.monthLabel,
    'Advance Rent Renewals (GHS)': m.advanceRentIncome,
    'Regular Monthly Rent (GHS)': m.regularRentIncome,
    'Total Expected (GHS)': m.totalExpected,
  }))

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <FeatureGate feature='ADVANCED_REPORTS'>
      <Box ref={contentRef}>
        {/* Export controls row */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 5 }}>
          <ExportButtons
            title='Cash Flow Forecast'
            data={exportData}
            filename='cash-flow-forecast'
            contentRef={contentRef as React.RefObject<HTMLElement>}
          />
        </Box>

        <Grid container spacing={5}>
          {/* Summary cards */}
          <Grid item xs={12}>
            <ReportSummaryCards summaries={summaries} />
          </Grid>

          {/* Empty state */}
          {isEmpty && (
            <Grid item xs={12}>
              <Alert severity='info' icon={<i className='ri-information-line' />}>
                No active units or advance rents found for the forecast period.
              </Alert>
            </Grid>
          )}

          {/* Stacked bar chart */}
          {!isEmpty && (
            <Grid item xs={12}>
              <Card variant='outlined'>
                <CardHeader
                  title='12-Month Income Projection'
                  subheader='Projected rent income split by advance renewals and regular monthly payments'
                />
                <Divider />
                <CardContent sx={{ pb: '12px !important' }}>
                  <AppReactApexCharts
                    type='bar'
                    height={350}
                    width='100%'
                    options={chartOptions}
                    series={chartSeries}
                  />
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Monthly breakdown table */}
          {!isEmpty && (
            <Grid item xs={12}>
              <Card variant='outlined'>
                <CardContent sx={{ pb: '12px !important' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant='h6'>Monthly Breakdown</Typography>
                    <Chip
                      label='Next 12 Months'
                      variant='tonal'
                      color='primary'
                      size='small'
                    />
                  </Box>
                  <Divider sx={{ mb: 3 }} />

                  <TableContainer>
                    <Table size='small'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Month</TableCell>
                          <TableCell align='right'>Advance Renewals</TableCell>
                          <TableCell align='right'>Regular Rent</TableCell>
                          <TableCell align='right'>Total Expected</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {months.map((m, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell>
                              <Typography variant='body2' fontWeight={500}>
                                {m.monthLabel}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='body2' color='primary.main'>
                                {formatCurrency(m.advanceRentIncome)}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='body2' color='success.main'>
                                {formatCurrency(m.regularRentIncome)}
                              </Typography>
                            </TableCell>
                            <TableCell align='right'>
                              <Typography variant='body2' fontWeight={600}>
                                {formatCurrency(m.totalExpected)}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}

                        {/* Totals row */}
                        <TableRow
                          sx={{ '& td': { borderTop: '2px solid', borderColor: 'divider', fontWeight: 700 } }}
                        >
                          <TableCell>Total (12 months)</TableCell>
                          <TableCell align='right'>
                            {formatCurrency(
                              months.reduce((sum, m) => sum + m.advanceRentIncome, 0)
                            )}
                          </TableCell>
                          <TableCell align='right'>
                            {formatCurrency(
                              months.reduce((sum, m) => sum + m.regularRentIncome, 0)
                            )}
                          </TableCell>
                          <TableCell align='right' sx={{ color: 'primary.main' }}>
                            {formatCurrency(data.totalExpected12Months)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Unit composition info */}
          <Grid item xs={12}>
            <Alert
              severity='info'
              icon={<i className='ri-building-2-line' />}
            >
              <Typography variant='body2'>
                <strong>{data.occupiedAdvanceUnits}</strong> unit{data.occupiedAdvanceUnits !== 1 ? 's' : ''} on advance rent
                {' · '}
                <strong>{data.occupiedRegularUnits}</strong> unit{data.occupiedRegularUnits !== 1 ? 's' : ''} paying monthly
                {' · '}
                <strong>{data.vacantUnits}</strong> vacant unit{data.vacantUnits !== 1 ? 's' : ''}
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      </Box>
    </FeatureGate>
  )
}

export default CashFlowReport
