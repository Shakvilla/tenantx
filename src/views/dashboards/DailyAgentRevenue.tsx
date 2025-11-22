'use client'

// Next Imports
import dynamic from 'next/dynamic'
import { useState, useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import { styled } from '@mui/material/styles'
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Component Imports
import OptionMenu from '@core/components/option-menu'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

const StyledCard = styled(Card)(({ theme }) => ({
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

// Helper function to get days in a month
const getDaysInMonth = (month: string) => {
  const monthIndex = new Date(Date.parse(`${month} 1, 2024`)).getMonth()
  return new Date(2024, monthIndex + 1, 0).getDate()
}

// Generate daily data for a month
const generateDailyData = (month: string) => {
  const daysInMonth = getDaysInMonth(month)
  const monthIndex = new Date(Date.parse(`${month} 1, 2024`)).getMonth()
  const monthName = new Date(2024, monthIndex, 1).toLocaleString('default', { month: 'short' })

  const revenueData: number[] = []
  const targetData: number[] = []
  const dates: string[] = []

  for (let day = 1; day <= daysInMonth; day++) {
    // Generate realistic daily revenue data (varying between 25-50)
    const baseRevenue = 25 + Math.floor(Math.random() * 25)
    const baseTarget = 20 + Math.floor(Math.random() * 20)

    revenueData.push(baseRevenue)
    targetData.push(baseTarget)
    dates.push(`${day} ${monthName}`)
  }

  return { revenueData, targetData, dates }
}

const DailyAgentRevenue = () => {
  // Hooks
  const theme = useTheme()
  const [selectedMonth, setSelectedMonth] = useState('January')

  // Generate data based on selected month (memoized)
  const { revenueData, targetData, dates } = useMemo(() => generateDailyData(selectedMonth), [selectedMonth])

  const series: any[] = useMemo(
    () => [
      {
        name: 'Revenue Collected',
        type: 'column',
        data: revenueData
      },
      {
        name: 'Target',
        type: 'line',
        data: targetData
      }
    ],
    [revenueData, targetData]
  )

  const totalRevenue = useMemo(() => revenueData.reduce((sum, val) => sum + val, 0), [revenueData])

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        parentHeightOffset: 0,
        toolbar: { show: false },
        stacked: false
      },
      stroke: {
        width: [0, 3],
        curve: 'smooth',
        colors: ['var(--mui-palette-info-main)']
      },
      markers: {
        size: 4,
        strokeWidth: 3,
        fillOpacity: 1,
        strokeOpacity: 1,
        colors: ['var(--mui-palette-background-paper)'],
        strokeColors: 'var(--mui-palette-info-main)',
        hover: {
          size: 5
        }
      },
      colors: ['var(--mui-palette-warning-main)', 'var(--mui-palette-info-main)'],
      dataLabels: { enabled: false },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '13px',
        labels: {
          colors: 'var(--mui-palette-text-secondary)'
        },
        markers: {
          width: 8,
          height: 8,
          radius: 4
        }
      },
      grid: {
        strokeDashArray: 6,
        borderColor: 'var(--mui-palette-divider)',
        xaxis: {
          lines: { show: false }
        },
        yaxis: {
          lines: { show: true }
        },
        padding: {
          top: 10,
          left: -10,
          right: -10,
          bottom: 0
        }
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
            fontSize: '13px'
          }
        }
      },
      yaxis: {
        min: 0,
        max: Math.max(...revenueData, ...targetData) + 10,
        tickAmount: 6,
        labels: {
          style: {
            colors: 'var(--mui-palette-text-disabled)',
            fontSize: '13px'
          },
          formatter: (val: number) => val.toString()
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number) => `GH₵ ${val.toLocaleString()}`
        }
      },
      states: {
        hover: {
          filter: { type: 'none' }
        },
        active: {
          filter: { type: 'none' }
        }
      }
    }),
    [revenueData, targetData, dates]
  )

  return (
    <StyledCard>
      <CardHeader
        title='Daily Agent Revenue Collection'
        subheader={`Total number of revenue collections ${(totalRevenue / 1000).toFixed(1)}k`}
        action={
          <div className='flex items-center gap-2'>
            <FormControl size='small' sx={{ minWidth: 120 }}>
              <Select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--mui-palette-info-main)'
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--mui-palette-info-main)'
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'var(--mui-palette-info-main)'
                  }
                }}
              >
                <MenuItem value='January'>January</MenuItem>
                <MenuItem value='February'>February</MenuItem>
                <MenuItem value='March'>March</MenuItem>
                <MenuItem value='April'>April</MenuItem>
                <MenuItem value='May'>May</MenuItem>
                <MenuItem value='June'>June</MenuItem>
              </Select>
            </FormControl>
            <OptionMenu options={['Refresh', 'Export', 'Share']} />
          </div>
        }
      />
      <CardContent className='p-4'>
        <AppReactApexCharts type='line' height={350} width='100%' series={series} options={options} />
      </CardContent>
    </StyledCard>
  )
}

export default DailyAgentRevenue
