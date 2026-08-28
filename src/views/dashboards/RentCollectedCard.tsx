'use client'

// React Imports
import { useMemo } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// API Imports
// Data: one shared /dashboard/summary fetch — no more full invoice download (audit #1/#2).
import { useDashboardSummary } from '@views/dashboards/DashboardSummaryContext'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

/** Floor for the sparkline area, so the chart still reads when the card is at its own height. */
const CHART_MIN_HEIGHT = 100

const RentCollectedCard = () => {
  const infoColor = 'var(--mui-palette-info-main)'

  const { summary, loading } = useDashboardSummary()

  // Server-computed (audit #1): sum of PAID invoice amounts issued in the current month.
  const thisMonthPaid = summary?.paidThisMonth ?? 0

  const trend = useMemo(
    () => (summary?.monthlyTrend ?? []).map(p => p.paidAmount),
    [summary]
  )

  const displayAmount = thisMonthPaid >= 1000
    ? `₵${(thisMonthPaid / 1000).toFixed(2)}K`
    : `₵${thisMonthPaid.toFixed(2)}`

  const series = [{ data: trend }]

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    tooltip: { enabled: false },
    grid: {
      strokeDashArray: 6,
      borderColor: 'var(--mui-palette-divider)',
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
      padding: { top: -27, left: -8, right: 7, bottom: -11 }
    },
    stroke: { width: 3, lineCap: 'butt', curve: 'smooth' },
    colors: [infoColor],
    markers: {
      size: 6,
      offsetY: 4,
      offsetX: -2,
      strokeWidth: 3,
      colors: ['transparent'],
      strokeColors: 'transparent',
      discrete: [
        {
          size: 5.5,
          seriesIndex: 0,
          strokeColor: infoColor,
          fillColor: 'var(--mui-palette-background-paper)',
          dataPointIndex: trend.length - 1
        }
      ]
    },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: { labels: { show: false } },
    // No fixed-height responsive override: the chart fills the card, and the card's height is
    // set by its row. Pinning 88px below 1296 put the dead space back on medium screens.
  }

  return (
    // The card sits in a row whose height is set by its tallest sibling, so the sparkline
    // takes whatever is left rather than a fixed 100px — otherwise a taller neighbour leaves
    // dead space under the chart.
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <Typography variant='h5' className='font-semibold' color='text.primary'>
            Rent Collected
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Total amount collected this month
          </Typography>
        </div>
        {loading ? (
          <Skeleton variant='text' width={120} height={40} />
        ) : (
          <Typography variant='h4' className='font-bold' color='text.primary'>
            {displayAmount}
          </Typography>
        )}
      </CardContent>
      <CardContent sx={{ pt: 0, flex: 1, minHeight: CHART_MIN_HEIGHT, display: 'flex', flexDirection: 'column' }}>
        {!loading && (
          // Absolute fill: ApexCharts resolves a percentage height against its parent's
          // definite height, and a plain flex child has none — the canvas would keep the
          // height it measured at mount and leave a gap under the line.
          <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
            <Box sx={{ position: 'absolute', inset: 0, '& > div': { height: '100%' } }}>
              <AppReactApexCharts type='line' height='100%' width='100%' options={options} series={series} />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default RentCollectedCard
