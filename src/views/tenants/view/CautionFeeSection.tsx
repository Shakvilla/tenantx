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
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import InputAdornment from '@mui/material/InputAdornment'
import Collapse from '@mui/material/Collapse'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

// API
import { cautionFeesApi } from '@/lib/api/cautionFees'
import { inspectionsApi } from '@/lib/api/inspections'
import type {
  CautionFeeResponse,
  CautionFeeStatus,
  DeductionReason,
} from '@/types/cautionFee'
import type { InspectionSummary } from '@/types/inspection'
import AddCautionFeeDrawer from './AddCautionFeeDrawer'

type Props = {
  occupantId: string
  unitId?: string
  propertyId?: string
}

// ---- helpers ---------------------------------------------------------------

const statusColor = (s: CautionFeeStatus) => {
  switch (s) {
    case 'HELD':                return 'info'
    case 'PARTIALLY_REFUNDED':  return 'warning'
    case 'REFUNDED':            return 'success'
    case 'FORFEITED':           return 'error'
    default:                    return 'default'
  }
}

const statusLabel: Record<CautionFeeStatus, string> = {
  HELD:                'Held',
  PARTIALLY_REFUNDED:  'Partly Refunded',
  REFUNDED:            'Refunded',
  FORFEITED:           'Forfeited',
}

const methodLabel: Record<string, string> = {
  MOBILE_MONEY:  'Mobile Money',
  CASH:          'Cash',
  CHEQUE:        'Cheque',
  BANK_TRANSFER: 'Bank Transfer',
}

const reasonLabel: Record<DeductionReason, string> = {
  DAMAGE:      'Damage',
  CLEANING:    'Cleaning',
  UNPAID_RENT: 'Unpaid Rent',
  OTHER:       'Other',
}

const DEDUCTION_REASONS: { value: DeductionReason; label: string }[] = [
  { value: 'DAMAGE',       label: 'Property Damage' },
  { value: 'CLEANING',     label: 'Cleaning Costs' },
  { value: 'UNPAID_RENT',  label: 'Unpaid Rent' },
  { value: 'OTHER',        label: 'Other' },
]

