'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
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
import InputAdornment from '@mui/material/InputAdornment'
import Snackbar from '@mui/material/Snackbar'

import Link from 'next/link'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table'

import tableStyles from '@core/styles/table.module.css'

import {
  getAdminTenants,
  createAdminTenant,
  updateAdminTenant,
  deactivateAdminTenant,
  reactivateAdminTenant,
  exportTenantsCsv,
  type TenantRecord,
  type CreateTenantPayload,
  type UpdateTenantPayload,
} from '@/lib/api/admin-auth-client'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

// ---------------------------------------------------------------------------
// Create Tenant Dialog
// ---------------------------------------------------------------------------

interface CreateTenantDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (tenant: TenantRecord) => void
}

function CreateTenantDialog({ open, onClose, onCreated }: CreateTenantDialogProps) {
  const [name, setName] = useState('')
  const [tenantId, setTenantId] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setName(''); setTenantId(''); setDescription(''); setError(null)
    onClose()
  }

  // Auto-generate tenant_id from name
  function handleNameChange(v: string) {
    setName(v)
    setTenantId(v.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').slice(0, 30))
  }

  async function handleSave() {
    if (!name.trim() || !tenantId.trim()) return
    setSaving(true); setError(null)
    try {
      const payload: CreateTenantPayload = { name: name.trim(), tenantId: tenantId.trim(), description: description.trim() || undefined }
      const created = await createAdminTenant(payload)
      onCreated(created)
      handleClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to create tenant')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Create Tenant</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <TextField
          label='Company Name'
          size='small'
          fullWidth
          value={name}
          onChange={e => handleNameChange(e.target.value)}
          disabled={saving}
          required
        />
        <TextField
          label='Tenant ID'
          size='small'
          fullWidth
          value={tenantId}
          onChange={e => setTenantId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 30))}
          disabled={saving}
          required
          helperText='Unique identifier (lowercase, underscores only)'
        />
        <TextField
          label='Description'
          size='small'
          fullWidth
          multiline
          rows={2}
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={saving}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving || !name.trim() || !tenantId.trim()}
          startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Edit Tenant Dialog
// ---------------------------------------------------------------------------

interface EditTenantDialogProps {
  tenant: TenantRecord | null
  onClose: () => void
  onSaved: (tenant: TenantRecord) => void
}

