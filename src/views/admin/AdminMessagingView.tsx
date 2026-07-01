'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Snackbar from '@mui/material/Snackbar'
import InputAdornment from '@mui/material/InputAdornment'
import TablePagination from '@mui/material/TablePagination'

import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import {
  getAdminTenants,
  sendTargetedMessage,
  broadcastMessage,
  getMessageHistory,
  type TenantRecord,
  type MessagingResult,
  type MessageLogDto,
} from '@/lib/api/admin-auth-client'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

// ---------------------------------------------------------------------------
// Compose dialog (shared by both tabs)
// ---------------------------------------------------------------------------

interface ComposeDialogProps {
  open: boolean
  recipientLabel: string        // e.g. "3 selected tenants" or "all active tenants"
  onClose: () => void
  onSend: (subject: string, body: string) => Promise<MessagingResult>
  onResult: (r: MessagingResult) => void
}

function ComposeDialog({ open, recipientLabel, onClose, onSend, onResult }: ComposeDialogProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  function handleClose() { setSubject(''); setBody(''); setError(null); onClose() }

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return
    setSending(true); setError(null)
    try {
      const result = await onSend(subject.trim(), body.trim())
      onResult(result)
      handleClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Compose Message</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Alert severity='info' icon={<i className='ri-mail-send-line' />}>
          Will be sent to: <strong>{recipientLabel}</strong>
        </Alert>
        {error && <Alert severity='error'>{error}</Alert>}
        <TextField
          label='Subject'
          size='small'
          fullWidth
          required
          value={subject}
          onChange={e => setSubject(e.target.value)}
          disabled={sending}
        />
        <TextField
          label='Message'
          size='small'
          fullWidth
          required
          multiline
          rows={6}
          value={body}
          onChange={e => setBody(e.target.value)}
          disabled={sending}
          placeholder='Write your message here...'
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={sending}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSend}
          disabled={sending || !subject.trim() || !body.trim()}
          startIcon={sending ? <CircularProgress size={14} color='inherit' /> : <i className='ri-send-plane-line' />}
        >
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Targeted Messaging tab
// ---------------------------------------------------------------------------

interface TargetedTabProps {
  onToast: (msg: string) => void
}

const tenantColumnHelper = createColumnHelper<TenantRecord>()

function TargetedTab({ onToast }: TargetedTabProps) {
  const [tenants, setTenants]       = useState<TenantRecord[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [composeOpen, setCompose]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      // Load all active tenants — use large page size
      const res = await getAdminTenants(undefined, 200)
      setTenants(res.data.filter(t => t.active))
    } catch { setError('Failed to load tenants') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filteredTenants = tenants.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.tenant_id.toLowerCase().includes(search.toLowerCase())
  )

  const selectedTenantIds = Object.keys(rowSelection)
    .filter(k => rowSelection[k])
    .map(k => filteredTenants[Number(k)]?.id)
    .filter((id): id is string => !!id)

  const selectedCount = Object.values(rowSelection).filter(Boolean).length

  async function handleSend(subject: string, body: string): Promise<MessagingResult> {
    return sendTargetedMessage(selectedTenantIds, subject, body)
  }

  function handleResult(r: MessagingResult) {
    setRowSelection({})
    onToast(`Sent to ${r.sent} tenant${r.sent !== 1 ? 's' : ''}${r.failed > 0 ? `, ${r.failed} failed` : ''}`)
  }

  const tenantCols = [
    tenantColumnHelper.display({
      id: 'select',
      header: ({ table }) => (
        <Checkbox size='small' checked={table.getIsAllRowsSelected()} indeterminate={table.getIsSomeRowsSelected()} onChange={table.getToggleAllRowsSelectedHandler()} />
      ),
      cell: ({ row }) => (
        <Checkbox size='small' checked={row.getIsSelected()} onChange={row.getToggleSelectedHandler()} />
      ),
    }),
    tenantColumnHelper.accessor('name', { header: 'Tenant', cell: info => <Typography variant='body2' fontWeight={600}>{info.getValue()}</Typography> }),
    tenantColumnHelper.accessor('tenant_id', { header: 'ID', cell: info => <Typography variant='caption' sx={{ fontFamily: 'monospace' }}>{info.getValue()}</Typography> }),
    tenantColumnHelper.display({ id: 'status', header: 'Status', cell: () => <Chip size='small' label='Active' color='success' variant='tonal' /> }),
  ]

  const targetedTable = useReactTable({
    data: filteredTenants,
    columns: tenantCols,
    state: { rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          size='small'
          placeholder='Search tenants…'
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ flex: 1, maxWidth: 320 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position='start'>
                  <i className='ri-search-line' style={{ fontSize: '1rem' }} />
                </InputAdornment>
              )
            }
          }}
        />
        <Button
          variant='contained'
          disabled={selectedCount === 0}
          startIcon={<i className='ri-send-plane-line' />}
          onClick={() => setCompose(true)}
        >
          Compose ({selectedCount} selected)
        </Button>
      </Box>

      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      <Card variant='outlined'>
        {loading ? (
          <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </CardContent>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              {targetedTable.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {targetedTable.getRowModel().rows.length === 0
                ? <tr><td colSpan={tenantCols.length} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No active tenants found</td></tr>
                : targetedTable.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
      </Card>

      <ComposeDialog
        open={composeOpen}
        recipientLabel={`${selectedCount} selected tenant${selectedCount !== 1 ? 's' : ''}`}
        onClose={() => setCompose(false)}
        onSend={handleSend}
        onResult={handleResult}
      />
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Broadcast tab
// ---------------------------------------------------------------------------

interface BroadcastTabProps {
  onToast: (msg: string) => void
}

function BroadcastTab({ onToast }: BroadcastTabProps) {
  const [tenantCount, setTenantCount]   = useState<number | null>(null)
  const [loading, setLoading]           = useState(true)
  const [composeOpen, setCompose]       = useState(false)
  const [confirmOpen, setConfirmOpen]   = useState(false)
  const [pendingSubject, setPendingSubject] = useState('')
  const [pendingBody, setPendingBody]       = useState('')

  useEffect(() => {
    getAdminTenants(undefined, 1).then(res => {
      setTenantCount(res.total ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleSend(subject: string, body: string): Promise<MessagingResult> {
    // Show confirmation before actually sending
    setPendingSubject(subject)
    setPendingBody(body)
    setConfirmOpen(true)
    // Return a never-resolving promise — the actual send happens in the confirm dialog
    return new Promise(() => {})
  }

  async function handleConfirm() {
    setConfirmOpen(false)
    try {
      const result = await broadcastMessage(pendingSubject, pendingBody)
      onToast(`Broadcast sent to ${result.sent} tenant${result.sent !== 1 ? 's' : ''}${result.failed > 0 ? ` (${result.failed} failed)` : ''}`)
    } catch {
      onToast('Broadcast failed — please try again')
    }
    setPendingSubject(''); setPendingBody('')
  }

  return (
    <Box>
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Box
            sx={{
              width: 56, height: 56, borderRadius: 2,
              bgcolor: 'warning.lighter',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}
          >
            <i className='ri-broadcast-line' style={{ fontSize: '1.75rem', color: 'var(--mui-palette-warning-main)' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant='subtitle1' fontWeight={700}>Broadcast to All Tenants</Typography>
            <Typography variant='body2' color='text.secondary'>
              {loading
                ? 'Loading tenant count…'
                : `Send a message to the primary admin of every active tenant on the platform${tenantCount != null ? ` (${tenantCount} tenants)` : ''}.`
              }
            </Typography>
          </Box>
          <Button
            variant='contained'
            color='warning'
            startIcon={<i className='ri-send-plane-2-line' />}
            onClick={() => setCompose(true)}
            disabled={loading}
          >
            Compose Broadcast
          </Button>
        </CardContent>
      </Card>

      <Alert severity='warning' icon={<i className='ri-alert-line' />}>
        Broadcast emails are sent to <strong>all active tenants</strong>. You will be asked to confirm before sending.
        Use this for platform-wide notices such as maintenance windows, new features, or policy updates.
      </Alert>

      {/* The ComposeDialog's onSend won't actually send — it triggers the confirm dialog instead */}
      <ComposeDialog
        open={composeOpen}
        recipientLabel='all active tenants'
        onClose={() => setCompose(false)}
        onSend={handleSend}
        onResult={() => {}}
      />

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Broadcast</DialogTitle>
        <DialogContent>
          <DialogContentText>
            You are about to send <strong>"{pendingSubject}"</strong> to <strong>all active tenants</strong>.
            This cannot be undone. Are you sure?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant='contained' color='warning' onClick={handleConfirm}
            startIcon={<i className='ri-send-plane-2-line' />}>
            Yes, Send Broadcast
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// History tab
// ---------------------------------------------------------------------------

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const histColumnHelper = createColumnHelper<MessageLogDto>()

function HistoryTab() {
  const [logs, setLogs]       = useState<MessageLogDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [page, setPage]       = useState(0)
  const [total, setTotal]     = useState(0)
  const [pageSize, setPageSize] = useState(25)

  const load = useCallback(async (p = 0, size?: number) => {
    setLoading(true); setError(null)
    try {
      const res = await getMessageHistory(p, size ?? pageSize)
      setLogs(res.data)
      setTotal(res.total)
      setPage(p)
    } catch { setError('Failed to load message history') }
    finally { setLoading(false) }
  }, [pageSize])

  useEffect(() => { load() }, [load])

  const histCols = [
    histColumnHelper.accessor('subject', {
      header: 'Subject',
      cell: info => (
        <Box>
          <Typography variant='body2' fontWeight={600}>{info.getValue()}</Typography>
          {info.row.original.bodyPreview && <Typography variant='caption' color='text.secondary' sx={{ display: 'block', maxWidth: 360 }} noWrap>{info.row.original.bodyPreview}</Typography>}
        </Box>
      )
    }),
    histColumnHelper.accessor('messageType', {
      header: 'Type',
      cell: info => (
        <Chip size='small' label={info.getValue() === 'BROADCAST' ? 'Broadcast' : 'Targeted'} color={info.getValue() === 'BROADCAST' ? 'warning' : 'info'} variant='tonal'
          icon={<i className={info.getValue() === 'BROADCAST' ? 'ri-broadcast-line' : 'ri-group-line'} />} />
      )
    }),
    histColumnHelper.accessor('recipientCount', { header: 'Recipients', cell: info => <Typography variant='body2'>{info.getValue()}</Typography> }),
    histColumnHelper.display({
      id: 'result',
      header: 'Sent / Failed',
      cell: info => (
        <Typography variant='body2'>
          <span style={{ color: 'var(--mui-palette-success-main)' }}>{info.row.original.sentCount}✓</span>
          {info.row.original.failedCount > 0 && <span style={{ color: 'var(--mui-palette-error-main)', marginLeft: 6 }}>{info.row.original.failedCount}✗</span>}
        </Typography>
      )
    }),
    histColumnHelper.accessor('sentAt', { header: 'Sent At', cell: info => <Typography variant='body2'>{fmtDateTime(info.getValue())}</Typography> }),
  ]

  const histTable = useReactTable({
    data: logs,
    columns: histCols,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(total / pageSize),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Box>
      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
      <Card variant='outlined'>
        {loading ? (
          <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </CardContent>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              {histTable.getHeaderGroups().map(hg => (
                <tr key={hg.id}>
                  {hg.headers.map(h => (
                    <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {histTable.getRowModel().rows.length === 0
                ? <tr><td colSpan={histCols.length} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No messages sent yet</td></tr>
                : histTable.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                    ))}
                  </tr>
                ))
              }
            </tbody>
          </table>
        )}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component='div'
          count={total}
          rowsPerPage={pageSize}
          page={page}
          onPageChange={(_, p) => { setPage(p); load(p, pageSize) }}
          onRowsPerPageChange={e => { const s = Number(e.target.value); setPageSize(s); setPage(0); load(0, s) }}
        />
      </Card>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminMessagingView() {
  const [tab, setTab] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h5' fontWeight={700}>Messaging</Typography>
        <Typography variant='body2' color='text.secondary'>
          Send targeted or platform-wide messages to tenant primary admins
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label='Targeted Messaging' icon={<i className='ri-group-line' />} iconPosition='start' />
        <Tab label='Broadcast to All'   icon={<i className='ri-broadcast-line' />} iconPosition='start' />
        <Tab label='Message History'    icon={<i className='ri-history-line' />} iconPosition='start' />
      </Tabs>

      {tab === 0 && <TargetedTab onToast={setToast} />}
      {tab === 1 && <BroadcastTab onToast={setToast} />}
      {tab === 2 && <HistoryTab />}

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity='success' onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </Box>
  )
}
