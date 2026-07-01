'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import TablePagination from '@mui/material/TablePagination'
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
import Button from '@mui/material/Button'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Menu from '@mui/material/Menu'
import Snackbar from '@mui/material/Snackbar'
import Divider from '@mui/material/Divider'

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import {
  getAdminUsers,
  deactivateAdminUser,
  reactivateAdminUser,
  resetAdminUserPassword,
  type AdminUserRecord,
} from '@/lib/api/admin-auth-client'

// ---------------------------------------------------------------------------
// Row action menu
// ---------------------------------------------------------------------------

interface RowMenuProps {
  user: AdminUserRecord
  onDeactivate: (user: AdminUserRecord) => void
  onReactivate: (user: AdminUserRecord) => void
  onResetPassword: (user: AdminUserRecord) => void
}

function RowMenu({ user, onDeactivate, onReactivate, onResetPassword }: RowMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  return (
    <>
      <IconButton size='small' onClick={e => setAnchor(e.currentTarget)}>
        <i className='ri-more-2-line' />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {user.active ? (
          <MenuItem onClick={() => { setAnchor(null); onDeactivate(user) }}>
            <i className='ri-user-forbid-line' style={{ marginRight: 8 }} />
            Deactivate
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { setAnchor(null); onReactivate(user) }}>
            <i className='ri-user-follow-line' style={{ marginRight: 8 }} />
            Reactivate
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => { setAnchor(null); onResetPassword(user) }}>
          <i className='ri-lock-password-line' style={{ marginRight: 8 }} />
          Send Password Reset
        </MenuItem>
      </Menu>
    </>
  )
}

// ---------------------------------------------------------------------------
// Confirm dialog
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  confirmColor?: 'error' | 'warning' | 'primary'
  loading: boolean
  onConfirm: () => void
  onClose: () => void
}

