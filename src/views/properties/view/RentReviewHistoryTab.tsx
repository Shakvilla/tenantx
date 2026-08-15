'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'

import { rentReviewsApi } from '@/lib/api/rentReviews'
import type { RentReviewSummary, RentReviewStatus } from '@/types/rentReview'
import { formatCurrency } from '@/utils/currency'

const statusColor = (s: RentReviewStatus): 'default' | 'warning' | 'info' | 'success' | 'error' => {
  switch (s) {
    case 'PENDING':
      return 'warning'
    case 'NOTIFIED':
      return 'info'
    case 'APPLIED':
      return 'success'
    case 'CANCELLED':
      return 'error'
    default:
      return 'default'
  }
}

const RentReviewHistoryTab = ({ unitId }: { unitId: string }) => {
  const [rows, setRows] = useState<RentReviewSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    rentReviewsApi
      .getAll({ unitId })
      .then(data => {
        if (active) setRows(data)
      })
      .catch(() => {
        // Rent Reviews is a Basic-plan feature; on a plan without it the API returns 402.
        // Treat any failure as "no history to show" rather than surfacing a raw error here.
        if (active) setRows([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [unitId])

  return (
    <Card>
      <CardHeader title='Rent Review History' subheader='Proposed and applied rent changes for this unit' />
      <CardContent>
        {loading ? (
          <Box className='flex flex-col gap-2'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant='text' height={28} />
            ))}
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <i className='ri-line-chart-line' style={{ fontSize: '2.5rem', color: 'var(--mui-palette-text-disabled)' }} />
            <Typography color='text.secondary' sx={{ mt: 1 }}>No rent reviews for this unit yet</Typography>
          </Box>
        ) : (
          <Box component='table' sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component='thead'>
              <Box component='tr' sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                {['Current', 'Proposed', 'Change', 'Effective', 'Status'].map(h => (
                  <Box component='th' key={h} sx={{ px: 2, py: 1.5, textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</Box>
                ))}
              </Box>
            </Box>
            <Box component='tbody'>
              {rows.map(r => (
                <Box component='tr' key={r.id} sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}>
                  <Box component='td' sx={{ px: 2, py: 1.5 }}><Typography variant='body2'>{formatCurrency(r.currentRent)}</Typography></Box>
                  <Box component='td' sx={{ px: 2, py: 1.5 }}><Typography variant='body2' fontWeight={600}>{formatCurrency(r.proposedRent)}</Typography></Box>
                  <Box component='td' sx={{ px: 2, py: 1.5 }}>
                    <Typography variant='body2' color={(r.increasePct ?? 0) >= 0 ? 'success.main' : 'error.main'}>
                      {r.increasePct != null ? `${r.increasePct > 0 ? '+' : ''}${r.increasePct}%` : '—'}
                    </Typography>
                  </Box>
                  <Box component='td' sx={{ px: 2, py: 1.5 }}>
                    <Typography variant='body2' color='text.secondary'>
                      {r.effectiveDate ? new Date(r.effectiveDate).toLocaleDateString() : '—'}
                    </Typography>
                  </Box>
                  <Box component='td' sx={{ px: 2, py: 1.5 }}>
                    <Chip label={r.status} size='small' color={statusColor(r.status)} variant='tonal' />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default RentReviewHistoryTab
