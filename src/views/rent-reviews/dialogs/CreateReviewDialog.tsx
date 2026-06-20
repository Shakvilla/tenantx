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

import { rentReviewsApi } from '@/lib/api/rentReviews'
import { getProperties } from '@/lib/api/properties'
import { getUnitsByProperty } from '@/lib/api/units'
import { getStoredTenantId } from '@/lib/api/storage'
import type { RentReviewResponse } from '@/types/rentReview'
import type { Unit } from '@/types/property'

type Props = {
  open:      boolean
  onClose:   () => void
  onCreated: (review: RentReviewResponse) => void
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

function oneYearFromNow(): string {
  const d = new Date()
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().slice(0, 10)
}

export default function CreateReviewDialog({ open, onClose, onCreated }: Props) {
  const [propertyId,    setPropertyId]    = useState('')
  const [unitId,        setUnitId]        = useState('')
  const [proposedRent,  setProposedRent]  = useState('')
  const [effectiveDate, setEffectiveDate] = useState(oneYearFromNow())
  const [notes,         setNotes]         = useState('')
  const [saving,        setSaving]        = useState(false)
  const [saveErr,       setSaveErr]       = useState<string | null>(null)
  const [errors,        setErrors]        = useState<{ unitId?: boolean; proposedRent?: boolean }>({})

  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [units,      setUnits]      = useState<Unit[]>([])
  const [unitsLoading, setUnitsLoading] = useState(false)

  // current rent shown from selected unit
  const selectedUnit = units.find(u => u.id === unitId)
  const currentRent  = selectedUnit?.rent ?? null

  // computed increase
  const proposed = parseFloat(proposedRent)
  const pct = currentRent && proposed > 0 && currentRent > 0
    ? (((proposed - currentRent) / currentRent) * 100).toFixed(1)
    : null

  useEffect(() => {
    if (open) {
      setPropertyId('')
      setUnitId('')
      setProposedRent('')
      setEffectiveDate(oneYearFromNow())
      setNotes('')
      setSaveErr(null)
      setErrors({})
      setUnits([])

      const tenantId = getStoredTenantId()
      if (tenantId) {
        getProperties(tenantId, { size: 200 })
          .then((res: any) => setProperties(res?.data ?? []))
          .catch(() => {})
      }
    }
  }, [open])

  useEffect(() => {
    if (!propertyId) { setUnits([]); setUnitId(''); return }
    const tenantId = getStoredTenantId()
    if (!tenantId) return
    setUnitsLoading(true)
    setUnitId('')
    getUnitsByProperty(tenantId, propertyId, { size: 200 })
      .then((res: any) => setUnits(res?.data ?? []))
      .catch(() => setUnits([]))
      .finally(() => setUnitsLoading(false))
  }, [propertyId])

  async function handleSave() {
    const errs: { unitId?: boolean; proposedRent?: boolean } = {}
    if (!unitId) errs.unitId = true
    const amt = parseFloat(proposedRent)
    if (!proposedRent || isNaN(amt) || amt <= 0) errs.proposedRent = true
    if (errs.unitId || errs.proposedRent) { setErrors(errs); return }

    setSaving(true)
    setSaveErr(null)
    try {
      const review = await rentReviewsApi.create({
        unitId,
        proposedRent: amt,
        effectiveDate,
        notes: notes || undefined,
      })
      onCreated(review)
    } catch (err: any) {
      setSaveErr(err?.response?.data?.message ?? err?.message ?? 'Failed to create review')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth='sm' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>New Rent Review</span>
        <IconButton size='small' onClick={onClose} disabled={saving}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box className='flex flex-col gap-5 mbs-2'>
          {saveErr && <Alert severity='error' onClose={() => setSaveErr(null)}>{saveErr}</Alert>}

          {/* Unit selection */}
          <Box>
            <SectionLabel icon='ri-door-line' label='Select Unit' />
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select size='small' fullWidth label='Property'
                  value={propertyId}
                  onChange={e => setPropertyId(e.target.value)}
                >
                  {properties.length === 0
                    ? <MenuItem disabled>Loading…</MenuItem>
                    : properties.map((p: any) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))
                  }
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select size='small' fullWidth required label='Unit'
                  value={unitId}
                  onChange={e => { setUnitId(e.target.value); setErrors(prev => ({ ...prev, unitId: false })) }}
                  disabled={!propertyId || unitsLoading}
                  error={errors.unitId}
                  helperText={errors.unitId ? 'Select a unit' : unitsLoading ? 'Loading units…' : ''}
                >
                  {units.length === 0
                    ? <MenuItem disabled>{propertyId ? 'No units found' : 'Select a property first'}</MenuItem>
                    : units.map(u => (
                        <MenuItem key={u.id} value={u.id}>
                          Unit {u.unitNo}
                          {u.occupantId ? '' : ' (vacant)'}
                          {' — GHS '}{Number(u.rent).toFixed(2)}
                        </MenuItem>
                      ))
                  }
                </TextField>
              </Grid>
            </Grid>

            {currentRent != null && (
              <Box sx={{ mt: 2, p: 2, borderRadius: 1, background: 'var(--mui-palette-primary-lightOpacity)' }}>
                <Typography variant='body2' color='text.secondary'>
                  Current rent: <strong>GHS {Number(currentRent).toFixed(2)}</strong>
                  {selectedUnit?.occupantId
                    ? ' · Unit is occupied'
                    : ' · Unit is vacant'}
                </Typography>
              </Box>
            )}
          </Box>

          <Divider />

          {/* Proposed rent */}
          <Box>
            <SectionLabel icon='ri-money-cedi-circle-line' label='Proposed New Rent' />
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  size='small' fullWidth required type='number'
                  label='New Monthly Rent'
                  placeholder='0.00'
                  value={proposedRent}
                  onChange={e => {
                    setProposedRent(e.target.value)
                    setErrors(prev => ({ ...prev, proposedRent: false }))
                  }}
                  error={errors.proposedRent}
                  helperText={errors.proposedRent ? 'Enter a valid amount' : ''}
                  slotProps={{ input: { startAdornment: <InputAdornment position='start'>GHS</InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                {pct !== null && (
                  <Box sx={{ pt: 1 }}>
                    <Typography variant='caption' color='text.secondary'>Increase</Typography>
                    <Typography variant='h6' color={parseFloat(pct) >= 0 ? 'success.main' : 'error.main'}>
                      {parseFloat(pct) >= 0 ? '+' : ''}{pct}%
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      GHS {(proposed - (currentRent ?? 0)).toFixed(2)} / month more
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Effective date */}
          <Box>
            <SectionLabel icon='ri-calendar-check-line' label='Effective Date' />
            <TextField
              size='small' fullWidth type='date'
              label='New rent takes effect from'
              value={effectiveDate}
              onChange={e => setEffectiveDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              helperText='The date from which the new rent will apply'
            />
          </Box>

          <Divider />

          {/* Notes */}
          <Box>
            <SectionLabel icon='ri-file-text-line' label='Notes (optional)' />
            <TextField
              size='small' fullWidth multiline rows={2}
              placeholder='Reason for increase, market rate reference…'
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
          startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='ri-file-chart-line' />}
        >
          {saving ? 'Saving…' : 'Create Review'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
