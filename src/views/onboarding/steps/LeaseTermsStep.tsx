'use client'

import { useState } from 'react'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import { createAgreement, type PaymentFrequency } from '@/lib/api/agreements'
import type { OnboardingEntityIds } from '../onboardingTypes'

interface Props {
  entityIds: OnboardingEntityIds
  defaultRent: number
  defaultStartDate: string
  onComplete: (ids: Partial<OnboardingEntityIds>) => void
}

// Adds `months` to a yyyy-MM-dd string and returns yyyy-MM-dd.
function addMonths(date: string, months: number): string {
  const d = date ? new Date(date) : new Date()

  d.setMonth(d.getMonth() + months)

  return d.toISOString().split('T')[0]
}

export default function LeaseTermsStep({ entityIds, defaultRent, defaultStartDate, onComplete }: Props) {
  const start = defaultStartDate || new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    rent: String(defaultRent || ''),
    securityDeposit: '',
    lateFee: '',
    paymentFrequency: 'MONTHLY' as PaymentFrequency,
    startDate: start,
    endDate: addMonths(start, 12)
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
        unitNo: entityIds.unitNo,
        startDate: form.startDate,
        endDate: form.endDate,
        rent: Number(form.rent),
        totalAmount: Number(form.rent),
        securityDeposit: form.securityDeposit ? Number(form.securityDeposit) : undefined,
        lateFee: form.lateFee ? Number(form.lateFee) : undefined,
        currency: 'GHS',
        paymentFrequency: form.paymentFrequency
      })

      if (!agreement?.id) {
        setError('Could not create the lease. Please try again.')

        return
      }

      onComplete({ agreementId: agreement.id })
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Could not create the lease. Please try again.')
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
      <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
        We&apos;ve pre-filled the rent and dates from the unit. Adjust anything that&apos;s different, then continue.
      </Typography>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type='number'
            label='Monthly rent (GHS)'
            value={form.rent}
            onChange={e => setForm({ ...form, rent: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type='number'
            label='Security deposit (GHS)'
            value={form.securityDeposit}
            onChange={e => setForm({ ...form, securityDeposit: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type='number'
            label='Late fee (GHS)'
            value={form.lateFee}
            onChange={e => setForm({ ...form, lateFee: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            select
            label='Payment frequency'
            value={form.paymentFrequency}
            onChange={e => setForm({ ...form, paymentFrequency: e.target.value as PaymentFrequency })}
          >
            <MenuItem value='MONTHLY'>Monthly</MenuItem>
            <MenuItem value='QUARTERLY'>Quarterly</MenuItem>
            <MenuItem value='YEARLY'>Yearly</MenuItem>
            <MenuItem value='ONE_TIME'>One-time</MenuItem>
          </TextField>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type='date'
            label='Start date'
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.startDate}
            onChange={e => setForm({ ...form, startDate: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            required
            type='date'
            label='End date'
            slotProps={{ inputLabel: { shrink: true } }}
            value={form.endDate}
            onChange={e => setForm({ ...form, endDate: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant='contained'
            disabled={!valid || submitting}
            onClick={handleSubmit}
            endIcon={submitting ? <CircularProgress size={18} color='inherit' /> : undefined}
          >
            Continue
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}
