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
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormGroup from '@mui/material/FormGroup'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import Paper from '@mui/material/Paper'

import {
  getRoles,
  createRole,
  updateRolePermissions,
  deleteRole,
  getPermissions,
  type RoleRecord,
  type PermissionRecord,
  type CreateRolePayload,
} from '@/lib/api/admin-auth-client'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

// ---------------------------------------------------------------------------
// Create Role dialog
// ---------------------------------------------------------------------------

interface CreateRoleDialogProps {
  open: boolean
  allPermissions: PermissionRecord[]
  onClose: () => void
  onCreated: (role: RoleRecord) => void
}

function CreateRoleDialog({ open, allPermissions, onClose, onCreated }: CreateRoleDialogProps) {
  const [name, setName]           = useState('')
  const [description, setDesc]    = useState('')
  const [selected, setSelected]   = useState<string[]>([])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  function handleClose() {
    setName(''); setDesc(''); setSelected([]); setError(null)
    onClose()
  }

  function toggle(perm: string) {
    setSelected(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm])
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true); setError(null)
    try {
      const payload: CreateRolePayload = {
        name: name.trim().toUpperCase().replace(/\s+/g, '_'),
        description: description.trim() || undefined,
        permissionNames: selected.length > 0 ? selected : undefined,
      }
      const created = await createRole(payload)
      onCreated(created)
      handleClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to create role')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Create Role</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <TextField
          label='Role Name'
          size='small'
          fullWidth
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={saving}
          required
          helperText='Will be uppercased, e.g. SUPPORT_AGENT'
        />
        <TextField
          label='Description (optional)'
          size='small'
          fullWidth
          multiline
          rows={2}
          value={description}
          onChange={e => setDesc(e.target.value)}
          disabled={saving}
        />
        {allPermissions.length > 0 && (
          <Box>
            <Typography variant='caption' color='text.secondary' fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
              Permissions
            </Typography>
            <FormGroup>
              {allPermissions.map(p => (
                <FormControlLabel
                  key={p.id}
                  control={
                    <Checkbox
                      size='small'
                      checked={selected.includes(p.name)}
                      onChange={() => toggle(p.name)}
                      disabled={saving}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant='body2'>{p.name}</Typography>
                      {p.description && (
                        <Typography variant='caption' color='text.secondary'>{p.description}</Typography>
                      )}
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving || !name.trim()}
          startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Create Role
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Edit Permissions dialog
// ---------------------------------------------------------------------------

interface EditPermissionsDialogProps {
  role: RoleRecord | null
  allPermissions: PermissionRecord[]
  onClose: () => void
  onUpdated: (role: RoleRecord) => void
}

function EditPermissionsDialog({ role, allPermissions, onClose, onUpdated }: EditPermissionsDialogProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (role) setSelected([...role.permissions])
  }, [role])

  function toggle(perm: string) {
    setSelected(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm])
  }

  async function handleSave() {
    if (!role) return
    setSaving(true); setError(null)
    try {
      const updated = await updateRolePermissions(role.id, selected)
      onUpdated(updated)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to update permissions')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!role} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Edit Permissions — {role?.name}</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
        {allPermissions.length === 0 ? (
          <Typography variant='body2' color='text.secondary'>No permissions defined in the system.</Typography>
        ) : (
          <FormGroup>
            {allPermissions.map(p => (
              <FormControlLabel
                key={p.id}
                control={
                  <Checkbox
                    size='small'
                    checked={selected.includes(p.name)}
                    onChange={() => toggle(p.name)}
                    disabled={saving}
                  />
                }
                label={
                  <Box>
                    <Typography variant='body2'>{p.name}</Typography>
                    {p.description && (
                      <Typography variant='caption' color='text.secondary'>{p.description}</Typography>
                    )}
                  </Box>
                }
              />
            ))}
          </FormGroup>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Save Permissions
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Delete confirm
// ---------------------------------------------------------------------------

interface DeleteRoleDialogProps {
  role: RoleRecord | null
  onClose: () => void
  onDeleted: (id: string) => void
}

function DeleteRoleDialog({ role, onClose, onDeleted }: DeleteRoleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handle() {
    if (!role) return
    setLoading(true); setError(null)
    try {
      await deleteRole(role.id)
      onDeleted(role.id)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to delete role')
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!role} onClose={onClose}>
      <DialogTitle>Delete Role</DialogTitle>
      <DialogContent>
        {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
        <DialogContentText>
          Permanently delete role <strong>{role?.name}</strong>? Admins currently assigned this role will lose its permissions immediately.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button color='error' variant='contained' onClick={handle} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Role card
// ---------------------------------------------------------------------------

interface RoleCardProps {
  role: RoleRecord
  canManage: boolean
  onEdit: (role: RoleRecord) => void
  onDelete: (role: RoleRecord) => void
}

function RoleCard({ role, canManage, onEdit, onDelete }: RoleCardProps) {
  return (
    <Card variant='outlined' sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant='subtitle2' fontWeight={700}>{role.name}</Typography>
              <Chip size='small' label={`${role.permissions.length} permissions`} variant='tonal' color='primary' />
            </Box>
            {role.description && (
              <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                {role.description}
              </Typography>
            )}
            <Divider sx={{ my: 1 }} />
            {role.permissions.length === 0 ? (
              <Typography variant='caption' color='text.disabled'>No permissions assigned</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {role.permissions.map(p => (
                  <Chip
                    key={p}
                    size='small'
                    label={p}
                    sx={{ fontFamily: 'monospace', fontSize: '0.7rem', bgcolor: 'action.hover' }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {canManage && (
            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
              <Tooltip title='Edit permissions'>
                <IconButton size='small' onClick={() => onEdit(role)}>
                  <i className='ri-edit-line' style={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
              <Tooltip title='Delete role'>
                <IconButton size='small' color='error' onClick={() => onDelete(role)}>
                  <i className='ri-delete-bin-line' style={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Permission Matrix tab
// ---------------------------------------------------------------------------

interface PermissionMatrixProps {
  roles: RoleRecord[]
  allPermissions: PermissionRecord[]
  canManage: boolean
  onRoleUpdated: (role: RoleRecord) => void
  onError: (msg: string) => void
}

function PermissionMatrix({ roles, allPermissions, canManage, onRoleUpdated, onError }: PermissionMatrixProps) {
  // savingCell: roleId-permName pairs currently being saved
  const [saving, setSaving] = useState<Set<string>>(new Set())

  async function handleToggle(role: RoleRecord, permName: string) {
    const key = `${role.id}-${permName}`
    if (saving.has(key)) return

    const hasIt = role.permissions.includes(permName)
    const newPerms = hasIt
      ? role.permissions.filter(p => p !== permName)
      : [...role.permissions, permName]

    // Optimistic update
    onRoleUpdated({ ...role, permissions: newPerms })
    setSaving(prev => new Set(prev).add(key))

    try {
      const updated = await updateRolePermissions(role.id, newPerms)
      onRoleUpdated(updated)
    } catch (e: any) {
      // Revert on error
      onRoleUpdated(role)
      onError(e?.response?.data?.message ?? 'Failed to update permission')
    } finally {
      setSaving(prev => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  if (roles.length === 0 || allPermissions.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
        {roles.length === 0 ? 'No roles defined yet.' : 'No permissions defined yet.'}
      </Typography>
    )
  }

  return (
    <TableContainer component={Paper} variant='outlined' sx={{ overflowX: 'auto' }}>
      <Table size='small' stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                fontWeight: 700,
                minWidth: 160,
                bgcolor: 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider',
                position: 'sticky',
                left: 0,
                zIndex: 3,
              }}
            >
              Role ↓ / Permission →
            </TableCell>
            {allPermissions.map(p => (
              <TableCell
                key={p.id}
                align='center'
                sx={{ fontFamily: 'monospace', fontSize: '0.7rem', whiteSpace: 'nowrap', minWidth: 100 }}
              >
                <Tooltip title={p.description ?? p.name} placement='top'>
                  <span>{p.name}</span>
                </Tooltip>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {roles.map(role => (
            <TableRow key={role.id} hover>
              <TableCell
                sx={{
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  position: 'sticky',
                  left: 0,
                  bgcolor: 'background.paper',
                  borderRight: '1px solid',
                  borderColor: 'divider',
                  zIndex: 1,
                }}
              >
                {role.name}
              </TableCell>
              {allPermissions.map(p => {
                const key = `${role.id}-${p.name}`
                const checked = role.permissions.includes(p.name)
                const isSaving = saving.has(key)
                return (
                  <TableCell key={p.id} align='center' sx={{ p: 0.5 }}>
                    {isSaving ? (
                      <CircularProgress size={16} />
                    ) : (
                      <Checkbox
                        size='small'
                        checked={checked}
                        disabled={!canManage}
                        onChange={() => handleToggle(role, p.name)}
                        sx={{ p: 0.5 }}
                      />
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminRolesView() {
  const { hasPermission } = useAdminAuth()
  const canManage = hasPermission('manage_admins')

  const [tab, setTab]                   = useState(0)
  const [roles, setRoles]               = useState<RoleRecord[]>([])
  const [allPerms, setAllPerms]         = useState<PermissionRecord[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [createOpen, setCreateOpen]     = useState(false)
  const [editTarget, setEditTarget]     = useState<RoleRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<RoleRecord | null>(null)
  const [toast, setToast]               = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [r, p] = await Promise.all([getRoles(), getPermissions()])
      setRoles(r)
      setAllPerms(p)
    } catch { setError('Failed to load roles') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function handleCreated(role: RoleRecord) {
    setRoles(prev => [...prev, role])
    setToast(`Role "${role.name}" created`)
  }

  function handleUpdated(role: RoleRecord) {
    setRoles(prev => prev.map(r => r.id === role.id ? role : r))
    setToast(`Permissions updated for "${role.name}"`)
  }

  function handleDeleted(id: string) {
    setRoles(prev => prev.filter(r => r.id !== id))
    setToast('Role deleted')
  }

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>Roles & Permissions</Typography>
          <Typography variant='body2' color='text.secondary'>
            Define what each admin role can do on the platform
          </Typography>
        </Box>
        {canManage && tab === 0 && (
          <Button
            variant='contained'
            startIcon={<i className='ri-add-line' />}
            onClick={() => setCreateOpen(true)}
          >
            Create Role
          </Button>
        )}
      </Box>

      {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label='Role Cards' icon={<i className='ri-shield-user-line' />} iconPosition='start' />
        <Tab label='Permission Matrix' icon={<i className='ri-table-2' />} iconPosition='start' />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : tab === 0 ? (
        /* ── Role Cards tab ─────────────────────────────────────────────── */
        roles.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 6 }}>
              <i className='ri-shield-keyhole-line' style={{ fontSize: '2.5rem', color: 'var(--mui-palette-text-disabled)' }} />
              <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
                No roles defined yet
              </Typography>
              {canManage && (
                <Button variant='contained' sx={{ mt: 2 }} onClick={() => setCreateOpen(true)}>
                  Create First Role
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          roles.map(role => (
            <RoleCard
              key={role.id}
              role={role}
              canManage={canManage}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
            />
          ))
        )
      ) : (
        /* ── Permission Matrix tab ──────────────────────────────────────── */
        <Box>
          {!canManage && (
            <Alert severity='info' sx={{ mb: 2 }}>
              You have read-only access. Contact a super admin to modify permissions.
            </Alert>
          )}
          <PermissionMatrix
            roles={roles}
            allPermissions={allPerms}
            canManage={canManage}
            onRoleUpdated={r => setRoles(prev => prev.map(x => x.id === r.id ? r : x))}
            onError={msg => setError(msg)}
          />
        </Box>
      )}

      <CreateRoleDialog
        open={createOpen}
        allPermissions={allPerms}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <EditPermissionsDialog
        role={editTarget}
        allPermissions={allPerms}
        onClose={() => setEditTarget(null)}
        onUpdated={handleUpdated}
      />

      <DeleteRoleDialog
        role={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onDeleted={handleDeleted}
      />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity='success' onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </Box>
  )
}
