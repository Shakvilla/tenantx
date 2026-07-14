'use client'

import { useState, useEffect } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { violationsApi } from '@/lib/api/violations'
import type {
  ViolationSummary, ViolationCategory, ViolationSeverity, ViolationStatus, CreateViolationRequest,
} from '@/types/violation'

const CATEGORIES: { value: ViolationCategory; label: string }[] = [
  { value: 'SUBLETTING',              label: 'Illegal Subletting' },
  { value: 'PROPERTY_DAMAGE',         label: 'Property Damage' },
  { value: 'UNAUTHORIZED_RENOVATION', label: 'Unauthorized Renovation' },
  { value: 'PROHIBITED_PETS',         label: 'Prohibited Pets' },
  { value: 'NOISE',                   label: 'Excessive Noise' },
  { value: 'NON_PAYMENT',             label: 'Non-Payment' },
  { value: 'OTHER',                   label: 'Other' },
]
const categoryLabel = (c: ViolationCategory) => CATEGORIES.find(x => x.value === c)?.label ?? c

const SEVERITIES: { value: ViolationSeverity; label: string }[] = [
  { value: 'LOW', label: 'Low' }, { value: 'MEDIUM', label: 'Medium' }, { value: 'HIGH', label: 'High' },
]
const SEVERITY_COLORS: Record<ViolationSeverity, 'default' | 'warning' | 'error'> = {
  LOW: 'default', MEDIUM: 'warning', HIGH: 'error',
}

const STATUS_LABELS: Record<ViolationStatus, string> = {
  OPEN: 'Open', WARNING_ISSUED: 'Warning Issued', FINE_ASSESSED: 'Fine Assessed',
  RESOLVED: 'Resolved', ESCALATED: 'Escalated',
}
const STATUS_COLORS: Record<ViolationStatus, 'info' | 'warning' | 'error' | 'success'> = {
  OPEN: 'info', WARNING_ISSUED: 'warning', FINE_ASSESSED: 'warning', RESOLVED: 'success', ESCALATED: 'error',
}

const TERMINAL: ViolationStatus[] = ['RESOLVED', 'ESCALATED']

type Props = { occupantId: string }

