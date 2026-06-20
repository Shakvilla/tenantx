'use client'

import { useState } from 'react'
import type { FormEvent } from 'react'

// MUI
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import InputAdornment from '@mui/material/InputAdornment'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'

// API
import { advanceRentsApi } from '@/lib/api/advanceRents'
import type { AdvanceRentResponse, PaymentMethodType } from '@/types/advanceRent'

type Props = {
  open: boolean
  handleClose: () => void
  onAdvanceRecorded?: (record: AdvanceRentResponse) => void
  occupantId: string
  unitId?: string
  propertyId?: string
  monthlyRent?: number
}

const PAYMENT_METHODS: { value: PaymentMethodType; label: string }[] = [
  { value: 'MOBILE_MONEY',   label: 'Mobile Money (MoMo)' },
  { value: 'CASH',           label: 'Cash' },
  { value: 'CHEQUE',         label: 'Cheque' },
  { value: 'BANK_TRANSFER',  label: 'Bank Transfer' }
]

const MONTHS_OPTIONS = [1, 2, 3, 6, 12, 18, 24]

const AddAdvanceRentDrawer = ({
  open,
  handleClose,
  onAdvanceRecorded,
  occupantId,
  unitId,
  propertyId,
  monthlyRent: defaultMonthlyRent
}: Props) => {
  const [monthlyRent, setMonthlyRent]       = useState(defaultMonthlyRent?.toString() ?? '')
  const [monthsCovered, setMonthsCovered]   = useState<number>(12)
  const [periodStart, setPeriodStart]       = useState(() => new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethodType | ''>('')
  const [paymentReference, setPaymentReference] = useState('')
  const [notes, setNotes]                   = useState('')
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  const totalAmount = monthlyRent && monthsCovered
    ? (parseFloat(monthlyRent) * monthsCovered).toFixed(2)
    : '0.00'

  const resetForm = () => {
    setMonthlyRent(defaultMonthlyRent?.toString() ?? '')
    setMonthsCovered(12)
    setPeriodStart(new Date().toISOString().split('T')[0])
    setPaymentMethod('')
    setPaymentReference('')
    setNotes('')
    setError(null)
  }

  const handleClose_ = () => {
    resetForm()
    handleClose()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!monthlyRent || parseFloat(monthlyRent) <= 0) {
      setError('Monthly rent must be greater than zero')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const record = await advanceRentsApi.create({
        occupantId,
        unitId: unitId || undefined,
        propertyId: propertyId || undefined,
        monthlyRent: parseFloat(monthlyRent),
        monthsCovered,
        periodStart,
        currency: 'GHS',
        paymentMethod: paymentMethod || undefined,
        paymentReference: paymentReference || undefined,
        notes: notes || undefined
      })
      onAdvanceRecorded?.(record)
      handleClose_()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to record advance rent')
    } finally {
      setLoading(false)
    }
  }

  // Compute period end display
  const periodEnd = periodStart
    ? (() => {
        const d = new Date(periodStart)
        d.setMonth(d.getMonth() + monthsCovered)
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      })()
    : '—'

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={handleClose_}
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
    >
      <Box className='flex items-center justify-between px-6 py-4'>
        <Typography variant='h5'>Record Advance Rent</Typography>
        <IconButton onClick={handleClose_} size='small'>
          <i className='ri-close-line text-xl' />
        </IconButton>
      </Box>

      <Divider />

      {/* Total preview banner */}
      <Box sx={{ bgcolor: 'primary.lightOpacity', px: 6, py: 3 }}>
        <Typography variant='caption' color='primary' className='uppercase font-medium tracking-wide'>
          Total Advance Amount
        </Typography>
        <Typography variant='h4' color='primary' className='font-bold'>
          ₵{totalAmount}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {monthsCovered} month{monthsCovered !== 1 ? 's' : ''} × ₵{monthlyRent || '0'} monthly rent
        </Typography>
        <br />
        <Typography variant='caption' color='text.secondary'>
          Period ends: <strong>{periodEnd}</strong>
        </Typography>
      </Box>

      <Divider />

      <form onSubmit={handleSubmit}>
        <Box className='flex flex-col gap-5 px-6 py-6'>

          {error && <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>}

          {/* Monthly rent */}
          <TextField
            label='Monthly Rent'
            required
            size='small'
            type='number'
            inputProps={{ min: 0.01, step: 0.01 }}
            value={monthlyRent}
            onChange={e => setMonthlyRent(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position='start'>₵</InputAdornment>
            }}
          />

          {/* Months covered */}
          <FormControl size='small' required>
            <InputLabel>Months Covered</InputLabel>
            <Select
              label='Months Covered'
              value={monthsCovered}
              onChange={e => setMonthsCovered(Number(e.target.value))}
            >
              {MONTHS_OPTIONS.map(m => (
                <MenuItem key={m} value={m}>
                  {m} month{m !== 1 ? 's' : ''}
                  {m === 12 ? ' (1 year)' : m === 24 ? ' (2 years)' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Period start */}
          <TextField
            label='Advance Period Start'
            required
            size='small'
            type='date'
            value={periodStart}
            onChange={e => setPeriodStart(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Divider />

          {/* Payment method */}
          <FormControl size='small'>
            <InputLabel>Payment Method</InputLabel>
            <Select
              label='Payment Method'
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as PaymentMethodType)}
            >
              <MenuItem value=''>Not specified</MenuItem>
              {PAYMENT_METHODS.map(m => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Payment reference */}
          <TextField
            label='Payment Reference'
            size='small'
            placeholder='Receipt no., transaction ID...'
            value={paymentReference}
            onChange={e => setPaymentReference(e.target.value)}
          />

          {/* Notes */}
          <TextField
            label='Notes'
            size='small'
            multiline
            rows={2}
            placeholder='Any additional notes...'
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />

        </Box>

        <Divider />

        <Box className='flex justify-end gap-3 px-6 py-4'>
          <Button variant='outlined' color='secondary' onClick={handleClose_} disabled={loading}>
            Cancel
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={loading || !monthlyRent || parseFloat(monthlyRent) <= 0}
            startIcon={loading ? <CircularProgress size={16} /> : <i className='ri-save-line' />}
          >
            {loading ? 'Saving...' : 'Record Advance'}
          </Button>
        </Box>
      </form>
    </Drawer>
  )
}

export default AddAdvanceRentDrawer
