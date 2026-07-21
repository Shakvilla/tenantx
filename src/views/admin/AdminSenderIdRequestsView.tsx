'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import TablePagination from '@mui/material/TablePagination'
import Tooltip from '@mui/material/Tooltip'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import {
  getSenderIdRequests,
  approveSenderIdRequest,
  rejectSenderIdRequest,
  deactivateSenderId,
  reactivateSenderId,
  type AdminSenderIdRequestDto,
} from '@/lib/api/admin-auth-client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  
return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusChip(status: AdminSenderIdRequestDto['status']) {
  const map: Record<string, { color: 'success' | 'error' | 'warning'; label: string }> = {
    PENDING:  { color: 'warning', label: 'Pending' },
    APPROVED: { color: 'success', label: 'Approved' },
    REJECTED: { color: 'error',   label: 'Rejected' },
  }

  const cfg = map[status] ?? { color: 'default' as const, label: status }

  
return <Chip size='small' label={cfg.label} color={cfg.color as any} variant='tonal' />
}

// ---------------------------------------------------------------------------
// Reject dialog
// ---------------------------------------------------------------------------

interface RejectDialogProps {
  target: AdminSenderIdRequestDto | null
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}

function RejectDialog({ target, onClose, onConfirm }: RejectDialogProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (target) setReason('') }, [target])

  async function handle() {
    setLoading(true)
    await onConfirm(reason.trim() || 'Not approved')
    setLoading(false)
  }

  return (
    <Dialog open={!!target} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle>Reject Sender ID Request</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Reject <strong>{target?.requestedSenderId}</strong> for <strong>{target?.tenantName}</strong>?
        </DialogContentText>
        <TextField
          label='Reason (optional)'
          fullWidth
          multiline
          rows={2}
          value={reason}
          onChange={e => setReason(e.target.value)}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant='contained' color='error' onClick={handle} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color='inherit' /> : undefined}>
          Reject
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Deactivate dialog
// ---------------------------------------------------------------------------

interface DeactivateDialogProps {
  target: AdminSenderIdRequestDto | null
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}

function DeactivateDialog({ target, onClose, onConfirm }: DeactivateDialogProps) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (target) setReason('') }, [target])

  async function handle() {
    setLoading(true)
    await onConfirm(reason.trim() || 'Deactivated by admin')
    setLoading(false)
  }

  return (
    <Dialog open={!!target} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle>Deactivate Sender ID</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Revoke <strong>{target?.requestedSenderId}</strong> for <strong>{target?.tenantName}</strong>? This immediately blocks their SMS sending until reactivated.
        </DialogContentText>
        <TextField
          label='Reason (optional)'
          fullWidth
          multiline
          rows={2}
          value={reason}
          onChange={e => setReason(e.target.value)}
          disabled={loading}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant='contained' color='error' onClick={handle} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color='inherit' /> : undefined}>
          Deactivate
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

const columnHelper = createColumnHelper<AdminSenderIdRequestDto>()

