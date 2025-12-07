// Documentation: /docs/subscription-plans/subscription-plans-module.md

'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type Props = {
  totalPlans: number
  activePlans: number
  totalSubscriptions: number
  activeSubscriptions: number
  monthlyRecurringRevenue: string
}

type StatsDataType = {
  title: string
  value: string
  icon: string
  desc: string
  iconColor: 'primary' | 'success' | 'warning' | 'info' | 'error'
}

const SubscriptionPlansStatsCard = ({
  totalPlans,
  activePlans,
  totalSubscriptions,
  activeSubscriptions,
  monthlyRecurringRevenue
}: Props) => {
  // Hooks
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  const data: StatsDataType[] = [
    {
      title: 'Total Plans',
      value: totalPlans.toString(),
      icon: 'ri-vip-crown-line',
      desc: 'Total subscription plans',
      iconColor: 'primary'
    },
    {
      title: 'Active Plans',
      value: activePlans.toString(),
      icon: 'ri-checkbox-circle-line',
      desc: 'Currently active plans',
      iconColor: 'success'
    },
    {
      title: 'Total Subscriptions',
      value: totalSubscriptions.toString(),
      icon: 'ri-group-line',
      desc: 'Total active subscriptions',
      iconColor: 'info'
    },
    {
      title: 'Active Subscriptions',
      value: activeSubscriptions.toString(),
      icon: 'ri-user-star-line',
      desc: 'Currently active subscriptions',
      iconColor: 'success'
    },
    {
      title: 'Monthly Recurring Revenue',
      value: monthlyRecurringRevenue,
      icon: 'ri-money-dollar-circle-line',
      desc: 'Total MRR from subscriptions',
      iconColor: 'success'
    }
  ]

  return (
    <Card className='mbs-6'>
      <CardContent>
        <Grid container spacing={6}>
          {data.map((item, index) => (
            <Grid
              size={{ xs: 12, sm: 6, md: 2.4 }}
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

export default SubscriptionPlansStatsCard