function EditTenantDialog({ tenant, onClose, onSaved }: EditTenantDialogProps) {
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // Sync fields when a different tenant is opened
  useEffect(() => {
    if (tenant) {
      setName(tenant.name)
      setDescription(tenant.description ?? '')
      setError(null)
    }
  }, [tenant])

  function handleClose() {
    setError(null)
    onClose()
  }

  async function handleSave() {
    if (!tenant || !name.trim()) return
    setSaving(true); setError(null)
    try {
      const payload: UpdateTenantPayload = {
        name: name.trim(),
        description: description.trim() || undefined,
      }
      const updated = await updateAdminTenant(tenant.id, payload)
      onSaved(updated)
      handleClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to update tenant')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!tenant} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Edit Tenant</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <TextField
          label='Tenant ID'
          size='small'
          fullWidth
          value={tenant?.tenant_id ?? ''}
          disabled
          helperText='Immutable — cannot be changed after creation'
          slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
        />
        <TextField
          label='Company Name'
          size='small'
          fullWidth
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={saving}
          required
          autoFocus
        />
        <TextField
          label='Description'
          size='small'
          fullWidth
          multiline
          rows={2}
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={saving}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving || !name.trim()}
          startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Deactivate confirm dialog
// ---------------------------------------------------------------------------

interface DeactivateDialogProps {
  tenant: TenantRecord | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

function DeactivateDialog({ tenant, onClose, onConfirm }: DeactivateDialogProps) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }
  return (
    <Dialog open={!!tenant} onClose={onClose}>
      <DialogTitle>Deactivate Tenant</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to deactivate <strong>{tenant?.name}</strong>? Their users will lose access immediately.
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
// Reactivate confirm dialog
// ---------------------------------------------------------------------------

interface ReactivateDialogProps {
  tenant: TenantRecord | null
  onClose: () => void
  onConfirm: () => Promise<void>
}

function ReactivateDialog({ tenant, onClose, onConfirm }: ReactivateDialogProps) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }
  return (
    <Dialog open={!!tenant} onClose={onClose}>
      <DialogTitle>Reactivate Tenant</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Reactivate <strong>{tenant?.name}</strong>? Their users will regain platform access immediately.
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
// Main view
// ---------------------------------------------------------------------------

export default function AdminTenantsView() {
  const { hasPermission } = useAdminAuth()

  const canManage = hasPermission('manage_tenants')

  const [tenants, setTenants]         = useState<TenantRecord[]>([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState<string | null>(null)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [createOpen, setCreateOpen]       = useState(false)
  const [editing, setEditing]             = useState<TenantRecord | null>(null)
  const [deactivating, setDeactivating]   = useState<TenantRecord | null>(null)
  const [reactivating, setReactivating]   = useState<TenantRecord | null>(null)
  const [actionError, setActionError]     = useState<string | null>(null)
  const [exporting, setExporting]         = useState(false)

  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  // cursors[i] = cursor to use when fetching page i
  // cursors[0] is always undefined (first page has no cursor)
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined])

  const load = useCallback(async (pageNum: number, size: number, cursorCache: (string | undefined)[]) => {
    setLoading(true); setError(null)
    try {
      const cursor = cursorCache[pageNum]
      const res = await getAdminTenants(cursor, size)
      setTenants(res.data)
      setTotal(res.total ?? 0)
      // Store the returned cursor for the next page
      if (res.cursor) {
        setCursors(prev => {
          const next = [...prev]
          next[pageNum + 1] = res.cursor!
          return next
        })
      }
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(0, pageSize, cursors)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = tenants.filter(t => {
    const matchesSearch = !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.tenant_id.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'all' ? true :
      statusFilter === 'active' ? t.active : !t.active
    return matchesSearch && matchesStatus
  })

  function handlePageChange(_: unknown, newPage: number) {
    setPage(newPage)
    load(newPage, pageSize, cursors)
  }

  function handlePageSizeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newSize = Number(e.target.value)
    const freshCursors: (string | undefined)[] = [undefined]
    setCursors(freshCursors)
    setPageSize(newSize)
    setPage(0)
    load(0, newSize, freshCursors)
  }

  function handleSaved(updated: TenantRecord) {
    setTenants(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  async function handleDeactivate() {
    if (!deactivating) return
    try {
      await deactivateAdminTenant(deactivating.id)
      setTenants(prev => prev.map(t => t.id === deactivating.id ? { ...t, active: false } : t))
    } catch (e: any) {
      setActionError(e?.response?.data?.message ?? e?.message ?? 'Failed to deactivate tenant')
    } finally {
      setDeactivating(null)
    }
  }

  async function handleReactivate() {
    if (!reactivating) return
    try {
      const updated = await reactivateAdminTenant(reactivating.id)
      setTenants(prev => prev.map(t => t.id === updated.id ? updated : t))
    } catch (e: any) {
      setActionError(e?.response?.data?.message ?? e?.message ?? 'Failed to reactivate tenant')
    } finally {
      setReactivating(null)
    }
  }

  const columnHelper = createColumnHelper<TenantRecord>()
  const columns = [
    columnHelper.accessor('name', {
      header: 'Name',
      cell: info => (
        <Link href={`/admin/tenants/${info.row.original.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography variant='body2' fontWeight={600} sx={{ '&:hover': { textDecoration: 'underline', cursor: 'pointer' } }}>
            {info.getValue()}
          </Typography>
        </Link>
      )
    }),
    columnHelper.accessor('tenant_id', {
      header: 'Tenant ID',
      cell: info => (
        <Typography variant='caption' sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.75, py: 0.25, borderRadius: 0.5 }}>
          {info.getValue()}
        </Typography>
      )
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: info => <Typography variant='body2' color='text.secondary'>{info.getValue() ?? '—'}</Typography>
    }),
    columnHelper.accessor('active', {
      header: 'Status',
      cell: info => (
        <Chip size='small' label={info.getValue() ? 'Active' : 'Inactive'} color={info.getValue() ? 'success' : 'default'} variant='outlined' />
      )
    }),
    columnHelper.accessor('createdAt', {
      header: 'Created',
      cell: info => <Typography variant='caption' color='text.secondary'>{new Date(info.getValue()).toLocaleDateString()}</Typography>
    }),
    ...(canManage ? [columnHelper.display({
      id: 'actions',
      header: () => <span style={{ display: 'block', textAlign: 'right' }}>Actions</span>,
      cell: info => {
        const tenant = info.row.original
        return (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Tooltip title='Edit'>
              <IconButton size='small' onClick={() => setEditing(tenant)}>
                <i className='ri-pencil-line' style={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
            {tenant.active ? (
              <Tooltip title='Deactivate'>
                <IconButton size='small' color='error' onClick={() => setDeactivating(tenant)}>
                  <i className='ri-forbid-line' style={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip title='Reactivate'>
                <IconButton size='small' color='success' onClick={() => setReactivating(tenant)}>
                  <i className='ri-checkbox-circle-line' style={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      }
    })] : []),
  ]

  const table = useReactTable({
    data: filtered,
    columns,
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>Tenants</Typography>
          <Typography variant='body2' color='text.secondary'>Manage landlord organisations on the platform</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title='Download tenant list as CSV'>
            <span>
              <Button
                variant='outlined'
                size='small'
                startIcon={<i className='ri-download-2-line' />}
                disabled={exporting}
                onClick={async () => {
                  setExporting(true)
                  try { await exportTenantsCsv() }
                  catch { /* ignore */ }
                  finally { setExporting(false) }
                }}
              >
                {exporting ? 'Exporting…' : 'Export CSV'}
              </Button>
            </span>
          </Tooltip>
          {canManage && (
            <Button variant='contained' startIcon={<i className='ri-add-line' />} onClick={() => setCreateOpen(true)}>
              Add Tenant
            </Button>
          )}
        </Box>
      </Box>

      <Card>
        <CardContent sx={{ pb: '8px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              size='small'
              placeholder='Search tenants…'
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ width: 300 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <i className='ri-search-line' />
                    </InputAdornment>
                  ),
                }
              }}
            />
            <ToggleButtonGroup
              size='small'
              exclusive
              value={statusFilter}
              onChange={(_, v) => { if (v) setStatusFilter(v) }}
            >
              <ToggleButton value='all'>All</ToggleButton>
              <ToggleButton value='active'>Active</ToggleButton>
              <ToggleButton value='inactive'>Inactive</ToggleButton>
            </ToggleButtonGroup>
          </Box>

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
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>
                        {search || statusFilter !== 'all' ? 'No matching tenants' : 'No tenants yet'}
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

              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={total}
                rowsPerPage={pageSize}
                page={page}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handlePageSizeChange}
              />
            </>
          )}
        </CardContent>
      </Card>

      <CreateTenantDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          const freshCursors: (string | undefined)[] = [undefined]
          setCursors(freshCursors)
          setPage(0)
          load(0, pageSize, freshCursors)
        }}
      />

      <EditTenantDialog
        tenant={editing}
        onClose={() => setEditing(null)}
        onSaved={handleSaved}
      />

      <DeactivateDialog
        tenant={deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={handleDeactivate}
      />

      <ReactivateDialog
        tenant={reactivating}
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
    </Box>
  )
}
