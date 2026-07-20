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
  getRoleById,
  createRole,
  updateRolePermissions,
  deleteRole,
  getPermissions,
  createPermission,
  deletePermission,
  type RoleRecord,
  type PermissionRecord,
  type CreateRolePayload,
  type CreatePermissionPayload,
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
// View Role Detail dialog
// ---------------------------------------------------------------------------

interface ViewRoleDialogProps {
  roleId: string | null
  onClose: () => void
}

function ViewRoleDialog({ roleId, onClose }: ViewRoleDialogProps) {
  const [role, setRole]       = useState<RoleRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!roleId) {
      setRole(null)
      return
    }
    let cancelled = false
    setLoading(true); setError(null)
    getRoleById(roleId)
      .then(r => { if (!cancelled) setRole(r) })
      .catch((e: any) => { if (!cancelled) setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load role') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [roleId])

  return (
    <Dialog open={!!roleId} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Role Detail</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : role ? (
          <Box>
            <Typography variant='subtitle1' fontWeight={700}>{role.name}</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
              {role.description || 'No description'}
            </Typography>
            {role.createdAt && (
              <Typography variant='caption' color='text.disabled' sx={{ display: 'block', mb: 1 }}>
                Created {new Date(role.createdAt).toLocaleString()}
              </Typography>
            )}
            <Divider sx={{ my: 1.5 }} />
            <Typography variant='caption' color='text.secondary' fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
              Permissions ({role.permissions.length})
            </Typography>
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
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
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

  // Same grouping the tenant-side role editor uses: 38 flat checkboxes are unreadable, and the
  // module is the unit an admin actually thinks in ("give support read access to tenants").
  const permissionGroups = useMemo(() => {
    const live = allPermissions.filter(p => p.module !== 'legacy')
    const byModule = new Map<string, PermissionRecord[]>()
    for (const p of live) {
      const key = p.module ?? 'other'
      if (!byModule.has(key)) byModule.set(key, [])
      byModule.get(key)!.push(p)
    }
    return [...byModule.entries()]
      .map(([module, perms]) => ({ module, perms: perms.sort((a, b) => a.name.localeCompare(b.name)) }))
      .sort((a, b) => a.module.localeCompare(b.module))
  }, [allPermissions])

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
        {permissionGroups.length === 0 ? (
          <Typography variant='body2' color='text.secondary'>No permissions defined in the system.</Typography>
        ) : (
          permissionGroups.map(({ module, perms }) => {
            const names = perms.map(p => p.name)
            const allOn = names.every(n => selected.includes(n))
            return (
              <Box key={module} sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant='caption' color='text.secondary' fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                    {module}
                  </Typography>
                  <Button
                    size='small'
                    variant='text'
                    disabled={saving}
                    onClick={() =>
                      setSelected(prev =>
                        allOn ? prev.filter(p => !names.includes(p)) : [...new Set([...prev, ...names])]
                      )
                    }
                    sx={{ fontSize: '0.7rem', minWidth: 0 }}
                  >
                    {allOn ? 'Clear' : 'Select all'}
                  </Button>
                </Box>
                <FormGroup>
                  {perms.map(p => (
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
                          <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {p.name.replace(/^platform:/, '')}
                          </Typography>
                          {p.description && (
                            <Typography variant='caption' color='text.secondary'>{p.description}</Typography>
                          )}
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              </Box>
            )
          })
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
// Create Permission dialog
// ---------------------------------------------------------------------------

interface CreatePermissionDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (perm: PermissionRecord) => void
}

function CreatePermissionDialog({ open, onClose, onCreated }: CreatePermissionDialogProps) {
  const [name, setName]         = useState('')
  const [description, setDesc]  = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  function handleClose() {
    setName(''); setDesc(''); setError(null)
    onClose()
  }

  function normalizeName(raw: string) {
    return raw.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+/, '')
  }

  async function handleSave() {
    const normalized = normalizeName(name)
    if (!normalized) return
    setSaving(true); setError(null)
    try {
      const payload: CreatePermissionPayload = {
        name: normalized,
        description: description.trim() || undefined,
      }
      const created = await createPermission(payload)
      onCreated(created)
      handleClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to create permission')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>New Permission</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <TextField
          label='Permission Name'
          size='small'
          fullWidth
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={saving}
          required
          helperText='Lowercase with underscores, e.g. manage_tenants'
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving || !normalizeName(name)}
          startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Create Permission
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Delete Permission confirm dialog
// ---------------------------------------------------------------------------

interface DeletePermissionDialogProps {
  permission: PermissionRecord | null
  onClose: () => void
  onDeleted: (id: string) => void
}

function DeletePermissionDialog({ permission, onClose, onDeleted }: DeletePermissionDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handle() {
    if (!permission) return
    setLoading(true); setError(null)
    try {
      await deletePermission(permission.id)
      onDeleted(permission.id)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to delete permission')
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!permission} onClose={onClose}>
      <DialogTitle>Delete Permission</DialogTitle>
      <DialogContent>
        {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
        <DialogContentText>
          Permanently delete permission <strong>{permission?.name}</strong>? Any role currently granting this permission will lose it immediately.
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
  onView: (role: RoleRecord) => void
  onEdit: (role: RoleRecord) => void
  onDelete: (role: RoleRecord) => void
}

function RoleCard({ role, canManage, onView, onEdit, onDelete }: RoleCardProps) {
  // Codes are namespaced `platform:` to stay disjoint from the tenant vocabulary, but that prefix
  // is noise on every chip — it is the same for all of them. Drop it for display only.
  const shortLabel = (code: string) => code.replace(/^platform:/, '')

  return (
    <Card variant='outlined'>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
              <Typography variant='subtitle2' fontWeight={700}>{role.name}</Typography>
              {role.name === 'SUPER_ADMIN' && (
                <Chip size='small' label='Built-in' color='primary' variant='tonal' />
              )}
              <Chip size='small' label={`${role.permissions.length} permissions`} variant='tonal' />
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
                  <Tooltip key={p} title={p} placement='top'>
                    <Chip
                      size='small'
                      label={shortLabel(p)}
                      sx={{ fontFamily: 'monospace', fontSize: '0.7rem', bgcolor: 'action.hover' }}
                    />
                  </Tooltip>
                ))}
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            <Tooltip title='View details'>
              <IconButton size='small' onClick={() => onView(role)}>
                <i className='ri-eye-line' style={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
            {canManage && (
              <>
                <Tooltip title='Edit permissions'>
                  <IconButton size='small' onClick={() => onEdit(role)}>
                    <i className='ri-edit-line' style={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
                {/* SUPER_ADMIN is built in and the backend rejects deleting it — don't offer it. */}
                {role.name !== 'SUPER_ADMIN' && (
                  <Tooltip title='Delete role'>
                    <IconButton size='small' color='error' onClick={() => onDelete(role)}>
                      <i className='ri-delete-bin-line' style={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </>
            )}
          </Box>
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
  onDeletePermission: (perm: PermissionRecord) => void
}

function PermissionMatrix({ roles, allPermissions, canManage, onRoleUpdated, onError, onDeletePermission }: PermissionMatrixProps) {
  // savingCell: roleId-permName pairs currently being saved
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')

  async function persist(role: RoleRecord, newPerms: string[], keys: string[]) {
    const prev = role
    onRoleUpdated({ ...role, permissions: newPerms })
    setSaving(s => { const n = new Set(s); keys.forEach(k => n.add(k)); return n })
    try {
      const updated = await updateRolePermissions(role.id, newPerms)
      onRoleUpdated(updated)
    } catch (e: any) {
      onRoleUpdated(prev)
      onError(e?.response?.data?.message ?? 'Failed to update permission')
    } finally {
      setSaving(s => { const n = new Set(s); keys.forEach(k => n.delete(k)); return n })
    }
  }

  function handleToggle(role: RoleRecord, permName: string) {
    const key = `${role.id}-${permName}`
    if (saving.has(key)) return
    const hasIt = role.permissions.includes(permName)
    persist(role, hasIt ? role.permissions.filter(p => p !== permName) : [...role.permissions, permName], [key])
  }

  /** Grant or revoke a whole module for one role in a single request. */
  function handleToggleModule(role: RoleRecord, perms: PermissionRecord[]) {
    const names = perms.map(p => p.name)
    const keys = names.map(n => `${role.id}-${n}`)
    if (keys.some(k => saving.has(k))) return
    const allGranted = names.every(n => role.permissions.includes(n))
    const next = allGranted
      ? role.permissions.filter(p => !names.includes(p))
      : [...new Set([...role.permissions, ...names])]
    persist(role, next, keys)
  }

  // Permissions outnumber roles roughly ten to one, and always will. Rendering roles as rows
  // produced a table ~5,200px wide that needed 4,000px of horizontal scrolling to read a single
  // role. Transposing it — permissions down, roles across — trades that for vertical scrolling,
  // which costs nothing, and lets each permission carry its description inline.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const live = allPermissions.filter(p => {
      if (p.module === 'legacy') return false
      if (!q) return true
      return p.name.toLowerCase().includes(q) || (p.description ?? '').toLowerCase().includes(q)
    })
    const byModule = new Map<string, PermissionRecord[]>()
    for (const p of live) {
      const key = p.module ?? 'other'
      if (!byModule.has(key)) byModule.set(key, [])
      byModule.get(key)!.push(p)
    }
    return [...byModule.entries()]
      .map(([module, perms]) => ({ module, perms: perms.sort((a, b) => a.name.localeCompare(b.name)) }))
      .sort((a, b) => a.module.localeCompare(b.module))
  }, [allPermissions, query])

  const totalShown = groups.reduce((n, g) => n + g.perms.length, 0)

  /** `platform:gateway:write` reads better as `gateway:write` under a "system" heading. */
  const shortLabel = (name: string) => name.replace(/^platform:/, '')

  /** Built-in codes are referenced literally by the backend guards; deleting one is unrecoverable. */
  const isBuiltIn = (name: string) => name.startsWith('platform:')

  if (roles.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
        No roles defined yet.
      </Typography>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size='small'
          placeholder='Filter permissions…'
          value={query}
          onChange={e => setQuery(e.target.value)}
          sx={{ minWidth: 260 }}
        />
        <Typography variant='caption' color='text.secondary'>
          {totalShown} permission{totalShown === 1 ? '' : 's'}
          {query ? ' matching' : ''} across {groups.length} module{groups.length === 1 ? '' : 's'}
        </Typography>
      </Box>

      {totalShown === 0 ? (
        <Typography variant='body2' color='text.secondary' sx={{ py: 4, textAlign: 'center' }}>
          No permissions match “{query}”.
        </Typography>
      ) : (
        <TableContainer component={Paper} variant='outlined' sx={{ maxHeight: 620, overflow: 'auto' }}>
          <Table size='small' stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 700,
                    minWidth: 280,
                    bgcolor: 'background.paper',
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    position: 'sticky',
                    left: 0,
                    zIndex: 4,
                  }}
                >
                  Permission
                </TableCell>
                {roles.map(role => (
                  <TableCell key={role.id} align='center' sx={{ minWidth: 132 }}>
                    <Typography variant='body2' sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {role.name}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {role.permissions.length} granted
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map(g => {
                return [
                  <TableRow key={`m-${g.module}`}>
                    <TableCell
                      sx={{
                        bgcolor: 'action.hover',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'text.secondary',
                        position: 'sticky',
                        left: 0,
                        zIndex: 2,
                      }}
                    >
                      {g.module}
                      <Typography component='span' variant='caption' sx={{ ml: 1, opacity: 0.7, letterSpacing: 0 }}>
                        ({g.perms.length})
                      </Typography>
                    </TableCell>
                    {roles.map(role => {
                      const names = g.perms.map(p => p.name)
                      const granted = names.filter(n => role.permissions.includes(n)).length
                      const all = granted === names.length
                      return (
                        <TableCell key={role.id} align='center' sx={{ bgcolor: 'action.hover', p: 0.5 }}>
                          <Tooltip title={all ? `Revoke all ${g.module}` : `Grant all ${g.module}`}>
                            <span>
                              <Button
                                size='small'
                                variant='text'
                                disabled={!canManage}
                                onClick={() => handleToggleModule(role, g.perms)}
                                sx={{ minWidth: 0, px: 0.75, fontSize: '0.68rem', lineHeight: 1.4 }}
                              >
                                {granted}/{names.length}
                              </Button>
                            </span>
                          </Tooltip>
                        </TableCell>
                      )
                    })}
                  </TableRow>,
                  ...g.perms.map(p => (
                    <TableRow key={p.id} hover>
                      <TableCell
                        sx={{
                          position: 'sticky',
                          left: 0,
                          bgcolor: 'background.paper',
                          borderRight: '1px solid',
                          borderColor: 'divider',
                          zIndex: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant='body2'
                              sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              {shortLabel(p.name)}
                            </Typography>
                            {p.description && (
                              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', lineHeight: 1.3 }}>
                                {p.description}
                              </Typography>
                            )}
                          </Box>
                          {canManage && !isBuiltIn(p.name) && (
                            <Tooltip title='Delete this custom permission'>
                              <IconButton
                                size='small'
                                color='error'
                                onClick={() => onDeletePermission(p)}
                                sx={{ p: 0.25, ml: 'auto' }}
                              >
                                <i className='ri-delete-bin-line' style={{ fontSize: '0.85rem' }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                      {roles.map(role => {
                        const key = `${role.id}-${p.name}`
                        const checked = role.permissions.includes(p.name)
                        const isSaving = saving.has(key)
                        return (
                          <TableCell key={role.id} align='center' sx={{ p: 0.5 }}>
                            {isSaving ? (
                              <CircularProgress size={16} />
                            ) : (
                              <Checkbox
                                size='small'
                                checked={checked}
                                disabled={!canManage}
                                onChange={() => handleToggle(role, p.name)}
                                inputProps={{ 'aria-label': `${p.name} for ${role.name}` }}
                                sx={{ p: 0.5 }}
                              />
                            )}
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )),
                ]
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {canManage && (
        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1.5 }}>
          Built-in <code>platform:</code> permissions cannot be deleted — they are referenced directly by the
          server. Revoke one from a role instead.
        </Typography>
      )}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminRolesView() {
  const { hasPermission } = useAdminAuth()
  const canManage = hasPermission('manage_admins')

  const [tab, setTab]                             = useState(0)
  const [roles, setRoles]                         = useState<RoleRecord[]>([])
  const [allPerms, setAllPerms]                   = useState<PermissionRecord[]>([])
  const [loading, setLoading]                     = useState(true)
  const [error, setError]                         = useState<string | null>(null)
  const [createOpen, setCreateOpen]               = useState(false)
  const [viewTargetId, setViewTargetId]           = useState<string | null>(null)
  const [editTarget, setEditTarget]               = useState<RoleRecord | null>(null)
  const [deleteTarget, setDeleteTarget]           = useState<RoleRecord | null>(null)
  const [createPermOpen, setCreatePermOpen]       = useState(false)
  const [deletePermTarget, setDeletePermTarget]   = useState<PermissionRecord | null>(null)
  const [toast, setToast]                         = useState<string | null>(null)

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

  function handlePermissionCreated(perm: PermissionRecord) {
    setAllPerms(prev => [...prev, perm])
    setToast(`Permission "${perm.name}" created`)
  }

  function handlePermissionDeleted(id: string) {
    setAllPerms(prev => prev.filter(p => p.id !== id))
    setRoles(prev => prev.map(r => ({ ...r, permissions: r.permissions.filter(name => {
      const deleted = allPerms.find(p => p.id === id)
      return !deleted || name !== deleted.name
    }) })))
    setToast('Permission deleted')
  }

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────────────────────
          Title and description live in the PageBanner on the route, matching how
          /settings/team is composed — don't repeat them here. */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mb: 3 }}>
        {canManage && tab === 0 && (
          <Button
            variant='contained'
            startIcon={<i className='ri-add-line' />}
            onClick={() => setCreateOpen(true)}
          >
            Create Role
          </Button>
        )}
        {canManage && tab === 1 && (
          <Button
            variant='contained'
            startIcon={<i className='ri-add-line' />}
            onClick={() => setCreatePermOpen(true)}
          >
            New Permission
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
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            {roles.map(role => (
              <RoleCard
                key={role.id}
                role={role}
                canManage={canManage}
                onView={r => setViewTargetId(r.id)}
                onEdit={setEditTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </Box>
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
            onDeletePermission={setDeletePermTarget}
          />
        </Box>
      )}

      <CreateRoleDialog
        open={createOpen}
        allPermissions={allPerms}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      <ViewRoleDialog
        roleId={viewTargetId}
        onClose={() => setViewTargetId(null)}
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

      <CreatePermissionDialog
        open={createPermOpen}
        onClose={() => setCreatePermOpen(false)}
        onCreated={handlePermissionCreated}
      />

      <DeletePermissionDialog
        permission={deletePermTarget}
        onClose={() => setDeletePermTarget(null)}
        onDeleted={handlePermissionDeleted}
      />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity='success' onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </Box>
  )
}
