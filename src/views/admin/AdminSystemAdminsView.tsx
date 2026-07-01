'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import InputAdornment from '@mui/material/InputAdornment'
import Avatar from '@mui/material/Avatar'
import Snackbar from '@mui/material/Snackbar'
import TablePagination from '@mui/material/TablePagination'

import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import OutlinedInput from '@mui/material/OutlinedInput'

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
  getSystemAdmins,
  createSystemAdmin,
  deactivateSystemAdmin,
  reactivateSystemAdmin,
  getRoles,
  type AdminRecord,
  type CreateAdminPayload,
  type RoleRecord,
} from '@/lib/api/admin-auth-client'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

// ---------------------------------------------------------------------------
// Create Admin Dialog
// ---------------------------------------------------------------------------

interface CreateAdminDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (admin: AdminRecord) => void
}

function CreateAdminDialog({ open, onClose, onCreated }: CreateAdminDialogProps) {
  const [fullName, setFullName]         = useState('')
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPw, setShowPw]             = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [availableRoles, setAvailableRoles] = useState<RoleRecord[]>([])
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState<string | null>(null)

  // Load available roles once when dialog opens
  useEffect(() => {
    if (open) {
      getRoles().then(setAvailableRoles).catch(() => {/* non-fatal */})
    }
  }, [open])

  function handleClose() {
    setFullName(''); setEmail(''); setPassword('')
    setSelectedRoles([]); setError(null)
    onClose()
  }

  async function handleSave() {
    if (!fullName.trim() || !email.trim() || password.length < 8) return
    setSaving(true); setError(null)
    try {
      const payload: CreateAdminPayload = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        roleNames: selectedRoles.length > 0 ? selectedRoles : undefined,
      }
      const created = await createSystemAdmin(payload)
      onCreated(created)
      handleClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to create admin')
    } finally {
      setSaving(false)
    }
  }

  const valid = fullName.trim() && email.trim() && password.length >= 8

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Add System Admin</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <TextField label='Full Name' size='small' fullWidth value={fullName} onChange={e => setFullName(e.target.value)} disabled={saving} required />
        <TextField label='Email' size='small' fullWidth type='email' value={email} onChange={e => setEmail(e.target.value)} disabled={saving} required />
        <TextField
          label='Password'
          size='small'
          fullWidth
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={saving}
          required
          helperText='Minimum 8 characters'
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton size='small' onClick={() => setShowPw(s => !s)}>
                    <i className={showPw ? 'ri-eye-off-line' : 'ri-eye-line'} />
                  </IconButton>
                </InputAdornment>
              )
            }
          }}
        />
        {availableRoles.length > 0 && (
          <FormControl size='small' fullWidth>
            <InputLabel>Roles (optional)</InputLabel>
            <Select
              multiple
              value={selectedRoles}
              onChange={e => setSelectedRoles(typeof e.target.value === 'string' ? [e.target.value] : e.target.value)}
              input={<OutlinedInput label='Roles (optional)' />}
              disabled={saving}
              renderValue={selected => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map(role => (
                    <Chip key={role} label={role} size='small' />
                  ))}
                </Box>
              )}
            >
              {availableRoles.map(role => (
                <MenuItem key={role.id} value={role.name}>
                  <Box>
                    <Typography variant='body2' fontWeight={selectedRoles.includes(role.name) ? 600 : 400}>
                      {role.name}
                    </Typography>
                    {role.description && (
                      <Typography variant='caption' color='text.secondary'>{role.description}</Typography>
                    )}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving || !valid}
          startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Add Admin
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Deactivate confirm
// ---------------------------------------------------------------------------

interface DeactivateDialogProps {
  admin: AdminRecord | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

function DeactivateDialog({ admin, onClose, onConfirm }: DeactivateDialogProps) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }
  return (
    <Dialog open={!!admin} onClose={onClose}>
      <DialogTitle>Deactivate Admin</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Deactivate <strong>{admin?.fullName}</strong>? They will immediately lose platform access.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button color='error' variant='contained' onClick={handle} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Deactivate
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Reactivate confirm
// ---------------------------------------------------------------------------

interface ReactivateDialogProps {
  admin: AdminRecord | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

function ReactivateDialog({ admin, onClose, onConfirm }: ReactivateDialogProps) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }
  return (
    <Dialog open={!!admin} onClose={onClose}>
      <DialogTitle>Reactivate Admin</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Reactivate <strong>{admin?.fullName}</strong>? They will regain platform access immediately.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button color='success' variant='contained' onClick={handle} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Reactivate
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string) {
  return name.split(' ').map(p => p[0] ?? '').slice(0, 2).join('').toUpperCase()
}

const columnHelper = createColumnHelper<AdminRecord>()

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminSystemAdminsView() {
  const { hasPermission } = useAdminAuth()
  const canManage = hasPermission('manage_admins')

  const [admins, setAdmins]             = useState<AdminRecord[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [globalFilter, setGlobalFilter] = useState('')
  const [page, setPage]                 = useState(0)
  const [pageSize, setPageSize]         = useState(10)
  const [createOpen, setCreateOpen]     = useState(false)
  const [deactivating, setDeactivating]   = useState<AdminRecord | null>(null)
  const [reactivating, setReactivating]   = useState<AdminRecord | null>(null)
  const [actionError, setActionError]     = useState<string | null>(null)
  const [toast, setToast]                 = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await getSystemAdmins(undefined, 200)
      setAdmins(res.data)
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load admins')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDeactivate() {
    if (!deactivating) return
    const name = deactivating.fullName
    try {
      await deactivateSystemAdmin(deactivating.id)
      setAdmins(prev => prev.map(a => a.id === deactivating.id ? { ...a, active: false } : a))
      setToast(`${name} deactivated`)
    } catch (e: any) {
      setActionError(e?.response?.data?.message ?? e?.message ?? 'Failed to deactivate admin')
    } finally {
      setDeactivating(null)
    }
  }

  async function handleReactivate() {
    if (!reactivating) return
    try {
      const updated = await reactivateSystemAdmin(reactivating.id)
      setAdmins(prev => prev.map(a => a.id === updated.id ? updated : a))
      setToast(`${updated.fullName} reactivated`)
    } catch (e: any) {
      setActionError(e?.response?.data?.message ?? e?.message ?? 'Failed to reactivate admin')
    } finally {
      setReactivating(null)
    }
  }

  const columns = [
    columnHelper.display({
      id: 'admin',
      header: 'Admin',
      cell: info => {
        const admin = info.row.original
        return (
          <Link href={`/admin/admins/${admin.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.lighter', color: 'primary.main', fontSize: '0.75rem' }}>{getInitials(admin.fullName)}</Avatar>
              <Typography variant='body2' fontWeight={600} sx={{ '&:hover': { textDecoration: 'underline', cursor: 'pointer' } }}>{admin.fullName}</Typography>
            </Box>
          </Link>
        )
      }
    }),
    columnHelper.accessor('email', { header: 'Email', cell: info => <Typography variant='body2' color='text.secondary'>{info.getValue()}</Typography> }),
    columnHelper.accessor('roles', {
      header: 'Roles',
      cell: info => {
        const roles = info.getValue()
        if (roles.length === 0) return <Typography variant='caption' color='text.disabled'>—</Typography>
        return <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{roles.map((r: string) => <Chip key={r} size='small' label={r} sx={{ bgcolor: 'primary.lighter', color: 'primary.main', fontWeight: 600, border: 'none', fontSize: '0.7rem' }} />)}</Box>
      }
    }),
    columnHelper.accessor('active', { header: 'Status', cell: info => <Chip size='small' label={info.getValue() ? 'Active' : 'Inactive'} color={info.getValue() ? 'success' : 'default'} variant='outlined' /> }),
    columnHelper.accessor('lastLoginAt', {
      header: 'Last Login',
      cell: info => {
        const v = info.getValue()
        return <Typography variant='caption' color='text.secondary'>{v ? new Date(v).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : <span style={{ color: 'var(--mui-palette-text-disabled)' }}>Never</span>}</Typography>
      }
    }),
    columnHelper.accessor('createdAt', { header: 'Created', cell: info => <Typography variant='caption' color='text.secondary'>{new Date(info.getValue()).toLocaleDateString()}</Typography> }),
    ...(canManage ? [columnHelper.display({
      id: 'actions',
      header: () => <span style={{ display: 'block', textAlign: 'right' }}>Actions</span>,
      cell: info => {
        const admin = info.row.original
        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            {admin.active
              ? <Tooltip title='Deactivate'><IconButton size='small' color='error' onClick={() => setDeactivating(admin)}><i className='ri-forbid-line' style={{ fontSize: '1rem' }} /></IconButton></Tooltip>
              : <Tooltip title='Reactivate'><IconButton size='small' color='success' onClick={() => setReactivating(admin)}><i className='ri-checkbox-circle-line' style={{ fontSize: '1rem' }} /></IconButton></Tooltip>
            }
          </Box>
        )
      }
    })] : []),
  ]

  const table = useReactTable({
    data: admins,
    columns,
    state: { globalFilter, pagination: { pageIndex: page, pageSize } },
    onGlobalFilterChange: v => { setGlobalFilter(v); setPage(0) },
    onPaginationChange: updater => {
      const next = typeof updater === 'function' ? updater({ pageIndex: page, pageSize }) : updater
      setPage(next.pageIndex)
      setPageSize(next.pageSize)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>System Admins</Typography>
          <Typography variant='body2' color='text.secondary'>Platform administrators with elevated access</Typography>
        </Box>
        {canManage && (
          <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={() => setCreateOpen(true)}>
            Add Admin
          </Button>
        )}
      </Box>

      <Card>
        <CardContent sx={{ pb: '8px !important' }}>
          <TextField
            size='small'
            placeholder='Search admins…'
            value={globalFilter ?? ''}
            onChange={e => { setGlobalFilter(e.target.value); setPage(0) }}
            sx={{ mb: 2, width: 320 }}
            slotProps={{ input: { startAdornment: <InputAdornment position='start'><i className='ri-search-line' /></InputAdornment> } }}
          />

          {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
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
                    ? <tr><td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>{globalFilter ? 'No matching admins' : 'No admins yet'}</td></tr>
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
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={table.getFilteredRowModel().rows.length}
                rowsPerPage={pageSize}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                onRowsPerPageChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <CreateAdminDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={a => setAdmins(prev => [a, ...prev])}
      />

      <DeactivateDialog
        admin={deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={handleDeactivate}
      />

      <ReactivateDialog
        admin={reactivating}
        onClose={() => setReactivating(null)}
        onConfirm={handleReactivate}
      />

      <Snackbar
        open={!!actionError}
        autoHideDuration={5000}
        onClose={() => setActionError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity='error' onClose={() => setActionError(null)} sx={{ width: '100%' }}>
          {actionError}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity='success' onClose={() => setToast(null)} sx={{ width: '100%' }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  )
}
