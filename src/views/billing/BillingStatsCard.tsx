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
import { BILLING_CHANGED } from '@/lib/api/events'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type StatItem = {
  title: string
  value: string
  icon: string
  desc: string
  iconColor: 'primary' | 'success' | 'info' | 'error' | 'warning'
}

/**
 * The row showed Total, Paid, Pending and Overdue — dropping Draft, Partial
 * and Cancelled, which the same API response has always carried. So a draft
 * invoice appeared in no tile at all while still counting towards Total, and
 * the four numbers could not be made to add up: a landlord with unsent drafts
 * saw a Total nobody could account for and no sign there was work waiting.
 *
 * The statuses now appear in lifecycle order. Cancelled stays out of the row —
 * it is terminal and not something to act on — and is named in the Total tile
 * instead, so the figures still reconcile:
 *
 *     total = draft + pending + partial + overdue + paid + cancelled
 */
const buildStats = (stats: InvoiceStats): StatItem[] => [
  {
    title: 'Total Invoices',
    value: stats.total.toString(),
    icon: 'ri-file-list-3-line',
    desc: stats.cancelled > 0 ? `Includes ${stats.cancelled} cancelled` : 'All invoices generated',
    iconColor: 'primary'
  },
  {
    title: 'Draft Invoices',
    value: stats.draft.toString(),
    icon: 'ri-draft-line',
    desc: 'Not yet issued',
    iconColor: 'warning'
  },
  {
    title: 'Pending Invoices',
    value: stats.pending.toString(),
    icon: 'ri-time-line',
    desc: 'Awaiting payment',
    iconColor: 'info'
  },
  {
    title: 'Part-paid Invoices',
    value: stats.partial.toString(),
    icon: 'ri-progress-4-line',
    desc: 'Balance outstanding',
    iconColor: 'info'
  },
  {
    title: 'Overdue Invoices',
    value: stats.overdue.toString(),
    icon: 'ri-error-warning-line',
    desc: 'Past due date',
    iconColor: 'error'
  },
  {
    title: 'Paid Invoices',
    value: stats.paid.toString(),
    icon: 'ri-checkbox-circle-line',
    desc: 'Settled in full',
    iconColor: 'success'
  }
]

/** Shown before the figures land, so the row does not jump size on load. */
const PLACEHOLDERS: StatItem[] = buildStats({
  total: 0,
  draft: 0,
  pending: 0,
  partial: 0,
  paid: 0,
  overdue: 0,
  cancelled: 0,
  totalAmount: 0,
  paidAmount: 0,
  outstandingAmount: 0
}).map(item => ({ ...item, value: '-' }))

const BillingStatsCard = () => {
  const [stats, setStats] = useState<InvoiceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const theme = useTheme()
  const isBelowMdScreen = useMediaQuery(theme.breakpoints.down('md'))
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    // `[]` alone meant these tiles loaded once and never again: a landlord who created an
    // invoice while the page was open kept seeing the old counts — "Overdue Invoices: 0" for a
    // bill seven weeks past due — and Refresh did not help, because Refresh reloads the table
    // beneath, not the tiles. Only a full page load fixed it.
    const load = () => {
      getInvoiceStats()
        .then(setStats)
        // Deliberately not `.catch(() => {})`. A silently swallowed failure leaves the previous
        // numbers on screen looking current, which is how a stale figure gets trusted.
        .catch(() => setFailed(true))
        .finally(() => setLoading(false))
    }

    load()
    window.addEventListener(BILLING_CHANGED, load)

    return () => window.removeEventListener(BILLING_CHANGED, load)
  }, [])

  const data: StatItem[] = stats ? buildStats(stats) : PLACEHOLDERS

  // The separators used to be written for exactly four tiles on one row: a
  // right border on every item but the last, which with two rows leaves a
  // stray border hanging at the end of the first. Deriving the row width
  // instead keeps them correct however many tiles there are.
  const perRow = isSmallScreen ? 1 : isBelowMdScreen ? 2 : 3
  const lastRowStart = data.length - (data.length % perRow || perRow)

  return (
    <Card className='my-6'>
      <CardContent>
        {failed && (
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 2 }}>
            These totals could not be refreshed just now, so they may be out of date.
          </Typography>
        )}
        <Grid container spacing={6}>
          {data.map((item, index) => {
            const endsRow = (index + 1) % perRow === 0
            const inLastRow = index >= lastRowStart

            return (
              <Grid
                size={{ xs: 12, sm: 6, md: 4 }}
                key={index}
                className={classnames({ '[&>div]:pie-6 [&>div]:border-ie': !endsRow && index !== data.length - 1 })}
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
                {!inLastRow && <Divider className={classnames('mbs-6', { 'mie-6': !endsRow })} />}
              </Grid>
            )
          })}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default BillingStatsCard
