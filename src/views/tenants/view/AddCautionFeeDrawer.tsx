'use client'

import { useState } from 'react'

// MUI
import Drawer from '@mui/material/Drawer'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Alert from '@mui/material/Alert'
import InputAdornment from '@mui/material/InputAdornment'

import { cautionFeesApi } from '@/lib/api/cautionFees'
import type { CautionFeeResponse, PaymentMethodType } from '@/types/cautionFee'

type Props = {
  open: boolean
  handleClose: () => void
  onCautionFeeRecorded: (record: CautionFeeResponse) => void
  occupantId: string
  unitId?: string
  propertyId?: string
}

const PAYMENT_METHODS: { value: PaymentMethodType; label: string }[] = [
  { value: 'CASH',          label: 'Cash' },
  { value: 'MOBILE_MONEY',  label: 'Mobile Money (MoMo)' },
  { value: 'CHEQUE',        label: 'Cheque' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
]

const AddCautionFeeDrawer = ({
  open,
  handleClose,
  onCautionFeeRecorded,
  occupantId,
  unitId,
  propertyId,
}: Props) => {
  const [amount,           setAmount]           = useState('')
  const [paymentMethod,    setPaymentMethod]    = useState<PaymentMethodType | ''>('')
  const [paymentReference, setPaymentReference] = useState('')
  const [collectedAt,      setCollectedAt]      = useState('')
  const [notes,            setNotes]            = useState('')
  const [submitting,       setSubmitting]       = useState(false)
  const [error,            setError]            = useState<string | null>(null)

  const reset = () => {
    setAmount(''); setPaymentMethod(''); setPaymentReference('')
    setCollectedAt(''); setNotes(''); setError(null)
  }

  const handleClose_ = () => { reset(); handleClose() }

  const handleSubmit = async () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount'); return
    }
    setSubmitting(true); setError(null)
    try {
      const record = await cautionFeesApi.create({
        occupantId,
        unitId,
        propertyId,
        amount: parseFloat(amount),
        currency: 'GHS',
        paymentMethod: paymentMethod || undefined,
        paymentReference: paymentReference || undefined,
        collectedAt: collectedAt || undefined,
        notes: notes || undefined,
      })
      onCautionFeeRecorded(record)
      handleClose_()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to record caution fee')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={handleClose_}
      PaperProps={{ sx: { width: { xs: '100%', sm: 420 } } }}
    >
      {/* Header */}
      <Box className='flex items-center justify-between px-6 py-4'>
        <Box>
          <Typography variant='h6'>Record Caution Fee</Typography>
          <Typography variant='body2' color='text.secondary'>
            Security deposit collected from tenant
          </Typography>
        </Box>
        <IconButton onClick={handleClose_} size='small'>
          <i className='ri-close-line text-xl' />
        </IconButton>
      </Box>
      <Divider />

      <Box className='flex flex-col gap-5 px-6 py-5 overflow-y-auto'>
        {error && <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>}

        {/* Amount */}
        <TextField
          label='Caution Fee Amount'
          type='number'
          value={amount}
          onChange={e => setAmount(e.target.value)}
          fullWidth
          required
          slotProps={{
            input: {
              startAdornment: <InputAdornment position='start'>₵</InputAdornment>
            }
          }}
          helperText='Total amount collected as security deposit'
        />

        {/* Collected date */}
        <TextField
          label='Date Collected'
          type='date'
          value={collectedAt}
          onChange={e => setCollectedAt(e.target.value)}
          fullWidth
          slotProps={{ inputLabel: { shrink: true } }}
          helperText='Defaults to today if left blank'
        />

        {/* Payment method */}
        <TextField
          label='Payment Method'
          select
          value={paymentMethod}
          onChange={e => setPaymentMethod(e.target.value as PaymentMethodType)}
          fullWidth
        >
          <MenuItem value=''>— Select —</MenuItem>
          {PAYMENT_METHODS.map(m => (
            <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
          ))}
        </TextField>

        {/* Payment reference */}
        <TextField
          label='Payment Reference'
          value={paymentReference}
          onChange={e => setPaymentReference(e.target.value)}
          fullWidth
          placeholder='Transaction ID, cheque number, etc.'
        />

        {/* Notes */}
        <TextField
          label='Notes'
          value={notes}
          onChange={e => setNotes(e.target.value)}
          fullWidth
          multiline
          rows={3}
          placeholder='Any additional details about the caution fee...'
        />

        {/* Summary preview */}
        {amount && parseFloat(amount) > 0 && (
          <Box sx={{ bgcolor: 'primary.lightOpacity', borderRadius: 2, p: 2 }}>
            <Typography variant='body2' color='primary.main' className='font-semibold mb-1'>
              Summary
            </Typography>
            <Typography variant='body2'>
              Caution fee of <strong>₵{parseFloat(amount).toLocaleString('en-GH', { minimumFractionDigits: 2 })}</strong> will be recorded as <strong>HELD</strong>.
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              This can be deducted or refunded at end of tenancy.
            </Typography>
          </Box>
        )}
      </Box>

      <Divider />
      <Box className='flex justify-end gap-3 px-6 py-4'>
        <Button variant='outlined' onClick={handleClose_} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={submitting || !amount}
          startIcon={submitting
            ? <i className='ri-loader-4-line animate-spin' />
            : <i className='ri-save-line' />}
        >
          {submitting ? 'Saving…' : 'Record Fee'}
        </Button>
      </Box>
    </Drawer>
  )
}

export default AddCautionFeeDrawer
