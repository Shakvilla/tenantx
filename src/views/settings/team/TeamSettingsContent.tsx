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
import Drawer from '@mui/material/Drawer'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
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

import tableStyles from '@core/styles/table.module.css'

import { useAuth } from '@/contexts/AuthContext'
import {
  getUsers,
  createUser,
  deactivateUser,
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getUserRoles,
  assignRoleToUser,
  removeRoleFromUser,
  getPermissions,
  type User,
  type TenantRole,
  type TenantPermission,
  type CreateUserPayload
} from '@/lib/api/users'

type UserWithRoles = User & { roles: TenantRole[] }

// ---------------------------------------------------------------------------
// Invite Staff dialog
// ---------------------------------------------------------------------------

interface InviteStaffDialogProps {
  open: boolean
  roles: TenantRole[]
  defaultCompanyName: string
  onClose: () => void
  onInvited: (user: User, roleId: string | null) => void
}

function InviteStaffDialog({ open, roles, defaultCompanyName, onClose, onInvited }: InviteStaffDialogProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState(defaultCompanyName)
  const [roleId, setRoleId] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) setCompanyName(defaultCompanyName)
  }, [open, defaultCompanyName])

  function handleClose() {
    setFullName('')
    setEmail('')
    setPassword('')
    setRoleId('')
    setError(null)
    onClose()
  }

  async function handleSave() {
    if (!fullName.trim() || !email.trim() || !password.trim() || !companyName.trim()) return
    setSaving(true)
    setError(null)
    try {
      const payload: CreateUserPayload = {
        email: email.trim(),
        fullName: fullName.trim(),
        password,
        companyName: companyName.trim()
      }
      const created = await createUser(payload)
      // Persist the role picked in the invite dialog — creating the user alone never assigned it,
      // so the selection silently reverted to "No role" on reload.
      if (roleId) {
        await assignRoleToUser({ userId: created.id, roleId })
      }
      onInvited(created, roleId || null)
      handleClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to invite staff member')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>Invite Staff Member</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: '8px !important' }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <TextField
          label='Full Name'
          size='small'
          fullWidth
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          disabled={saving}
          required
        />
        <TextField
          label='Email'
          type='email'
          size='small'
          fullWidth
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={saving}
          required
        />
        <TextField
          label='Temporary Password'
          type='password'
          size='small'
          fullWidth
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={saving}
          required
          helperText='Share this with the staff member so they can log in and change it'
        />
        <TextField
          label='Company Name'
          size='small'
          fullWidth
          value={companyName}
          onChange={e => setCompanyName(e.target.value)}
          disabled={saving}
          required
        />
        <TextField
          select
          label='Role (optional)'
          size='small'
          fullWidth
          value={roleId}
          onChange={e => setRoleId(e.target.value)}
          disabled={saving}
        >
          <MenuItem value=''>No role</MenuItem>
          {roles.map(role => (
            <MenuItem key={role.id} value={role.id}>
              {role.name}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving || !fullName.trim() || !email.trim() || !password.trim() || !companyName.trim()}
          startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Send Invite
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Edit User Role dialog
// ---------------------------------------------------------------------------

interface EditUserRoleDialogProps {
  user: UserWithRoles | null
  roles: TenantRole[]
  onClose: () => void
  onUpdated: (userId: string, roles: TenantRole[]) => void
}

function EditUserRoleDialog({ user, roles, onClose, onUpdated }: EditUserRoleDialogProps) {
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) setSelected(user.roles.map(r => r.id))
  }, [user])

  function toggle(roleId: string) {
    setSelected(prev => (prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]))
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      const previousIds = user.roles.map(r => r.id)
      const toAdd = selected.filter(id => !previousIds.includes(id))
      const toRemove = previousIds.filter(id => !selected.includes(id))

      await Promise.all([
        ...toAdd.map(roleId => assignRoleToUser({ userId: user.id, roleId })),
        ...toRemove.map(roleId => removeRoleFromUser({ userId: user.id, roleId }))
      ])

      const updatedRoles = roles.filter(r => selected.includes(r.id))
      onUpdated(user.id, updatedRoles)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to update role assignment')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!user} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Edit Role — {user?.fullName}</DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {roles.length === 0 ? (
          <Typography variant='body2' color='text.secondary'>
            No roles defined yet. Create a role first in the Roles &amp; Permissions tab.
          </Typography>
        ) : (
          <FormGroup>
            {roles.map(role => (
              <FormControlLabel
                key={role.id}
                control={
                  <Checkbox
                    size='small'
                    checked={selected.includes(role.id)}
                    onChange={() => toggle(role.id)}
                    disabled={saving}
                  />
                }
                label={
                  <Box>
                    <Typography variant='body2'>{role.name}</Typography>
                    {role.description && (
                      <Typography variant='caption' color='text.secondary'>
                        {role.description}
                      </Typography>
                    )}
                  </Box>
                }
              />
            ))}
          </FormGroup>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Deactivate confirm
// ---------------------------------------------------------------------------

interface DeactivateUserDialogProps {
  user: User | null
  onClose: () => void
  onDeactivated: (id: string) => void
}

function DeactivateUserDialog({ user, onClose, onDeactivated }: DeactivateUserDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle() {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      await deactivateUser(user.id)
      onDeactivated(user.id)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to deactivate user')
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!user} onClose={onClose}>
      <DialogTitle>Deactivate Staff Member</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <DialogContentText>
          Deactivate <strong>{user?.fullName}</strong>? They will lose access to this workspace — they
          can&#39;t sign in again, and any active session ends within a few minutes.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          color='error'
          variant='contained'
          onClick={handle}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Deactivate
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Staff Members tab
// ---------------------------------------------------------------------------

interface StaffMembersTabProps {
  users: UserWithRoles[]
  roles: TenantRole[]
  loading: boolean
  onInvite: () => void
  onEditRole: (user: UserWithRoles) => void
  onDeactivate: (user: UserWithRoles) => void
}

function StaffMembersTab({ users, roles: _roles, loading, onInvite, onEditRole, onDeactivate }: StaffMembersTabProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (users.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <i className='ri-team-line' style={{ fontSize: '2.5rem', color: 'var(--mui-palette-text-disabled)' }} />
          <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
            No staff members yet
          </Typography>
          <Button variant='contained' sx={{ mt: 2 }} onClick={onInvite}>
            Invite Your First Staff Member
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <TableContainer component={Paper} variant='outlined' className={tableStyles.scrollShadow}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>User Type</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Assigned Role</TableCell>
            <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 700 }} align='right'>
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map(user => (
            <TableRow key={user.id} hover>
              <TableCell>{user.fullName}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Chip size='small' label={user.userType ?? 'STAFF'} variant='tonal' />
              </TableCell>
              <TableCell>
                {user.roles.length === 0 ? (
                  <Typography variant='caption' color='text.disabled'>
                    No role
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {user.roles.map(role => (
                      <Chip key={role.id} size='small' label={role.name} />
                    ))}
                  </Box>
                )}
              </TableCell>
              <TableCell>
                <Chip
                  size='small'
                  label={user.active ? 'Active' : 'Deactivated'}
                  color={user.active ? 'success' : 'default'}
                  variant='tonal'
                />
              </TableCell>
              <TableCell align='right'>
                <Tooltip title='Edit role'>
                  <IconButton size='small' onClick={() => onEditRole(user)}>
                    <i className='ri-shield-user-line' style={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
                {user.active && (
                  <Tooltip title='Deactivate'>
                    <IconButton size='small' color='error' onClick={() => onDeactivate(user)}>
                      <i className='ri-user-unfollow-line' style={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}

// ---------------------------------------------------------------------------
// Create / Edit Role drawer
// ---------------------------------------------------------------------------

interface RoleDrawerProps {
  open: boolean
  role: TenantRole | null
  permissionsByModule: Record<string, TenantPermission[]>
  onClose: () => void
  onSaved: (role: TenantRole, isNew: boolean) => void
}

function RoleDrawer({ open, role, permissionsByModule, onClose, onSaved }: RoleDrawerProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(role?.name ?? '')
      setDescription(role?.description ?? '')
      setSelected(role?.permissionCodes ?? [])
      setError(null)
    }
  }, [open, role])

  function toggle(code: string) {
    setSelected(prev => (prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]))
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    try {
      if (role) {
        const updated = await updateRole(role.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          permissionCodes: selected
        })
        onSaved(updated, false)
      } else {
        const created = await createRole({
          name: name.trim(),
          description: description.trim() || undefined,
          permissionCodes: selected
        })
        onSaved(created, true)
      }
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to save role')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      onClose={onClose}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 480 } } }}
    >
      <Box className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>{role ? 'Edit Role' : 'Create Role'}</Typography>
        <IconButton size='small' onClick={onClose}>
          <i className='ri-close-line' />
        </IconButton>
      </Box>
      <Divider />
      <Box sx={{ p: 5, display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto' }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <TextField
          label='Role Name'
          size='small'
          fullWidth
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={saving}
          required
          placeholder='e.g. Finance Officer'
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
        <Box>
          <Typography variant='subtitle2' fontWeight={700} sx={{ mb: 2 }}>
            Permissions
          </Typography>
          {Object.keys(permissionsByModule).length === 0 ? (
            <Typography variant='body2' color='text.secondary'>
              No permissions available.
            </Typography>
          ) : (
            Object.entries(permissionsByModule).map(([module, perms]) => (
              <Box key={module} sx={{ mb: 3 }}>
                <Typography variant='caption' color='text.secondary' fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                  {module}
                </Typography>
                <FormGroup>
                  {perms.map(p => (
                    <FormControlLabel
                      key={p.id}
                      control={
                        <Checkbox
                          size='small'
                          checked={selected.includes(p.code)}
                          onChange={() => toggle(p.code)}
                          disabled={saving}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                            {p.code}
                          </Typography>
                          {p.description && (
                            <Typography variant='caption' color='text.secondary'>
                              {p.description}
                            </Typography>
                          )}
                        </Box>
                      }
                    />
                  ))}
                </FormGroup>
              </Box>
            ))
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={saving || !name.trim()}
            startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
          >
            {role ? 'Save Changes' : 'Create Role'}
          </Button>
        </Box>
      </Box>
    </Drawer>
  )
}

// ---------------------------------------------------------------------------
// Delete Role confirm
// ---------------------------------------------------------------------------

interface DeleteRoleDialogProps {
  role: TenantRole | null
  onClose: () => void
  onDeleted: (id: string) => void
}

function DeleteRoleDialog({ role, onClose, onDeleted }: DeleteRoleDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle() {
    if (!role) return
    setLoading(true)
    setError(null)
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
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <DialogContentText>
          Permanently delete role <strong>{role?.name}</strong>? Staff currently assigned this role will lose its
          permissions immediately.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          color='error'
          variant='contained'
          onClick={handle}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Roles & Permissions tab
// ---------------------------------------------------------------------------

interface RolesTabProps {
  roles: TenantRole[]
  loading: boolean
  onCreate: () => void
  onEdit: (role: TenantRole) => void
  onDelete: (role: TenantRole) => void
}

function RolesTab({ roles, loading, onCreate, onEdit, onDelete }: RolesTabProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (roles.length === 0) {
    return (
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <i className='ri-shield-keyhole-line' style={{ fontSize: '2.5rem', color: 'var(--mui-palette-text-disabled)' }} />
          <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
            No roles defined yet
          </Typography>
          <Button variant='contained' sx={{ mt: 2 }} onClick={onCreate}>
            Create First Role
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
      {roles.map(role => (
        <Card key={role.id} variant='outlined'>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Typography variant='subtitle2' fontWeight={700}>
                    {role.name}
                  </Typography>
                  {role.isDefault && <Chip size='small' label='Default' color='primary' variant='tonal' />}
                  <Chip size='small' label={`${role.permissionCodes.length} permissions`} variant='tonal' />
                </Box>
                {role.description && (
                  <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
                    {role.description}
                  </Typography>
                )}
                <Divider sx={{ my: 1 }} />
                {role.permissionCodes.length === 0 ? (
                  <Typography variant='caption' color='text.disabled'>
                    No permissions assigned
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {role.permissionCodes.map(code => (
                      <Chip
                        key={code}
                        size='small'
                        label={code}
                        sx={{ fontFamily: 'monospace', fontSize: '0.7rem', bgcolor: 'action.hover' }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                <Tooltip title='Edit role'>
                  <IconButton size='small' onClick={() => onEdit(role)}>
                    <i className='ri-edit-line' style={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
                {/* Built-in roles can't be deleted (the backend rejects it) — don't offer it. */}
                {!['ADMIN', 'MANAGER', 'STAFF'].includes(role.name) && (
                  <Tooltip title='Delete role'>
                    <IconButton size='small' color='error' onClick={() => onDelete(role)}>
                      <i className='ri-delete-bin-line' style={{ fontSize: '1rem' }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function TeamSettingsContent() {
  const { tenant } = useAuth()

  const [tab, setTab] = useState(0)
  const [users, setUsers] = useState<UserWithRoles[]>([])
  const [roles, setRoles] = useState<TenantRole[]>([])
  const [permissions, setPermissions] = useState<TenantPermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [inviteOpen, setInviteOpen] = useState(false)
  const [editRoleTarget, setEditRoleTarget] = useState<UserWithRoles | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<UserWithRoles | null>(null)

  const [roleDrawerOpen, setRoleDrawerOpen] = useState(false)
  const [roleDrawerTarget, setRoleDrawerTarget] = useState<TenantRole | null>(null)
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<TenantRole | null>(null)

  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [usersRes, rolesRes, permsRes] = await Promise.all([
        getUsers({ size: 100 }),
        getRoles({ size: 100 }),
        getPermissions()
      ])

      const roleLists = await Promise.all(usersRes.data.map(u => getUserRoles(u.id, { size: 20 })))
      const usersWithRoles: UserWithRoles[] = usersRes.data.map((u, i) => ({ ...u, roles: roleLists[i].data }))

      setUsers(usersWithRoles)
      setRoles(rolesRes.data)
      setPermissions(permsRes)
    } catch {
      setError('Failed to load team data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const permissionsByModule = permissions.reduce<Record<string, TenantPermission[]>>((acc, p) => {
    const key = p.module || 'other'
    acc[key] = acc[key] ? [...acc[key], p] : [p]
    return acc
  }, {})

  function handleInvited(user: User, roleId: string | null) {
    const assignedRole = roleId ? roles.find(r => r.id === roleId) : undefined
    setUsers(prev => [...prev, { ...user, roles: assignedRole ? [assignedRole] : [] }])
    setToast(`${user.fullName} invited`)
  }

  function handleRoleAssignmentUpdated(userId: string, updatedRoles: TenantRole[]) {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, roles: updatedRoles } : u)))
    setToast('Role assignment updated')
  }

  function handleDeactivated(userId: string) {
    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, active: false } : u)))
    setToast('Staff member deactivated')
  }

  function handleRoleSaved(role: TenantRole, isNew: boolean) {
    setRoles(prev => (isNew ? [...prev, role] : prev.map(r => (r.id === role.id ? role : r))))
    setToast(isNew ? `Role "${role.name}" created` : `Role "${role.name}" updated`)
  }

  function handleRoleDeleted(id: string) {
    setRoles(prev => prev.filter(r => r.id !== id))
    setUsers(prev => prev.map(u => ({ ...u, roles: u.roles.filter(r => r.id !== id) })))
    setToast('Role deleted')
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label='Staff Members' icon={<i className='ri-team-line' />} iconPosition='start' />
          <Tab label='Roles and Permissions' icon={<i className='ri-shield-user-line' />} iconPosition='start' />
        </Tabs>
        {tab === 0 ? (
          <Button variant='contained' startIcon={<i className='ri-user-add-line' />} onClick={() => setInviteOpen(true)}>
            Invite Staff
          </Button>
        ) : (
          <Button
            variant='contained'
            startIcon={<i className='ri-add-line' />}
            onClick={() => {
              setRoleDrawerTarget(null)
              setRoleDrawerOpen(true)
            }}
          >
            Create Role
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {tab === 0 ? (
        <StaffMembersTab
          users={users}
          roles={roles}
          loading={loading}
          onInvite={() => setInviteOpen(true)}
          onEditRole={setEditRoleTarget}
          onDeactivate={setDeactivateTarget}
        />
      ) : (
        <RolesTab
          roles={roles}
          loading={loading}
          onCreate={() => {
            setRoleDrawerTarget(null)
            setRoleDrawerOpen(true)
          }}
          onEdit={role => {
            setRoleDrawerTarget(role)
            setRoleDrawerOpen(true)
          }}
          onDelete={setDeleteRoleTarget}
        />
      )}

      <InviteStaffDialog
        open={inviteOpen}
        roles={roles}
        defaultCompanyName={tenant?.name ?? ''}
        onClose={() => setInviteOpen(false)}
        onInvited={handleInvited}
      />

      <EditUserRoleDialog
        user={editRoleTarget}
        roles={roles}
        onClose={() => setEditRoleTarget(null)}
        onUpdated={handleRoleAssignmentUpdated}
      />

      <DeactivateUserDialog
        user={deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onDeactivated={handleDeactivated}
      />

      <RoleDrawer
        open={roleDrawerOpen}
        role={roleDrawerTarget}
        permissionsByModule={permissionsByModule}
        onClose={() => setRoleDrawerOpen(false)}
        onSaved={handleRoleSaved}
      />

      <DeleteRoleDialog role={deleteRoleTarget} onClose={() => setDeleteRoleTarget(null)} onDeleted={handleRoleDeleted} />

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity='success' onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  )
}
