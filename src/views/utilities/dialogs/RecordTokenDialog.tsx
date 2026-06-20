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
import type { UtilityMeterResponse, UtilityTokenResponse, PaymentResponsibility } from '@/types/utility'

type Props = {
  open:      boolean
  meter:     UtilityMeterResponse
  onClose:   () => void
  onCreated: (token: UtilityTokenResponse) => void
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

function todayInput() {
  return new Date().toISOString().slice(0, 10)
}

const BLANK = {
  purchasedAt:   todayInput(),
  tokenNumber:   '',
  unitsPurchased: '',
  amountPaid:    '',
  purchasedBy:   'LANDLORD' as PaymentResponsibility,
  notes:         '',
}

export default function RecordTokenDialog({ open, meter, onClose, onCreated }: Props) {
  const [form, setForm]       = useState({ ...BLANK })
  const [saving, setSaving]   = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [amountErr, setAmountErr] = useState(false)

  useEffect(() => {
    if (open) {
      setForm({ ...BLANK })
      setSaveErr(null)
      setAmountErr(false)
    }
  }, [open])

  function field<K extends keyof typeof BLANK>(key: K, value: typeof BLANK[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (key === 'amountPaid') setAmountErr(false)
  }

  async function handleSave() {
    const amt = parseFloat(form.amountPaid)
    if (!form.amountPaid || isNaN(amt) || amt <= 0) { setAmountErr(true); return }

    setSaving(true)
    setSaveErr(null)
    try {
      const token = await utilitiesApi.createToken({
        meterId:        meter.id,
        purchasedAt:    form.purchasedAt,
        tokenNumber:    form.tokenNumber   || undefined,
        unitsPurchased: form.unitsPurchased ? parseFloat(form.unitsPurchased) : undefined,
        amountPaid:     amt,
        purchasedBy:    form.purchasedBy,
        notes:          form.notes         || undefined,
      })
      onCreated(token)
    } catch (err: any) {
      setSaveErr(err?.response?.data?.message ?? err?.message ?? 'Failed to record token')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth='xs' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <Box className='flex items-center gap-2'>
          <i className='ri-flashlight-line' style={{ color: '#FFB347' }} />
          <span>Record Token Top-up</span>
        </Box>
        <IconButton size='small' onClick={onClose} disabled={saving}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box className='flex flex-col gap-5 mbs-2'>
          {saveErr && <Alert severity='error' onClose={() => setSaveErr(null)}>{saveErr}</Alert>}

          {/* Meter tag */}
          <Box sx={{ p: 2, borderRadius: 1, background: 'var(--mui-palette-primary-lightOpacity)' }}>
            <Typography variant='body2' color='text.secondary'>
              Meter: <strong>{meter.meterNumber}</strong>
              {meter.propertyName && ` · ${meter.propertyName}`}
            </Typography>
          </Box>

          {/* Purchase date */}
          <Box>
            <SectionLabel icon='ri-calendar-line' label='Purchase Date' />
            <TextField
              size='small' fullWidth type='date'
              value={form.purchasedAt}
              onChange={e => field('purchasedAt', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <Divider />

          {/* Token details */}
          <Box>
            <SectionLabel icon='ri-barcode-line' label='Token Details' />
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  size='small' fullWidth required type='number'
                  label='Amount Paid'
                  placeholder='0.00'
                  value={form.amountPaid}
                  onChange={e => field('amountPaid', e.target.value)}
                  error={amountErr}
                  helperText={amountErr ? 'Enter the amount paid' : ''}
                  slotProps={{ input: { startAdornment: <InputAdornment position='start'>GHS</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  size='small' fullWidth type='number'
                  label='Units Purchased (kWh)'
                  placeholder='e.g. 50'
                  value={form.unitsPurchased}
                  onChange={e => field('unitsPurchased', e.target.value)}
                  helperText='Optional — enter kWh shown on the voucher'
                  slotProps={{ input: { endAdornment: <InputAdornment position='end'>kWh</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  size='small' fullWidth
                  label='Token Number'
                  placeholder='e.g. 1234-5678-9012-3456'
                  value={form.tokenNumber}
                  onChange={e => field('tokenNumber', e.target.value)}
                  helperText='Optional — the 20-digit code on the voucher'
                  slotProps={{ input: { style: { fontFamily: 'monospace' } } }}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Who purchased */}
          <Box>
            <SectionLabel icon='ri-user-line' label='Purchased By' />
            <TextField
              select size='small' fullWidth
              value={form.purchasedBy}
              onChange={e => field('purchasedBy', e.target.value as PaymentResponsibility)}
            >
              <MenuItem value='LANDLORD'>Landlord</MenuItem>
              <MenuItem value='CARETAKER'>Caretaker</MenuItem>
              <MenuItem value='TENANT'>Tenant</MenuItem>
            </TextField>
          </Box>

          {/* Notes */}
          <Divider />
          <Box>
            <SectionLabel icon='ri-file-text-line' label='Notes (optional)' />
            <TextField
              size='small' fullWidth multiline rows={2}
              placeholder='Any notes about this top-up…'
              value={form.notes}
              onChange={e => field('notes', e.target.value)}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained' color='warning' onClick={handleSave} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='ri-flashlight-line' />}
        >
          {saving ? 'Saving…' : 'Record Top-up'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
