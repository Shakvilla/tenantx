'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Tooltip from '@mui/material/Tooltip'
import Snackbar from '@mui/material/Snackbar'

import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

import {
  getSystemAdmin,
  deactivateSystemAdmin,
  reactivateSystemAdmin,
  resetSystemAdminPassword,
  getRoles,
  assignAdminRole,
  removeAdminRole,
  setAdminMfaRequired,
  type AdminRecord,
  type RoleRecord,
} from '@/lib/api/admin-auth-client'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

// ---------------------------------------------------------------------------
// Reset Password dialog
// ---------------------------------------------------------------------------

interface ResetPasswordDialogProps {
  open: boolean
  admin: AdminRecord
  onClose: () => void
}

function ResetPasswordDialog({ open, admin, onClose }: ResetPasswordDialogProps) {
  const [newPassword, setNewPassword] = useState('')
  const [showPw, setShowPw]           = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [success, setSuccess]         = useState(false)

  function handleClose() {
    setNewPassword(''); setError(null); setSuccess(false); setShowPw(false)
    onClose()
  }

  async function handleSave() {
    if (newPassword.length < 8) return
    setSaving(true); setError(null)
    try {
      await resetSystemAdminPassword(admin.id, newPassword)
      setSuccess(true)
      setNewPassword('')
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to reset password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='xs' fullWidth>
      <DialogTitle>Reset Password</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Typography variant='body2' color='text.secondary'>
          Setting a new password for <strong>{admin.fullName}</strong>. They will need to use this password on their next login.
        </Typography>
        {error   && <Alert severity='error'>{error}</Alert>}
        {success && <Alert severity='success'>Password reset successfully.</Alert>}
        <TextField
          label='New Password'
          size='small'
          fullWidth
          type={showPw ? 'text' : 'password'}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          disabled={saving || success}
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
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{success ? 'Close' : 'Cancel'}</Button>
        {!success && (
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={saving || newPassword.length < 8}
            startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
          >
            Reset Password
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Confirm dialog (deactivate / reactivate)
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: React.ReactNode
  confirmLabel: string
  confirmColor: 'error' | 'success'
  onClose: () => void
  onConfirm: () => Promise<void>
}

function ConfirmDialog({ open, title, message, confirmLabel, confirmColor, onClose, onConfirm }: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  async function handle() {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button color={confirmColor} variant='contained' onClick={handle} disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          {confirmLabel}
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

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', py: 1.5, alignItems: 'flex-start', gap: 2 }}>
      <Typography variant='body2' color='text.secondary' sx={{ minWidth: 140, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box>{children}</Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminAdminDetailView({ adminId }: { adminId: string }) {
  const router = useRouter()
  const { hasPermission } = useAdminAuth()
  const canManage = hasPermission('manage_admins')

  const [admin, setAdmin]           = useState<AdminRecord | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [allRoles, setAllRoles]     = useState<RoleRecord[]>([])
  const [roleToAdd, setRoleToAdd]   = useState('')
  const [roleLoading, setRoleLoading] = useState(false)
  const [mfaLoading, setMfaLoading] = useState(false)
  const [resetPwOpen, setResetPwOpen]       = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [reactivateOpen, setReactivateOpen] = useState(false)
  const [toast, setToast]                   = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null)
      try {
        const [data, roles] = await Promise.all([getSystemAdmin(adminId), getRoles()])
        setAdmin(data)
        setAllRoles(roles)
      } catch (e: any) {
        setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load admin')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [adminId])

  async function handleAssignRole() {
    if (!admin || !roleToAdd) return
    setRoleLoading(true)
    try {
      await assignAdminRole(admin.id, roleToAdd)
      setAdmin(prev => prev ? { ...prev, roles: [...prev.roles, roleToAdd] } : prev)
      setRoleToAdd('')
    } finally {
      setRoleLoading(false)
    }
  }

  async function handleRemoveRole(roleName: string) {
    if (!admin) return
    setRoleLoading(true)
    try {
      await removeAdminRole(admin.id, roleName)
      setAdmin(prev => prev ? { ...prev, roles: prev.roles.filter(r => r !== roleName) } : prev)
    } finally {
      setRoleLoading(false)
    }
  }

  async function handleDeactivate() {
    if (!admin) return
    await deactivateSystemAdmin(admin.id)
    setAdmin(prev => prev ? { ...prev, active: false } : prev)
    setDeactivateOpen(false)
    setToast(`${admin.fullName} deactivated`)
  }

  async function handleReactivate() {
    if (!admin) return
    const updated = await reactivateSystemAdmin(admin.id)
    setAdmin(updated)
    setReactivateOpen(false)
    setToast(`${updated.fullName} reactivated`)
  }

  async function handleMfaToggle() {
    if (!admin) return
    setMfaLoading(true)
    try {
      const updated = await setAdminMfaRequired(admin.id, !admin.mfaRequired)
      setAdmin(updated)
      setToast(updated.mfaRequired ? 'MFA enforcement enabled' : 'MFA enforcement disabled')
    } catch (e: any) {
      setToast('Failed to update MFA requirement')
    } finally {
      setMfaLoading(false)
    }
  }

  // ── Loading / error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !admin) {
    return (
      <Box>
        <Button startIcon={<i className='ri-arrow-left-line' />} onClick={() => router.back()} sx={{ mb: 2 }}>
          Back
        </Button>
        <Alert severity='error'>{error ?? 'Admin not found'}</Alert>
      </Box>
    )
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Tooltip title='Back to Admins'>
          <IconButton onClick={() => router.push('/admin/admins')}>
            <i className='ri-arrow-left-line' />
          </IconButton>
        </Tooltip>

        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.lighter', color: 'primary.main', fontWeight: 700 }}>
          {getInitials(admin.fullName)}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant='h5' fontWeight={700}>{admin.fullName}</Typography>
            <Chip
              size='small'
              label={admin.active ? 'Active' : 'Inactive'}
              color={admin.active ? 'success' : 'default'}
              variant='outlined'
            />
          </Box>
          <Typography variant='body2' color='text.secondary'>{admin.email}</Typography>
        </Box>

        {canManage && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant='outlined'
              startIcon={<i className='ri-lock-password-line' />}
              onClick={() => setResetPwOpen(true)}
            >
              Reset Password
            </Button>
            {admin.active ? (
              <Button
                variant='outlined'
                color='error'
                startIcon={<i className='ri-forbid-line' />}
                onClick={() => setDeactivateOpen(true)}
              >
                Deactivate
              </Button>
            ) : (
              <Button
                variant='outlined'
                color='success'
                startIcon={<i className='ri-checkbox-circle-line' />}
                onClick={() => setReactivateOpen(true)}
              >
                Reactivate
              </Button>
            )}
          </Box>
        )}
      </Box>

      {/* Info card */}
      <Card>
        <CardContent>
          <Typography variant='subtitle2' fontWeight={600} gutterBottom>
            Admin Information
          </Typography>
          <Divider sx={{ mb: 1 }} />

          <InfoRow label='Full Name'>
            <Typography variant='body2' fontWeight={600}>{admin.fullName}</Typography>
          </InfoRow>

          <Divider />

          <InfoRow label='Email'>
            <Typography variant='body2'>{admin.email}</Typography>
          </InfoRow>

          <Divider />

          <InfoRow label='Status'>
            <Chip
              size='small'
              label={admin.active ? 'Active' : 'Inactive'}
              color={admin.active ? 'success' : 'default'}
              variant='outlined'
            />
          </InfoRow>

          <Divider />

          <InfoRow label='MFA Required'>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <FormControlLabel
                control={
                  <Switch
                    size='small'
                    checked={admin.mfaRequired}
                    onChange={handleMfaToggle}
                    disabled={!canManage || mfaLoading}
                    color='warning'
                  />
                }
                label={
                  <Typography variant='body2'>
                    {admin.mfaRequired ? 'Enforced' : 'Not enforced'}
                  </Typography>
                }
              />
              {mfaLoading && <CircularProgress size={14} />}
              {admin.mfaRequired && (
                <Chip
                  size='small'
                  label='MFA Required'
                  color='warning'
                  icon={<i className='ri-shield-check-line' style={{ fontSize: '0.875rem' }} />}
                />
              )}
            </Box>
          </InfoRow>

          <Divider />

          <InfoRow label='Roles'>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Current roles */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {admin.roles.length === 0 ? (
                  <Typography variant='body2' color='text.disabled'>No roles assigned</Typography>
                ) : admin.roles.map(role => (
                  <Chip
                    key={role}
                    size='small'
                    label={role}
                    sx={{ bgcolor: 'primary.lighter', color: 'primary.main', fontWeight: 600, border: 'none' }}
                    onDelete={canManage ? () => handleRemoveRole(role) : undefined}
                    disabled={roleLoading}
                  />
                ))}
              </Box>
              {/* Assign new role */}
              {canManage && (() => {
                const unassigned = allRoles.filter(r => !admin.roles.includes(r.name))
                return unassigned.length > 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <FormControl size='small' sx={{ minWidth: 180 }}>
                      <InputLabel>Add role</InputLabel>
                      <Select
                        value={roleToAdd}
                        onChange={e => setRoleToAdd(e.target.value)}
                        label='Add role'
                        disabled={roleLoading}
                      >
                        {unassigned.map(r => (
                          <MenuItem key={r.id} value={r.name}>{r.name}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      size='small'
                      variant='outlined'
                      onClick={handleAssignRole}
                      disabled={!roleToAdd || roleLoading}
                      startIcon={roleLoading ? <CircularProgress size={12} color='inherit' /> : undefined}
                    >
                      Assign
                    </Button>
                  </Box>
                ) : null
              })()}
            </Box>
          </InfoRow>

          <Divider />

          <InfoRow label='Last Login'>
            <Typography variant='body2'>
              {admin.lastLoginAt
                ? new Date(admin.lastLoginAt).toLocaleString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
                : <span style={{ color: 'var(--mui-palette-text-disabled)' }}>Never logged in</span>
              }
            </Typography>
          </InfoRow>

          <Divider />

          <InfoRow label='Created'>
            <Typography variant='body2'>
              {new Date(admin.createdAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </Typography>
          </InfoRow>
        </CardContent>
      </Card>

      {/* Dialogs */}
      {resetPwOpen && (
        <ResetPasswordDialog
          open={resetPwOpen}
          admin={admin}
          onClose={() => setResetPwOpen(false)}
        />
      )}

      <ConfirmDialog
        open={deactivateOpen}
        title='Deactivate Admin'
        message={<>Deactivate <strong>{admin.fullName}</strong>? They will immediately lose platform access.</>}
        confirmLabel='Deactivate'
        confirmColor='error'
        onClose={() => setDeactivateOpen(false)}
        onConfirm={handleDeactivate}
      />

      <ConfirmDialog
        open={reactivateOpen}
        title='Reactivate Admin'
        message={<>Reactivate <strong>{admin.fullName}</strong>? They will regain platform access immediately.</>}
        confirmLabel='Reactivate'
        confirmColor='success'
        onClose={() => setReactivateOpen(false)}
        onConfirm={handleReactivate}
      />

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity='success' onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </Box>
  )
}