const fmt = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const ghsFmt = (n: number) =>
  `₵${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ---- component -------------------------------------------------------------

const CautionFeeSection = ({ occupantId, unitId, propertyId }: Props) => {
  const [records,       setRecords]       = useState<CautionFeeResponse[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)
  const [drawerOpen,    setDrawerOpen]    = useState(false)
  const [expanded,      setExpanded]      = useState<Record<string, boolean>>({})

  // Deduction dialog
  const [deductOpen,        setDeductOpen]        = useState(false)
  const [deductId,          setDeductId]          = useState<string | null>(null)
  const [deductAmt,         setDeductAmt]         = useState('')
  const [deductReason,      setDeductReason]      = useState<DeductionReason>('DAMAGE')
  const [deductDesc,        setDeductDesc]        = useState('')
  const [deductLoading,     setDeductLoading]     = useState(false)
  const [deductInspectionId, setDeductInspectionId] = useState<string>('')
  const [completedInspections, setCompletedInspections] = useState<InspectionSummary[]>([])

  // Refund dialog
  const [refundOpen,    setRefundOpen]    = useState(false)
  const [refundId,      setRefundId]      = useState<string | null>(null)
  const [refundAmt,     setRefundAmt]     = useState('')
  const [refundNotes,   setRefundNotes]   = useState('')
  const [refundLoading, setRefundLoading] = useState(false)

  // Forfeit
  const [forfeitLoading, setForfeitLoading] = useState<string | null>(null)

  const fetchRecords = useCallback(() => {
    setLoading(true); setError(null)
    cautionFeesApi.getByOccupant(occupantId)
      .then(setRecords)
      .catch(err => setError(err?.message ?? 'Failed to load caution fee records'))
      .finally(() => setLoading(false))
  }, [occupantId])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const toggleExpand = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  // ---- deduction ----

  const openDeductDialog = (id: string) => {
    setDeductId(id); setDeductAmt(''); setDeductReason('DAMAGE'); setDeductDesc('')
    setDeductInspectionId('')
    setDeductOpen(true)
    // Load completed inspections for this unit so the user can link one
    if (unitId) {
      inspectionsApi.getCompletedByUnit(unitId)
        .then(setCompletedInspections)
        .catch(() => setCompletedInspections([]))
    }
  }

  const handleDeduct = async () => {
    if (!deductId || !deductAmt || parseFloat(deductAmt) <= 0) return
    setDeductLoading(true)
    try {
      const updated = await cautionFeesApi.addDeduction(deductId, {
        amount: parseFloat(deductAmt),
        reason: deductReason,
        description: deductDesc || undefined,
        inspectionId: deductInspectionId || undefined,
      })
      setRecords(prev => prev.map(r => r.id === deductId ? updated : r))
      setDeductOpen(false)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to add deduction')
      setDeductOpen(false)
    } finally {
      setDeductLoading(false)
    }
  }

  // ---- refund ----

  const openRefundDialog = (id: string) => {
    const record = records.find(r => r.id === id)
    setRefundId(id)
    setRefundAmt(record ? record.refundableAmount.toFixed(2) : '')
    setRefundNotes('')
    setRefundOpen(true)
  }

  const handleRefund = async () => {
    if (!refundId) return
    setRefundLoading(true)
    try {
      const updated = await cautionFeesApi.processRefund(refundId, {
        amount: refundAmt ? parseFloat(refundAmt) : undefined,
        notes: refundNotes || undefined,
      })
      setRecords(prev => prev.map(r => r.id === refundId ? updated : r))
      setRefundOpen(false)
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to process refund')
      setRefundOpen(false)
    } finally {
      setRefundLoading(false)
    }
  }

  // ---- forfeit ----

  const handleForfeit = async (id: string) => {
    if (!confirm('Forfeit this caution fee? The tenant will not receive a refund.')) return
    setForfeitLoading(id)
    try {
      const updated = await cautionFeesApi.forfeit(id)
      setRecords(prev => prev.map(r => r.id === id ? updated : r))
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to forfeit')
    } finally {
      setForfeitLoading(null)
    }
  }

  const isActive = (r: CautionFeeResponse) =>
    r.status === 'HELD' || r.status === 'PARTIALLY_REFUNDED'

  return (
    <>
      <Card elevation={0}>
        <CardHeader
          title={
            <Box className='flex items-center gap-2'>
              <i className='ri-shield-check-line text-xl' />
              <span>Caution Fee</span>
            </Box>
          }
          subheader='Security deposit collected at start of tenancy'
          action={
            <Button
              size='small'
              variant='contained'
              startIcon={<i className='ri-add-line' />}
              onClick={() => setDrawerOpen(true)}
            >
              Record Fee
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
              <i className='ri-shield-check-line text-5xl' style={{ opacity: 0.25 }} />
              <Typography color='text.secondary' variant='body2'>
                No caution fee recorded yet.
              </Typography>
              <Button
                size='small'
                variant='outlined'
                startIcon={<i className='ri-add-line' />}
                onClick={() => setDrawerOpen(true)}
                sx={{ mt: 1 }}
              >
                Record Caution Fee
              </Button>
            </Box>
          )}

          {!loading && records.map((r, idx) => (
            <Box key={r.id}>
              {idx > 0 && <Divider />}

              <Box className='px-6 py-5 flex flex-col gap-3'>
                {/* Header row */}
                <Box className='flex items-start justify-between gap-3'>
                  <Box>
                    <Box className='flex items-center gap-2 mb-1'>
                      <Typography variant='body1' className='font-semibold'>
                        {ghsFmt(r.amount)}
                      </Typography>
                      <Chip
                        label={statusLabel[r.status]}
                        size='small'
                        color={statusColor(r.status)}
                        variant='tonal'
                      />
                    </Box>
                    <Typography variant='caption' color='text.secondary'>
                      Collected {fmt(r.collectedAt)}
                      {r.refundedAt && ` · Refunded ${fmt(r.refundedAt)}`}
                    </Typography>
                  </Box>

                  {/* Action buttons */}
                  {isActive(r) && (
                    <Box className='flex items-center gap-1'>
                      <Tooltip title='Add deduction'>
                        <IconButton size='small' onClick={() => openDeductDialog(r.id)}>
                          <i className='ri-subtract-line text-base' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Process refund'>
                        <IconButton size='small' color='success' onClick={() => openRefundDialog(r.id)}>
                          <i className='ri-refund-line text-base' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Forfeit (tenant forfeits deposit)'>
                        <span>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleForfeit(r.id)}
                            disabled={forfeitLoading === r.id}
                          >
                            {forfeitLoading === r.id
                              ? <CircularProgress size={14} />
                              : <i className='ri-close-circle-line text-base' />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  )}
                </Box>

                {/* Amounts breakdown */}
                <Box className='grid grid-cols-3 gap-3'>
                  <Box sx={{ bgcolor: 'action.hover', borderRadius: 1.5, p: 1.5 }}>
                    <Typography variant='caption' color='text.secondary' display='block'>Original</Typography>
                    <Typography variant='body2' className='font-semibold'>{ghsFmt(r.amount)}</Typography>
                  </Box>
                  <Box sx={{ bgcolor: r.totalDeductions > 0 ? 'error.lightOpacity' : 'action.hover', borderRadius: 1.5, p: 1.5 }}>
                    <Typography variant='caption' color='text.secondary' display='block'>Deductions</Typography>
                    <Typography variant='body2' className='font-semibold' color={r.totalDeductions > 0 ? 'error.main' : 'text.primary'}>
                      -{ghsFmt(r.totalDeductions)}
                    </Typography>
                  </Box>
                  <Box sx={{ bgcolor: 'success.lightOpacity', borderRadius: 1.5, p: 1.5 }}>
                    <Typography variant='caption' color='text.secondary' display='block'>
                      {r.status === 'REFUNDED' ? 'Refunded' : 'Refundable'}
                    </Typography>
                    <Typography variant='body2' className='font-semibold' color='success.main'>
                      {r.status === 'REFUNDED' && r.refundAmount != null
                        ? ghsFmt(r.refundAmount)
                        : ghsFmt(r.refundableAmount)}
                    </Typography>
                  </Box>
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

                {/* Deductions history (collapsible) */}
                {r.deductions.length > 0 && (
                  <Box>
                    <Button
                      size='small'
                      variant='text'
                      onClick={() => toggleExpand(r.id)}
                      startIcon={<i className={`ri-${expanded[r.id] ? 'arrow-up' : 'arrow-down'}-s-line`} />}
                      sx={{ px: 0, minWidth: 0, color: 'text.secondary', fontSize: '0.75rem' }}
                    >
                      {r.deductions.length} deduction{r.deductions.length !== 1 ? 's' : ''}
                    </Button>
                    <Collapse in={expanded[r.id]}>
                      <List dense disablePadding sx={{ mt: 0.5 }}>
                        {r.deductions.map(d => (
                          <ListItem key={d.id} disablePadding sx={{ py: 0.25 }}>
                            <Box className='flex items-center justify-between w-full'>
                              <Box className='flex items-center gap-2'>
                                <i className='ri-arrow-right-s-line text-xs' style={{ color: 'var(--mui-palette-text-disabled)' }} />
                                <ListItemText
                                  primary={
                                    <Typography variant='caption'>
                                      {reasonLabel[d.reason] ?? d.reason}
                                      {d.description ? ` — ${d.description}` : ''}
                                      {d.inspectionId && (
                                        <Chip
                                          label='Inspection'
                                          size='small'
                                          variant='tonal'
                                          color='info'
                                          icon={<i className='ri-file-list-3-line' style={{ fontSize: 10 }} />}
                                          sx={{ ml: 1, fontSize: 10, height: 18 }}
                                        />
                                      )}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography variant='caption' color='text.disabled'>
                                      {fmt(d.deductedAt)}
                                    </Typography>
                                  }
                                />
                              </Box>
                              <Typography variant='caption' color='error.main' className='font-semibold shrink-0 ml-3'>
                                -{ghsFmt(d.amount)}
                              </Typography>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                  </Box>
                )}
              </Box>
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* Add Caution Fee Drawer */}
      <AddCautionFeeDrawer
        open={drawerOpen}
        handleClose={() => setDrawerOpen(false)}
        onCautionFeeRecorded={record => setRecords(prev => [record, ...prev])}
        occupantId={occupantId}
        unitId={unitId}
        propertyId={propertyId}
      />

      {/* Add Deduction Dialog */}
      <Dialog open={deductOpen} onClose={() => setDeductOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Add Deduction</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-4'>
          <TextField
            label='Amount'
            type='number'
            value={deductAmt}
            onChange={e => setDeductAmt(e.target.value)}
            fullWidth
            required
            autoFocus
            slotProps={{ input: { startAdornment: <InputAdornment position='start'>₵</InputAdornment> } }}
          />
          <TextField
            label='Reason'
            select
            value={deductReason}
            onChange={e => setDeductReason(e.target.value as DeductionReason)}
            fullWidth
          >
            {DEDUCTION_REASONS.map(r => (
              <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
            ))}
          </TextField>
          <TextField
            label='Description (optional)'
            value={deductDesc}
            onChange={e => setDeductDesc(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder='e.g. Broken window in bedroom 2'
          />
          {completedInspections.length > 0 && (
            <TextField
              label='Link to Inspection (optional)'
              select
              value={deductInspectionId}
              onChange={e => setDeductInspectionId(e.target.value)}
              fullWidth
              helperText='Attach a completed inspection that documents this damage'
            >
              <MenuItem value=''>— None —</MenuItem>
              {completedInspections.map(ins => (
                <MenuItem key={ins.id} value={ins.id}>
                  {ins.type === 'MOVE_IN' ? 'Move-In' : 'Move-Out'}
                  {ins.inspectionDate ? ` · ${new Date(ins.inspectionDate).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })}` : ''}
                  {ins.inspectorName ? ` · ${ins.inspectorName}` : ''}
                </MenuItem>
              ))}
            </TextField>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeductOpen(false)} disabled={deductLoading}>Cancel</Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleDeduct}
            disabled={deductLoading || !deductAmt || parseFloat(deductAmt) <= 0}
            startIcon={deductLoading ? <CircularProgress size={14} /> : <i className='ri-subtract-line' />}
          >
            {deductLoading ? 'Saving…' : 'Add Deduction'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Process Refund Dialog */}
      <Dialog open={refundOpen} onClose={() => setRefundOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Process Refund</DialogTitle>
        <DialogContent className='flex flex-col gap-4 pt-4'>
          {refundId && (() => {
            const record = records.find(r => r.id === refundId)
            return record ? (
              <Alert severity='info' sx={{ mb: 1 }}>
                Refundable: <strong>{ghsFmt(record.refundableAmount)}</strong>
                {record.totalDeductions > 0 && (
                  <> (after {ghsFmt(record.totalDeductions)} in deductions)</>
                )}
              </Alert>
            ) : null
          })()}
          <TextField
            label='Refund Amount'
            type='number'
            value={refundAmt}
            onChange={e => setRefundAmt(e.target.value)}
            fullWidth
            slotProps={{ input: { startAdornment: <InputAdornment position='start'>₵</InputAdornment> } }}
            helperText='Leave as-is to refund the full refundable amount'
          />
          <TextField
            label='Notes (optional)'
            value={refundNotes}
            onChange={e => setRefundNotes(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRefundOpen(false)} disabled={refundLoading}>Cancel</Button>
          <Button
            variant='contained'
            color='success'
            onClick={handleRefund}
            disabled={refundLoading}
            startIcon={refundLoading ? <CircularProgress size={14} /> : <i className='ri-refund-line' />}
          >
            {refundLoading ? 'Processing…' : 'Confirm Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default CautionFeeSection
