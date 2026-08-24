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
import { cautionFeesApi } from '@/lib/api/cautionFees'
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

  // The lease exists but its caution fee could not be written to the ledger. Not an error —
  // nothing is lost and the tenancy is real — but the landlord must be told, because the money
  // he is holding is exactly what he will be asked about when the tenant moves out.
  const [depositWarning, setDepositWarning] = useState<{ agreementId: string; detail: string } | null>(null)

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

      // Record the caution fee as money HELD, not merely as a number on the lease.
      //
      // The agreement's securityDeposit column is a term of the tenancy — what was agreed. The
      // caution_fees ledger is the money itself: what is held, what has been deducted, what must
      // be refunded or forfeited at move-out. Onboarding used to write only the former, so the
      // ledger stayed empty and nothing in the product could answer "how much of my tenants'
      // money am I holding?". The feature was already built; nothing routed into it.
      const deposit = form.securityDeposit ? Number(form.securityDeposit) : 0

      if (deposit > 0) {
        try {
          await cautionFeesApi.create({
            occupantId: entityIds.occupantId!,
            unitId: entityIds.unitId,
            propertyId: entityIds.propertyId,
            amount: deposit,
            currency: 'GHS',
            collectedAt: form.startDate
          })
        } catch (e: any) {
          // Deliberately NOT swallowed. The lease is good and must not be thrown away, but a
          // caution fee that silently failed to record is money that goes missing at move-out.
          setDepositWarning({
            agreementId: agreement.id,
            detail: e?.response?.data?.message ?? e?.message ?? 'The caution fee could not be recorded.'
          })

          return
        }
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
      {depositWarning && (
        <Alert
          severity='warning'
          sx={{ mb: 3 }}
          action={
            <Button size='small' onClick={() => onComplete({ agreementId: depositWarning.agreementId })}>
              Continue anyway
            </Button>
          }
        >
          The tenancy was created, but the caution fee was not recorded: {depositWarning.detail} You can
          record it later from the tenant&apos;s Home Details tab. Nothing else is affected.
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
            label='Caution fee (GHS)'
            helperText='Held on the tenant&apos;s behalf and refundable, less any damage'
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
