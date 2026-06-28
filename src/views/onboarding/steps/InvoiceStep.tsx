'use client'

import { useState } from 'react'

import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import { createInvoice } from '@/lib/api/invoices'
import type { OnboardingStepProps } from '../onboardingTypes'

interface InvoiceStepProps extends OnboardingStepProps {
  defaultRent: number
}

export default function InvoiceStep({ entityIds, onComplete, defaultRent }: InvoiceStepProps) {
  const today = new Date().toISOString().slice(0, 10)
  const [form, setForm] = useState({ dueDate: '', amount: String(defaultRent || '') })
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const valid = Boolean(form.dueDate && Number(form.amount) > 0)

  const handleSubmit = async () => {
    setError(null)
    setSubmitting(true)

    try {
      const invoice = await createInvoice({
        occupantId: entityIds.occupantId,
        propertyId: entityIds.propertyId,
        unitId: entityIds.unitId,
        issuedDate: today,
        dueDate: form.dueDate,
        amount: Number(form.amount),
        currency: 'GHS',
        invoiceType: 'RENT'
      })

      if (!invoice?.id) {
        setError('Could not create invoice. Please try again.')
        
return
      }

      onComplete({ invoiceId: invoice.id })
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Could not create invoice. Please try again.')
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
            label='Due date'
            required
            InputLabelProps={{ shrink: true }}
            value={form.dueDate}
            onChange={e => setForm({ ...form, dueDate: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            type='number'
            label='Amount (GHS)'
            required
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
          />
        </Grid>
        <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant='contained'
            disabled={!valid || submitting}
            onClick={handleSubmit}
            endIcon={submitting ? <CircularProgress size={18} color='inherit' /> : undefined}
          >
            Generate invoice
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}

export type { InvoiceStepProps }
