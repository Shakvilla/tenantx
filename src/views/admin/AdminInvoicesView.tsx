'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Link from 'next/link'

import TextField from '@mui/material/TextField'

import {
  getAdminInvoices,
  getAdminFailedInvoices,
  getAdminDelinquentInvoices,
  adminRetryInvoice,
  adminVoidInvoice,
  getUpcomingRenewals,
  exportRevenueCsv,
  type AdminInvoiceDto,
  type PagedInvoiceResponse,
  type UpcomingRenewalDto,
} from '@/lib/api/admin-auth-client'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(amount)
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

type InvoiceStatus = 'PENDING' | 'PAID' | 'FAILED' | 'VOID'

function statusChip(status: InvoiceStatus | string) {
  const map: Record<string, { color: 'success' | 'error' | 'warning' | 'default'; label: string }> = {
    PAID:    { color: 'success', label: 'Paid' },
    FAILED:  { color: 'error',   label: 'Failed' },
    PENDING: { color: 'warning', label: 'Pending' },
    VOID:    { color: 'default', label: 'Void' },
  }
  const cfg = map[status] ?? { color: 'default', label: status }
  return <Chip size='small' label={cfg.label} color={cfg.color} variant='tonal' />
}

// ---------------------------------------------------------------------------
// Retry confirm dialog
// ---------------------------------------------------------------------------

interface RetryDialogProps {
  invoice: AdminInvoiceDto | null
  onClose: () => void
  onConfirmed: (id: string) => Promise<void>
}

function RetryDialog({ invoice, onClose, onConfirmed }: RetryDialogProps) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    if (!invoice) return
    setLoading(true)
    await onConfirmed(invoice.id)
    setLoading(false)
  }
  return (
    <Dialog open={!!invoice} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle>Retry Invoice</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Immediately retry payment for <strong>{invoice?.tenantName}</strong> — {invoice ? formatCurrency(invoice.totalAmount) : ''}?
          <br /><br />
          The system will attempt wallet debit first, then Redde push-to-pay as a fallback.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant='contained'
          color='warning'
          onClick={handle}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color='inherit' /> : <i className='ri-refresh-line' />}
        >
          Retry Now
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Void / write-off dialog
// ---------------------------------------------------------------------------

interface VoidDialogProps {
  invoice: AdminInvoiceDto | null
  onClose: () => void
  onVoided: (updated: AdminInvoiceDto) => void
}

