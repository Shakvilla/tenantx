'use client'

import { useState, useEffect } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { utilitiesApi } from '@/lib/api/utilities'
import type {
  UtilityMeterResponse, UtilityBillResponse,
  BillSplitMethod, ManualSplit
} from '@/types/utility'

type Props = {
  open:      boolean
  meter:     UtilityMeterResponse
  onClose:   () => void
  onCreated: (bill: UtilityBillResponse) => void
}

function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <Box className='flex items-center gap-2 mbe-3'>
      <i className={`${icon} text-base`} style={{ color: 'var(--mui-palette-primary-main)' }} />
      <Typography variant='caption' fontWeight={600}
        sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
  )
}

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10)
}

function firstOfMonth() {
  const now = new Date()
  return toDateInput(new Date(now.getFullYear(), now.getMonth(), 1))
}

function lastOfMonth() {
  const now = new Date()
  return toDateInput(new Date(now.getFullYear(), now.getMonth() + 1, 0))
}

export default function RecordBillDialog({ open, meter, onClose, onCreated }: Props) {
  const [periodStart,     setPeriodStart]     = useState(firstOfMonth())
  const [periodEnd,       setPeriodEnd]       = useState(lastOfMonth())
  const [prevReading,     setPrevReading]     = useState('')
  const [currReading,     setCurrReading]     = useState('')
  const [amount,          setAmount]          = useState('')
  const [splitMethod,     setSplitMethod]     = useState<BillSplitMethod>(meter.splitMethod)
  const [manualSplits,    setManualSplits]    = useState<ManualSplit[]>([])
  const [notes,           setNotes]           = useState('')
  const [saving,          setSaving]          = useState(false)
  const [saveErr,         setSaveErr]         = useState<string | null>(null)
  const [errors,          setErrors]          = useState<{ amount?: boolean; splits?: boolean }>({})

  // Initialise manual splits when meter units or split method changes
  useEffect(() => {
    if (splitMethod === 'MANUAL') {
      setManualSplits(
        meter.units.map(u => ({ unitId: u.unitId, amount: 0 }))
      )
    }
  }, [splitMethod, meter.units])

  useEffect(() => {
    if (open) {
      setPeriodStart(firstOfMonth())
      setPeriodEnd(lastOfMonth())
      setPrevReading('')
      setCurrReading('')
      setAmount('')
      setSplitMethod(meter.splitMethod)
      setNotes('')
      setSaveErr(null)
      setErrors({})
    }
  }, [open, meter.splitMethod])

  function updateManualSplit(unitId: string, value: string) {
    const num = parseFloat(value) || 0
    setManualSplits(prev => prev.map(s => s.unitId === unitId ? { ...s, amount: num } : s))
    setErrors(prev => ({ ...prev, splits: false }))
  }

  function validateManualSplits(): boolean {
    const total = manualSplits.reduce((s, m) => s + m.amount, 0)
    const billTotal = parseFloat(amount) || 0
    // Allow up to ±1 GHS tolerance for manual entry rounding
    return Math.abs(total - billTotal) < 1
  }

  async function handleSave() {
    const amtNum = parseFloat(amount)
    const errs: { amount?: boolean; splits?: boolean } = {}
    if (!amount || isNaN(amtNum) || amtNum <= 0) errs.amount = true
    if (splitMethod === 'MANUAL' && !validateManualSplits()) errs.splits = true
    if (errs.amount || errs.splits) { setErrors(errs); return }

    setSaving(true)
    setSaveErr(null)
    try {
      const bill = await utilitiesApi.createBill({
        meterId:            meter.id,
        billingPeriodStart: periodStart,
        billingPeriodEnd:   periodEnd,
        previousReading:    prevReading ? parseFloat(prevReading) : undefined,
        currentReading:     currReading ? parseFloat(currReading) : undefined,
        amount:             amtNum,
        splitMethod,
        manualSplits:       splitMethod === 'MANUAL' ? manualSplits : undefined,
        notes:              notes || undefined,
      })
      onCreated(bill)
    } catch (err: any) {
      setSaveErr(err?.response?.data?.message ?? err?.message ?? 'Failed to record bill')
    } finally {
      setSaving(false)
    }
  }

  const manualTotal = manualSplits.reduce((s, m) => s + m.amount, 0)
  const billTotal   = parseFloat(amount) || 0
  const splitOk     = splitMethod !== 'MANUAL' || Math.abs(manualTotal - billTotal) < 1

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth='sm' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>Record Bill — {meter.meterNumber}</span>
        <IconButton size='small' onClick={onClose} disabled={saving}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box className='flex flex-col gap-5 mbs-2'>
          {saveErr && <Alert severity='error' onClose={() => setSaveErr(null)}>{saveErr}</Alert>}

          {/* Billing period */}
          <Box>
            <SectionLabel icon='ri-calendar-line' label='Billing Period' />
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  size='small' fullWidth type='date' label='Period Start'
                  value={periodStart}
                  onChange={e => setPeriodStart(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  size='small' fullWidth type='date' label='Period End'
                  value={periodEnd}
                  onChange={e => setPeriodEnd(e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Meter readings */}
          <Box>
            <SectionLabel icon='ri-dashboard-line' label='Meter Readings (optional)' />
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  size='small' fullWidth type='number' label='Previous Reading'
                  placeholder='e.g. 1240'
                  value={prevReading}
                  onChange={e => setPrevReading(e.target.value)}
                  slotProps={{ input: { endAdornment: <InputAdornment position='end'>units</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  size='small' fullWidth type='number' label='Current Reading'
                  placeholder='e.g. 1540'
                  value={currReading}
                  onChange={e => setCurrReading(e.target.value)}
                  slotProps={{ input: { endAdornment: <InputAdornment position='end'>units</InputAdornment> } }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Amount & split */}
          <Box>
            <SectionLabel icon='ri-money-cedi-circle-line' label='Amount & Split' />
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  size='small' fullWidth required type='number' label='Bill Amount'
                  placeholder='0.00'
                  value={amount}
                  onChange={e => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: false })) }}
                  error={errors.amount}
                  helperText={errors.amount ? 'Enter a valid amount' : ''}
                  slotProps={{ input: { startAdornment: <InputAdornment position='start'>GHS</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select size='small' fullWidth label='Split Method'
                  value={splitMethod}
                  onChange={e => setSplitMethod(e.target.value as BillSplitMethod)}
                  helperText={`Default from meter: ${meter.splitMethod}`}
                >
                  <MenuItem value='EQUAL'>Equal split</MenuItem>
                  <MenuItem value='MANUAL'>Manual (per-unit amounts)</MenuItem>
                  <MenuItem value='BY_OCCUPANT'>By occupant count</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>

          {/* Manual split per-unit inputs */}
          {splitMethod === 'MANUAL' && meter.units.length > 0 && (
            <>
              <Divider />
              <Box>
                <SectionLabel icon='ri-scales-line' label='Per-unit Amounts' />
                {errors.splits && (
                  <Alert severity='warning' sx={{ mb: 2 }}>
                    Split amounts must add up to the bill total (GHS {billTotal.toFixed(2)}).
                    Current total: GHS {manualTotal.toFixed(2)}.
                  </Alert>
                )}
                <Box className='flex flex-col gap-3'>
                  {meter.units.map(unit => {
                    const split = manualSplits.find(s => s.unitId === unit.unitId)
                    return (
                      <Box key={unit.unitId} className='flex items-center gap-3'>
                        <Typography variant='body2' sx={{ minWidth: 80 }}>
                          Unit {unit.unitNo}
                        </Typography>
                        <TextField
                          size='small' type='number' label='Amount'
                          placeholder='0.00'
                          value={split?.amount ?? 0}
                          onChange={e => updateManualSplit(unit.unitId, e.target.value)}
                          slotProps={{ input: { startAdornment: <InputAdornment position='start'>GHS</InputAdornment> } }}
                          sx={{ flex: 1 }}
                        />
                      </Box>
                    )
                  })}
                  <Box className='flex justify-end'>
                    <Typography variant='caption' color={splitOk ? 'success.main' : 'warning.main'}>
                      Total: GHS {manualTotal.toFixed(2)} / GHS {billTotal.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </>
          )}

          {/* Notes */}
          <Divider />
          <Box>
            <SectionLabel icon='ri-file-text-line' label='Notes (optional)' />
            <TextField
              size='small' fullWidth multiline rows={2}
              placeholder='Any notes about this bill…'
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained' onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='ri-file-list-3-line' />}
        >
          {saving ? 'Saving…' : 'Record Bill'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
