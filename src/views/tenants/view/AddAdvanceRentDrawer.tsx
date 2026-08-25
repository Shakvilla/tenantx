'use client'

import { useEffect, useState } from 'react'
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
import AlertTitle from '@mui/material/AlertTitle'
import Box from '@mui/material/Box'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'

// API
import { advanceRentsApi } from '@/lib/api/advanceRents'
import type { AdvanceRentLimits, AdvanceRentResponse, PaymentMethodType } from '@/types/advanceRent'

// The MoMo number format is shared with the wallet feature — reuse its regex
// rather than duplicating it.
import { MOMO_NUMBER } from '@/types/wallet'

type Props = {
  open: boolean
  onClose: () => void
  onAdvanceRecorded?: (record: AdvanceRentResponse) => void
  // initiatePayment() only returns { advanceRentId, paymentTransactionId, status } — not a
  // full AdvanceRentResponse — so it can't be handed to onAdvanceRecorded. Call this instead
  // once the gateway payment has been started, so the caller can refetch its list and pick
  // up the new PENDING record.
  onPaymentRequested?: () => void
  occupantId: string
  occupantName?: string
  unitId?: string
  propertyId?: string
  monthlyRent?: number
}

type Mode = 'record' | 'request'

// The backend's MobileNetwork enum for gateway payments (MTN, AIRTELTIGO, VODAFONE) —
// distinct from the wallet feature's MomoNetwork ('TELECEL' instead of 'VODAFONE').
// The wire value MUST stay 'VODAFONE' — that's what the backend enum and the
// gateway integration expect. Only the on-screen label is rebranded to match
// how the network is actually marketed in Ghana today (and how the wallet
// feature already labels its own, separate TELECEL enum value).
type MobileNetwork = 'MTN' | 'AIRTELTIGO' | 'VODAFONE'

const MOBILE_NETWORKS: { value: MobileNetwork; label: string }[] = [
  { value: 'MTN', label: 'MTN' },
  { value: 'AIRTELTIGO', label: 'AirtelTigo' },
  { value: 'VODAFONE', label: 'Telecel' }
]

const PAYMENT_METHODS: { value: PaymentMethodType; label: string }[] = [
  { value: 'MOBILE_MONEY',   label: 'Mobile Money (MoMo)' },
  { value: 'CASH',           label: 'Cash' },
  { value: 'CHEQUE',         label: 'Cheque' },
  { value: 'BANK_TRANSFER',  label: 'Bank Transfer' }
]

