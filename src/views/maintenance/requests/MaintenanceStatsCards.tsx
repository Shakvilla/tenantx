'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// API Imports
import { getMaintenanceRequestStats, type MaintenanceRequestStats } from '@/lib/api/maintenance'

type StatItem = {
  title: string
  value: string | number
  icon: string
  desc: string
  color?: string
}

const MaintenanceStatsCards = () => {
  const [stats, setStats] = useState<MaintenanceRequestStats | null>(null)
  const [loading, setLoading] = useState(true)

  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  useEffect(() => {
    getMaintenanceRequestStats()
      .then(s => setStats(s))
      .catch(() => setStats(null))
      .finally(() => setLoading(false))
  }, [])

  const data: StatItem[] = stats
    ? [
        {
          title: 'Total Requests',
          value: stats.total,
          icon: 'ri-tools-line',
          desc: 'All maintenance requests'
        },
        {
          title: 'Open Requests',
          value: stats.openRequests,
          icon: 'ri-folder-open-line',
          desc: 'Pending or in progress'
        },
        {
          title: 'Completed This Month',
          value: stats.completedThisMonth,
          icon: 'ri-checkbox-circle-line',
          desc: 'Resolved in current month'
        },
        {
          title: 'SLA Breached',
          value: stats.slaBreached,
          icon: 'ri-alarm-warning-line',
          desc: 'Requests exceeding SLA'
        }
      ]
    : []

  if (loading) {
    return (
      <Card className='mbs-6'>
        <CardContent>
          <Grid container spacing={6}>
            {[1, 2, 3, 4].map(i => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
                <div className='flex flex-col gap-2'>
                  <Skeleton variant='text' width='60%' />
                  <Skeleton variant='text' width='40%' height={40} />
                  <Skeleton variant='text' width='80%' />
                </div>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

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
                  <CustomAvatar variant='rounded' size={44} skin='light'
                    color={
                      item.icon.includes('warning') && Number(item.value) > 0 ? 'error' :
                      item.icon.includes('checkbox') ? 'success' :
                      item.icon.includes('open') ? 'warning' : 'primary'
                    }>
                    <i className={classnames(item.icon, 'text-[28px]')} />
                  </CustomAvatar>
                </div>
                <Typography variant='body2' color='text.secondary'>{item.desc}</Typography>
              </div>
              {isBelowMdScreen && !isSmallScreen && index < data.length - 2 && (
                <Divider className={classnames('mbs-6', { 'mie-6': index % 2 === 0 })} />
              )}
              {isSmallScreen && index < data.length - 1 && <Divider className='mbs-6' />}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default MaintenanceStatsCards
