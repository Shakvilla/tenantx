'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'
import { styled } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Component Imports
import RowActions from '@components/table/RowActions'

// API Imports
import { getInvoices, type Invoice } from '@/lib/api/invoices'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

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
    background: 'linear-gradient(90deg, var(--mui-palette-warning-main), var(--mui-palette-warning-light))',
    borderRadius: '4px 4px 0 0'
  }
}))

/** Get daily invoice totals for a given month/year */
function getDailyData(
  invoices: Invoice[],
  monthIndex: number,
  year: number
): { revenueData: number[]; dates: string[] } {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const monthShort = new Date(year, monthIndex, 1).toLocaleString('default', { month: 'short' })

  const dailyMap: Record<number, number> = {}

  invoices.forEach(inv => {
    const d = new Date(inv.issuedDate)

    if (isNaN(d.getTime())) return
    if (d.getFullYear() !== year || d.getMonth() !== monthIndex) return
    const day = d.getDate()

    dailyMap[day] = (dailyMap[day] || 0) + inv.amount
  })

  const revenueData: number[] = []
  const dates: string[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    revenueData.push(dailyMap[day] || 0)
    dates.push(`${day} ${monthShort}`)
  }

  return { revenueData, dates }
}

const DailyAgentRevenue = () => {
  const currentMonth = MONTHS[new Date().getMonth()]
  const currentYear = new Date().getFullYear()

  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getInvoices()
      .then(setInvoices)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const { revenueData, dates } = useMemo(() => {
    const monthIndex = MONTHS.indexOf(selectedMonth)

    return getDailyData(invoices, monthIndex, currentYear)
  }, [invoices, selectedMonth, currentYear])

  const totalRevenue = useMemo(
    () => revenueData.reduce((sum, val) => sum + val, 0),
    [revenueData]
  )

  const series = useMemo(
    () => [{ name: 'Revenue', type: 'column', data: revenueData }],
    [revenueData]
  )

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        parentHeightOffset: 0,
        toolbar: { show: false },
        stacked: false
      },
      stroke: {
        width: [0],
        curve: 'smooth'
      },
      colors: ['var(--mui-palette-warning-main)'],
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '13px',
        labels: { colors: 'var(--mui-palette-text-secondary)' },
        markers: { width: 8, height: 8, radius: 4 }
      },
      grid: {
        strokeDashArray: 6,
        borderColor: 'var(--mui-palette-divider)',
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 10, left: -10, right: -10, bottom: 0 }
      },
      plotOptions: {
        bar: {
          borderRadius: 4,
          columnWidth: dates.length > 20 ? '60%' : '70%',
          borderRadiusApplication: 'end'
        }
      },
      xaxis: {
        categories: dates,
        axisTicks: { show: false },
        axisBorder: { show: false },
        labels: {
          style: {
            colors: 'var(--mui-palette-text-disabled)',
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        min: 0,
        labels: {
          style: {
            colors: 'var(--mui-palette-text-disabled)',
            fontSize: '13px'
          },
          formatter: (val: number) =>
            val >= 1000 ? `₵${(val / 1000).toFixed(0)}k` : `₵${val}`
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number) =>
            `₵${val.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
      },
      states: {
        hover: { filter: { type: 'none' } },
        active: { filter: { type: 'none' } }
      }
    }),
    [revenueData, dates]
  )

  const totalDisplay = totalRevenue >= 1000
    ? `${(totalRevenue / 1000).toFixed(1)}k`
    : totalRevenue.toFixed(0)

  return (
    <StyledCard>
      <CardHeader
        title='Daily Revenue — Invoices Issued'
        subheader={`${selectedMonth} ${currentYear} · Total: ₵${totalDisplay}`}
        action={
          <div className='flex items-center gap-2'>
            <FormControl size='small' sx={{ minWidth: 120 }}>
              <Select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--mui-palette-warning-main)' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--mui-palette-warning-main)' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--mui-palette-warning-main)' }
                }}
              >
                {MONTHS.map(m => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <RowActions options={['Refresh', 'Export', 'Share']} />
          </div>
        }
      />
      <CardContent className='p-4'>
        {loading ? (
          <Box className='flex justify-center py-10'>
            <CircularProgress />
          </Box>
        ) : (
          <AppReactApexCharts type='bar' height={350} width='100%' series={series} options={options} />
        )}
      </CardContent>
    </StyledCard>
  )
}

export default DailyAgentRevenue
