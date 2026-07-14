'use client'

import { useState, useEffect } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { noticesApi } from '@/lib/api/notices'
import type { NoticeSummary, NoticeType, NoticeStatus, NoticeChannel, IssueNoticeRequest } from '@/types/notice'

// Landlords manually issue these; the automated types (RENT_DUE, LEASE_EXPIRY, …) still render if present.
const ISSUABLE_TYPES: { value: NoticeType; label: string }[] = [
  { value: 'TERMINATION', label: 'Termination' },
  { value: 'EVICTION',    label: 'Eviction' },
  { value: 'WARNING',     label: 'Warning' },
  { value: 'GENERAL',     label: 'General' },
]

export const NOTICE_TYPE_LABELS: Record<NoticeType, string> = {
  RENT_DUE:     'Rent Due',
  LATE_PAYMENT: 'Late Payment',
  LEASE_EXPIRY: 'Lease Expiry',
  RENT_REVIEW:  'Rent Review',
  INSPECTION:   'Inspection',
  TERMINATION:  'Termination',
  EVICTION:     'Eviction',
  WARNING:      'Warning',
  GENERAL:      'General',
}

const TYPE_COLORS: Record<NoticeType, 'default' | 'primary' | 'warning' | 'error' | 'info' | 'success'> = {
  RENT_DUE:     'info',
  LATE_PAYMENT: 'warning',
  LEASE_EXPIRY: 'primary',
  RENT_REVIEW:  'primary',
  INSPECTION:   'info',
  TERMINATION:  'error',
  EVICTION:     'error',
  WARNING:      'warning',
  GENERAL:      'default',
}

const STATUS_COLORS: Record<NoticeStatus, 'default' | 'info' | 'success'> = {
  SENT:         'info',
  DELIVERED:    'info',
  ACKNOWLEDGED: 'success',
}

const CHANNELS: { value: NoticeChannel; label: string }[] = [
  { value: 'IN_APP', label: 'In-app' },
  { value: 'SMS',    label: 'SMS' },
]

type Props = { occupantId: string }

