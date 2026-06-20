'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
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
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Snackbar from '@mui/material/Snackbar'

// API
import { paymentsApi } from '@/lib/api/payments'
import type { MobileNetwork, PaymentResponse } from '@/types/payment'

// ─── Types ───────────────────────────────────────────────────────────────────

type PaymentMethod = 'MOBILE_MONEY' | 'CASH' | 'CHEQUE' | 'BANK_TRANSFER'

type Props = {
  open: boolean
  handleClose: () => void
  onPaymentRecorded?: (payment: PaymentResponse) => void
  invoiceData?: {
    id: string
    balance: string
    amount: string
    invoiceNumber: string
    occupantId?: string
    occupantName?: string
  }
}

// ─── MoMo status polling dialog ───────────────────────────────────────────────

type MoMoStatus = 'PROCESSING' | 'PAID' | 'FAILED'

interface MoMoStatusDialogProps {
  open: boolean
  paymentId: string
  walletNumber: string
  network: MobileNetwork
  amount: string
  onClose: (success: boolean) => void
}

const MoMoStatusDialog = ({ open, paymentId, walletNumber, network, amount, onClose }: MoMoStatusDialogProps) => {
  const [status, setStatus]     = useState<MoMoStatus>('PROCESSING')
  const [reason, setReason]     = useState('')
  const [attempts, setAttempts] = useState(0)
  const intervalRef             = useRef<ReturnType<typeof setInterval> | null>(null)
  const MAX_ATTEMPTS            = 24 // 2 minutes at 5 s intervals

  const networkLabels: Record<MobileNetwork, string> = {
    MTN: 'MTN MoMo',
    AIRTELTIGO: 'AirtelTigo Money',
    VODAFONE: 'Telecel Cash'
  }

  const poll = useCallback(async () => {
    try {
      const res = await paymentsApi.checkStatus(paymentId)
      if (res.status === 'PAID') {
        setStatus('PAID')
        if (intervalRef.current) clearInterval(intervalRef.current)
      } else if (res.status === 'FAILED') {
        setStatus('FAILED')
        setReason(res.failureReason || 'Payment was declined or timed out.')
        if (intervalRef.current) clearInterval(intervalRef.current)
      } else {
        setAttempts(a => {
          const next = a + 1
          if (next >= MAX_ATTEMPTS) {
            setStatus('FAILED')
            setReason('Payment request timed out. Please check your MoMo balance and try again.')
            if (intervalRef.current) clearInterval(intervalRef.current)
          }
          return next
        })
      }
    } catch {
      // network blip — keep polling
    }
  }, [paymentId])

  useEffect(() => {
    if (!open) return
    setStatus('PROCESSING')
    setAttempts(0)
    setReason('')
    intervalRef.current = setInterval(poll, 5000)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [open, poll])

  return (
    <Dialog open={open} maxWidth='xs' fullWidth disableEscapeKeyDown>
      <DialogTitle>Mobile Money Payment</DialogTitle>
      <DialogContent>
        <div className='flex flex-col items-center gap-5 py-4'>
          <div className='text-center'>
            <Typography variant='body2' color='text.secondary'>Requesting payment from</Typography>
            <Typography variant='h6' className='font-semibold'>{networkLabels[network]}</Typography>
            <Typography variant='body2' color='text.secondary'>{walletNumber}</Typography>
            <Typography variant='h5' className='font-bold mt-1'>₵{amount}</Typography>
          </div>

          {status === 'PROCESSING' && (
            <>
              <CircularProgress size={48} />
              <div className='text-center'>
                <Typography variant='body1' className='font-medium'>Waiting for customer approval</Typography>
                <Typography variant='body2' color='text.secondary'>
                  A prompt has been sent to the customer's phone.
                  Ask them to enter their PIN to approve the payment.
                </Typography>
              </div>
              <Chip
                label={`Checking... (${attempts}/${MAX_ATTEMPTS})`}
                size='small'
                color='warning'
                variant='outlined'
              />
            </>
          )}

          {status === 'PAID' && (
            <>
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%',
                bgcolor: 'success.main', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <i className='ri-check-line text-3xl' style={{ color: '#fff' }} />
              </Box>
              <div className='text-center'>
                <Typography variant='h6' color='success.main'>Payment Successful!</Typography>
                <Typography variant='body2' color='text.secondary'>
                  ₵{amount} received from {walletNumber}
                </Typography>
              </div>
              <Button variant='contained' color='success' fullWidth onClick={() => onClose(true)}>
                Done
              </Button>
            </>
          )}

          {status === 'FAILED' && (
            <>
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%',
                bgcolor: 'error.main', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <i className='ri-close-line text-3xl' style={{ color: '#fff' }} />
              </Box>
              <Alert severity='error' className='w-full'>
                {reason || 'Payment failed. Please try again.'}
              </Alert>
              <Button variant='outlined' color='error' fullWidth onClick={() => onClose(false)}>
                Close
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Main drawer ──────────────────────────────────────────────────────────────

const getBalance = (invoiceData?: Props['invoiceData']) =>
  invoiceData?.balance?.replace(/[₵,]/g, '') || invoiceData?.amount?.replace(/[₵,]/g, '') || '0'

const AddPaymentDrawer = ({ open, handleClose, invoiceData, onPaymentRecorded }: Props) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOBILE_MONEY')
  const [amount, setAmount]               = useState(getBalance(invoiceData))
  const [paymentDate, setPaymentDate]     = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes]                 = useState('')
  const [loading, setLoading]             = useState(false)

  // MoMo
  const [network, setNetwork]           = useState<MobileNetwork>('MTN')
  const [walletNumber, setWalletNumber] = useState('')

  // Cheque
  const [chequeNumber, setChequeNumber] = useState('')
  const [chequeBank, setChequeBank]     = useState('')

  // MoMo dialog
  const [momoOpen, setMomoOpen]               = useState(false)
  const [pendingPayment, setPendingPayment]   = useState<PaymentResponse | null>(null)

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  })

  useEffect(() => { setAmount(getBalance(invoiceData)) }, [invoiceData])

  const reset = () => {
    setPaymentMethod('MOBILE_MONEY')
    setAmount(getBalance(invoiceData))
    setPaymentDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setNetwork('MTN')
    setWalletNumber('')
    setChequeNumber('')
    setChequeBank('')
    setMomoOpen(false)
    setPendingPayment(null)
  }

  const handleCancel = () => { reset(); handleClose() }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!invoiceData?.id) return

    setLoading(true)
    try {
      if (paymentMethod === 'MOBILE_MONEY') {
        const payment = await paymentsApi.initiateMoMo({
          invoiceId:     invoiceData.id,
          invoiceNumber: invoiceData.invoiceNumber,
          occupantId:    invoiceData.occupantId,
          occupantName:  invoiceData.occupantName,
          amount:        parseFloat(amount),
          mobileNetwork: network,
          walletNumber,
          description:   `Rent payment - ${invoiceData.invoiceNumber}`
        })
        setPendingPayment(payment)
        setMomoOpen(true)
      } else {
        const payment = await paymentsApi.recordManual({
          invoiceId:     invoiceData.id,
          invoiceNumber: invoiceData.invoiceNumber,
          occupantId:    invoiceData.occupantId,
          occupantName:  invoiceData.occupantName,
          amount:        parseFloat(amount),
          paymentMethod: paymentMethod as 'CASH' | 'CHEQUE' | 'BANK_TRANSFER',
          paymentDate,
          chequeNumber:  paymentMethod === 'CHEQUE' ? chequeNumber : undefined,
          chequeBank:    paymentMethod === 'CHEQUE' ? chequeBank : undefined,
          notes
        })
        setSnackbar({ open: true, message: 'Payment recorded successfully', severity: 'success' })
        onPaymentRecorded?.(payment)
        reset()
        handleClose()
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to process payment',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleMomoClose = (success: boolean) => {
    setMomoOpen(false)
    if (success && pendingPayment) {
      setSnackbar({ open: true, message: 'Mobile Money payment received!', severity: 'success' })
      onPaymentRecorded?.(pendingPayment)
      reset()
      handleClose()
    }
  }

  const networkLabels: Record<MobileNetwork, string> = {
    MTN: 'MTN MoMo',
    AIRTELTIGO: 'AirtelTigo Money',
    VODAFONE: 'Telecel Cash'
  }

  return (
    <>
      <Drawer
        open={open}
        anchor='right'
        variant='temporary'
        onClose={handleCancel}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { width: { xs: 320, sm: 420 } } }}
      >
        <div className='flex items-center justify-between pli-5 plb-4'>
          <Typography variant='h5'>Record Payment</Typography>
          <IconButton size='small' onClick={handleCancel}>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <Divider />

        <div className='p-5'>
          <form onSubmit={handleSubmit} className='flex flex-col gap-5'>

            {/* Balance (read-only) */}
            <TextField
              fullWidth size='small'
              label='Invoice Balance'
              value={invoiceData?.balance || invoiceData?.amount || '₵0'}
              slotProps={{ input: { readOnly: true } }}
            />

            {/* Amount */}
            <TextField
              fullWidth size='small'
              label='Payment Amount'
              type='number'
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position='start'>₵</InputAdornment>,
                  inputProps: { min: 0.01, step: '0.01' }
                }
              }}
            />

            {/* Payment method */}
            <FormControl fullWidth size='small'>
              <InputLabel>Payment Method</InputLabel>
              <Select
                label='Payment Method'
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
              >
                <MenuItem value='MOBILE_MONEY'>
                  <span className='flex items-center gap-2'>
                    <i className='ri-smartphone-line' /> Mobile Money (MoMo)
                  </span>
                </MenuItem>
                <MenuItem value='CASH'>
                  <span className='flex items-center gap-2'>
                    <i className='ri-money-cny-circle-line' /> Cash
                  </span>
                </MenuItem>
                <MenuItem value='CHEQUE'>
                  <span className='flex items-center gap-2'>
                    <i className='ri-file-paper-2-line' /> Cheque
                  </span>
                </MenuItem>
                <MenuItem value='BANK_TRANSFER'>
                  <span className='flex items-center gap-2'>
                    <i className='ri-bank-line' /> Bank Transfer
                  </span>
                </MenuItem>
              </Select>
            </FormControl>

            {/* MoMo fields */}
            {paymentMethod === 'MOBILE_MONEY' && (
              <>
                <FormControl fullWidth size='small'>
                  <InputLabel>Mobile Network</InputLabel>
                  <Select
                    label='Mobile Network'
                    value={network}
                    onChange={e => setNetwork(e.target.value as MobileNetwork)}
                  >
                    {(Object.keys(networkLabels) as MobileNetwork[]).map(n => (
                      <MenuItem key={n} value={n}>{networkLabels[n]}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth size='small'
                  label='MoMo Wallet Number'
                  required
                  placeholder='0241234567'
                  value={walletNumber}
                  onChange={e => setWalletNumber(e.target.value)}
                  helperText='Customer will receive a prompt to approve on their phone'
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position='start'>+233</InputAdornment>
                    }
                  }}
                />
              </>
            )}

            {/* Cheque fields */}
            {paymentMethod === 'CHEQUE' && (
              <>
                <TextField
                  fullWidth size='small'
                  label='Cheque Number'
                  value={chequeNumber}
                  onChange={e => setChequeNumber(e.target.value)}
                />
                <TextField
                  fullWidth size='small'
                  label='Bank Name'
                  value={chequeBank}
                  onChange={e => setChequeBank(e.target.value)}
                />
              </>
            )}

            {/* Payment date for manual methods */}
            {paymentMethod !== 'MOBILE_MONEY' && (
              <TextField
                fullWidth size='small'
                label='Payment Date'
                type='date'
                required
                value={paymentDate}
                onChange={e => setPaymentDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            )}

            {/* Notes */}
            <TextField
              fullWidth size='small'
              label='Notes'
              multiline
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder='Optional payment notes...'
            />

            {/* Actions */}
            <div className='flex items-center gap-4'>
              <Button
                variant='contained'
                color='primary'
                type='submit'
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} color='inherit' /> : undefined}
              >
                {loading
                  ? 'Processing...'
                  : paymentMethod === 'MOBILE_MONEY'
                    ? 'Send MoMo Request'
                    : 'Record Payment'}
              </Button>
              <Button variant='outlined' color='secondary' fullWidth onClick={handleCancel}>
                Cancel
              </Button>
            </div>

          </form>
        </div>
      </Drawer>

      {/* MoMo status polling dialog */}
      {pendingPayment && (
        <MoMoStatusDialog
          open={momoOpen}
          paymentId={pendingPayment.id}
          walletNumber={walletNumber}
          network={network}
          amount={amount}
          onClose={handleMomoClose}
        />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}

export default AddPaymentDrawer