function ConfirmDialog({ open, title, description, confirmLabel, confirmColor = 'primary', loading, onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button variant='contained' color={confirmColor} onClick={onConfirm} disabled={loading}>
          {loading ? <CircularProgress size={18} color='inherit' /> : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Column helper
// ---------------------------------------------------------------------------

const col = createColumnHelper<AdminUserRecord>()

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminUsersView() {
  const [users, setUsers]         = useState<AdminUserRecord[]>([])
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(0)
  const [rowsPerPage, setRows]    = useState(50)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  // Filters
  const [search, setSearch]       = useState('')
  const [roleFilter, setRole]     = useState('')
  const [activeFilter, setActive] = useState<'all' | 'true' | 'false'>('all')
  const [tenantFilter, setTenant] = useState('')

  // Action state
  const [actionTarget, setActionTarget] = useState<AdminUserRecord | null>(null)
  const [actionType, setActionType]     = useState<'deactivate' | 'reactivate' | 'reset' | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Snackbar
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  })

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch
  const fetchUsers = useCallback(async (p = page, rpp = rowsPerPage) => {
    setLoading(true); setError(null)
    try {
      const res = await getAdminUsers({
        search:   search   || undefined,
        role:     roleFilter || undefined,
        active:   activeFilter === 'all' ? undefined : activeFilter === 'true',
        tenantId: tenantFilter || undefined,
        page:     p,
        size:     rpp,
      })
      setUsers(res.items)
      setTotal(res.total)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, activeFilter, tenantFilter, page, rowsPerPage])

  useEffect(() => {
    fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, roleFilter, activeFilter])

  // Debounce search + tenantFilter
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => {
      setPage(0)
      fetchUsers(0, rowsPerPage)
    }, 400)
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tenantFilter])

  // ── Actions ───────────────────────────────────────────────────────────────

  function openAction(user: AdminUserRecord, type: 'deactivate' | 'reactivate' | 'reset') {
    setActionTarget(user)
    setActionType(type)
  }

  function closeAction() {
    setActionTarget(null)
    setActionType(null)
  }

  async function handleConfirmAction() {
    if (!actionTarget || !actionType) return
    setActionLoading(true)
    try {
      if (actionType === 'deactivate') {
        const updated = await deactivateAdminUser(actionTarget.id)
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
        setSnack({ open: true, message: `${updated.fullName} deactivated.`, severity: 'success' })
      } else if (actionType === 'reactivate') {
        const updated = await reactivateAdminUser(actionTarget.id)
        setUsers(prev => prev.map(u => u.id === updated.id ? updated : u))
        setSnack({ open: true, message: `${updated.fullName} reactivated.`, severity: 'success' })
      } else if (actionType === 'reset') {
        const result = await resetAdminUserPassword(actionTarget.id)
        setSnack({ open: true, message: `Password reset sent to ${result.recipientEmail}.`, severity: 'success' })
      }
      closeAction()
    } catch (e: any) {
      setSnack({ open: true, message: e?.response?.data?.message ?? 'Action failed', severity: 'error' })
    } finally {
      setActionLoading(false)
    }
  }

  // ── Table columns ─────────────────────────────────────────────────────────

  const columns = [
    col.accessor('fullName', {
      header: 'Name',
      cell: info => (
        <Box>
          <Typography variant='body2' fontWeight={500}>{info.getValue()}</Typography>
          <Typography variant='caption' color='text.secondary'>{info.row.original.email}</Typography>
        </Box>
      ),
    }),
    col.accessor('companyName', {
      header: 'Company',
      cell: info => <Typography variant='body2'>{info.getValue()}</Typography>,
    }),
    col.accessor('tenantId', {
      header: 'Tenant',
      cell: info => (
        <Chip
          label={info.getValue()}
          size='small'
          variant='tonal'
          sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}
        />
      ),
    }),
    col.accessor('role', {
      header: 'Role',
      cell: info => (
        <Chip
          label={info.getValue()}
          size='small'
          color={info.getValue() === 'ADMIN' ? 'primary' : 'default'}
          variant='tonal'
        />
      ),
    }),
    col.accessor('active', {
      header: 'Status',
      cell: info => (
        <Chip
          label={info.getValue() ? 'Active' : 'Inactive'}
          size='small'
          color={info.getValue() ? 'success' : 'error'}
          variant='tonal'
        />
      ),
    }),
    col.accessor('createdAt', {
      header: 'Joined',
      cell: info => (
        <Typography variant='body2' color='text.secondary'>
          {new Date(info.getValue()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Typography>
      ),
    }),
    col.display({
      id: 'actions',
      header: '',
      cell: info => (
        <RowMenu
          user={info.row.original}
          onDeactivate={u => openAction(u, 'deactivate')}
          onReactivate={u => openAction(u, 'reactivate')}
          onResetPassword={u => openAction(u, 'reset')}
        />
      ),
    }),
  ]

  const table = useReactTable({
    data: users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: Math.ceil(total / rowsPerPage),
  })

  // ── Action dialog text ────────────────────────────────────────────────────

  const actionDialogProps = (() => {
    if (!actionTarget || !actionType) return null
    if (actionType === 'deactivate') return {
      title: 'Deactivate User',
      description: `Deactivate ${actionTarget.fullName} (${actionTarget.email})? They will not be able to log in until reactivated.`,
      confirmLabel: 'Deactivate',
      confirmColor: 'error' as const,
    }
    if (actionType === 'reactivate') return {
      title: 'Reactivate User',
      description: `Reactivate ${actionTarget.fullName} (${actionTarget.email})?`,
      confirmLabel: 'Reactivate',
      confirmColor: 'primary' as const,
    }
    return {
      title: 'Send Password Reset',
      description: `Send a password reset OTP email to ${actionTarget.fullName} (${actionTarget.email})?`,
      confirmLabel: 'Send Reset Email',
      confirmColor: 'primary' as const,
    }
  })()

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant='h5' fontWeight={600}>Platform Users</Typography>
        <Typography variant='body2' color='text.secondary'>
          All users across every tenant — {total.toLocaleString()} total
        </Typography>
      </Box>

      <Card>
        <CardContent sx={{ pb: '0 !important' }}>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3 }}>
            <TextField
              size='small'
              placeholder='Search name or email…'
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-search-line' />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              size='small'
              placeholder='Filter by tenant ID…'
              value={tenantFilter}
              onChange={e => setTenant(e.target.value)}
              sx={{ minWidth: 200 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <i className='ri-building-2-line' />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size='small' sx={{ minWidth: 130 }}>
              <InputLabel>Role</InputLabel>
              <Select value={roleFilter} label='Role' onChange={e => { setRole(e.target.value); setPage(0) }}>
                <MenuItem value=''>All roles</MenuItem>
                <MenuItem value='ADMIN'>Admin</MenuItem>
                <MenuItem value='MANAGER'>Manager</MenuItem>
                <MenuItem value='STAFF'>Staff</MenuItem>
                <MenuItem value='VIEWER'>Viewer</MenuItem>
              </Select>
            </FormControl>

            <FormControl size='small' sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={activeFilter}
                label='Status'
                onChange={e => { setActive(e.target.value as any); setPage(0) }}
              >
                <MenuItem value='all'>All</MenuItem>
                <MenuItem value='true'>Active</MenuItem>
                <MenuItem value='false'>Inactive</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ ml: 'auto' }}>
              <Tooltip title='Refresh'>
                <span>
                  <IconButton onClick={() => fetchUsers()} disabled={loading}>
                    <i className='ri-refresh-line' />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          </Box>

          {/* Error */}
          {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

          {/* Table */}
          <Box sx={{ overflowX: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : users.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <i className='ri-user-search-line' style={{ fontSize: 40, opacity: 0.3 }} />
                <Typography color='text.secondary' sx={{ mt: 1 }}>No users found</Typography>
              </Box>
            ) : (
              <table className={tableStyles.table}>
                <thead>
                  {table.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => (
                        <th key={h.id}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Box>

          {/* Pagination */}
          <TablePagination
            component='div'
            count={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => { setPage(p); fetchUsers(p, rowsPerPage) }}
            onRowsPerPageChange={e => {
              const rpp = parseInt(e.target.value, 10)
              setRows(rpp); setPage(0); fetchUsers(0, rpp)
            }}
            rowsPerPageOptions={[25, 50, 100]}
          />
        </CardContent>
      </Card>

      {/* Confirm dialog */}
      {actionDialogProps && (
        <ConfirmDialog
          open={Boolean(actionTarget && actionType)}
          {...actionDialogProps}
          loading={actionLoading}
          onConfirm={handleConfirmAction}
          onClose={closeAction}
        />
      )}

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack(s => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
