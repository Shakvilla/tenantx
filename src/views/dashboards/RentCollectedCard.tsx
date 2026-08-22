'use client'

// React Imports
import { useMemo } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
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
    responsive: [
      {
        breakpoint: 1296,
        options: { chart: { height: 88 } }
      }
    ]
  }

  return (
    <Card sx={{ height: '100%' }}>
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
      <CardContent className='pt-0'>
        {!loading && (
          <AppReactApexCharts type='line' height={100} width='100%' options={options} series={series} />
        )}
      </CardContent>
    </Card>
  )
}

export default RentCollectedCard
