'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Tooltip from '@mui/material/Tooltip'
import Snackbar from '@mui/material/Snackbar'
import DialogContentText from '@mui/material/DialogContentText'
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
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  type AnnouncementDto,
  type CreateAnnouncementPayload,
} from '@/lib/api/admin-auth-client'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY_COLOR: Record<string, 'info' | 'warning' | 'error' | 'success'> = {
  info: 'info', warning: 'warning', error: 'error', success: 'success',
}

function severityLabel(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ---------------------------------------------------------------------------
// Create / Edit dialog
// ---------------------------------------------------------------------------

interface AnnouncementFormDialogProps {
  open: boolean
  initial?: AnnouncementDto | null
  onClose: () => void
  onSaved: (a: AnnouncementDto) => void
}

function AnnouncementFormDialog({ open, initial, onClose, onSaved }: AnnouncementFormDialogProps) {
  const [title, setTitle]         = useState('')
  const [message, setMessage]     = useState('')
  const [severity, setSeverity]   = useState('info')
  const [active, setActive]       = useState(true)
  const [expires, setExpires]     = useState('')
  const [scheduled, setScheduled] = useState('')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? '')
      setMessage(initial?.message ?? '')
      setSeverity(initial?.severity ?? 'info')
      setActive(initial?.active ?? true)
      setExpires(initial?.expiresAt ? initial.expiresAt.slice(0, 10) : '')
      // datetime-local expects "YYYY-MM-DDTHH:mm"
      setScheduled(initial?.scheduledAt ? initial.scheduledAt.slice(0, 16) : '')
      setError(null)
    }
  }, [open, initial])

  async function handleSave() {
    if (!title.trim() || !message.trim()) return
    setSaving(true); setError(null)
    try {
      const payload: CreateAnnouncementPayload = {
        title: title.trim(),
        message: message.trim(),
        severity,
        active,
        expiresAt: expires || undefined,
        scheduledAt: scheduled || undefined,
      }
      const saved = initial
        ? await updateAnnouncement(initial.id, payload)
        : await createAnnouncement(payload)
      onSaved(saved)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to save announcement')
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!initial

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>{isEdit ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity='error'>{error}</Alert>}

        <TextField
          label='Title'
          size='small'
          fullWidth
          required
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={saving}
        />

        <TextField
          label='Message'
          size='small'
          fullWidth
          required
          multiline
          rows={3}
          value={message}
          onChange={e => setMessage(e.target.value)}
          disabled={saving}
        />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size='small' sx={{ minWidth: 140 }}>
            <InputLabel>Severity</InputLabel>
            <Select value={severity} onChange={e => setSeverity(e.target.value)} label='Severity' disabled={saving}>
              <MenuItem value='info'>Info</MenuItem>
              <MenuItem value='warning'>Warning</MenuItem>
              <MenuItem value='error'>Critical</MenuItem>
              <MenuItem value='success'>Success</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label='Expires (optional)'
            type='date'
            size='small'
            value={expires}
            onChange={e => setExpires(e.target.value)}
            disabled={saving}
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ flex: 1 }}
          />
        </Box>

        <TextField
          label='Schedule for (optional)'
          type='datetime-local'
          size='small'
          fullWidth
          value={scheduled}
          onChange={e => setScheduled(e.target.value)}
          disabled={saving}
          slotProps={{ inputLabel: { shrink: true } }}
          helperText={scheduled ? 'Announcement will only become visible to tenants at this time (UTC).' : 'Leave blank to publish immediately.'}
        />

        <FormControlLabel
          control={
            <Switch checked={active} onChange={e => setActive(e.target.checked)} disabled={saving} />
          }
          label={active ? 'Active — visible to tenants' : 'Inactive — hidden from tenants'}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving || !title.trim() || !message.trim()}
          startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          {isEdit ? 'Save Changes' : 'Publish'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

const columnHelper = createColumnHelper<AnnouncementDto>()

export default function AdminAnnouncementsView() {
  const { hasPermission } = useAdminAuth()
  const canManage = hasPermission('manage_tenants')

  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [formOpen, setFormOpen]             = useState(false)
  const [editing, setEditing]               = useState<AnnouncementDto | null>(null)
  const [deleteTarget, setDeleteTarget]     = useState<AnnouncementDto | null>(null)
  const [deleting, setDeleting]             = useState(false)
  const [toggling, setToggling]             = useState<string | null>(null)
  const [toast, setToast]                   = useState<string | null>(null)
  const [page, setPage]                     = useState(0)
  const [pageSize, setPageSize]             = useState(10)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setAnnouncements(await getAnnouncements())
    } catch { setError('Failed to load announcements') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggle(a: AnnouncementDto) {
    setToggling(a.id)
    try {
      const updated = await updateAnnouncement(a.id, { active: !a.active })
      setAnnouncements(prev => prev.map(x => x.id === updated.id ? updated : x))
      setToast(updated.active ? 'Announcement activated' : 'Announcement deactivated')
    } catch {
      setToast('Failed to update announcement')
    } finally {
      setToggling(null)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleting(true)
    try {
      await deleteAnnouncement(id)
      setAnnouncements(prev => prev.filter(x => x.id !== id))
      setToast('Announcement deleted')
      setDeleteTarget(null)
    } catch {
      setToast('Failed to delete announcement')
    } finally {
      setDeleting(false)
    }
  }

  function handleSaved(a: AnnouncementDto) {
    setAnnouncements(prev => {
      const idx = prev.findIndex(x => x.id === a.id)
      if (idx >= 0) {
        const next = [...prev]; next[idx] = a; return next
      }
      return [a, ...prev]
    })
    setToast(editing ? 'Announcement updated' : 'Announcement published')
    setEditing(null)
  }

  function openEdit(a: AnnouncementDto) { setEditing(a); setFormOpen(true) }
  function openCreate() { setEditing(null); setFormOpen(true) }

  const columns = [
    columnHelper.accessor('title', {
      header: 'Title',
      cell: info => (
        <Box>
          <Typography variant='body2' fontWeight={600}>{info.getValue()}</Typography>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', maxWidth: 320 }} noWrap>{info.row.original.message}</Typography>
        </Box>
      )
    }),
    columnHelper.accessor('severity', {
      header: 'Severity',
      cell: info => <Chip size='small' label={severityLabel(info.getValue())} color={SEVERITY_COLOR[info.getValue()] ?? 'default'} variant='tonal' />
    }),
    columnHelper.display({
      id: 'status',
      header: 'Status',
      cell: info => {
        const a = info.row.original
        if (!canManage) {
          const isScheduled = a.active && a.scheduledAt && new Date(a.scheduledAt) > new Date()
          return <Chip size='small' label={isScheduled ? 'Scheduled' : a.active ? 'Active' : 'Inactive'} color={isScheduled ? 'warning' : a.active ? 'success' : 'default'} variant='outlined' />
        }
        if (toggling === a.id) return <CircularProgress size={16} />
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch size='small' checked={a.active} onChange={() => handleToggle(a)} color='success' />
            {a.active && a.scheduledAt && new Date(a.scheduledAt) > new Date() && <Chip size='small' label='Scheduled' color='warning' variant='tonal' />}
          </Box>
        )
      }
    }),
    columnHelper.accessor('scheduledAt', { header: 'Goes Live', cell: info => <Typography variant='body2'>{info.getValue() ? fmtDate(info.getValue()) : '—'}</Typography> }),
    columnHelper.accessor('expiresAt', { header: 'Expires', cell: info => <Typography variant='body2'>{fmtDate(info.getValue())}</Typography> }),
    columnHelper.accessor('createdAt', { header: 'Created', cell: info => <Typography variant='body2'>{fmtDate(info.getValue())}</Typography> }),
    ...(canManage ? [columnHelper.display({
      id: 'actions',
      header: () => null,
      cell: info => (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Tooltip title='Edit'><IconButton size='small' onClick={() => openEdit(info.row.original)}><i className='ri-edit-line' style={{ fontSize: '1rem' }} /></IconButton></Tooltip>
          <Tooltip title='Delete'><IconButton size='small' color='error' onClick={() => setDeleteTarget(info.row.original)}><i className='ri-delete-bin-line' style={{ fontSize: '1rem' }} /></IconButton></Tooltip>
        </Box>
      )
    })] : []),
  ]

  const table = useReactTable({
    data: announcements,
    columns,
    state: { pagination: { pageIndex: page, pageSize } },
    onPaginationChange: updater => {
      const next = typeof updater === 'function' ? updater({ pageIndex: page, pageSize }) : updater
      setPage(next.pageIndex)
      setPageSize(next.pageSize)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>Platform Announcements</Typography>
          <Typography variant='body2' color='text.secondary'>
            Publish sitewide banners that appear to all tenants in the app
          </Typography>
        </Box>
        {canManage && (
          <Button
            variant='contained'
            startIcon={<i className='ri-add-line' />}
            onClick={openCreate}
          >
            New Announcement
          </Button>
        )}
      </Box>

      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Preview card for active announcement ───────────────────────────── */}
      {(() => {
        const now = new Date()
        const active = announcements.find(a =>
          a.active &&
          (!a.expiresAt || new Date(a.expiresAt) > now) &&
          (!a.scheduledAt || new Date(a.scheduledAt) <= now)
        )
        if (!active) return null
        return (
          <Alert
            severity={SEVERITY_COLOR[active.severity] ?? 'info'}
            sx={{ mb: 3 }}
            icon={<i className='ri-megaphone-line' />}
          >
            <Typography variant='subtitle2' fontWeight={700}>{active.title}</Typography>
            <Typography variant='body2'>{active.message}</Typography>
          </Alert>
        )
      })()}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <Card variant='outlined'>
        {loading ? (
          <CardContent sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </CardContent>
        ) : announcements.length === 0 ? (
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <i className='ri-megaphone-line' style={{ fontSize: '2.5rem', color: 'var(--mui-palette-text-disabled)' }} />
            <Typography color='text.secondary' sx={{ mt: 1 }}>No announcements yet</Typography>
            {canManage && (
              <Button variant='contained' sx={{ mt: 2 }} onClick={openCreate}>
                Create First Announcement
              </Button>
            )}
          </CardContent>
        ) : (
          <>
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
                {table.getRowModel().rows.length === 0
                  ? <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No data</td></tr>
                  : table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                      ))}
                    </tr>
                  ))
                }
              </tbody>
            </table>
            {announcements.length > 10 && (
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={announcements.length}
                rowsPerPage={pageSize}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
              />
            )}
          </>
        )}
      </Card>

      {/* Delete confirm dialog */}
      <Dialog open={deleteTarget !== null} onClose={() => !deleting && setDeleteTarget(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Delete Announcement</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Delete <strong>{deleteTarget?.title}</strong>? It will immediately stop showing to tenants and cannot be recovered.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleDelete}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={14} color='inherit' /> : undefined}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <AnnouncementFormDialog
        open={formOpen}
        initial={editing}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSaved={handleSaved}
      />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity='success' onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </Box>
  )
}
