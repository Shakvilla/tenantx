'use client'

import { useState } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Snackbar from '@mui/material/Snackbar'

import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { changeAdminPassword } from '@/lib/api/admin-auth-client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string) {
  return name.split(' ').map(p => p[0] ?? '').slice(0, 2).join('').toUpperCase()
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', py: 1.5, alignItems: 'flex-start', gap: 2 }}>
      <Typography variant='body2' color='text.secondary' sx={{ minWidth: 160, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box>{children}</Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Change password section
// ---------------------------------------------------------------------------

function ChangePasswordCard() {
  const [currentPw, setCurrentPw]   = useState('')
  const [newPw, setNewPw]           = useState('')
  const [confirmPw, setConfirmPw]   = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [successOpen, setSuccessOpen] = useState(false)

  const mismatch   = confirmPw.length > 0 && newPw !== confirmPw
  const valid      = currentPw.length > 0 && newPw.length >= 8 && newPw === confirmPw

  async function handleSave() {
    if (!valid) return
    setSaving(true); setError(null)
    try {
      await changeAdminPassword(currentPw, newPw)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setSuccessOpen(true)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant='subtitle2' fontWeight={600} gutterBottom>
            Change Password
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 420 }}>
            {error && <Alert severity='error'>{error}</Alert>}

            <TextField
              label='Current Password'
              size='small'
              type={showCurrent ? 'text' : 'password'}
              value={currentPw}
              onChange={e => setCurrentPw(e.target.value)}
              disabled={saving}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton size='small' onClick={() => setShowCurrent(s => !s)}>
                        <i className={showCurrent ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

            <TextField
              label='New Password'
              size='small'
              type={showNew ? 'text' : 'password'}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              disabled={saving}
              helperText='Minimum 8 characters'
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton size='small' onClick={() => setShowNew(s => !s)}>
                        <i className={showNew ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              }}
            />

            <TextField
              label='Confirm New Password'
              size='small'
              type='password'
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              disabled={saving}
              error={mismatch}
              helperText={mismatch ? 'Passwords do not match' : undefined}
            />

            <Box>
              <Button
                variant='contained'
                onClick={handleSave}
                disabled={saving || !valid}
                startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
              >
                Update Password
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={successOpen}
        autoHideDuration={4000}
        onClose={() => setSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity='success' onClose={() => setSuccessOpen(false)} sx={{ width: '100%' }}>
          Password updated successfully.
        </Alert>
      </Snackbar>
    </>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminProfileView() {
  const { adminUser } = useAdminAuth()

  if (!adminUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main', fontSize: '1.25rem', fontWeight: 700 }}>
          {getInitials(adminUser.fullName)}
        </Avatar>
        <Box>
          <Typography variant='h5' fontWeight={700}>{adminUser.fullName}</Typography>
          <Typography variant='body2' color='text.secondary'>{adminUser.email}</Typography>
        </Box>
      </Box>

      {/* Profile info card */}
      <Card>
        <CardContent>
          <Typography variant='subtitle2' fontWeight={600} gutterBottom>
            Account Details
          </Typography>
          <Divider sx={{ mb: 1 }} />

          <InfoRow label='Full Name'>
            <Typography variant='body2' fontWeight={600}>{adminUser.fullName}</Typography>
          </InfoRow>
          <Divider />

          <InfoRow label='Email'>
            <Typography variant='body2'>{adminUser.email}</Typography>
          </InfoRow>
          <Divider />

          <InfoRow label='Status'>
            <Chip
              size='small'
              label={adminUser.active ? 'Active' : 'Inactive'}
              color={adminUser.active ? 'success' : 'default'}
              variant='outlined'
            />
          </InfoRow>
          <Divider />

          <InfoRow label='Roles'>
            {adminUser.roles.length === 0 ? (
              <Typography variant='body2' color='text.disabled'>No roles assigned</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {adminUser.roles.map(role => (
                  <Chip
                    key={role}
                    size='small'
                    label={role}
                    sx={{ bgcolor: 'primary.lighter', color: 'primary.main', fontWeight: 600, border: 'none' }}
                  />
                ))}
              </Box>
            )}
          </InfoRow>
        </CardContent>
      </Card>

      {/* Change password */}
      <ChangePasswordCard />
    </Box>
  )
}
