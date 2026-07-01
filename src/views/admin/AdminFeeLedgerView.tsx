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
import TablePagination from '@mui/material/TablePagination'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Skeleton from '@mui/material/Skeleton'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

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

const columnHelper = createColumnHelper<FeeLedgerEntryDto>()

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
  const [rowsPerPage, setRowsPerPage]   = useState(25)
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
  const loadEntries = useCallback(async (p = 0, size?: number) => {
    const effectiveSize = size ?? rowsPerPage
    setLoading(true); setError(null)
    try {
      const res = await getFeeLedgerEntries({
        tenantId: tenantFilter || undefined,
        status:   statusFilter || undefined,
        page: p,
        size: effectiveSize,
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

  const columns = [
    columnHelper.accessor('createdAt', {
      header: 'Date',
      cell: info => <Typography variant='caption' sx={{ fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{fmtDate(info.getValue())}</Typography>
    }),
    columnHelper.accessor('tenantId', {
      header: 'Tenant',
      cell: info => <Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{info.getValue()}</Typography>
    }),
    columnHelper.accessor('sourceId', {
      header: 'Source',
      cell: info => <Typography sx={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'text.secondary' }}>{info.getValue().slice(0, 8)}…</Typography>
    }),
    columnHelper.accessor('grossAmount', {
      header: () => <span style={{ display: 'block', textAlign: 'right' }}>Gross</span>,
      cell: info => <Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem', textAlign: 'right', display: 'block' }}>{Number(info.getValue()).toFixed(2)}</Typography>
    }),
    columnHelper.accessor('feeRate', {
      header: () => <span style={{ display: 'block', textAlign: 'right' }}>Rate</span>,
      cell: info => <Typography sx={{ fontSize: '0.78rem', textAlign: 'right', display: 'block' }}>{fmtRate(info.getValue())}</Typography>
    }),
    columnHelper.accessor('feeAmount', {
      header: () => <span style={{ display: 'block', textAlign: 'right' }}>Fee</span>,
      cell: info => <Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 600, textAlign: 'right', display: 'block' }}>{Number(info.getValue()).toFixed(2)}</Typography>
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => <Chip label={info.getValue()} size='small' color={statusColor(info.getValue())} sx={{ fontSize: '0.65rem', height: 20 }} />
    }),
    columnHelper.accessor('settledAt', {
      header: 'Settled At',
      cell: info => <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>{fmtDate(info.getValue())}</Typography>
    }),
    columnHelper.display({
      id: 'action',
      header: 'Action',
      cell: info => {
        const entry = info.row.original
        if (entry.status !== 'CAPTURED') return null
        return (
          <Tooltip title='Mark as settled'>
            <span>
              <IconButton size='small' color='success' onClick={() => handleSettle(entry.id)} disabled={settlingId === entry.id}>
                {settlingId === entry.id ? <CircularProgress size={16} color='inherit' /> : <i className='ri-check-line' style={{ fontSize: '1rem' }} />}
              </IconButton>
            </span>
          </Tooltip>
        )
      }
    }),
  ]

  const table = useReactTable({
    data: entries,
    columns,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(totalElements / rowsPerPage),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

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

        <table className={tableStyles.table}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => <td key={j}><Skeleton variant='text' /></td>)}
                </tr>
              ))
            ) : entries.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No fee ledger entries found.</td></tr>
            ) : table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <TablePagination
          component='div'
          count={totalElements}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => loadEntries(p)}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); loadEntries(0, parseInt(e.target.value, 10)) }}
          rowsPerPageOptions={[10, 25, 50]}
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
