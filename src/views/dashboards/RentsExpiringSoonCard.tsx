'use client'

// React Imports
import { useState, useEffect } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Divider from '@mui/material/Divider'

// API Imports
import { advanceRentsApi } from '@/lib/api/advanceRents'
import type { AdvanceRentResponse } from '@/types/advanceRent'

const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

/**
 * Deliberately a hair under three rows: enough to read at a glance, short enough to keep the
 * dashboard row height even, and it clips the third entry so the list reads as scrollable
 * rather than complete.
 */
const LIST_MAX_HEIGHT = 240

/**
 * Portfolio-wide "Rents Expiring Soon" widget.
 *
 * Sources data from GET /api/v1/advance-rents/expiring (dedicated backend endpoint)
 * rather than deriving "expiring" client-side from an already-fetched full list.
 */
const RentsExpiringSoonCard = () => {
  const [records, setRecords] = useState<AdvanceRentResponse[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    advanceRentsApi
      .getExpiring()
      .then(setRecords)
      .catch(() => setRecords([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title='Rents Expiring Soon'
        subheader='Advance periods ending within 2 months'
        action={
          !loading && records.length > 0 ? (
            <Chip label={records.length} size='small' color='warning' variant='tonal' />
          ) : undefined
        }
      />
      <Divider />
      {/* The list is capped and scrolls. It sits in a four-card row on the dashboard, and the
          record count is unbounded — one card that grows with its data stretches every card
          beside it, so a busy month turned the whole row into three mostly-empty cards. The
          header chip carries the true total, so nothing is hidden without a signal. */}
      <CardContent sx={{ flex: 1, p: 0, maxHeight: LIST_MAX_HEIGHT, overflowY: 'auto', '&:last-child': { pb: 0 } }}>
        {loading && (
          <Box className='flex flex-col gap-3 p-4'>
            {[0, 1, 2].map(i => (
              <Skeleton key={i} variant='rectangular' height={48} sx={{ borderRadius: 1 }} />
            ))}
          </Box>
        )}

        {!loading && records.length === 0 && (
          <Box className='flex flex-col items-center py-10 gap-2 text-center px-6'>
            <i className='ri-calendar-check-line text-5xl' style={{ opacity: 0.25 }} />
            <Typography color='text.secondary' variant='body2'>
              No advance rents expiring soon.
            </Typography>
          </Box>
        )}

        {!loading &&
          records.map((r, idx) => (
            <Box key={r.id}>
              {idx > 0 && <Divider />}
              <Link href={`/occupants/${r.occupantId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Box
                  className='flex items-center justify-between gap-3 px-6 py-3'
                  sx={{ '&:hover': { bgcolor: 'action.hover' }, cursor: 'pointer' }}
                >
                  <Box className='min-w-0'>
                    <Typography variant='body2' className='font-medium truncate' color='text.primary'>
                      {r.occupantName ?? 'Unknown occupant'}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' className='truncate'>
                      {[r.propertyName, r.unitNo].filter(Boolean).join(' · ') || '—'}
                    </Typography>
                    <Typography variant='caption' color='text.disabled' className='block'>
                      Ends {fmt(r.periodEnd)}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${r.monthsRemaining} mo${r.monthsRemaining !== 1 ? 's' : ''} left`}
                    size='small'
                    color='warning'
                    variant='tonal'
                    sx={{ flexShrink: 0 }}
                  />
                </Box>
              </Link>
            </Box>
          ))}
      </CardContent>
    </Card>
  )
}

export default RentsExpiringSoonCard