export default function AdminSenderIdRequestsView() {
  const [rows, setRows]           = useState<AdminSenderIdRequestDto[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [page, setPage]           = useState(0)
  const [pageSize, setPageSize]   = useState(25)
  const [totalElements, setTotalElements] = useState(0)

  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<AdminSenderIdRequestDto | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AdminSenderIdRequestDto | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // Filter state
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  // Committed filter (applied on search)
  const [committed, setCommitted] = useState({ search: '', status: '', from: '', to: '' })

  const load = useCallback(async (p: number, size: number, filters: typeof committed) => {
    setLoading(true)
    setError(null)

    try {
      const res = await getSenderIdRequests({
        status: filters.status || undefined,
        search: filters.search || undefined,
        from: filters.from ? new Date(filters.from).toISOString() : undefined,
        to: filters.to ? new Date(filters.to + 'T23:59:59').toISOString() : undefined,
        page: p,
        size,
      })

      setRows(res.data)
      setPage(res.page)
      setTotalElements(res.totalElements)
    } catch {
      setError('Failed to load sender ID requests')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(0, pageSize, committed)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSearch() {
    const next = { search, status, from: fromDate, to: toDate }

    setCommitted(next)
    load(0, pageSize, next)
  }

  function handleReset() {
    setSearch(''); setStatus(''); setFromDate(''); setToDate('')
    const empty = { search: '', status: '', from: '', to: '' }

    setCommitted(empty)
    load(0, pageSize, empty)
  }

  async function handleApprove(r: AdminSenderIdRequestDto) {
    if (!r.id) return
    setBusyKey(r.id)

    try {
      await approveSenderIdRequest(r.id)
      setToast('Sender ID approved')
      load(page, pageSize, committed)
    } catch {
      setToast('Failed to approve')
    } finally {
      setBusyKey(null)
    }
  }

  async function handleReject(reason: string) {
    if (!rejectTarget?.id) return

    try {
      await rejectSenderIdRequest(rejectTarget.id, reason)
      setToast('Sender ID rejected')
      setRejectTarget(null)
      load(page, pageSize, committed)
    } catch {
      setToast('Failed to reject')
    }
  }

  async function handleDeactivate(reason: string) {
    if (!deactivateTarget) return

    try {
      await deactivateSenderId(deactivateTarget.tenantId, reason)
      setToast('Sender ID deactivated')
      setDeactivateTarget(null)
      load(page, pageSize, committed)
    } catch {
      setToast('Failed to deactivate')
    }
  }

  async function handleReactivate(r: AdminSenderIdRequestDto) {
    setBusyKey(r.tenantId)

    try {
      await reactivateSenderId(r.tenantId)
      setToast('Sender ID reactivated')
      load(page, pageSize, committed)
    } catch {
      setToast('Failed to reactivate')
    } finally {
      setBusyKey(null)
    }
  }

  const columns = useMemo(() => [
    columnHelper.accessor('tenantName', {
      header: 'Tenant',
      cell: info => {
        const r = info.row.original

        
return (
          <Box>
            <Typography variant='body2' fontWeight={600}>{r.tenantName}</Typography>
            <Typography variant='caption' color='text.secondary' sx={{ fontFamily: 'monospace' }}>{r.tenantId}</Typography>
          </Box>
        )
      },
    }),
    columnHelper.accessor('requestedSenderId', {
      header: 'Sender ID',
      cell: info => <Typography variant='body2' fontWeight={600}>{info.getValue()}</Typography>,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => statusChip(info.getValue()),
    }),
    columnHelper.display({
      id: 'active',
      header: 'Active',
      cell: info => {
        const r = info.row.original

        if (r.status !== 'APPROVED') return <Typography variant='caption' color='text.secondary'>—</Typography>
        if (r.isActive) return <Chip size='small' label='Active' color='success' variant='outlined' />
        if (r.deactivatedAt) return <Chip size='small' label='Deactivated' color='default' variant='outlined' />

return <Typography variant='caption' color='text.secondary'>Awaiting funding</Typography>
      },
    }),
    columnHelper.accessor('createdAt', {
      header: 'Requested',
      cell: info => <Typography variant='caption' color='text.secondary'>{fmtDate(info.getValue())}</Typography>,
    }),
    columnHelper.display({
      id: 'resolvedAt',
      header: 'Approved / Rejected',
      cell: info => {
        const r = info.row.original
        const at = r.approvedAt ?? r.rejectedAt

        
return <Typography variant='caption' color='text.secondary'>{fmtDate(at)}</Typography>
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <span style={{ display: 'block', textAlign: 'right' }}>Actions</span>,
      cell: info => {
        const r = info.row.original
        const isBusy = busyKey === r.id || busyKey === r.tenantId

        return (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {r.status === 'PENDING' && (
              <>
                <Button
                  size='small'
                  variant='contained'
                  color='success'
                  disabled={isBusy}
                  onClick={() => handleApprove(r)}
                  startIcon={busyKey === r.id ? <CircularProgress size={14} color='inherit' /> : undefined}
                >
                  Approve
                </Button>
                <Button size='small' variant='outlined' color='error' onClick={() => setRejectTarget(r)}>
                  Reject
                </Button>
              </>
            )}
            {r.status === 'APPROVED' && r.isActive && (
              <Button size='small' variant='outlined' color='error' onClick={() => setDeactivateTarget(r)}>
                Deactivate
              </Button>
            )}
            {r.status === 'APPROVED' && !r.isActive && r.deactivatedAt && (
              <Button
                size='small'
                variant='outlined'
                color='success'
                disabled={isBusy}
                onClick={() => handleReactivate(r)}
                startIcon={busyKey === r.tenantId ? <CircularProgress size={14} color='inherit' /> : undefined}
              >
                Reactivate
              </Button>
            )}
            {r.status === 'REJECTED' && r.rejectionReason && (
              <Tooltip title={r.rejectionReason}>
                <Typography variant='caption' color='text.secondary' sx={{ cursor: 'help' }}>Reason</Typography>
              </Tooltip>
            )}
          </Box>
        )
      },
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [busyKey])

  const table = useReactTable({
    data: rows,
    columns,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(totalElements / pageSize),
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <Box>
      <Typography variant='h5' fontWeight={700} sx={{ mb: 3 }}>SMS Sender ID Requests</Typography>

      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant='subtitle2' fontWeight={600} mb={2}>Filters</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <TextField
              label='Search'
              size='small'
              placeholder='Sender ID or tenant name'
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              label='Status'
              size='small'
              value={status}
              onChange={e => setStatus(e.target.value)}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value=''>All</MenuItem>
              <MenuItem value='PENDING'>Pending</MenuItem>
              <MenuItem value='APPROVED'>Approved</MenuItem>
              <MenuItem value='REJECTED'>Rejected</MenuItem>
            </TextField>
            <TextField
              label='From Date'
              type='date'
              size='small'
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <TextField
              label='To Date'
              type='date'
              size='small'
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
            <Button variant='contained' onClick={handleSearch} sx={{ height: 40 }}>Search</Button>
            <Button variant='outlined' onClick={handleReset} sx={{ height: 40 }}>Reset</Button>
          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card variant='outlined'>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && (
            <>
              <div className='overflow-x-auto'>
                <table className={tableStyles.table}>
                  <thead>
                    {table.getHeaderGroups().map(hg => (
                      <tr key={hg.id}>
                        {hg.headers.map(h => (
                          <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>
                          No sender ID requests match the current filters.
                        </td>
                      </tr>
                    ) : table.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={totalElements}
                rowsPerPage={pageSize}
                page={page}
                onPageChange={(_, newPage) => { setPage(newPage); load(newPage, pageSize, committed) }}
                onRowsPerPageChange={e => {
                  const newSize = Number(e.target.value)

                  setPageSize(newSize)
                  setPage(0)
                  load(0, newSize, committed)
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <RejectDialog target={rejectTarget} onClose={() => setRejectTarget(null)} onConfirm={handleReject} />
      <DeactivateDialog target={deactivateTarget} onClose={() => setDeactivateTarget(null)} onConfirm={handleDeactivate} />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity='success' onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </Box>
  )
}
