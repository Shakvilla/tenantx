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
  total: number
  active: number
  inactive: number
  pending: number
}

type StatsDataType = {
  title: string
  value: string
  icon: string
  desc: string
  iconColor: 'primary' | 'success' | 'warning' | 'info'
}

const OccupantsStatsCard = ({ total, active, inactive, pending }: Props) => {
  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  const data: StatsDataType[] = [
    {
      title: 'All Occupants',
      value: total.toString(),
      icon: 'ri-group-line',
      desc: 'Total number of occupants',
      iconColor: 'primary'
    },
    {
      title: 'Active Occupants',
      value: active.toString(),
      icon: 'ri-user-line',
      desc: 'Currently active occupants',
      iconColor: 'success'
    },
    {
      title: 'Inactive Occupants',
      value: inactive.toString(),
      icon: 'ri-user-unfollow-line',
      desc: 'Inactive or past occupants',
      iconColor: 'warning'
    },
    {
      title: 'Pending',
      value: pending.toString(),
      icon: 'ri-time-line',
      desc: 'Pending occupants',
      iconColor: 'info'
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

export default OccupantsStatsCard
