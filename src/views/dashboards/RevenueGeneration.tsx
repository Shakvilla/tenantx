'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Component Imports
import RowActions from '@components/table/RowActions'

// API Imports
import { getInvoiceStats, getInvoices, type InvoiceStats, type Invoice } from '@/lib/api/invoices'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const StyledCard = styled(Card)(() => ({
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(90deg, var(--mui-palette-success-main), var(--mui-palette-success-light))',
    borderRadius: '4px 4px 0 0'
  }
}))

/** Get last N months of invoice amounts for the sparkline */
function getMonthlyTrend(invoices: Invoice[], months = 6): number[] {
  const map: Record<string, number> = {}

  invoices.forEach(inv => {
    const d = new Date(inv.issuedDate)

    if (isNaN(d.getTime())) return
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    map[key] = (map[key] || 0) + inv.amount
  })

  // Sort keys and take last N
  const sorted = Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-months)
    .map(([, v]) => v)

  // Pad with 0s if fewer than N months
  while (sorted.length < months) sorted.unshift(0)

  return sorted
}

const RevenueGeneration = () => {
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([getInvoiceStats(), getInvoices()])
      .then(([s, inv]) => {
        setStats(s)
        setInvoices(inv)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const trend = useMemo(() => getMonthlyTrend(invoices, 6), [invoices])

  const paidPct = useMemo(() => {
    if (!stats || stats.totalAmount === 0) return 0

    return Math.round((stats.paidAmount / stats.totalAmount) * 100)
  }, [stats])

  const lineSeries = [{ data: trend }]
  const donutSeries = [paidPct]

  const lineOptions: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      sparkline: { enabled: true }
    },
    tooltip: { enabled: false },
    grid: {
      show: false,
      padding: { top: 0, left: 0, right: 0, bottom: 0 }
    },
    stroke: {
      width: 3,
      lineCap: 'round',
      curve: 'smooth'
    },
    colors: ['var(--mui-palette-success-main)'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: ['var(--mui-palette-success-light)'],
        inverseColors: false,
        opacityFrom: 0.7,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    markers: { size: 0 },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: { labels: { show: false } }
  }

  const donutOptions: ApexOptions = {
    chart: { sparkline: { enabled: true } },
    legend: { show: false },
    stroke: { width: 6, colors: ['var(--mui-palette-background-paper)'] },
    colors: ['var(--mui-palette-primary-main)'],
    labels: ['Paid'],
    tooltip: {
      y: { formatter: (val: number) => `${val}%` }
    },
    dataLabels: { enabled: false },
    states: {
      hover: { filter: { type: 'none' } },
      active: { filter: { type: 'none' } }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: { show: false },
            total: {
              label: 'Paid',
              show: true,
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--mui-palette-text-secondary)',
              formatter: () => `${paidPct}%`
            },
            value: {
              offsetY: 6,
              fontWeight: 700,
              fontSize: '1.25rem',
              formatter: (val: string) => `${val}%`,
              color: 'var(--mui-palette-primary-main)'
            }
          }
        }
      }
    }
  }

  return (
    <StyledCard className='bs-full'>
      <CardHeader
        title='Revenue Generation'
        subheader='Ongoing transactions based on statuses'
        action={<RowActions options={['Refresh', 'Export', 'Share']} />}
      />
      <CardContent className='flex flex-col gap-4'>
        {loading ? (
          <Box className='flex justify-center py-6'>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <div className='bs-[80px] rounded-lg overflow-hidden' style={{ backgroundColor: 'var(--mui-palette-success-lightOpacity)' }}>
              <AppReactApexCharts type='area' height={80} width='100%' options={lineOptions} series={lineSeries} />
            </div>
            <div className='flex flex-col items-center gap-2'>
              <AppReactApexCharts type='donut' height={180} width='100%' options={donutOptions} series={donutSeries} />
            </div>
          </>
        )}
      </CardContent>
    </StyledCard>
  )
}

export default RevenueGeneration
