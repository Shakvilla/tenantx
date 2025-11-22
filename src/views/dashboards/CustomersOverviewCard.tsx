'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'
import OptionMenu from '@core/components/option-menu'

type KPIItem = {
  label: string
  value: string | number
  icon: string
  iconColor?: ThemeColor
}

type CustomersOverviewCardProps = {
  title: string
  summary: {
    total: string | number
    trend?: {
      value: number
      isPositive: boolean
    }
  }
  kpis: KPIItem[]
}

const StyledCard = styled(Card)(({ theme }) => ({
  position: 'relative',
  overflow: 'visible',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 'var(--mui-customShadows-lg)'
  }
}))

const CustomersOverviewCard = ({ title, summary, kpis }: CustomersOverviewCardProps) => {
  return (
    <StyledCard className='bs-full'>
      <CardHeader
        title={title}
        action={<OptionMenu options={['Refresh', 'Export', 'Share']} />}
      />
      <CardContent className='flex flex-col gap-4 p-4'>
        {/* Summary Section */}
        <div className='flex items-center justify-between'>
          <Typography variant='body1' color='text.secondary' className='font-medium'>
            Total {summary.total} Customers
          </Typography>
          {summary.trend && (
            <div className='flex items-center gap-1'>
              <i
                className={`text-base ${
                  summary.trend.isPositive ? 'ri-arrow-up-s-line text-success' : 'ri-arrow-down-s-line text-error'
                }`}
              />
              <Typography
                variant='body1'
                color={summary.trend.isPositive ? 'success.main' : 'error.main'}
                className='font-semibold'
              >
                {summary.trend.isPositive ? '+' : ''}
                {summary.trend.value}%
              </Typography>
            </div>
          )}
        </div>

        {/* KPIs Section */}
        <div className='flex flex-wrap items-center gap-3'>
          {kpis.map((kpi, index) => (
            <div key={index} className='flex items-center gap-2' style={{ minWidth: 'calc(20% - 12px)' }}>
              <CustomAvatar skin='light' color={kpi.iconColor || 'primary'} variant='rounded' size={32}>
                <i className={kpi.icon} />
              </CustomAvatar>
              <div className='flex flex-col'>
                <Typography variant='h6' className='font-bold' color='text.primary'>
                  {kpi.value}
                </Typography>
                <Typography variant='body2' color='text.secondary' className='text-xs'>
                  {kpi.label}
                </Typography>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </StyledCard>
  )
}

export default CustomersOverviewCard

