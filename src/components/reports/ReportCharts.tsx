// Documentation: /docs/reports/reports-flow.md

'use client'

// React Imports
import { useMemo } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import { useTheme , styled } from '@mui/material/styles'

// Third-party Imports
import type { ApexOptions } from 'apexcharts'

// Component Imports
import AppReactApexCharts from '@/libs/styles/AppReactApexCharts'

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
    background: 'linear-gradient(90deg, var(--mui-palette-primary-main), var(--mui-palette-primary-light))',
    borderRadius: '4px 4px 0 0'
  }
}))

type LineChartProps = {
  title: string
  data: { date: string; value: number }[]
  dataKey: string
  color?: string
}

export const LineChart = ({ title, data, dataKey, color = 'primary' }: LineChartProps) => {
  const theme = useTheme()

  const series = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        {
          name: dataKey,
          data: []
        }
      ]
    }

    
return [
      {
        name: dataKey,
        data: data.map(d => d.value || 0)
      }
    ]
  }, [data, dataKey])

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        parentHeightOffset: 0,
        toolbar: { show: false },
        type: 'line'
      },
      stroke: {
        width: 3,
        curve: 'smooth',
        colors: [`var(--mui-palette-${color}-main)`]
      },
      colors: [`var(--mui-palette-${color}-main)`],
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: {
        strokeDashArray: 6,
        borderColor: 'var(--mui-palette-divider)',
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 10, left: -10, right: -10, bottom: 0 }
      },
      xaxis: {
        categories: data && data.length > 0 ? data.map(d => d.date || '') : [],
        labels: {
          style: { colors: 'var(--mui-palette-text-secondary)' }
        }
      },
      yaxis: {
        labels: {
          style: { colors: 'var(--mui-palette-text-secondary)' }
        }
      },
      tooltip: {
        theme: theme.palette.mode
      }
    }),
    [data, color, theme]
  )

  if (!data || data.length === 0) {
    return (
      <StyledCard>
        <CardHeader title={title} />
        <CardContent>
          <Typography variant='body2' color='text.secondary' className='text-center p-4'>
            No data available
          </Typography>
        </CardContent>
      </StyledCard>
    )
  }

  return (
    <StyledCard>
      <CardHeader title={title} />
      <CardContent>
        <AppReactApexCharts type='line' height={300} series={series} options={options} />
      </CardContent>
    </StyledCard>
  )
}

type BarChartProps = {
  title: string
  data: { label: string; value: number }[]
  color?: string
}

export const BarChart = ({ title, data, color = 'primary' }: BarChartProps) => {
  const theme = useTheme()

  const series = useMemo(() => {
    if (!data || data.length === 0) {
      return [
        {
          name: 'Value',
          data: []
        }
      ]
    }

    
return [
      {
        name: 'Value',
        data: data.map(d => d.value || 0)
      }
    ]
  }, [data])

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        parentHeightOffset: 0,
        toolbar: { show: false },
        type: 'bar'
      },
      colors: [`var(--mui-palette-${color}-main)`],
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: {
        strokeDashArray: 6,
        borderColor: 'var(--mui-palette-divider)',
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { top: 10, left: -10, right: -10, bottom: 0 }
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          columnWidth: '60%',
          borderRadiusApplication: 'end'
        }
      },
      xaxis: {
        categories: data && data.length > 0 ? data.map(d => d.label || '') : [],
        labels: {
          style: { colors: 'var(--mui-palette-text-secondary)' }
        }
      },
      yaxis: {
        labels: {
          style: { colors: 'var(--mui-palette-text-secondary)' }
        }
      },
      tooltip: {
        theme: theme.palette.mode
      }
    }),
    [data, color, theme]
  )

  if (!data || data.length === 0) {
    return (
      <StyledCard>
        <CardHeader title={title} />
        <CardContent>
          <Typography variant='body2' color='text.secondary' className='text-center p-4'>
            No data available
          </Typography>
        </CardContent>
      </StyledCard>
    )
  }

  return (
    <StyledCard>
      <CardHeader title={title} />
      <CardContent>
        <AppReactApexCharts type='bar' height={300} series={series} options={options} />
      </CardContent>
    </StyledCard>
  )
}

type DonutChartProps = {
  title: string
  data: { label: string; value: number }[]
}

export const DonutChart = ({ title, data }: DonutChartProps) => {
  const theme = useTheme()

  const series = useMemo(() => {
    if (!data || data.length === 0) {
      return []
    }

    
return data.map(d => d.value || 0)
  }, [data])

  const options: ApexOptions = useMemo(
    () => ({
      chart: {
        parentHeightOffset: 0,
        toolbar: { show: false },
        type: 'donut'
      },
      labels: data && data.length > 0 ? data.map(d => d.label || '') : [],
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(1)}%`
      },
      legend: {
        show: true,
        position: 'bottom',
        horizontalAlign: 'center'
      },
      colors: [
        'var(--mui-palette-primary-main)',
        'var(--mui-palette-success-main)',
        'var(--mui-palette-warning-main)',
        'var(--mui-palette-error-main)',
        'var(--mui-palette-info-main)'
      ],
      tooltip: {
        theme: theme.palette.mode
      }
    }),
    [data, theme]
  )

  if (!data || data.length === 0) {
    return (
      <StyledCard>
        <CardHeader title={title} />
        <CardContent>
          <Typography variant='body2' color='text.secondary' className='text-center p-4'>
            No data available
          </Typography>
        </CardContent>
      </StyledCard>
    )
  }

  return (
    <StyledCard>
      <CardHeader title={title} />
      <CardContent>
        <AppReactApexCharts type='donut' height={300} series={series} options={options} />
      </CardContent>
    </StyledCard>
  )
}