function VoidDialog({ invoice, onClose, onVoided }: VoidDialogProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  useEffect(() => { if (invoice) { setReason(''); setError(null) } }, [invoice])

  async function handle() {
    if (!invoice) return
    setLoading(true); setError(null)
    try {
      const updated = await adminVoidInvoice(invoice.id, reason.trim() || undefined)
      onVoided(updated)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to void invoice')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!invoice} onClose={loading ? undefined : onClose} maxWidth='xs' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <i className='ri-file-damage-line' />
        Write Off Invoice
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <DialogContentText>
          Write off the <strong>{invoice ? formatCurrency(invoice.totalAmount) : ''}</strong> invoice
          for <strong>{invoice?.tenantName}</strong>? This marks it as VOID and removes it from the payment queue.
          The tenant's plan is not affected.
        </DialogContentText>
        <TextField
          label='Reason (optional)'
          size='small'
          fullWidth
          multiline
          rows={2}
          value={reason}
          onChange={e => setReason(e.target.value)}
          disabled={loading}
          placeholder='e.g. Goodwill credit, billing error correction…'
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant='contained'
          color='error'
          onClick={handle}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color='inherit' /> : <i className='ri-file-damage-line' />}
        >
          {loading ? 'Writing off…' : 'Write Off'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Invoice table (shared between tabs)
// ---------------------------------------------------------------------------

interface InvoiceTableProps {
  invoices: AdminInvoiceDto[]
  loading: boolean
  showRetry?: boolean
  onRetry?: (inv: AdminInvoiceDto) => void
  onVoid?: (inv: AdminInvoiceDto) => void
  emptyMessage?: string
}

function InvoiceTable({ invoices, loading, showRetry, onRetry, onVoid, emptyMessage = 'No invoices found' }: InvoiceTableProps) {
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
  }

  return (
    <TableContainer>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Tenant</TableCell>
            <TableCell>Plan</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Period</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Units</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Retries</TableCell>
            <TableCell>Created</TableCell>
            {showRetry && <TableCell align='right'>Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showRetry ? 10 : 9} align='center' sx={{ py: 5, color: 'text.secondary' }}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : invoices.map(inv => (
            <TableRow key={inv.id} hover>
              <TableCell>
                <Link href={`/admin/tenants`} style={{ textDecoration: 'none' }}>
                  <Box>
                    <Typography variant='body2' fontWeight={600} sx={{ '&:hover': { textDecoration: 'underline' } }}>
                      {inv.tenantName}
                    </Typography>
                    <Typography variant='caption' color='text.secondary' sx={{ fontFamily: 'monospace' }}>
                      {inv.tenantId}
                    </Typography>
                  </Box>
                </Link>
              </TableCell>
              <TableCell>
                <Chip size='small' label={inv.planName} variant='outlined' />
              </TableCell>
              <TableCell>
                <Typography variant='caption' color='text.secondary'>{inv.invoiceType}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant='caption'>
                  {formatDate(inv.periodStart)} → {formatDate(inv.periodEnd)}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant='body2' fontWeight={600}>{formatCurrency(inv.totalAmount)}</Typography>
              </TableCell>
              <TableCell>
                <Typography variant='body2'>{inv.unitCount}</Typography>
              </TableCell>
              <TableCell>{statusChip(inv.status)}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <Typography variant='caption'>{inv.retryCount}x</Typography>
                  {inv.failureReason && (
                    <Tooltip title={inv.failureReason} placement='top'>
                      <Typography variant='caption' color='error.main' sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'help' }}>
                        {inv.failureReason}
                      </Typography>
                    </Tooltip>
                  )}
                  {inv.nextRetryAt && (
                    <Typography variant='caption' color='text.secondary'>
                      Next: {formatDateTime(inv.nextRetryAt)}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant='caption' color='text.secondary'>{formatDateTime(inv.createdAt)}</Typography>
              </TableCell>
              {showRetry && (
                <TableCell align='right'>
                  <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                    {inv.status === 'FAILED' && onRetry && (
                      <Tooltip title='Retry payment now'>
                        <IconButton size='small' color='warning' onClick={() => onRetry(inv)}>
                          <i className='ri-refresh-line' style={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    {(inv.status === 'PENDING' || inv.status === 'FAILED') && onVoid && (
                      <Tooltip title='Write off / void invoice'>
                        <IconButton size='small' color='error' onClick={() => onVoid(inv)}>
                          <i className='ri-file-damage-line' style={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// ---------------------------------------------------------------------------
// Tab 0 — All Invoices
// ---------------------------------------------------------------------------

function AllInvoicesTab({ canManage }: { canManage: boolean }) {
  const [data, setData]           = useState<PagedInvoiceResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatus] = useState('')
  const [page, setPage]           = useState(0)
  const [retryTarget, setRetry]   = useState<AdminInvoiceDto | null>(null)
  const [voidTarget, setVoid]     = useState<AdminInvoiceDto | null>(null)
  const [toast, setToast]         = useState<string | null>(null)
  const [error, setError]         = useState<string | null>(null)
  const [exportStart, setExportStart] = useState('')
  const [exportEnd, setExportEnd]     = useState('')
  const [exporting, setExporting]     = useState(false)

  const fetchData = useCallback(async (status: string, pg: number) => {
    setLoading(true); setError(null)
    try {
      const res = await getAdminInvoices(status || undefined, pg, 50)
      setData(res)
    } catch { setError('Failed to load invoices') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData(statusFilter, page) }, [fetchData, statusFilter, page])

  async function handleRetry(id: string) {
    try {
      await adminRetryInvoice(id)
      setToast('Retry triggered successfully')
      fetchData(statusFilter, page)
    } catch (e: any) {
      setToast(e?.response?.data?.message ?? 'Retry failed')
    }
    setRetry(null)
  }

  async function handleExport() {
    setExporting(true)
    try {
      await exportRevenueCsv(exportStart || undefined, exportEnd || undefined)
    } catch {
      setToast('Export failed')
    } finally {
      setExporting(false)
    }
  }

  function handleVoided(updated: AdminInvoiceDto) {
    setData(prev => prev ? {
      ...prev,
      data: prev.data.map(i => i.id === updated.id ? updated : i)
    } : prev)
    setToast(`Invoice written off`)
    setVoid(null)
  }

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size='small' sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label='Status' onChange={e => { setStatus(e.target.value); setPage(0) }}>
            <MenuItem value=''>All</MenuItem>
            <MenuItem value='PENDING'>Pending</MenuItem>
            <MenuItem value='PAID'>Paid</MenuItem>
            <MenuItem value='FAILED'>Failed</MenuItem>
            <MenuItem value='VOID'>Void</MenuItem>
          </Select>
        </FormControl>

        {/* Revenue CSV export */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 'auto', flexWrap: 'wrap' }}>
          <TextField
            size='small'
            type='date'
            label='From'
            slotProps={{ inputLabel: { shrink: true } }}
            value={exportStart}
            onChange={e => setExportStart(e.target.value)}
            sx={{ width: 150 }}
          />
          <TextField
            size='small'
            type='date'
            label='To'
            slotProps={{ inputLabel: { shrink: true } }}
            value={exportEnd}
            onChange={e => setExportEnd(e.target.value)}
            sx={{ width: 150 }}
          />
          <Tooltip title='Export paid invoices as CSV'>
            <Button
              size='small'
              variant='outlined'
              onClick={handleExport}
              disabled={exporting}
              startIcon={exporting ? <CircularProgress size={14} /> : <i className='ri-download-line' />}
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </Tooltip>
        </Box>

        {data && (
          <Typography variant='caption' color='text.secondary' sx={{ width: '100%', textAlign: 'right' }}>
            {data.totalElements} total invoices
          </Typography>
        )}
      </Box>

      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      <InvoiceTable
        invoices={data?.data ?? []}
        loading={loading}
        showRetry={canManage}
        onRetry={setRetry}
        onVoid={canManage ? setVoid : undefined}
      />

      {data && data.totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, pt: 2 }}>
          <Button size='small' variant='outlined' disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            Previous
          </Button>
          <Typography variant='body2' sx={{ alignSelf: 'center' }}>
            Page {page + 1} of {data.totalPages}
          </Typography>
          <Button size='small' variant='outlined' disabled={!data.hasMore} onClick={() => setPage(p => p + 1)}>
            Next
          </Button>
        </Box>
      )}

      <RetryDialog invoice={retryTarget} onClose={() => setRetry(null)} onConfirmed={handleRetry} />
      <VoidDialog invoice={voidTarget} onClose={() => setVoid(null)} onVoided={handleVoided} />
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.includes('fail') || toast?.includes('Fail') ? 'error' : 'success'} onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tab 1 — Failed Queue
// ---------------------------------------------------------------------------

function FailedQueueTab({ canManage }: { canManage: boolean }) {
  const [invoices, setInvoices] = useState<AdminInvoiceDto[]>([])
  const [loading, setLoading]   = useState(true)
  const [retryTarget, setRetry] = useState<AdminInvoiceDto | null>(null)
  const [voidTarget, setVoid]   = useState<AdminInvoiceDto | null>(null)
  const [toast, setToast]       = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setInvoices(await getAdminFailedInvoices()) }
    catch { setError('Failed to load failed invoices') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleRetry(id: string) {
    try {
      await adminRetryInvoice(id)
      setToast('Retry triggered — check back shortly')
      load()
    } catch (e: any) {
      setToast(e?.response?.data?.message ?? 'Retry failed')
    }
    setRetry(null)
  }

  function handleVoided(updated: AdminInvoiceDto) {
    setInvoices(prev => prev.filter(i => i.id !== updated.id))
    setToast('Invoice written off')
    setVoid(null)
  }

  return (
    <>
      {invoices.length > 0 && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} in the failed queue. Use retry to attempt payment or write off to waive.
        </Alert>
      )}
      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      <InvoiceTable
        invoices={invoices}
        loading={loading}
        showRetry={canManage}
        onRetry={setRetry}
        onVoid={canManage ? setVoid : undefined}
        emptyMessage='No failed invoices — all payments are up to date'
      />

      <RetryDialog invoice={retryTarget} onClose={() => setRetry(null)} onConfirmed={handleRetry} />
      <VoidDialog invoice={voidTarget} onClose={() => setVoid(null)} onVoided={handleVoided} />
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity='info' onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tab 2 — Delinquent Accounts
// ---------------------------------------------------------------------------

function DelinquentTab({ canManage }: { canManage: boolean }) {
  const [invoices, setInvoices] = useState<AdminInvoiceDto[]>([])
  const [loading, setLoading]   = useState(true)
  const [retryTarget, setRetry] = useState<AdminInvoiceDto | null>(null)
  const [voidTarget, setVoid]   = useState<AdminInvoiceDto | null>(null)
  const [toast, setToast]       = useState<string | null>(null)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setInvoices(await getAdminDelinquentInvoices()) }
    catch { setError('Failed to load delinquent accounts') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleRetry(id: string) {
    try {
      await adminRetryInvoice(id)
      setToast('Retry triggered')
      load()
    } catch (e: any) {
      setToast(e?.response?.data?.message ?? 'Retry failed')
    }
    setRetry(null)
  }

  function handleVoided(updated: AdminInvoiceDto) {
    setInvoices(prev => prev.filter(i => i.id !== updated.id))
    setToast('Invoice written off')
    setVoid(null)
  }

  // Group by tenant
  const byTenant = invoices.reduce<Record<string, AdminInvoiceDto[]>>((acc, inv) => {
    if (!acc[inv.tenantId]) acc[inv.tenantId] = []
    acc[inv.tenantId].push(inv)
    return acc
  }, {})

  const uniqueTenants = Object.keys(byTenant).length

  return (
    <>
      {uniqueTenants > 0 && (
        <Alert severity='error' sx={{ mb: 2 }}>
          <strong>{uniqueTenants} tenant{uniqueTenants !== 1 ? 's' : ''}</strong> at risk of auto-downgrade to FREE due to 2+ failed payment attempts.
        </Alert>
      )}
      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      <InvoiceTable
        invoices={invoices}
        loading={loading}
        showRetry={canManage}
        onRetry={setRetry}
        onVoid={canManage ? setVoid : undefined}
        emptyMessage='No delinquent accounts — all tenants are in good standing'
      />

      <RetryDialog invoice={retryTarget} onClose={() => setRetry(null)} onConfirmed={handleRetry} />
      <VoidDialog invoice={voidTarget} onClose={() => setVoid(null)} onVoided={handleVoided} />
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity='info' onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </>
  )
}

// ---------------------------------------------------------------------------
// Tab 3 — Upcoming Renewals
// ---------------------------------------------------------------------------

function RenewalsTab() {
  const [days, setDays]         = useState<7 | 14 | 30>(30)
  const [renewals, setRenewals] = useState<UpcomingRenewalDto[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const load = useCallback(async (d: 7 | 14 | 30) => {
    setLoading(true); setError(null)
    try { setRenewals(await getUpcomingRenewals(d)) }
    catch { setError('Failed to load upcoming renewals') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load(days) }, [load, days])

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <Typography variant='body2' color='text.secondary'>Renewals due within:</Typography>
        <ToggleButtonGroup
          size='small'
          exclusive
          value={days}
          onChange={(_, v) => { if (v) setDays(v) }}
        >
          <ToggleButton value={7}>7 days</ToggleButton>
          <ToggleButton value={14}>14 days</ToggleButton>
          <ToggleButton value={30}>30 days</ToggleButton>
        </ToggleButtonGroup>
        {!loading && (
          <Typography variant='caption' color='text.secondary' sx={{ ml: 'auto' }}>
            {renewals.length} subscription{renewals.length !== 1 ? 's' : ''} renewing
          </Typography>
        )}
      </Box>

      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : renewals.length === 0 ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <i className='ri-calendar-check-line' style={{ fontSize: '2rem', opacity: 0.3 }} />
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            No renewals due in the next {days} days
          </Typography>
        </Box>
      ) : (
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Tenant</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Price/Unit</TableCell>
                <TableCell>Renewal Date</TableCell>
                <TableCell>Days Until Renewal</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renewals.map(r => {
                const daysLeft = Math.round(
                  (new Date(r.renewalDate).getTime() - Date.now()) / 86_400_000
                )
                const urgency: 'error' | 'warning' | 'default' =
                  daysLeft <= 3 ? 'error' : daysLeft <= 7 ? 'warning' : 'default'
                return (
                  <TableRow key={r.tenantId} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>{r.tenantName}</Typography>
                      <Typography variant='caption' color='text.secondary' sx={{ fontFamily: 'monospace' }}>
                        {r.tenantId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size='small' label={r.planDisplayName} variant='tonal' color='primary' />
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(r.pricePerUnit)}/unit
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>
                        {new Date(r.renewalDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size='small'
                        label={daysLeft <= 0 ? 'Today' : `${daysLeft}d`}
                        color={urgency}
                        variant={urgency === 'default' ? 'outlined' : 'tonal'}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminInvoicesView() {
  const { hasPermission } = useAdminAuth()
  const canManage = hasPermission('manage_tenants')

  const [tab, setTab] = useState(0)

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h5' fontWeight={700}>Billing & Invoices</Typography>
        <Typography variant='body2' color='text.secondary'>
          Platform-wide subscription invoice management
        </Typography>
      </Box>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label='All Invoices' icon={<i className='ri-file-list-3-line' style={{ fontSize: '1rem' }} />} iconPosition='start' />
            <Tab label='Failed Queue' icon={<i className='ri-error-warning-line' style={{ fontSize: '1rem' }} />} iconPosition='start' />
            <Tab label='Delinquent Accounts' icon={<i className='ri-alarm-warning-line' style={{ fontSize: '1rem' }} />} iconPosition='start' />
            <Tab label='Upcoming Renewals' icon={<i className='ri-calendar-event-line' style={{ fontSize: '1rem' }} />} iconPosition='start' />
          </Tabs>
        </Box>

        <CardContent>
          {tab === 0 && <AllInvoicesTab canManage={canManage} />}
          {tab === 1 && <FailedQueueTab canManage={canManage} />}
          {tab === 2 && <DelinquentTab canManage={canManage} />}
          {tab === 3 && <RenewalsTab />}
        </CardContent>
      </Card>
    </Box>
  )
}
