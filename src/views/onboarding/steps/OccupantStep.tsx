'use client'

import { useState } from 'react'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import { createOccupant } from '@/lib/api/occupants'
import type { OnboardingStepProps } from '../onboardingTypes'

export default function OccupantStep({ tenantId, entityIds, onComplete, onSkip }: OnboardingStepProps) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const valid = Boolean(form.firstName && form.lastName && form.email && form.phone)

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)

    try {
      const record = await createOccupant(tenantId, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        propertyId: entityIds.propertyId,
        unitId: entityIds.unitId
      })

      if (!record?.id) {
        setError('Could not create occupant. Please try again.')
        
return
      }

      onComplete({ occupantId: record.id })
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Could not create occupant. Please try again.')
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
            label='First name'
            required
            value={form.firstName}
            onChange={e => setForm({ ...form, firstName: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label='Last name'
            required
            value={form.lastName}
            onChange={e => setForm({ ...form, lastName: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type='email'
            label='Email'
            required
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label='Phone number'
            required
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
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