const BLANK_FORM: Omit<CreateViolationRequest, 'occupantId'> = {
  category: 'NOISE', severity: 'MEDIUM', title: '', description: '',
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ViolationsTab({ occupantId }: Props) {
  const [violations, setViolations] = useState<ViolationSummary[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [busyId, setBusyId]         = useState<string | null>(null)

  // log dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm]             = useState({ ...BLANK_FORM })
  const [formErr, setFormErr]       = useState<{ title?: boolean }>({})
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState<string | null>(null)

  // fine / notes sub-dialogs
  const [fineFor, setFineFor]   = useState<string | null>(null)
  const [fineAmount, setFineAmount] = useState('')
  const [notesFor, setNotesFor] = useState<{ id: string; action: 'resolve' | 'escalate' } | null>(null)
  const [notes, setNotes]       = useState('')

  useEffect(() => { load() }, [occupantId]) // eslint-disable-line

  function load() {
    setLoading(true)
    setError(null)
    violationsApi.listByOccupant(occupantId)
      .then(setViolations)
      .catch(err => setError(err?.message ?? 'Failed to load violations'))
      .finally(() => setLoading(false))
  }

  function replace(updated: ViolationSummary) {
    setViolations(prev => prev.map(v => (v.id === updated.id ? updated : v)))
  }

  async function run(id: string, fn: () => Promise<ViolationSummary>) {
    setBusyId(id)
    setError(null)
    try {
      replace(await fn())
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Action failed')
    } finally {
      setBusyId(null)
    }
  }

  async function handleLog() {
    if (!form.title.trim()) { setFormErr({ title: true }); return }
    setSaving(true)
    setSaveError(null)
    try {
      const created = await violationsApi.create({ ...form, occupantId })
      setViolations(prev => [created, ...prev])
      setDialogOpen(false)
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? err?.message ?? 'Failed to log violation')
    } finally {
      setSaving(false)
    }
  }

  async function submitFine() {
    if (!fineFor) return
    const amount = Number(fineAmount)
    if (!amount || amount <= 0) return
    await run(fineFor, () => violationsApi.assessFine(fineFor, amount))
    setFineFor(null); setFineAmount('')
  }

  async function submitNotes() {
    if (!notesFor) return
    const { id, action } = notesFor
    await run(id, () => (action === 'resolve' ? violationsApi.resolve(id, notes) : violationsApi.escalate(id, notes)))
    setNotesFor(null); setNotes('')
  }

  if (loading) return (
    <Box className='flex justify-center items-center' sx={{ minHeight: 200 }}>
      <CircularProgress />
    </Box>
  )

  return (
    <>
      <Card>
        <CardHeader
          title='Violations'
          subheader='Tenancy violations and their warning / fine / resolution status'
          action={
            <Button variant='contained' size='small' color='error'
              startIcon={<i className='ri-error-warning-line' />} onClick={() => { setForm({ ...BLANK_FORM }); setFormErr({}); setSaveError(null); setDialogOpen(true) }}>
              Log Violation
            </Button>
          }
        />
        <CardContent>
          {error && <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

          {violations.length === 0 ? (
            <Box className='flex flex-col items-center justify-center gap-2 py-12' sx={{ color: 'text.disabled' }}>
              <i className='ri-shield-check-line' style={{ fontSize: 28 }} />
              <Typography variant='body2'>No violations recorded for this occupant.</Typography>
            </Box>
          ) : (
            <Box className='flex flex-col gap-4'>
              {violations.map((v, idx) => {
                const terminal = TERMINAL.includes(v.status)
                const busy = busyId === v.id
                return (
                  <Box key={v.id}>
                    {idx > 0 && <Divider sx={{ mb: 4 }} />}
                    <Box className='flex items-start justify-between gap-3'>
                      <Box className='flex flex-col gap-1'>
                        <Box className='flex items-center gap-2 flex-wrap'>
                          <Chip label={STATUS_LABELS[v.status]} size='small' variant='tonal' color={STATUS_COLORS[v.status]} />
                          <Chip label={categoryLabel(v.category)} size='small' variant='tonal' color='secondary' />
                          <Chip label={v.severity} size='small' variant='tonal' color={SEVERITY_COLORS[v.severity]} />
                          <Typography fontWeight={600}>{v.title}</Typography>
                        </Box>
                        <Typography variant='caption' color='text.secondary'>
                          {fmtDate(v.reportedAt)}
                          {v.fineAmount != null ? ` · Fine GHS ${v.fineAmount} (${v.fineStatus})` : ''}
                        </Typography>
                      </Box>
                    </Box>

                    {!terminal && (
                      <Box className='flex items-center gap-2 flex-wrap mbs-3'>
                        <Button size='small' variant='outlined' color='warning' disabled={busy}
                          onClick={() => run(v.id, () => violationsApi.warn(v.id))}
                          startIcon={busy ? <CircularProgress size={14} color='inherit' /> : <i className='ri-alarm-warning-line' />}>
                          Warn
                        </Button>
                        <Button size='small' variant='outlined' disabled={busy}
                          onClick={() => { setFineFor(v.id); setFineAmount('') }}
                          startIcon={<i className='ri-money-dollar-circle-line' />}>
                          Assess Fine
                        </Button>
                        {v.fineStatus === 'PENDING' && (
                          <>
                            <Button size='small' variant='text' color='success' disabled={busy}
                              onClick={() => run(v.id, () => violationsApi.setFineStatus(v.id, 'PAID'))}>
                              Mark Paid
                            </Button>
                            <Button size='small' variant='text' color='secondary' disabled={busy}
                              onClick={() => run(v.id, () => violationsApi.setFineStatus(v.id, 'WAIVED'))}>
                              Waive
                            </Button>
                          </>
                        )}
                        <Button size='small' variant='outlined' color='success' disabled={busy}
                          onClick={() => { setNotesFor({ id: v.id, action: 'resolve' }); setNotes('') }}
                          startIcon={<i className='ri-check-line' />}>
                          Resolve
                        </Button>
                        <Button size='small' variant='outlined' color='error' disabled={busy}
                          onClick={() => { setNotesFor({ id: v.id, action: 'escalate' }); setNotes('') }}
                          startIcon={<i className='ri-arrow-up-double-line' />}>
                          Escalate
                        </Button>
                      </Box>
                    )}
                  </Box>
                )
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Log Violation Dialog ────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle className='flex items-center justify-between'>
          <span>Log Violation</span>
          <IconButton size='small' onClick={() => setDialogOpen(false)} disabled={saving}><i className='ri-close-line' /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-5 mbs-2'>
            {saveError && <Alert severity='error' onClose={() => setSaveError(null)}>{saveError}</Alert>}
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select size='small' fullWidth label='Category' value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value as ViolationCategory }))}>
                  {CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select size='small' fullWidth label='Severity' value={form.severity}
                  onChange={e => setForm(p => ({ ...p, severity: e.target.value as ViolationSeverity }))}>
                  {SEVERITIES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>
            <TextField size='small' fullWidth required label='Title' placeholder='Short summary'
              value={form.title}
              onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setFormErr({}) }}
              error={formErr.title} helperText={formErr.title ? 'Required' : ''} />
            <TextField size='small' fullWidth multiline rows={3} label='Description'
              placeholder='What happened, when, any evidence…'
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </Box>
        </DialogContent>
        <DialogActions className='gap-2 pbs-4'>
          <Button variant='outlined' color='secondary' onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant='contained' color='error' onClick={handleLog} disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='ri-error-warning-line' />}>
            {saving ? 'Saving…' : 'Log Violation'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Assess Fine Dialog ──────────────────────────────────────────── */}
      <Dialog open={!!fineFor} onClose={() => setFineFor(null)} maxWidth='xs' fullWidth>
        <DialogTitle>Assess Fine</DialogTitle>
        <DialogContent>
          <TextField size='small' fullWidth type='number' label='Amount (GHS)' sx={{ mt: 1 }}
            value={fineAmount} onChange={e => setFineAmount(e.target.value)} />
        </DialogContent>
        <DialogActions className='gap-2 pbs-4'>
          <Button variant='outlined' color='secondary' onClick={() => setFineFor(null)}>Cancel</Button>
          <Button variant='contained' onClick={submitFine} disabled={!Number(fineAmount)}>Assess</Button>
        </DialogActions>
      </Dialog>

      {/* ── Resolve / Escalate Notes Dialog ─────────────────────────────── */}
      <Dialog open={!!notesFor} onClose={() => setNotesFor(null)} maxWidth='xs' fullWidth>
        <DialogTitle>{notesFor?.action === 'escalate' ? 'Escalate Violation' : 'Resolve Violation'}</DialogTitle>
        <DialogContent>
          <TextField size='small' fullWidth multiline rows={3} label='Notes (optional)' sx={{ mt: 1 }}
            value={notes} onChange={e => setNotes(e.target.value)} />
        </DialogContent>
        <DialogActions className='gap-2 pbs-4'>
          <Button variant='outlined' color='secondary' onClick={() => setNotesFor(null)}>Cancel</Button>
          <Button variant='contained' color={notesFor?.action === 'escalate' ? 'error' : 'success'} onClick={submitNotes}>
            {notesFor?.action === 'escalate' ? 'Escalate' : 'Resolve'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
