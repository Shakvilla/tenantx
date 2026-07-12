'use client'

import { useState, useEffect } from 'react'

// MUI
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'

// API
import { paymentsApi, openPaymentReceipt } from '@/lib/api/payments'
import type { PaymentResponse, PaymentStatus } from '@/types/payment'

type Props = {
  invoiceId: string
  /** Increment to force a re-fetch after a new payment is recorded */
  refreshKey?: number
}

const statusColor = (s: PaymentStatus) => {
  switch (s) {
    case 'PAID':
    case 'RECORDED': return 'success'
    case 'FAILED':
    case 'CANCELLED': return 'error'
    case 'PROCESSING': return 'info'
    default: return 'warning'
  }
}

const methodLabel: Record<string, string> = {
  MOBILE_MONEY: 'Mobile Money',
  CASH: 'Cash',
  CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank Transfer'
}

const InvoicePaymentHistory = ({ invoiceId, refreshKey }: Props) => {
  const [payments, setPayments] = useState<PaymentResponse[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [verifying, setVerifying] = useState<Record<string, boolean>>({})
  const [receiptError, setReceiptError] = useState<string | null>(null)

  const handleReceipt = async (id: string) => {
    try {
      await openPaymentReceipt(id)
    } catch {
      setReceiptError('Failed to open receipt')
    }
  }

  async function handleVerify(paymentId: string) {
    setVerifying(v => ({ ...v, [paymentId]: true }))
    try {
      const updated = await paymentsApi.checkStatus(paymentId)
      setPayments(prev => prev.map(p => p.id === paymentId ? updated : p))
    } catch {
      // status chip will remain unchanged
    } finally {
      setVerifying(v => ({ ...v, [paymentId]: false }))
    }
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    paymentsApi.getByInvoice(invoiceId)
      .then(setPayments)
      .catch(err => setError(err?.message ?? 'Failed to load payments'))
      .finally(() => setLoading(false))
  }, [invoiceId, refreshKey])

  if (loading) {
    return (
      <Card sx={{ mt: 6 }}>
        <CardContent className='flex justify-center py-8'>
          <CircularProgress size={32} />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card sx={{ mt: 6 }}>
        <CardContent>
          <Alert severity='error'>{error}</Alert>
        </CardContent>
      </Card>
    )
  }

  if (payments.length === 0) return null

  return (
    <Card sx={{ mt: 6 }} className='no-print'>
      <CardHeader title='Payment History' />
      <Divider />
      {receiptError && (
        <CardContent className='pb-0'>
          <Alert severity='error' onClose={() => setReceiptError(null)}>{receiptError}</Alert>
        </CardContent>
      )}
      <CardContent className='flex flex-col gap-0 p-0'>
        {payments.map((p, idx) => {
          const date = p.paymentDate ?? p.createdAt
          const formattedDate = date
            ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—'

          return (
            <Box
              key={p.id}
              className='flex items-center justify-between px-6 py-4'
              sx={{ borderBottom: idx < payments.length - 1 ? '1px solid' : 'none', borderColor: 'divider' }}
            >
              <Box className='flex flex-col gap-0.5'>
                <Typography variant='body2' className='font-medium'>
                  {methodLabel[p.paymentMethod] ?? p.paymentMethod}
                  {p.mobileNetwork ? ` · ${p.mobileNetwork}` : ''}
                  {p.walletNumber ? ` (${p.walletNumber})` : ''}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {formattedDate}
                  {p.notes ? ` · ${p.notes}` : ''}
                </Typography>
              </Box>
              <Box className='flex items-center gap-3'>
                <Chip
                  variant='tonal'
                  label={p.status}
                  size='small'
                  color={statusColor(p.status)}
                />
                {(p.status === 'PENDING' || p.status === 'PROCESSING') && p.paymentMethod === 'MOBILE_MONEY' && (
                  <Tooltip title='Check payment status with Redde'>
                    <Button
                      size='small'
                      variant='outlined'
                      disabled={!!verifying[p.id]}
                      onClick={() => handleVerify(p.id)}
                      startIcon={verifying[p.id] ? <CircularProgress size={12} /> : <i className='ri-refresh-line' />}
                    >
                      {verifying[p.id] ? 'Checking…' : 'Verify'}
                    </Button>
                  </Tooltip>
                )}
                {(p.status === 'PAID' || p.status === 'RECORDED') && (
                  <Tooltip title='Open printable receipt'>
                    <Button
                      size='small'
                      variant='outlined'
                      onClick={() => handleReceipt(p.id)}
                      startIcon={<i className='ri-receipt-line' />}
                    >
                      Receipt
                    </Button>
                  </Tooltip>
                )}
                <Typography variant='body2' className='font-semibold' color='text.primary'>
                  ₵{p.amount.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default InvoicePaymentHistory
