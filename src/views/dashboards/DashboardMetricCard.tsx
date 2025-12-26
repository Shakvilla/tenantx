'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { styled } from '@mui/material/styles'

// Type Imports
import type { ThemeColor } from '@core/types'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type StatRow = {
  label: string
  value: string | number
}

type DashboardMetricCardProps = {
  title: string
  stats: StatRow[]
  icon?: string
  iconColor?: ThemeColor
  actionButton?: {
    label: string
    onClick?: () => void
  }
}

const StyledCard = styled(Card)(() => ({
  position: 'relative',
  overflow: 'visible',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: 'var(--mui-customShadows-lg)'
  }
}))

const DashboardMetricCard = ({ title, stats, icon, iconColor = 'primary', actionButton }: DashboardMetricCardProps) => {
  return (
    <StyledCard className='bs-full'>
      <CardContent className='flex flex-col gap-3 p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {icon && (
              <CustomAvatar skin='light' color={iconColor} variant='rounded' size={36}>
                <i className={icon} />
              </CustomAvatar>
            )}
            <Typography variant='subtitle1' className='font-semibold'>
              {title}
            </Typography>
          </div>
        </div>
        <div className='flex flex-col gap-2'>
          {stats.map((stat, index) => (
            <div key={index} className='flex items-center justify-between p-2 rounded bg-actionHover'>
              <Typography variant='body2' color='text.secondary' className='text-sm'>
                {stat.label}
              </Typography>
              <Typography variant='body1' className='font-bold' color='text.primary'>
                {stat.value}
              </Typography>
            </div>
          ))}
        </div>
        {actionButton && (
          <Button variant='contained' size='small' onClick={actionButton.onClick} className='mt-1' fullWidth>
            {actionButton.label}
          </Button>
        )}
      </CardContent>
    </StyledCard>
  )
}

export default DashboardMetricCard
