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
  totalInvoices?: number
  paidInvoices?: number
  pendingInvoices?: number
  overdueInvoices?: number
}

const BillingStatsCard = ({
  totalInvoices = 45,
  paidInvoices = 32,
  pendingInvoices = 8,
  overdueInvoices = 5
}: Props) => {
  // Hooks
  const theme = useTheme()
  const isBelowMdScreen = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  const data: DataType[] = [
    {
      title: 'Total Invoices',
      value: totalInvoices.toString(),
      icon: 'ri-file-list-3-line',
      desc: 'All invoices generated',
      iconColor: 'primary'
    },
    {
      title: 'Paid Invoices',
      value: paidInvoices.toString(),
      icon: 'ri-checkbox-circle-line',
      desc: 'Successfully paid',
      iconColor: 'success'
    },
    {
      title: 'Pending Invoices',
      value: pendingInvoices.toString(),
      icon: 'ri-time-line',
      desc: 'Awaiting payment',
      iconColor: 'info'
    },
    {
      title: 'Overdue Invoices',
      value: overdueInvoices.toString(),
      icon: 'ri-error-warning-line',
      desc: 'Past due date',
      iconColor: 'error'
    }
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

export default BillingStatsCard