const AddAdvanceRentDrawer = ({
  open,
  onClose,
  onAdvanceRecorded,
  onPaymentRequested,
  occupantId,
  occupantName,
  unitId,
  propertyId,
  monthlyRent: defaultMonthlyRent
}: Props) => {
  const [mode, setMode]                     = useState<Mode>('record')
  const [monthlyRent, setMonthlyRent]       = useState(defaultMonthlyRent?.toString() ?? '')
  const [monthsCovered, setMonthsCovered]   = useState('12')
  const [periodStart, setPeriodStart]       = useState(() => new Date().toISOString().split('T')[0])

  // "Already received" fields
  const [paymentDate, setPaymentDate]       = useState(() => new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod]   = useState<PaymentMethodType | ''>('')
  const [paymentReference, setPaymentReference] = useState('')
  const [notes, setNotes]                   = useState('')

  // "Request payment" fields — the occupant's own MoMo wallet, not the landlord's
  const [mobileNetwork, setMobileNetwork]   = useState<MobileNetwork>('MTN')
  const [walletNumber, setWalletNumber]     = useState('')

  const [limits, setLimits]                 = useState<AdvanceRentLimits | null>(null)

  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState<string | null>(null)

  // Set once a gateway payment has been started — the drawer switches to a
  // waiting state and can no longer be treated as "nothing happened".
  const [requested, setRequested]           = useState<{ walletNumber: string } | null>(null)

  // Fetch the landlord's configured advance-rent range whenever the drawer opens,
  // so the months field can be clamped with the same message the backend enforces.
  useEffect(() => {
    if (!open) return
    advanceRentsApi.getLimits()
      .then(setLimits)
      .catch(() => setLimits(null))
  }, [open])

  const monthsNum = Number(monthsCovered)
  const monthsValid = monthsCovered !== '' && Number.isFinite(monthsNum) && monthsNum > 0

  const monthsError = (() => {
    // Blank must fail closed, not read as "not yet an error" — an empty field
    // would otherwise pass validation, leave submitDisabled false, and send
    // monthsCovered: 0 to the backend if the browser's native required/step
    // constraints ever get bypassed (e.g. programmatic submit, autofill).
    if (!monthsValid) return 'Enter a valid number of months'

    // The limits bound what an occupant may be ASKED to pay through the gateway — the wording
    // is "you can offer at most", and the backend only enforces them on initiateGatewayPayment.
    // Applying them to "Record advance" blocked a landlord from writing down money already in
    // his hand: two years paid up front in cash is the normal Ghanaian arrangement, the system
    // was already holding a 24-month advance created through this very path, and the form
    // refused to let him record another. Recording is a statement of fact, not an offer.
    if (!limits || mode === 'record') return null

    if (monthsNum > limits.maxMonths) return `You can offer at most ${limits.maxMonths} months`
    if (monthsNum < limits.minMonths) return `You must offer at least ${limits.minMonths} months`

    return null
  })()

  const totalAmount = monthlyRent && monthsValid
    ? (parseFloat(monthlyRent) * monthsNum).toFixed(2)
    : '0.00'

  const resetForm = () => {
    setMode('record')
    setMonthlyRent(defaultMonthlyRent?.toString() ?? '')
    setMonthsCovered('12')
    setPeriodStart(new Date().toISOString().split('T')[0])
    setPaymentMethod('')
    setPaymentReference('')
    setNotes('')
    setMobileNetwork('MTN')
    setWalletNumber('')
    setError(null)
    setRequested(null)
    setLimits(null)
  }

  const handleClose_ = () => {
    resetForm()
    onClose()
  }

  const handleRecordSubmit = async () => {
    const record = await advanceRentsApi.create({
      occupantId,
      unitId: unitId || undefined,
      propertyId: propertyId || undefined,
      monthlyRent: parseFloat(monthlyRent),
      monthsCovered: monthsNum,
      periodStart,
      paymentDate: paymentDate || undefined,
      currency: 'GHS',
      paymentMethod: paymentMethod || undefined,
      paymentReference: paymentReference || undefined,
      notes: notes || undefined
    })
    onAdvanceRecorded?.(record)
    handleClose_()
  }

  const handleRequestSubmit = async () => {
    if (!unitId) {
      setError('This occupant has no assigned unit yet — assign one before requesting payment through the platform')
      return
    }

    if (!MOMO_NUMBER.test(walletNumber)) {
      setError('Enter a valid 10-digit Ghanaian MoMo number')
      return
    }

    await advanceRentsApi.initiatePayment({
      occupantId,
      unitId,
      propertyId: propertyId || undefined,
      monthlyRent: parseFloat(monthlyRent),
      monthsCovered: monthsNum,
      periodStart,
      mobileNetwork,
      walletNumber
    })

    // PENDING — no invoices or wallet credit exist yet. Only the occupant's approval
    // on their own handset turns this into an ACTIVE advance, so the drawer must wait
    // rather than treat the 202 as "done".
    setRequested({ walletNumber })

    // Let the caller pick up the new PENDING record now, while the waiting alert is
    // still open — closing the drawer should not be the only way to see it appear.
    onPaymentRequested?.()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!monthlyRent || parseFloat(monthlyRent) <= 0) {
      setError('Monthly rent must be greater than zero')
      return
    }

    if (monthsError) {
      setError(monthsError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (mode === 'record') {
        await handleRecordSubmit()
      } else {
        await handleRequestSubmit()
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Compute period end display
  const periodEnd = periodStart && monthsValid
    ? (() => {
        const d = new Date(periodStart)
        d.setMonth(d.getMonth() + monthsNum)
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      })()
    : '—'

  const submitDisabled = loading || !monthlyRent || parseFloat(monthlyRent) <= 0 || !!monthsError ||
    (mode === 'request' && !MOMO_NUMBER.test(walletNumber))

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={handleClose_}
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
    >
      <Box className='flex items-center justify-between px-6 py-4'>
        <Typography variant='h5'>Advance Rent</Typography>
        <IconButton onClick={handleClose_} size='small'>
          <i className='ri-close-line text-xl' />
        </IconButton>
      </Box>

      <Divider />

      {requested ? (
        <Box className='flex flex-col gap-5 px-6 py-6'>
          <Alert severity='info' icon={<i className='ri-smartphone-line' />}>
            <AlertTitle>Waiting for {occupantName || 'the occupant'} to approve</AlertTitle>
            A payment prompt has been sent to {requested.walletNumber}. They need to approve it on
            their phone. Nothing is collected until they approve — this request is saved as
            pending in the meantime. You can close this and check back.
          </Alert>
          <Button variant='outlined' color='secondary' onClick={handleClose_}>
            Close
          </Button>
        </Box>
      ) : (
        <>
          {/* Total preview banner */}
          <Box sx={{ bgcolor: 'primary.lightOpacity', px: 6, py: 3 }}>
            <Typography variant='caption' color='primary' className='uppercase font-medium tracking-wide'>
              Total Advance Amount
            </Typography>
            <Typography variant='h4' color='primary' className='font-bold'>
              ₵{totalAmount}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {monthsNum || 0} month{monthsNum !== 1 ? 's' : ''} × ₵{monthlyRent || '0'} monthly rent
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

              {/*
                Two genuinely different actions, not two payment methods. "Already received"
                records money the landlord is holding. "Request payment" asks the occupant to
                approve a MoMo prompt — the landlord starts it but cannot complete it, which the
                copy has to say plainly or they will wonder why nothing happened.
              */}
              <FormControl>
                <RadioGroup value={mode} onChange={e => setMode(e.target.value as Mode)}>
                  <FormControlLabel
                    value='record'
                    control={<Radio />}
                    label='Already received — record cash, cheque or a bank transfer'
                  />
                  <FormControlLabel
                    value='request'
                    control={<Radio />}
                    label='Request payment through Yiliora — MoMo'
                  />
                </RadioGroup>
              </FormControl>

              <Divider />

              {/* Monthly rent */}
              <TextField
                label='Monthly Rent'
                required
                size='small'
                type='number'
                inputProps={{ min: 0.01, step: 'any' }}
                value={monthlyRent}
                onChange={e => setMonthlyRent(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position='start'>₵</InputAdornment>
                }}
              />

              {/* Months covered */}
              <TextField
                label='Months Covered'
                required
                size='small'
                type='number'
                inputProps={{ min: 1, step: 1 }}
                value={monthsCovered}
                onChange={e => setMonthsCovered(e.target.value)}
                error={!!monthsError}
                helperText={
                  monthsError ??
                  (mode === 'request' && limits
                    ? `Allowed range: ${limits.minMonths}–${limits.maxMonths} months`
                    : ' ')
                }
              />

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

              {mode === 'record' ? (
                <>
                  {/* Date received — separate from the period start, and it is the one that
                      decides which month the money is reported in. Advances are routinely
                      handed over weeks before the tenancy begins. */}
                  <TextField
                    label='Date Received'
                    size='small'
                    type='date'
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    helperText='When the money reached you — not when the tenancy starts'
                  />

                  {/* Payment method */}
                  <FormControl size='small'>
                    <InputLabel id='payment-method-label'>Payment Method</InputLabel>
                    <Select
                      labelId='payment-method-label'
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
                </>
              ) : (
                <>
                  <Typography variant='body2' color='text.secondary'>
                    A MoMo prompt is sent to the occupant&apos;s own number below. Only they can
                    approve it — you will not be asked for a PIN here.
                  </Typography>

                  {/* Occupant's MoMo network */}
                  <FormControl size='small' required>
                    <InputLabel id='mobile-network-label'>Network</InputLabel>
                    <Select
                      labelId='mobile-network-label'
                      label='Network'
                      value={mobileNetwork}
                      onChange={e => setMobileNetwork(e.target.value as MobileNetwork)}
                    >
                      {MOBILE_NETWORKS.map(n => (
                        <MenuItem key={n.value} value={n.value}>{n.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Occupant's MoMo number */}
                  <TextField
                    label='MoMo Number'
                    required
                    size='small'
                    placeholder='024XXXXXXX'
                    value={walletNumber}
                    onChange={e => setWalletNumber(e.target.value.replace(/\s+/g, ''))}
                    error={walletNumber.length > 0 && !MOMO_NUMBER.test(walletNumber)}
                    helperText={
                      walletNumber.length > 0 && !MOMO_NUMBER.test(walletNumber)
                        ? 'Enter a valid 10-digit Ghanaian number'
                        : 'The occupant’s own number — not yours'
                    }
                  />
                </>
              )}

            </Box>

            <Divider />

            <Box className='flex justify-end gap-3 px-6 py-4'>
              <Button variant='outlined' color='secondary' onClick={handleClose_} disabled={loading}>
                Cancel
              </Button>
              <Button
                type='submit'
                variant='contained'
                disabled={submitDisabled}
                startIcon={loading ? <CircularProgress size={16} /> : <i className={mode === 'record' ? 'ri-save-line' : 'ri-smartphone-line'} />}
              >
                {loading ? 'Saving...' : mode === 'record' ? 'Record Advance' : 'Request Payment'}
              </Button>
            </Box>
          </form>
        </>
      )}
    </Drawer>
  )
}

export default AddAdvanceRentDrawer
