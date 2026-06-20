'use client'

/**
 * CreateVacateNoticeDialog
 *
 * Simple single-step form: notice date, expected move-out date, reason, notes.
 * Creates a notice in NOTICE_GIVEN status.
 */

import { useState, useEffect } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid2'

import { vacateNoticesApi } from '@/lib/api/vacateNotices'

const REASONS = [
  'End of lease',
  'Tenant request',
  'Property sale',
  'Renovation / refurbishment',
  'Non-payment of rent',
  'Lease violation',
  'Other',
]

type Props = {
  open: boolean
  unitId: string
  propertyId: string
  unitNo?: string
  propertyName?: string
  tenantName?: string
  onClose: () => void
  onCreated: () => void
}

export default function CreateVacateNoticeDialog({
  open, unitId, propertyId, unitNo, propertyName, tenantName, onClose, onCreated
}: Props) {
  const today = new Date().toISOString().slice(0, 10)

  const [noticeDate, setNoticeDate]       = useState(today)
  const [expectedOut, setExpectedOut]     = useState('')
  const [reason, setReason]               = useState('')
  const [occupantName, setOccupantName]   = useState('')

  // Sync tenant name from DB whenever the dialog opens
  useEffect(() => {
    if (open) setOccupantName(tenantName ?? '')
  }, [open, tenantName])
  const [notes, setNotes]                 = useState('')
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  function reset() {
    setNoticeDate(today)
    setExpectedOut('')
    setReason('')
    setOccupantName(tenantName ?? '')
    setNotes('')
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSave() {
    if (!noticeDate || !expectedOut) {
      setError('Notice date and expected move-out date are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await vacateNoticesApi.create({
        unitId,
        propertyId,
        unitNo,
        propertyName,
        occupantName: occupantName || undefined,
        noticeDate,
        expectedMoveOut: expectedOut,
        noticeReason: reason || undefined,
        notes: notes || undefined,
      })
      reset()
      onCreated()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to create vacate notice')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <Box className='flex items-center gap-2'>
          <i className='ri-door-open-line' style={{ color: 'var(--mui-palette-warning-main)' }} />
          <span>New Vacate Notice</span>
        </Box>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ pt: 1 }}>
          {/* Unit context */}
          {(unitNo || propertyName) && (
            <Grid size={{ xs: 12 }}>
              <TextField
                label='Unit'
                value={[unitNo, propertyName].filter(Boolean).join(' — ')}
                fullWidth
                size='small'
                InputProps={{ readOnly: true }}
              />
            </Grid>
          )}

          {/* Tenant name — pre-filled from unit's current occupant */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label='Tenant Name'
              placeholder='Name of tenant giving notice'
              value={occupantName}
              onChange={e => setOccupantName(e.target.value)}
              fullWidth
              size='small'
              InputProps={{ readOnly: !!tenantName }}
              helperText={tenantName ? 'Auto-filled from current occupant' : undefined}
            />
          </Grid>

          {/* Notice date */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label='Notice Date *'
              type='date'
              value={noticeDate}
              onChange={e => setNoticeDate(e.target.value)}
              fullWidth
              size='small'
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Expected move-out */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label='Expected Move-Out *'
              type='date'
              value={expectedOut}
              onChange={e => setExpectedOut(e.target.value)}
              fullWidth
              size='small'
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Reason */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label='Reason for Vacating'
              select
              value={reason}
              onChange={e => setReason(e.target.value)}
              fullWidth
              size='small'
            >
              <MenuItem value=''>— Select reason —</MenuItem>
              {REASONS.map(r => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </TextField>
          </Grid>

          {/* Notes */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label='Notes'
              value={notes}
              onChange={e => setNotes(e.target.value)}
              fullWidth
              size='small'
              multiline
              rows={3}
              placeholder='Any additional details…'
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className='gap-2'>
        <Button variant='outlined' color='secondary' onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant='contained'
          startIcon={<i className='ri-add-line' />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Create Notice'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

