'use client'

import { useEffect, useState } from 'react'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'

import { getUnitPriceHistory } from '@/lib/api/units'
import type { UnitPriceChangeLog } from '@/lib/api/units'
import { formatCurrency } from '@/utils/currency'

const HEADERS = ['Date', 'Old Price', 'New Price', 'Changed By', 'Reason']

const UnitPriceHistoryTab = ({ unitId }: { unitId: string }) => {
  const [rows, setRows] = useState<UnitPriceChangeLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    setLoading(true)
    getUnitPriceHistory(unitId)
      .then(data => {
        if (active) setRows(data)
      })
      .catch(() => {
        // A failed read means there is nothing to show here, not a page-breaking error.
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
      <CardHeader title='Price Change History' subheader='Every rent change recorded for this unit' />
      <CardContent>
        {loading ? (
          <Box className='flex flex-col gap-2'>
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant='text' height={28} />
            ))}
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <i className='ri-price-tag-3-line' style={{ fontSize: '2.5rem', color: 'var(--mui-palette-text-disabled)' }} />
            <Typography color='text.secondary' sx={{ mt: 1 }}>No price changes for this unit yet</Typography>
          </Box>
        ) : (
          <Box component='table' sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <Box component='thead'>
              <Box component='tr' sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                {HEADERS.map(h => (
                  <Box
                    component='th'
                    key={h}
                    sx={{
                      px: 2,
                      py: 1.5,
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}
                  >
                    {h}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component='tbody'>
              {rows.map(r => (
                <Box
                  component='tr'
                  key={r.id}
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Box component='td' sx={{ px: 2, py: 1.5 }}>
                    <Typography variant='body2' color='text.secondary'>
                      {r.effectiveDate ? new Date(r.effectiveDate).toLocaleDateString() : '—'}
                    </Typography>
                  </Box>
                  <Box component='td' sx={{ px: 2, py: 1.5 }}>
                    <Typography variant='body2'>{formatCurrency(r.oldRent, r.currency)}</Typography>
                  </Box>
                  <Box component='td' sx={{ px: 2, py: 1.5 }}>
                    <Typography variant='body2' fontWeight={600}>
                      {formatCurrency(r.newRent, r.currency)}
                    </Typography>
                  </Box>
                  <Box component='td' sx={{ px: 2, py: 1.5 }}>
                    <Typography variant='body2'>{r.changedBy || '—'}</Typography>
                  </Box>
                  <Box component='td' sx={{ px: 2, py: 1.5 }}>
                    <Typography variant='body2' color='text.secondary'>
                      {r.reason || '—'}
                    </Typography>
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

export default UnitPriceHistoryTab
