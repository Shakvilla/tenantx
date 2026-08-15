'use client'

// React Imports
import { useState, useEffect } from 'react'

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
import { getAgreementStats, type AgreementStats } from '@/lib/api/agreements'

type StatItem = {
  title: string
  value: number
  icon: string
  desc: string
  iconColor: 'primary' | 'success' | 'warning' | 'info' | 'error'
}

const AgreementsStatsCard = () => {
  const [stats, setStats] = useState<AgreementStats | null>(null)
  const [loading, setLoading] = useState(true)

  const isBelowMdScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
  const isSmallScreen   = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

  useEffect(() => {
    setLoading(true)
    getAgreementStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const data: StatItem[] = [
    {
      title: 'Total Agreements',
      value: stats?.total ?? 0,
      icon: 'ri-file-contract-line',
      desc: 'Total number of agreements',
      iconColor: 'primary'
    },
    {
      title: 'Active',
      value: stats?.active ?? 0,
      icon: 'ri-checkbox-circle-line',
      desc: 'Currently active agreements',
      iconColor: 'success'
    },
    {
      title: 'Pending',
      value: stats?.pending ?? 0,
      icon: 'ri-hourglass-line',
      desc: 'Pending approval',
      iconColor: 'info'
    },
    {
      title: 'Expired',
      value: stats?.expired ?? 0,
      icon: 'ri-time-line',
      desc: 'Expired agreements',
      iconColor: 'warning'
    },
    {
      title: 'Terminated',
      value: stats?.terminated ?? 0,
      icon: 'ri-close-circle-line',
      desc: 'Terminated agreements',
      iconColor: 'error'
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
                    {loading ? (
                      <Skeleton variant='text' width={48} height={40} />
                    ) : (
                      <Typography variant='h4'>{item.value}</Typography>
                    )}
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

export default AgreementsStatsCard
