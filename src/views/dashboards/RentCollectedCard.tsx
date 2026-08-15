'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

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
import { getInvoices, type Invoice } from '@/lib/api/invoices'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

/** Get last N months of paid invoice amounts as a sparkline array */
function getPaidMonthlyTrend(invoices: Invoice[], months = 12): number[] {
  const map: Record<string, number> = {}

  invoices.forEach(inv => {
    if (inv.status !== 'PAID') return
    const d = new Date(inv.issuedDate)

    if (isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    map[key] = (map[key] || 0) + inv.amount
  })

  const sorted = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([, v]) => v)

  while (sorted.length < months) sorted.unshift(0)

  return sorted
}

const RentCollectedCard = () => {
  const infoColor = 'var(--mui-palette-info-main)'

  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getInvoices()
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Paid this month
  const thisMonthPaid = useMemo(() => {
    const now = new Date()

    return invoices
      .filter(inv => {
        if (inv.status !== 'PAID') return false
        const d = new Date(inv.issuedDate)

        return !isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      .reduce((sum, inv) => sum + inv.amount, 0)
  }, [invoices])

  const trend = useMemo(() => getPaidMonthlyTrend(invoices, 12), [invoices])

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
