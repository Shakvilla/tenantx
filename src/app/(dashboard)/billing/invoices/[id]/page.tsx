'use client'

// React Imports
import { useState, useEffect, use, useCallback } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box'

// Component Imports
import ViewInvoiceCard from '@/views/billing/view/ViewInvoiceCard'
import ViewInvoiceActions from '@/views/billing/view/ViewInvoiceActions'
import InvoicePaymentHistory from '@/views/billing/view/InvoicePaymentHistory'

// API Imports
import { getInvoiceById, type Invoice } from '@/lib/api/invoices'

type Props = {
  params: Promise<{ id: string }>
}

const ViewInvoicePage = ({ params }: Props) => {
  const { id: invoiceId } = use(params)

  const [invoice, setInvoice]         = useState<Invoice | null>(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [refreshKey, setRefreshKey]   = useState(0)

  const fetchInvoice = useCallback(() => {
    setLoading(true)
    setError(null)
    getInvoiceById(invoiceId)
      .then(setInvoice)
      .catch(err => setError(err?.message ?? 'Failed to load invoice'))
      .finally(() => setLoading(false))
  }, [invoiceId])

  useEffect(() => { fetchInvoice() }, [fetchInvoice])

  const handlePaymentRecorded = useCallback(() => {
    // Re-fetch invoice (updates balance/status) and bump refreshKey so PaymentHistory re-fetches too
    getInvoiceById(invoiceId).then(setInvoice).catch(console.error)
    setRefreshKey(k => k + 1)
  }, [invoiceId])

  if (loading) {
    return (
      <Box className='flex items-center justify-center' sx={{ minHeight: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !invoice) {
    return <Alert severity='error'>{error ?? 'Invoice not found'}</Alert>
  }

  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12, md: 9 }}>
        <ViewInvoiceCard invoiceData={invoice} invoiceId={invoiceId} />
        <InvoicePaymentHistory invoiceId={invoiceId} refreshKey={refreshKey} />
      </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
        <ViewInvoiceActions
          invoiceId={invoiceId}
          invoiceData={invoice}
          onPaymentRecorded={handlePaymentRecorded}
        />
      </Grid>
    </Grid>
  )
}

export default ViewInvoicePage
