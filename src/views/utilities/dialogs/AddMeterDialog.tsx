'use client'

import { useState, useEffect } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { utilitiesApi } from '@/lib/api/utilities'
import { getProperties } from '@/lib/api/properties'
import { getUnitsByProperty } from '@/lib/api/units'
import { getStoredTenantId } from '@/lib/api/storage'
import type { Unit } from '@/types/property'
import type {
  UtilityMeterResponse, UtilityType, MeterType,
  PaymentResponsibility, BillSplitMethod
} from '@/types/utility'

type Props = {
  open:      boolean
  onClose:   () => void
  onCreated: (meter: UtilityMeterResponse) => void
}

function SectionLabel({ icon, label, hint }: { icon: string; label: string; hint?: string }) {
  return (
    <Box className='flex items-center gap-2 mbe-3'>
      <i className={`${icon} text-base`} style={{ color: 'var(--mui-palette-primary-main)' }} />
      <Typography variant='caption' fontWeight={600}
        sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
        {label}
      </Typography>
      {hint && (
        <Tooltip title={hint} arrow>
          <i className='ri-information-line text-sm' style={{ color: 'var(--mui-palette-text-disabled)', cursor: 'default' }} />
        </Tooltip>
      )}
    </Box>
  )
}

type UnitScope = 'all' | 'some'

const BLANK = {
  propertyId:            '',
  meterNumber:           '',
  utilityType:           'ELECTRICITY' as UtilityType,
  meterType:             'POSTPAID'    as MeterType,
  paymentResponsibility: 'LANDLORD'   as PaymentResponsibility,
  splitMethod:           'EQUAL'       as BillSplitMethod,
  notes:                 '',
}

