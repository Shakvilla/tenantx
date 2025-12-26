'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type FinancialMetricCardProps = {
  title: string
  amount: number
  icon?: string
  iconColor?: ThemeColor
  showCurrency?: boolean
  trend?: {
    value: number
    isPositive: boolean
  }
}

const StyledCard = styled(Card)(() => ({
  position: 'relative',
  overflow: 'visible',
  transition: 'all 0.3s ease-in-out',
  background: 'linear-gradient(135deg, var(--mui-palette-background-paper) 0%, var(--mui-palette-background-paper) 100%)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 'var(--mui-customShadows-lg)'
  },
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

const FinancialMetricCard = ({
  title,
  amount,
  icon = 'ri-time-line',
  iconColor = 'primary',
  showCurrency = true,
  trend
}: FinancialMetricCardProps) => {
  const formatAmount = (value: number) => {
    return `GH₵ ${value.toLocaleString('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  return (
    <StyledCard className='bs-full'>
      <CardContent className='flex flex-col gap-3 p-4'>
        <div className='flex items-center justify-between'>
          <CustomAvatar skin='light' color={iconColor} variant='rounded' size={40}>
            <i className={icon} />
          </CustomAvatar>
          {trend && (
            <div className='flex items-center gap-1 px-2 py-0.5 rounded-md bg-actionHover'>
              <i
                className={`text-sm ${trend.isPositive ? 'ri-arrow-up-s-line text-success' : 'ri-arrow-down-s-line text-error'}`}
              />
              <Typography variant='caption' color={trend.isPositive ? 'success.main' : 'error.main'} className='font-semibold text-xs'>
                {trend.isPositive ? '+' : ''}
                {trend.value}%
              </Typography>
            </div>
          )}
        </div>
        <div className='flex flex-col gap-0.5'>
          <Typography variant='body2' color='text.secondary' className='text-sm'>
            {title}
          </Typography>
          <Typography variant='h6' className='font-bold' color='text.primary'>
            {showCurrency ? formatAmount(amount) : amount.toLocaleString()}
          </Typography>
        </div>
      </CardContent>
    </StyledCard>
  )
}

export default FinancialMetricCard
