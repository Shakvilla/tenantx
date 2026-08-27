'use client'

import { useEffect, useState } from 'react'

// MUI Imports
import Alert from '@mui/material/Alert'
import AlertTitle from '@mui/material/AlertTitle'
import Typography from '@mui/material/Typography'

// API Imports
import { paymentsApi } from '@/lib/api/payments'
import type { PaymentResponse } from '@/types/payment'

// Utils
import { formatCurrency } from '@/utils/currency'

const formatDate = (d?: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Payments that took, or may have taken, a payer's money without the platform being able
 * to book it.
 *
 * Read-only by design. Resolving one of these credits a wallet, so it stays a TenantX
 * support action — this panel exists because the landlord previously had no way to see the
 * flag at all after the single notification raised when it was first set. A flagged payment
 * is usually PAID or PROCESSING, so it looks settled in every other view; that is exactly
 * what makes it worth surfacing.
 *
 * Renders nothing in the normal case (nothing flagged). A failed check is NOT swallowed:
 * silence is indistinguishable from "all clear", and the whole point of the panel is that
 * stranded money must not be invisible.
 */
const PaymentsNeedingAttention = () => {
  const [rows, setRows] = useState<PaymentResponse[]>([])
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    paymentsApi
      .getNeedingAttention()
      .then(data => {
        if (!cancelled) setRows(data ?? [])
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (failed) {
    return (
      <Alert severity='info' className='mbe-4'>
        Could not check for payments needing attention. Nothing is wrong with the payments below —
        this check just did not run.
      </Alert>
    )
  }

  if (rows.length === 0) return null

  return (
    <Alert severity='warning' className='mbe-4'>
      <AlertTitle>
        {rows.length === 1
          ? '1 payment needs attention'
          : `${rows.length} payments need attention`}
      </AlertTitle>
      <Typography variant='body2' className='mbe-2'>
        {rows.length === 1 ? 'This payment' : 'These payments'} may have taken money from the payer
        without us being able to record it against an invoice. Contact TenantX support to have{' '}
        {rows.length === 1 ? 'it' : 'them'} settled — they cannot be resolved from here.
      </Typography>
      <ul className='pli-4 mbe-0'>
        {rows.map(p => (
          <li key={p.id}>
            <Typography variant='body2' component='span' className='font-medium'>
              {formatCurrency(Number(p.amount), p.currency)}
            </Typography>
            <Typography variant='body2' component='span'>
              {' '}
              — {p.occupantName ?? 'Unknown payer'}
              {p.invoiceNumber ? ` · ${p.invoiceNumber}` : ''} ·{' '}
              {formatDate(p.paymentDate ?? p.createdAt)}
            </Typography>
            {p.reconciliationReason && (
              <Typography variant='caption' component='div' color='text.secondary'>
                {p.reconciliationReason}
              </Typography>
            )}
          </li>
        ))}
      </ul>
    </Alert>
  )
}

export default PaymentsNeedingAttention
