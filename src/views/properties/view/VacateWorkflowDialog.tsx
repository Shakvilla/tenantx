'use client'

/**
 * VacateWorkflowDialog
 *
 * Handles three workflow transitions:
 *   'confirm'   NOTICE_GIVEN → CONFIRMED    (notes only)
 *   'move-out'  CONFIRMED → MOVED_OUT       (actual date, keys, inspection link)
 *   'complete'  MOVED_OUT → COMPLETED       (notes only)
 */

import { useState, useEffect } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'

import { vacateNoticesApi } from '@/lib/api/vacateNotices'
import { inspectionsApi } from '@/lib/api/inspections'
import type { VacateNoticeSummary } from '@/types/vacateNotice'
import type { InspectionSummary } from '@/types/inspection'

// ─── per-action config ────────────────────────────────────────────────────────

const ACTION_META = {
  'confirm': {
    title: 'Confirm Vacate Notice',
    icon: 'ri-check-line',
    iconColor: 'var(--mui-palette-info-main)',
    label: 'Confirm',
    color: 'info' as const,
    description: 'Mark this notice as confirmed. The tenant is expected to move out on the date specified.',
  },
  'move-out': {
    title: 'Mark as Moved Out',
    icon: 'ri-door-open-line',
    iconColor: 'var(--mui-palette-warning-main)',
    label: 'Mark Moved Out',
    color: 'warning' as const,
    description: 'Record that the tenant has physically vacated. This will automatically mark the unit as vacant.',
  },
  'complete': {
    title: 'Complete Move-Out',
    icon: 'ri-checkbox-circle-line',
    iconColor: 'var(--mui-palette-success-main)',
    label: 'Complete',
    color: 'success' as const,
    description: 'Finalise the move-out process. All handover items should be resolved before completing.',
  },
}

// ─── component ────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  notice: VacateNoticeSummary
  action: 'confirm' | 'move-out' | 'complete'
  onClose: () => void
  onDone: () => void
}

