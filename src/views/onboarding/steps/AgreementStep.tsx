'use client'

import { useState } from 'react'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import { createAgreement } from '@/lib/api/agreements'
import type { OnboardingStepProps } from '../onboardingTypes'

interface AgreementStepProps extends OnboardingStepProps {
  defaultRent: number
}

export default function AgreementStep({ entityIds, onComplete, onSkip, defaultRent }: AgreementStepProps) {
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    rent: String(defaultRent || '')
  })

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const valid = Boolean(form.startDate && form.endDate && Number(form.rent) > 0)

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)

    try {
      const agreement = await createAgreement({
        type: 'LEASE',
        occupantId: entityIds.occupantId,
        propertyId: entityIds.propertyId,
        unitId: entityIds.unitId,
        startDate: form.startDate,
        endDate: form.endDate,
        rent: Number(form.rent),
        currency: 'GHS',
        paymentFrequency: 'MONTHLY'
      })

      if (!agreement?.id) {
        setError('Could not create agreement. Please try again.')
        
return
      }

      onComplete({ agreementId: agreement.id })
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Could not create agreement. Please try again.')
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
            type='date'
            label='Start date'
            required
            InputLabelProps={{ shrink: true }}
            value={form.startDate}
            onChange={e => setForm({ ...form, startDate: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type='date'
            label='End date'
            required
            InputLabelProps={{ shrink: true }}
            value={form.endDate}
            onChange={e => setForm({ ...form, endDate: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            type='number'
            label='Rent amount (GHS)'
            required
            value={form.rent}
            onChange={e => setForm({ ...form, rent: e.target.value })}
          />
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

export type { AgreementStepProps }
