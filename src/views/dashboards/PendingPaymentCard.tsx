'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// Vars
const series = [{ data: [0, 15, 8, 25, 12, 30, 18, 35, 22, 40, 28, 45] }]

const PendingPaymentCard = () => {
  // Vars
  const errorColor = 'var(--mui-palette-error-main)'

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    tooltip: { enabled: false },
    grid: {
      strokeDashArray: 6,
      borderColor: 'var(--mui-palette-divider)',
      xaxis: {
        lines: { show: true }
      },
      yaxis: {
        lines: { show: false }
      },
      padding: {
        top: -27,
        left: -8,
        right: 7,
        bottom: -11
      }
    },
    stroke: {
      width: 3,
      lineCap: 'butt',
      curve: 'smooth'
    },
    colors: [errorColor],
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
          strokeColor: errorColor,
          fillColor: 'var(--mui-palette-background-paper)',
          dataPointIndex: series[0].data.length - 1
        }
      ]
    },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: {
      labels: { show: false }
    },
    responsive: [
      {
        breakpoint: 1296,
        options: {
          chart: {
            height: 88
          }
        }
      }
    ]
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent className='flex flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <Typography variant='h5' className='font-semibold' color='text.primary'>
            Pending Payment
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Amount due and overdue payments
          </Typography>
        </div>
        <Typography variant='h4' className='font-bold' color='text.primary'>
          ₵8.45K
        </Typography>
      </CardContent>
      <CardContent className='pt-0'>
        <AppReactApexCharts type='line' height={100} width='100%' options={options} series={series} />
      </CardContent>
    </Card>
  )
}

export default PendingPaymentCard
