'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { useMediaQuery, useTheme } from '@mui/material'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type DataType = {
  title: string
  value: string
  icon: string
  desc: string
  iconColor: 'primary' | 'success' | 'info' | 'error' | 'warning'
}

type Props = {
  totalExpenses: number
  upcomingExpenses: number
  unfulfilledExpenses: number
  paidExpenses: number
}

const ExpenseStatsCard = ({
  totalExpenses = 0,
  upcomingExpenses = 0,
  unfulfilledExpenses = 0,
  paidExpenses = 0
}: Props) => {
  // Hooks
  const theme = useTheme()
  const isBelowMdScreen = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const data: DataType[] = [
    {
      title: 'Total Expenses',
      value: `₵${totalExpenses.toFixed(2)}`,
      icon: 'ri-money-dollar-circle-line',
      desc: 'All expenses recorded',
      iconColor: 'primary'
    },
    {
      title: 'Upcoming Expenses',
      value: `₵${upcomingExpenses.toFixed(2)}`,
      icon: 'ri-calendar-event-line',
      desc: 'Future expenses',
      iconColor: 'info'
    },
    {
      title: 'Unfulfilled Expenses',
      value: `₵${unfulfilledExpenses.toFixed(2)}`,
      icon: 'ri-error-warning-line',
      desc: 'Debt/Overdue',
      iconColor: 'error'
    },
    {
      title: 'Paid',
      value: `₵${paidExpenses.toFixed(2)}`,
      icon: 'ri-checkbox-circle-line',
      desc: 'Successfully paid',
      iconColor: 'success'
    }
  ]

  return (
    <Card className='mbs-6'>
      <CardContent>
        <Grid container spacing={6}>
          {data.map((item, index) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 3 }}
              key={index}
              className={classnames({
                '[&:nth-of-type(odd)>div]:pie-6 [&:nth-of-type(odd)>div]:border-ie': isBelowMdScreen && !isSmallScreen,
                '[&:not(:last-child)>div]:pie-6 [&:not(:last-child)>div]:border-ie': !isBelowMdScreen
              })}
            >
              <div className='flex flex-col gap-1'>
                <div className='flex justify-between'>
                  <div className='flex flex-col gap-1'>
                    <Typography>{item.title}</Typography>
                    <Typography variant='h4'>{item.value}</Typography>
                  </div>
                  <CustomAvatar variant='rounded' skin='light' color={item.iconColor} size={44}>
                    <i className={classnames(item.icon, 'text-[28px]')} />
                  </CustomAvatar>
                </div>
                <Typography>{item.desc}</Typography>
              </div>
              {isBelowMdScreen && !isSmallScreen && index < data.length - 2 && (
                <Divider
                  className={classnames('mbs-6', {
                    'mie-6': index % 2 === 0
                  })}
                />
              )}
              {isSmallScreen && index < data.length - 1 && <Divider className='mbs-6' />}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default ExpenseStatsCard

