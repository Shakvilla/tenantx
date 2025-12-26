'use client'

// Next Imports
import dynamic from 'next/dynamic'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'

// import Typography from '@mui/material/Typography'
import { useTheme , styled } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Component Imports
import OptionMenu from '@core/components/option-menu'

// Styled Component Imports
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// Vars
const lineSeries = [{ data: [0, 20, 5, 30, 15, 45] }]
const donutSeries = [100]

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

const RevenueGeneration = () => {
  // Hooks
  // const theme = useTheme()

  // Line Chart Options
  const lineOptions: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false },
      sparkline: { enabled: true }
    },
    tooltip: { enabled: false },
    grid: {
      show: false,
      padding: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }
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
    markers: {
      size: 0
    },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: {
      labels: { show: false }
    }
  }

  // Donut Chart Options
  const donutOptions: ApexOptions = {
    chart: {
      sparkline: { enabled: true }
    },
    legend: { show: false },
    stroke: { width: 6, colors: ['var(--mui-palette-background-paper)'] },
    colors: ['var(--mui-palette-primary-main)'],
    labels: ['complete'],
    tooltip: {
      y: { formatter: (val: number) => `${val}%` }
    },
    dataLabels: {
      enabled: false
    },
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: { show: false },
            total: {
              label: 'Complete',
              show: true,
              fontWeight: 600,
              fontSize: '0.875rem',
              color: 'var(--mui-palette-text-secondary)',
              formatter: () => '100.00%'
            },
            value: {
              offsetY: 6,
              fontWeight: 700,
              fontSize: '1.25rem',
              formatter: () => '100%',
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
        action={<OptionMenu options={['Refresh', 'Export', 'Share']} />}
      />
      <CardContent className='flex flex-col gap-4'>
        <div className='bs-[80px] rounded-lg overflow-hidden' style={{ backgroundColor: 'var(--mui-palette-success-lightOpacity)' }}>
          <AppReactApexCharts type='area' height={80} width='100%' options={lineOptions} series={lineSeries} />
        </div>
        <div className='flex flex-col items-center gap-2'>
          <AppReactApexCharts type='donut' height={180} width='100%' options={donutOptions} series={donutSeries} />
        </div>
      </CardContent>
    </StyledCard>
  )
}

export default RevenueGeneration
