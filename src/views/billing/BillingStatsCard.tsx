'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import { useMediaQuery, useTheme } from '@mui/material'

// Third-party Imports
import classnames from 'classnames'

// API Imports
import { getInvoiceStats, type InvoiceStats } from '@/lib/api/invoices'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type StatItem = {
  title: string
  value: string
  icon: string
  desc: string
  iconColor: 'primary' | 'success' | 'info' | 'error' | 'warning'
}

const buildStats = (stats: InvoiceStats): StatItem[] => [
  {
    title: 'Total Invoices',
    value: stats.total.toString(),
    icon: 'ri-file-list-3-line',
    desc: 'All invoices generated',
    iconColor: 'primary'
  },
  {
    title: 'Paid Invoices',
    value: stats.paid.toString(),
    icon: 'ri-checkbox-circle-line',
    desc: 'Successfully paid',
    iconColor: 'success'
  },
  {
    title: 'Pending Invoices',
    value: stats.pending.toString(),
    icon: 'ri-time-line',
    desc: 'Awaiting payment',
    iconColor: 'info'
  },
  {
    title: 'Overdue Invoices',
    value: stats.overdue.toString(),
    icon: 'ri-error-warning-line',
    desc: 'Past due date',
    iconColor: 'error'
  }
]

const BillingStatsCard = () => {
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [loading, setLoading] = useState(true)

  const theme = useTheme()
  const isBelowMdScreen = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    getInvoiceStats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const data: StatItem[] = stats
    ? buildStats(stats)
    : [
        { title: 'Total Invoices',   value: '-', icon: 'ri-file-list-3-line',      desc: 'All invoices generated', iconColor: 'primary' },
        { title: 'Paid Invoices',    value: '-', icon: 'ri-checkbox-circle-line',   desc: 'Successfully paid',      iconColor: 'success' },
        { title: 'Pending Invoices', value: '-', icon: 'ri-time-line',              desc: 'Awaiting payment',       iconColor: 'info' },
        { title: 'Overdue Invoices', value: '-', icon: 'ri-error-warning-line',     desc: 'Past due date',          iconColor: 'error' }
      ]

  return (
    <Card className='my-6'>
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
                    {loading ? (
                      <Skeleton variant='text' width={60} height={40} />
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

export default BillingStatsCard
