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

// API
import { paymentsApi } from '@/lib/api/payments'
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