export default function VacateWorkflowDialog({ open, notice, action, onClose, onDone }: Props) {
  const meta = ACTION_META[action]
  const today = new Date().toISOString().slice(0, 10)

  // shared
  const [notes, setNotes]           = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  // move-out specific
  const [actualOut, setActualOut]       = useState(today)
  const [keysReturned, setKeysReturned] = useState(false)
  const [keysDate, setKeysDate]         = useState(today)
  const [keysTo, setKeysTo]             = useState('')
  const [inspectionId, setInspectionId] = useState('')
  const [completedInspections, setCompletedInspections] = useState<InspectionSummary[]>([])

  // Load completed move-out inspections for the unit when action = move-out
  useEffect(() => {
    if (!open || action !== 'move-out') return
    inspectionsApi
      .getCompletedByUnit(notice.unitId)
      .then(list => setCompletedInspections(list.filter(i => i.type === 'MOVE_OUT')))
      .catch(() => {/* silent — not critical */})
  }, [open, action, notice.unitId])

  function reset() {
    setNotes('')
    setActualOut(today)
    setKeysReturned(false)
    setKeysDate(today)
    setKeysTo('')
    setInspectionId('')
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      if (action === 'confirm') {
        await vacateNoticesApi.confirm(notice.id, { notes: notes || undefined })
      } else if (action === 'move-out') {
        await vacateNoticesApi.markMovedOut(notice.id, {
          actualMoveOut: actualOut || undefined,
          keysReturned,
          keysReturnedDate: keysReturned && keysDate ? keysDate : undefined,
          keysReturnedTo:   keysReturned && keysTo   ? keysTo   : undefined,
          inspectionId:     inspectionId || undefined,
          notes:            notes        || undefined,
        })
      } else {
        await vacateNoticesApi.complete(notice.id, { notes: notes || undefined })
      }
      reset()
      onDone()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Action failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <Box className='flex items-center gap-2'>
          <i className={meta.icon} style={{ color: meta.iconColor }} />
          <span>{meta.title}</span>
        </Box>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Notice summary */}
        <Box sx={{ mb: 3, p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
            Vacate Notice
          </Typography>
          <Grid container spacing={2}>
            {notice.unitNo && (
              <Grid size={{ xs: 6 }}>
                <Typography variant='caption' color='text.secondary'>Unit</Typography>
                <Typography variant='body2' fontWeight={500}>{notice.unitNo}</Typography>
              </Grid>
            )}
            {notice.occupantName && (
              <Grid size={{ xs: 6 }}>
                <Typography variant='caption' color='text.secondary'>Tenant</Typography>
                <Typography variant='body2' fontWeight={500}>{notice.occupantName}</Typography>
              </Grid>
            )}
            <Grid size={{ xs: 6 }}>
              <Typography variant='caption' color='text.secondary'>Notice Date</Typography>
              <Typography variant='body2' fontWeight={500}>
                {new Date(notice.noticeDate).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant='caption' color='text.secondary'>Expected Move-Out</Typography>
              <Typography variant='body2' fontWeight={500}>
                {new Date(notice.expectedMoveOut).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
          {meta.description}
        </Typography>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* ── Move-out specific fields ──────────────────────────────────── */}
          {action === 'move-out' && (
            <>
              {/* Actual move-out date */}
              <Grid size={{ xs: 12 }}>
                <TextField
                  label='Actual Move-Out Date'
                  type='date'
                  value={actualOut}
                  onChange={e => setActualOut(e.target.value)}
                  fullWidth
                  size='small'
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>

              {/* Keys handover */}
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={keysReturned}
                      onChange={e => setKeysReturned(e.target.checked)}
                      color='success'
                    />
                  }
                  label='Keys have been returned'
                />
              </Grid>

              {keysReturned && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label='Keys Returned Date'
                      type='date'
                      value={keysDate}
                      onChange={e => setKeysDate(e.target.value)}
                      fullWidth
                      size='small'
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      label='Keys Returned To'
                      placeholder='Name of recipient'
                      value={keysTo}
                      onChange={e => setKeysTo(e.target.value)}
                      fullWidth
                      size='small'
                    />
                  </Grid>
                </>
              )}

              {/* Link to move-out inspection */}
              {completedInspections.length > 0 && (
                <>
                  <Grid size={{ xs: 12 }}>
                    <Divider />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label='Link Move-Out Inspection'
                      select
                      value={inspectionId}
                      onChange={e => setInspectionId(e.target.value)}
                      fullWidth
                      size='small'
                      helperText='Optional — attach the move-out inspection to this notice'
                    >
                      <MenuItem value=''>— None —</MenuItem>
                      {completedInspections.map(ins => (
                        <MenuItem key={ins.id} value={ins.id}>
                          {ins.inspectionDate
                            ? new Date(ins.inspectionDate).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })
                            : 'No date'}
                          {ins.inspectorName ? ` — ${ins.inspectorName}` : ''}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12 }}>
                <Divider />
              </Grid>
            </>
          )}

          {/* Notes (all actions) */}
          <Grid size={{ xs: 12 }}>
            <TextField
              label='Notes'
              value={notes}
              onChange={e => setNotes(e.target.value)}
              fullWidth
              size='small'
              multiline
              rows={3}
              placeholder='Any additional notes for this step…'
            />
          </Grid>

          {/* Move-out: warn about auto-vacate */}
          {action === 'move-out' && (
            <Grid size={{ xs: 12 }}>
              <Box className='flex items-start gap-2' sx={{ p: 2, borderRadius: 1, bgcolor: 'warning.light', color: 'warning.dark' }}>
                <i className='ri-information-line' style={{ marginTop: 2, flexShrink: 0 }} />
                <Typography variant='caption'>
                  Marking as moved out will automatically set the unit status to <strong>Vacant</strong>.
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions className='gap-2'>
        <Button variant='outlined' color='secondary' onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color={meta.color}
          startIcon={<i className={meta.icon} />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : meta.label}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