export default function AddMeterDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm]         = useState({ ...BLANK })
  const [errors, setErrors]     = useState<{ propertyId?: boolean; meterNumber?: boolean }>({})
  const [saving, setSaving]     = useState(false)
  const [saveErr, setSaveErr]   = useState<string | null>(null)

  // property list
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])

  // unit selection
  const [units, setUnits]           = useState<Unit[]>([])
  const [unitsLoading, setUnitsLoading] = useState(false)
  const [unitScope, setUnitScope]   = useState<UnitScope>('all')   // 'all' = whole property, 'some' = pick units
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([])

  // ── reset on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setForm({ ...BLANK })
      setErrors({})
      setSaveErr(null)
      setUnits([])
      setUnitScope('all')
      setSelectedUnitIds([])

      const tenantId = getStoredTenantId()
      if (tenantId) {
        getProperties(tenantId, { size: 200 })
          .then((res: any) => setProperties(res?.data ?? []))
          .catch(() => {})
      }
    }
  }, [open])

  // ── load units when property changes ──────────────────────────────────────
  useEffect(() => {
    if (!form.propertyId) { setUnits([]); return }
    const tenantId = getStoredTenantId()
    if (!tenantId) return
    setUnitsLoading(true)
    setSelectedUnitIds([])
    setUnitScope('all')
    getUnitsByProperty(tenantId, form.propertyId, { size: 200 })
      .then((res: any) => setUnits(res?.data ?? []))
      .catch(() => setUnits([]))
      .finally(() => setUnitsLoading(false))
  }, [form.propertyId])

  // ── helpers ───────────────────────────────────────────────────────────────
  function field<K extends keyof typeof BLANK>(key: K, value: typeof BLANK[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value }
      // water is always postpaid
      if (key === 'utilityType' && value === 'WATER') next.meterType = 'POSTPAID'
      return next
    })
    if (key === 'propertyId') setErrors(prev => ({ ...prev, propertyId: false }))
    if (key === 'meterNumber') setErrors(prev => ({ ...prev, meterNumber: false }))
  }

  function toggleUnit(id: string) {
    setSelectedUnitIds(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    )
  }

  // ── save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    const errs = {
      propertyId:  !form.propertyId,
      meterNumber: !form.meterNumber.trim(),
    }
    if (errs.propertyId || errs.meterNumber) { setErrors(errs); return }

    setSaving(true)
    setSaveErr(null)
    try {
      const unitIds = unitScope === 'some' && selectedUnitIds.length > 0
        ? selectedUnitIds
        : undefined   // backend treats absence as "whole property" (no unit link)

      const created = await utilitiesApi.createMeter({
        propertyId:            form.propertyId,
        meterNumber:           form.meterNumber.trim(),
        utilityType:           form.utilityType,
        meterType:             form.meterType,
        paymentResponsibility: form.paymentResponsibility,
        splitMethod:           form.splitMethod,
        notes:                 form.notes || undefined,
        unitIds,
      })
      onCreated(created)
    } catch (err: any) {
      setSaveErr(err?.response?.data?.message ?? err?.message ?? 'Failed to create meter')
    } finally {
      setSaving(false)
    }
  }

  const hasUnits = units.length > 0

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} maxWidth='sm' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>Add Utility Meter</span>
        <IconButton size='small' onClick={onClose} disabled={saving}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box className='flex flex-col gap-5 mbs-2'>
          {saveErr && <Alert severity='error' onClose={() => setSaveErr(null)}>{saveErr}</Alert>}

          {/* ── Meter details ───────────────────────────────────────────── */}
          <Box>
            <SectionLabel icon='ri-plug-line' label='Meter Details' />
            <Grid container spacing={4}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select size='small' fullWidth required
                  label='Property'
                  value={form.propertyId}
                  onChange={e => field('propertyId', e.target.value)}
                  error={errors.propertyId}
                  helperText={errors.propertyId ? 'Required' : ''}
                >
                  {properties.length === 0
                    ? <MenuItem disabled>Loading properties…</MenuItem>
                    : properties.map((p: any) => (
                        <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                      ))
                  }
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select size='small' fullWidth label='Utility Type'
                  value={form.utilityType}
                  onChange={e => field('utilityType', e.target.value as UtilityType)}
                >
                  <MenuItem value='ELECTRICITY'>⚡ Electricity (ECG/NEDCO)</MenuItem>
                  <MenuItem value='WATER'>💧 Water (GWCL)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select size='small' fullWidth label='Meter Type'
                  value={form.meterType}
                  onChange={e => field('meterType', e.target.value as MeterType)}
                  disabled={form.utilityType === 'WATER'}
                  helperText={form.utilityType === 'WATER' ? 'Water meters are always postpaid' : ''}
                >
                  <MenuItem value='POSTPAID'>Postpaid (billed monthly)</MenuItem>
                  <MenuItem value='PREPAID'>Prepaid (token top-up)</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  size='small' fullWidth required
                  label='Meter Number'
                  placeholder='e.g. ECG-0012345678'
                  value={form.meterNumber}
                  onChange={e => field('meterNumber', e.target.value)}
                  error={errors.meterNumber}
                  helperText={errors.meterNumber ? 'Required' : ''}
                />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* ── Unit assignment ──────────────────────────────────────────── */}
          <Box>
            <SectionLabel
              icon='ri-door-line'
              label='Unit Coverage'
              hint='Choose whether this meter covers the whole property or only specific units'
            />

            {!form.propertyId ? (
              <Typography variant='body2' color='text.disabled'>Select a property first</Typography>
            ) : unitsLoading ? (
              <Box className='flex items-center gap-2'>
                <CircularProgress size={16} />
                <Typography variant='body2' color='text.secondary'>Loading units…</Typography>
              </Box>
            ) : !hasUnits ? (
              <Typography variant='body2' color='text.secondary'>
                No units found for this property. Meter will cover the entire property.
              </Typography>
            ) : (
              <Box className='flex flex-col gap-3'>
                <ToggleButtonGroup
                  exclusive size='small'
                  value={unitScope}
                  onChange={(_, v) => { if (v) { setUnitScope(v); setSelectedUnitIds([]) } }}
                >
                  <ToggleButton value='all' sx={{ px: 3 }}>
                    <i className='ri-building-line ri-sm mie-2' />
                    Whole property
                  </ToggleButton>
                  <ToggleButton value='some' sx={{ px: 3 }}>
                    <i className='ri-door-line ri-sm mie-2' />
                    Specific unit(s)
                  </ToggleButton>
                </ToggleButtonGroup>

                {unitScope === 'some' && (
                  <Box sx={{
                    border: '1px solid var(--mui-palette-divider)',
                    borderRadius: 1, p: 2,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: 0,
                  }}>
                    {units.map(u => (
                      <FormControlLabel
                        key={u.id}
                        label={<Typography variant='body2'>Unit {u.unitNo}</Typography>}
                        control={
                          <Checkbox
                            size='small'
                            checked={selectedUnitIds.includes(u.id)}
                            onChange={() => toggleUnit(u.id)}
                          />
                        }
                        sx={{ m: 0 }}
                      />
                    ))}
                  </Box>
                )}

                {unitScope === 'some' && selectedUnitIds.length === 0 && (
                  <Typography variant='caption' color='warning.main'>
                    Select at least one unit, or switch to "Whole property".
                  </Typography>
                )}
                {unitScope === 'some' && selectedUnitIds.length > 0 && (
                  <Typography variant='caption' color='text.secondary'>
                    {selectedUnitIds.length} unit{selectedUnitIds.length > 1 ? 's' : ''} selected
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <Divider />

          {/* ── Payment & split ──────────────────────────────────────────── */}
          <Box>
            <SectionLabel icon='ri-bank-card-line' label='Payment & Cost Sharing' />
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select size='small' fullWidth label='Who pays this meter?'
                  value={form.paymentResponsibility}
                  onChange={e => field('paymentResponsibility', e.target.value as PaymentResponsibility)}
                >
                  <MenuItem value='LANDLORD'>Landlord</MenuItem>
                  <MenuItem value='CARETAKER'>Caretaker</MenuItem>
                  <MenuItem value='TENANT'>Tenant</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select size='small' fullWidth label='Default split method'
                  value={form.splitMethod}
                  onChange={e => field('splitMethod', e.target.value as BillSplitMethod)}
                  helperText='How bills are shared across units'
                >
                  <MenuItem value='EQUAL'>Equal split</MenuItem>
                  <MenuItem value='MANUAL'>Manual (enter per-unit amounts)</MenuItem>
                  <MenuItem value='BY_OCCUPANT'>By occupant count</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* ── Notes ───────────────────────────────────────────────────── */}
          <Box>
            <SectionLabel icon='ri-file-text-line' label='Notes (Optional)' />
            <TextField
              size='small' fullWidth multiline rows={2}
              placeholder='Any notes about this meter…'
              value={form.notes}
              onChange={e => field('notes', e.target.value)}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained' onClick={handleSave}
          disabled={saving || (unitScope === 'some' && selectedUnitIds.length === 0 && hasUnits)}
          startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='ri-plug-line' />}
        >
          {saving ? 'Saving…' : 'Add Meter'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