const BLANK_FORM: Omit<IssueNoticeRequest, 'occupantId'> = {
  type: 'GENERAL',
  title: '',
  body: '',
  deliveryMethods: ['IN_APP'],
}

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function NoticesTab({ occupantId }: Props) {
  const [notices, setNotices] = useState<NoticeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm]             = useState({ ...BLANK_FORM })
  const [formErrors, setFormErrors] = useState<{ title?: boolean; body?: boolean }>({})
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState<string | null>(null)

  useEffect(() => { load() }, [occupantId]) // eslint-disable-line

  function load() {
    setLoading(true)
    setError(null)
    noticesApi.listByOccupant(occupantId)
      .then(setNotices)
      .catch(err => setError(err?.message ?? 'Failed to load notices'))
      .finally(() => setLoading(false))
  }

  function openIssue() {
    setForm({ ...BLANK_FORM })
    setFormErrors({})
    setSaveError(null)
    setDialogOpen(true)
  }

  function toggleChannel(ch: NoticeChannel) {
    setForm(prev => {
      const has = prev.deliveryMethods.includes(ch)
      return { ...prev, deliveryMethods: has ? prev.deliveryMethods.filter(c => c !== ch) : [...prev.deliveryMethods, ch] }
    })
  }

  async function handleIssue() {
    const errs = { title: !form.title.trim(), body: !form.body.trim() }
    if (errs.title || errs.body) { setFormErrors(errs); return }

    setSaving(true)
    setSaveError(null)
    try {
      const created = await noticesApi.issue({
        ...form,
        occupantId,
        deliveryMethods: form.deliveryMethods.length ? form.deliveryMethods : ['IN_APP'],
      })
      setNotices(prev => [created, ...prev])
      setDialogOpen(false)
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? err?.message ?? 'Failed to issue notice')
    } finally {
      setSaving(false)
    }
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
          title='Notices'
          subheader='Formal notice history for this occupant'
          action={
            <Button variant='contained' size='small' startIcon={<i className='ri-mail-send-line' />} onClick={openIssue}>
              Issue Notice
            </Button>
          }
        />
        <CardContent>
          {error && <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

          {notices.length === 0 ? (
            <Box className='flex flex-col items-center justify-center gap-3 py-12' sx={{ color: 'text.disabled' }}>
              <Box sx={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--mui-palette-primary-lightOpacity)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className='ri-mail-line' style={{ fontSize: 28, color: 'var(--mui-palette-primary-main)' }} />
              </Box>
              <Box className='text-center'>
                <Typography variant='body1' fontWeight={500} color='text.primary'>No notices yet</Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                  Issue a formal notice to this occupant, or automated notices will appear here.
                </Typography>
              </Box>
              <Button variant='outlined' size='small' onClick={openIssue} startIcon={<i className='ri-add-line' />}>
                Issue Notice
              </Button>
            </Box>
          ) : (
            <Box className='flex flex-col gap-4'>
              {notices.map((n, idx) => (
                <Box key={n.id}>
                  {idx > 0 && <Divider sx={{ mb: 4 }} />}
                  <Box className='flex items-start justify-between gap-3'>
                    <Box className='flex flex-col gap-1'>
                      <Box className='flex items-center gap-2'>
                        <Chip label={NOTICE_TYPE_LABELS[n.type] ?? n.type} size='small' variant='tonal' color={TYPE_COLORS[n.type] ?? 'default'} />
                        <Typography fontWeight={600}>{n.title}</Typography>
                      </Box>
                      <Typography variant='caption' color='text.secondary'>
                        {fmtDate(n.issuedAt)} · {n.deliveryMethod}
                        {n.issuedByName ? ` · by ${n.issuedByName}` : ''}
                        {n.sourceType && n.sourceType !== 'MANUAL' ? ` · auto (${n.sourceType.toLowerCase()})` : ''}
                      </Typography>
                    </Box>
                    <Box className='flex flex-col items-end gap-1'>
                      <Chip label={n.status === 'ACKNOWLEDGED' ? 'Acknowledged' : n.status === 'DELIVERED' ? 'Delivered' : 'Sent'}
                        size='small' variant='tonal' color={STATUS_COLORS[n.status] ?? 'default'} />
                      {n.acknowledgedAt && (
                        <Typography variant='caption' color='text.secondary'>{fmtDate(n.acknowledgedAt)}</Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Issue Notice Dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle className='flex items-center justify-between'>
          <span>Issue Notice</span>
          <IconButton size='small' onClick={() => setDialogOpen(false)} disabled={saving}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box className='flex flex-col gap-5 mbs-2'>
            {saveError && <Alert severity='error' onClose={() => setSaveError(null)}>{saveError}</Alert>}

            <TextField
              select size='small' fullWidth label='Notice Type'
              value={form.type}
              onChange={e => setForm(prev => ({ ...prev, type: e.target.value as NoticeType }))}
            >
              {ISSUABLE_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>

            <TextField
              size='small' fullWidth required label='Title'
              placeholder='Short summary, e.g. "Notice to vacate"'
              value={form.title}
              onChange={e => { setForm(prev => ({ ...prev, title: e.target.value })); setFormErrors(prev => ({ ...prev, title: false })) }}
              error={formErrors.title}
              helperText={formErrors.title ? 'Required' : ''}
            />

            <TextField
              size='small' fullWidth required multiline rows={4} label='Message'
              placeholder='The full text of the notice…'
              value={form.body}
              onChange={e => { setForm(prev => ({ ...prev, body: e.target.value })); setFormErrors(prev => ({ ...prev, body: false })) }}
              error={formErrors.body}
              helperText={formErrors.body ? 'Required' : ''}
            />

            <Box>
              <Typography variant='caption' fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
                Delivery
              </Typography>
              <Grid container>
                {CHANNELS.map(c => (
                  <Grid key={c.value} size={{ xs: 6 }}>
                    <FormControlLabel
                      control={<Checkbox size='small' checked={form.deliveryMethods.includes(c.value)} onChange={() => toggleChannel(c.value)} />}
                      label={c.label}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions className='gap-2 pbs-4'>
          <Button variant='outlined' color='secondary' onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
          <Button
            variant='contained' onClick={handleIssue} disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='ri-mail-send-line' />}
          >
            {saving ? 'Sending…' : 'Send Notice'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
