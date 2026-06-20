'use client'

import { useState, useEffect, useCallback } from 'react'

// MUI
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'

// API
import { advanceRentsApi } from '@/lib/api/advanceRents'
import type { AdvanceRentResponse, AdvanceRentStatus } from '@/types/advanceRent'
import AddAdvanceRentDrawer from './AddAdvanceRentDrawer'

type Props = {
  occupantId: string
  unitId?: string
  propertyId?: string
  monthlyRent?: number
}

const statusColor = (s: AdvanceRentStatus) => {
  switch (s) {
    case 'ACTIVE':    return 'success'
    case 'EXPIRING':  return 'warning'
    case 'EXPIRED':   return 'error'
    case 'CANCELLED': return 'default'
    default:          return 'default'
  }
}

const methodLabel: Record<string, string> = {
  MOBILE_MONEY:  'Mobile Money',
  CASH:          'Cash',
  CHEQUE:        'Cheque',
  BANK_TRANSFER: 'Bank Transfer'
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const AdvanceRentSection = ({ occupantId, unitId, propertyId, monthlyRent }: Props) => {
  const [records, setRecords]       = useState<AdvanceRentResponse[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)

  const fetchRecords = useCallback(() => {
    setLoading(true)
    setError(null)
    advanceRentsApi.getByOccupant(occupantId)
      .then(setRecords)
      .catch(err => setError(err?.message ?? 'Failed to load advance rent records'))
      .finally(() => setLoading(false))
  }, [occupantId])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const handleAdvanceRecorded = (record: AdvanceRentResponse) => {
    setRecords(prev => [record, ...prev])
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this advance rent record?')) return
    setCancelling(id)
    try {
      const updated = await advanceRentsApi.cancel(id)
      setRecords(prev => prev.map(r => r.id === id ? updated : r))
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to cancel')
    } finally {
      setCancelling(null)
    }
  }

  return (
    <>
      <Card elevation={0}>
        <CardHeader
          title={
            <Box className='flex items-center gap-2'>
              <i className='ri-calendar-2-line text-xl' />
              <span>Advance Rent</span>
            </Box>
          }
          subheader='Upfront rent payments covering future periods — invoices and wallet credit auto-applied'
          action={
            <Button
              size='small'
              variant='contained'
              startIcon={<i className='ri-add-line' />}
              onClick={() => setDrawerOpen(true)}
            >
              Record Advance
            </Button>
          }
        />
        <Divider />
        <CardContent className='p-0'>

          {loading && (
            <Box className='flex justify-center py-8'>
              <CircularProgress size={28} />
            </Box>
          )}

          {error && (
            <Box className='px-6 py-4'>
              <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>
            </Box>
          )}

          {!loading && !error && records.length === 0 && (
            <Box className='flex flex-col items-center py-10 gap-2 text-center px-6'>
              <i className='ri-calendar-2-line text-5xl' style={{ opacity: 0.25 }} />
              <Typography color='text.secondary' variant='body2'>
                No advance rent recorded yet.
              </Typography>
              <Button
                size='small'
                variant='outlined'
                startIcon={<i className='ri-add-line' />}
                onClick={() => setDrawerOpen(true)}
                sx={{ mt: 1 }}
              >
                Record First Advance
              </Button>
            </Box>
          )}

          {!loading && records.map((r, idx) => (
            <Box key={r.id}>
              {idx > 0 && <Divider />}

              {/* Status banner */}
              {r.status === 'EXPIRING' && (
                <Box sx={{ bgcolor: 'warning.lightOpacity', px: 6, py: 1.5 }}>
                  <Typography variant='caption' color='warning.main' className='font-medium'>
                    ⚠ Advance expiring in {r.monthsRemaining} month{r.monthsRemaining !== 1 ? 's' : ''} — consider renewing
                  </Typography>
                </Box>
              )}
              {r.status === 'EXPIRED' && (
                <Box sx={{ bgcolor: 'error.lightOpacity', px: 6, py: 1.5 }}>
                  <Typography variant='caption' color='error.main' className='font-medium'>
                    ✕ Advance period has expired
                  </Typography>
                </Box>
              )}

              <Box className='px-6 py-5 flex flex-col gap-4'>
                {/* Header row */}
                <Box className='flex items-start justify-between gap-3'>
                  <Box>
                    <Box className='flex items-center gap-2 mb-1'>
                      <Typography variant='body1' className='font-semibold'>
                        ₵{r.totalAmount.toFixed(2)} advance
                      </Typography>
                      <Chip
                        label={r.status}
                        size='small'
                        color={statusColor(r.status)}
                        variant='tonal'
                      />
                      {r.invoiceCount > 0 && (
                        <Chip
                          icon={<i className='ri-file-list-3-line text-xs' />}
                          label={`${r.invoiceCount} invoice${r.invoiceCount !== 1 ? 's' : ''}`}
                          size='small'
                          variant='outlined'
                          sx={{ fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                    <Typography variant='body2' color='text.secondary'>
                      {r.monthsCovered} months @ ₵{r.monthlyRent.toFixed(2)}/month
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {fmt(r.periodStart)} → {fmt(r.periodEnd)}
                    </Typography>
                  </Box>

                  {/* Cancel action — only for active records */}
                  {(r.status === 'ACTIVE' || r.status === 'EXPIRING') && (
                    <Tooltip title='Cancel advance record'>
                      <span>
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => handleCancel(r.id)}
                          disabled={cancelling === r.id}
                        >
                          {cancelling === r.id
                            ? <CircularProgress size={14} />
                            : <i className='ri-close-circle-line text-base' />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Box>

                {/* Time-based progress bar */}
                <Box>
                  <Box className='flex justify-between mb-1'>
                    <Typography variant='caption' color='text.secondary'>
                      Period progress
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {r.monthsRemaining} month{r.monthsRemaining !== 1 ? 's' : ''} remaining
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant='determinate'
                    value={r.percentageUsed}
                    color={r.status === 'EXPIRING' ? 'warning' : r.status === 'EXPIRED' ? 'error' : 'success'}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                  <Typography variant='caption' color='text.disabled' sx={{ mt: 0.5, display: 'block' }}>
                    {r.percentageUsed}% of period elapsed
                  </Typography>
                </Box>

                {/* Meta row */}
                <Box className='flex flex-wrap gap-x-6 gap-y-1'>
                  {r.paymentMethod && (
                    <Box className='flex items-center gap-1'>
                      <i className='ri-bank-card-line text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }} />
                      <Typography variant='caption' color='text.secondary'>
                        {methodLabel[r.paymentMethod] ?? r.paymentMethod}
                      </Typography>
                    </Box>
                  )}
                  {r.paymentReference && (
                    <Box className='flex items-center gap-1'>
                      <i className='ri-receipt-line text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }} />
                      <Typography variant='caption' color='text.secondary'>
                        Ref: {r.paymentReference}
                      </Typography>
                    </Box>
                  )}
                  {r.notes && (
                    <Box className='flex items-center gap-1'>
                      <i className='ri-sticky-note-line text-sm' style={{ color: 'var(--mui-palette-text-secondary)' }} />
                      <Typography variant='caption' color='text.secondary'>
                        {r.notes}
                      </Typography>
                    </Box>
                  )}
                </Box>

              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>

      <AddAdvanceRentDrawer
        open={drawerOpen}
        handleClose={() => setDrawerOpen(false)}
        onAdvanceRecorded={handleAdvanceRecorded}
        occupantId={occupantId}
        unitId={unitId}
        propertyId={propertyId}
        monthlyRent={monthlyRent}
      />
    </>
  )
}

export default AdvanceRentSection
