'use client'

import { useState } from 'react'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import { createUnit } from '@/lib/api/units'
import { useReferenceData } from '@/contexts/ReferenceDataContext'
import type { Unit } from '@/types/property'
import type { OnboardingStepProps } from '../onboardingTypes'

// Extend onComplete payload with rent so later steps (agreement/invoice) can prefill.
interface UnitStepProps extends OnboardingStepProps {
  onUnitCreated: (unitId: string, rent: number) => void
  onSkip?: () => void
}

// Rent period is stored in unit.metadata.rentPeriod (mirrors AddUnitDialog).
const RENT_PERIODS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'biannual', label: 'Bi-annual' },
  { value: 'annual', label: 'Annual' }
] as const

export default function UnitStep({ tenantId, entityIds, onUnitCreated, onSkip }: UnitStepProps) {
  const { ref } = useReferenceData()
  const [form, setForm] = useState({ unitNo: '', type: '', rent: '', rentPeriod: 'monthly' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const rentNum = Number(form.rent)
  const valid = Boolean(form.unitNo && form.type && form.rent && rentNum > 0 && form.rentPeriod)

  const handleSubmit = async () => {
    if (!entityIds.propertyId) {
      setError('Missing property. Please restart the wizard.')
      
return
    }

    setError(null)
    setSubmitting(true)

    try {
      const res = await createUnit(tenantId, entityIds.propertyId, {
        unitNo: form.unitNo,
        type: form.type as Unit['type'],
        rent: rentNum,
        currency: 'GHS',
        status: 'available',
        metadata: { rentPeriod: form.rentPeriod }
      })

      if (!res.success || !res.data?.id) {
        setError(res.error?.message ?? 'Could not create unit. Please try again.')
        
return
      }

      onUnitCreated(res.data.id, rentNum)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Could not create unit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box>
      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label='Unit name / number'
            required
            value={form.unitNo}
            onChange={e => setForm({ ...form, unitNo: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth required>
            <InputLabel>Unit type</InputLabel>
            <Select label='Unit type' value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {ref.unitTypes.map(t => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type='number'
            label='Rent amount (GHS)'
            required
            value={form.rent}
            onChange={e => setForm({ ...form, rent: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth required>
            <InputLabel>Rent frequency</InputLabel>
            <Select
              label='Rent frequency'
              value={form.rentPeriod}
              onChange={e => setForm({ ...form, rentPeriod: e.target.value })}
            >
              {RENT_PERIODS.map(f => (
                <MenuItem key={f.value} value={f.value}>
                  {f.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant='text' color='inherit' onClick={onSkip} disabled={submitting}>
            Skip this step
          </Button>
          <Button
            variant='contained'
            disabled={!valid || submitting}
            onClick={handleSubmit}
            endIcon={submitting ? <CircularProgress size={18} color='inherit' /> : undefined}
          >
            Save &amp; continue
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}

export type { UnitStepProps }
