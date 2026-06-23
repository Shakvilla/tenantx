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
import Divider from '@mui/material/Divider'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'

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
  const [title, setTitle]       = useState('')
  const [message, setMessage]   = useState('')
  const [severity, setSeverity] = useState('info')
  const [active, setActive]     = useState(true)
  const [expires, setExpires]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? '')
      setMessage(initial?.message ?? '')
      setSeverity(initial?.severity ?? 'info')
      setActive(initial?.active ?? true)
      setExpires(initial?.expiresAt ? initial.expiresAt.slice(0, 10) : '')
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

export default function AdminAnnouncementsView() {
  const { hasPermission } = useAdminAuth()
  const canManage = hasPermission('manage_tenants')

  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [formOpen, setFormOpen]           = useState(false)
  const [editing, setEditing]             = useState<AnnouncementDto | null>(null)
  const [deleting, setDeleting]           = useState<string | null>(null)
  const [toggling, setToggling]           = useState<string | null>(null)
  const [toast, setToast]                 = useState<string | null>(null)

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

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      await deleteAnnouncement(id)
      setAnnouncements(prev => prev.filter(x => x.id !== id))
      setToast('Announcement deleted')
    } catch {
      setToast('Failed to delete announcement')
    } finally {
      setDeleting(null)
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
        const active = announcements.find(a => a.active && (!a.expiresAt || new Date(a.expiresAt) > new Date()))
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
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Severity</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Expires</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                {canManage && <TableCell />}
              </TableRow>
            </TableHead>
            <TableBody>
              {announcements.map(a => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    <Typography variant='body2' fontWeight={600}>{a.title}</Typography>
                    <Typography variant='caption' color='text.secondary' sx={{ display: 'block', maxWidth: 320 }} noWrap>
                      {a.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size='small'
                      label={severityLabel(a.severity)}
                      color={SEVERITY_COLOR[a.severity] ?? 'default'}
                      variant='tonal'
                    />
                  </TableCell>
                  <TableCell>
                    {canManage ? (
                      toggling === a.id ? (
                        <CircularProgress size={16} />
                      ) : (
                        <Switch
                          size='small'
                          checked={a.active}
                          onChange={() => handleToggle(a)}
                          color='success'
                        />
                      )
                    ) : (
                      <Chip size='small' label={a.active ? 'Active' : 'Inactive'} color={a.active ? 'success' : 'default'} variant='outlined' />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>{fmtDate(a.expiresAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant='body2'>{fmtDate(a.createdAt)}</Typography>
                  </TableCell>
                  {canManage && (
                    <TableCell align='right'>
                      <Tooltip title='Edit'>
                        <IconButton size='small' onClick={() => openEdit(a)}>
                          <i className='ri-edit-line' style={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Delete'>
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => handleDelete(a.id)}
                          disabled={deleting === a.id}
                        >
                          {deleting === a.id
                            ? <CircularProgress size={14} />
                            : <i className='ri-delete-bin-line' style={{ fontSize: '1rem' }} />
                          }
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

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
