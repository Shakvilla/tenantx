'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Skeleton from '@mui/material/Skeleton'
import Divider from '@mui/material/Divider'

import {
  getFeeLedgerEntries,
  getFeeLedgerSummary,
  settleFeeEntry,
  settleBatch,
  type FeeLedgerEntryDto,
  type FeeLedgerSummary,
} from '@/lib/api/admin-auth-client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number | undefined | null): string {
  if (n == null) return '—'
  return `GHS ${Number(n).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtRate(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`
}

// ---------------------------------------------------------------------------
// Summary stat card
// ---------------------------------------------------------------------------

function SummaryCard({ label, value, icon, color, loading }: {
  label: string
  value: string
  icon: string
  color: 'primary' | 'success' | 'warning' | 'info'
  loading: boolean
}) {
  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent sx={{ py: '12px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant='caption' color='text.secondary' fontWeight={600}>
            {label}
          </Typography>
          <Box
            sx={{
              width: 30, height: 30, borderRadius: 1.5,
              bgcolor: `${color}.main`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <i className={icon} style={{ fontSize: '0.9rem', color: '#fff' }} />
          </Box>
        </Box>
        {loading
          ? <Skeleton variant='text' width='50%' height={32} />
          : <Typography variant='h5' fontWeight={800}>{value}</Typography>
        }
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminFeeLedgerView() {
  // ── Summary ───────────────────────────────────────────────────────────────
  const [summary, setSummary]           = useState<FeeLedgerSummary | null>(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [summaryError, setSummaryError] = useState<string | null>(null)

  // ── Ledger list ───────────────────────────────────────────────────────────
  const [entries, setEntries]           = useState<FeeLedgerEntryDto[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [page, setPage]                 = useState(0)
  const [rowsPerPage, setRowsPerPage]   = useState(50)
  const [totalElements, setTotalElements] = useState(0)

  // ── Filters ───────────────────────────────────────────────────────────────
  const [tenantFilter, setTenantFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  // ── Settling ──────────────────────────────────────────────────────────────
  const [settlingId, setSettlingId]         = useState<string | null>(null)   // row-level spinner
  const [batchSettling, setBatchSettling]   = useState(false)
  const [batchConfirmOpen, setBatchConfirmOpen] = useState(false)
  const [toast, setToast]                   = useState<string | null>(null)

  // ── Load summary ──────────────────────────────────────────────────────────
  useEffect(() => {
    setSummaryLoading(true)
    getFeeLedgerSummary()
      .then(setSummary)
      .catch(() => setSummaryError('Failed to load summary'))
      .finally(() => setSummaryLoading(false))
  }, [])

  // ── Load entries ──────────────────────────────────────────────────────────
  const loadEntries = useCallback(async (p = 0) => {
    setLoading(true); setError(null)
    try {
      const res = await getFeeLedgerEntries({
        tenantId: tenantFilter || undefined,
        status:   statusFilter || undefined,
        page: p,
        size: rowsPerPage,
      })
      setEntries(res.data)
      setTotalElements(res.totalElements)
      setPage(p)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load fee ledger')
    } finally {
      setLoading(false)
    }
  }, [tenantFilter, statusFilter, rowsPerPage])

  useEffect(() => { loadEntries(0) }, [loadEntries])

  function handleSearch() { loadEntries(0) }

  async function handleSettle(id: string) {
    setSettlingId(id)
    try {
      const updated = await settleFeeEntry(id)
      setEntries(prev => prev.map(e => e.id === id ? updated : e))
      setSummary(null) // trigger summary reload
      getFeeLedgerSummary().then(setSummary).catch(() => {})
      setToast('Fee entry marked as settled')
    } catch (e: any) {
      setToast(e?.response?.data?.message ?? 'Failed to settle entry')
    } finally {
      setSettlingId(null)
    }
  }

  async function handleBatchSettle() {
    setBatchConfirmOpen(false)
    setBatchSettling(true)
    try {
      const scopedTenant = tenantFilter || undefined
      const result = await settleBatch(scopedTenant)
      setToast(`Settled ${result.settledCount} entr${result.settledCount === 1 ? 'y' : 'ies'} — GHS ${Number(result.totalAmount).toFixed(2)}`)
      loadEntries(0)
      getFeeLedgerSummary().then(setSummary).catch(() => {})
    } catch (e: any) {
      setToast(e?.response?.data?.message ?? 'Batch settle failed')
    } finally {
      setBatchSettling(false)
    }
  }

  function statusColor(s: string): 'success' | 'warning' | 'error' | 'default' {
    if (s === 'SETTLED')  return 'success'
    if (s === 'REVERSED') return 'error'
    if (s === 'CAPTURED') return 'warning'
    return 'default'
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* ── Page header ───────────────────────────────────────────────────── */}
      <Typography variant='h5' fontWeight={700} sx={{ mb: 0.5 }}>
        Transaction Fee Ledger
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        Platform fees captured from subscription payments. Fee rate is configurable in Platform Settings.
      </Typography>

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      {summaryError && <Alert severity='warning' sx={{ mb: 2 }}>{summaryError}</Alert>}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <SummaryCard label='Total Captured' value={fmt(summary?.totalCaptured)} icon='ri-coins-line' color='primary' loading={summaryLoading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard label='Total Settled' value={fmt(summary?.totalSettled)} icon='ri-check-double-line' color='success' loading={summaryLoading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard label='Last 30 Days' value={fmt(summary?.last30Days)} icon='ri-calendar-check-line' color='info' loading={summaryLoading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <SummaryCard label='Last 7 Days' value={fmt(summary?.last7Days)} icon='ri-time-line' color='warning' loading={summaryLoading} />
        </Grid>
      </Grid>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <Card sx={{ mb: 2 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <TextField
            label='Tenant ID'
            size='small'
            value={tenantFilter}
            onChange={e => setTenantFilter(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            sx={{ minWidth: 200 }}
            slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
          />
          <FormControl size='small' sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label='Status'
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='CAPTURED'>Captured</MenuItem>
              <MenuItem value='SETTLED'>Settled</MenuItem>
              <MenuItem value='REVERSED'>Reversed</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant='contained'
            size='small'
            onClick={handleSearch}
            startIcon={<i className='ri-search-line' />}
            sx={{ height: 40 }}
          >
            Search
          </Button>

          {/* Push Settle All to the right */}
          <Box sx={{ flex: 1 }} />

          <Tooltip title={tenantFilter ? `Settle all captured for tenant "${tenantFilter}"` : 'Settle all captured fees'}>
            <span>
              <Button
                variant='outlined'
                color='success'
                size='small'
                onClick={() => setBatchConfirmOpen(true)}
                disabled={batchSettling || loading}
                startIcon={batchSettling
                  ? <CircularProgress size={14} color='inherit' />
                  : <i className='ri-check-double-line' />}
                sx={{ height: 40, whiteSpace: 'nowrap' }}
              >
                {batchSettling ? 'Settling…' : 'Settle All Captured'}
              </Button>
            </span>
          </Tooltip>
        </CardContent>
      </Card>

      {/* ── Ledger table ──────────────────────────────────────────────────── */}
      <Card>
        {error && <Alert severity='error' sx={{ m: 2 }}>{error}</Alert>}

        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Tenant</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Source</TableCell>
                <TableCell align='right' sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Gross</TableCell>
                <TableCell align='right' sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Rate</TableCell>
                <TableCell align='right' sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Fee</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Settled At</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', width: 60 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(8)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(9)].map((__, j) => (
                      <TableCell key={j}><Skeleton variant='text' /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align='center' sx={{ py: 4, color: 'text.secondary' }}>
                    No fee ledger entries found.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map(entry => (
                  <TableRow key={entry.id} hover>
                    <TableCell sx={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                      {fmtDate(entry.createdAt)}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {entry.tenantId}
                    </TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'text.secondary' }}>
                      {entry.sourceId.slice(0, 8)}…
                    </TableCell>
                    <TableCell align='right' sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>
                      {Number(entry.grossAmount).toFixed(2)}
                    </TableCell>
                    <TableCell align='right' sx={{ fontSize: '0.78rem' }}>
                      {fmtRate(entry.feeRate)}
                    </TableCell>
                    <TableCell align='right' sx={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 600 }}>
                      {Number(entry.feeAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.status}
                        size='small'
                        color={statusColor(entry.status)}
                        sx={{ fontSize: '0.65rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {fmtDate(entry.settledAt)}
                    </TableCell>
                    <TableCell>
                      {entry.status === 'CAPTURED' && (
                        <Tooltip title='Mark as settled'>
                          <span>
                            <IconButton
                              size='small'
                              color='success'
                              onClick={() => handleSettle(entry.id)}
                              disabled={settlingId === entry.id}
                            >
                              {settlingId === entry.id
                                ? <CircularProgress size={16} color='inherit' />
                                : <i className='ri-check-line' style={{ fontSize: '1rem' }} />
                              }
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Divider />
        <TablePagination
          component='div'
          count={totalElements}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => loadEntries(p)}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); loadEntries(0) }}
          rowsPerPageOptions={[25, 50, 100]}
        />
      </Card>

      {/* ── Batch confirm dialog ──────────────────────────────────────────── */}
      <Dialog open={batchConfirmOpen} onClose={() => setBatchConfirmOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Settle All Captured Fees?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {tenantFilter
              ? `This will mark all CAPTURED fee entries for tenant "${tenantFilter}" as SETTLED. This action cannot be undone.`
              : 'This will mark ALL CAPTURED fee entries across every tenant as SETTLED. This action cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBatchConfirmOpen(false)}>Cancel</Button>
          <Button variant='contained' color='success' onClick={handleBatchSettle}>
            Confirm Settle All
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      <Snackbar
        open={!!toast}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
