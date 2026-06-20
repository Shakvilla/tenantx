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

import { guarantorsApi } from '@/lib/api/guarantors'
import type { GuarantorResponse, CreateGuarantorRequest, GuarantorRelationship } from '@/types/guarantor'

const RELATIONSHIPS: { value: GuarantorRelationship; label: string }[] = [
  { value: 'PARENT',    label: 'Parent' },
  { value: 'SIBLING',   label: 'Sibling' },
  { value: 'SPOUSE',    label: 'Spouse' },
  { value: 'FRIEND',    label: 'Friend' },
  { value: 'COLLEAGUE', label: 'Colleague' },
  { value: 'OTHER',     label: 'Other' },
]

const BLANK_FORM: Omit<CreateGuarantorRequest, 'occupantId'> = {
  firstName:    '',
  lastName:     '',
  phone:        '',
  email:        '',
  relationship: 'OTHER',
  employerName: '',
  jobTitle:     '',
  workAddress:  '',
  notes:        '',
}

type Props = { occupantId: string }

// ── small helper ──────────────────────────────────────────────────────────────
function SectionLabel({ icon, label }: { icon: string; label: string }) {
  return (
    <Box className='flex items-center gap-2 mbe-2'>
      <i className={`${icon} text-base`} style={{ color: 'var(--mui-palette-primary-main)' }} />
      <Typography variant='caption' fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>
        {label}
      </Typography>
    </Box>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <Box>
      <Typography variant='caption' color='text.secondary'>{label}</Typography>
      <Typography variant='body2' fontWeight={500}>{value}</Typography>
    </Box>
  )
}

// ── main component ────────────────────────────────────────────────────────────
export default function GuarantorTab({ occupantId }: Props) {
  const [guarantors, setGuarantors] = useState<GuarantorResponse[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm]             = useState({ ...BLANK_FORM })
  const [formErrors, setFormErrors] = useState<{ firstName?: boolean; lastName?: boolean; phone?: boolean }>({})
  const [saving, setSaving]         = useState(false)
  const [saveError, setSaveError]   = useState<string | null>(null)

  const [deleteId, setDeleteId]     = useState<string | null>(null)
  const [deleting, setDeleting]     = useState(false)

  useEffect(() => { load() }, [occupantId]) // eslint-disable-line

  function load() {
    setLoading(true)
    setError(null)
    guarantorsApi.getByOccupant(occupantId)
      .then(setGuarantors)
      .catch(err => setError(err?.message ?? 'Failed to load guarantors'))
      .finally(() => setLoading(false))
  }

  function openAdd() {
    setForm({ ...BLANK_FORM })
    setFormErrors({})
    setSaveError(null)
    setDialogOpen(true)
  }

  function closeDialog() {
    if (!saving) setDialogOpen(false)
  }

  function field(key: keyof typeof BLANK_FORM, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
    if (key === 'firstName' || key === 'lastName' || key === 'phone') {
      setFormErrors(prev => ({ ...prev, [key]: false }))
    }
  }

  async function handleSave() {
    const errs = {
      firstName: !form.firstName.trim(),
      lastName:  !form.lastName.trim(),
      phone:     !form.phone?.trim(),
    }
    if (errs.firstName || errs.lastName || errs.phone) { setFormErrors(errs); return }

    setSaving(true)
    setSaveError(null)
    try {
      const created = await guarantorsApi.create({ ...form, occupantId })
      setGuarantors(prev => [created, ...prev])
      setDialogOpen(false)
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? err?.message ?? 'Failed to save guarantor')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(true)
    try {
      await guarantorsApi.delete(id)
      setGuarantors(prev => prev.filter(g => g.id !== id))
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete guarantor')
    } finally {
      setDeleting(false)
      setDeleteId(null)
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
          title='Guarantors / Sureties'
          action={
            <Button
              variant='contained'
              size='small'
              startIcon={<i className='ri-user-add-line' />}
              onClick={openAdd}
            >
              Add Guarantor
            </Button>
          }
        />
        <CardContent>
          {error && (
            <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>
          )}

          {guarantors.length === 0 ? (
            <Box className='flex flex-col items-center justify-center gap-3 py-12' sx={{ color: 'text.disabled' }}>
              <Box
                sx={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'var(--mui-palette-primary-lightOpacity)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <i className='ri-shield-user-line' style={{ fontSize: 28, color: 'var(--mui-palette-primary-main)' }} />
              </Box>
              <Box className='text-center'>
                <Typography variant='body1' fontWeight={500} color='text.primary'>No guarantors yet</Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                  Add a guarantor or surety for this occupant.
                </Typography>
              </Box>
              <Button variant='outlined' size='small' onClick={openAdd} startIcon={<i className='ri-add-line' />}>
                Add Guarantor
              </Button>
            </Box>
          ) : (
            <Box className='flex flex-col gap-4'>
              {guarantors.map((g, idx) => (
                <Box key={g.id}>
                  {idx > 0 && <Divider sx={{ mb: 4 }} />}

                  {/* Header row */}
                  <Box className='flex items-start justify-between gap-3 mbe-4'>
                    <Box className='flex items-center gap-3'>
                      <Box sx={{
                        width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                        background: 'var(--mui-palette-primary-lightOpacity)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <i className='ri-shield-user-line' style={{ fontSize: 20, color: 'var(--mui-palette-primary-main)' }} />
                      </Box>
                      <Box>
                        <Typography fontWeight={600}>{g.fullName}</Typography>
                        <Chip
                          label={RELATIONSHIPS.find(r => r.value === g.relationship)?.label ?? g.relationship}
                          size='small'
                          variant='tonal'
                          color='primary'
                          sx={{ mt: 0.5, fontSize: 11 }}
                        />
                      </Box>
                    </Box>
                    <IconButton size='small' color='error' onClick={() => setDeleteId(g.id)} title='Remove'>
                      <i className='ri-delete-bin-line text-base' />
                    </IconButton>
                  </Box>

                  {/* Detail grid */}
                  <Grid container spacing={4} sx={{ pl: '56px' }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <InfoRow label='Phone' value={g.phone} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <InfoRow label='Email' value={g.email} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <InfoRow label='Employer' value={g.employerName} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <InfoRow label='Job Title' value={g.jobTitle} />
                    </Grid>
                    {g.workAddress && (
                      <Grid size={{ xs: 12 }}>
                        <InfoRow label='Work Address' value={g.workAddress} />
                      </Grid>
                    )}
                    {g.notes && (
                      <Grid size={{ xs: 12 }}>
                        <InfoRow label='Notes' value={g.notes} />
                      </Grid>
                    )}
                  </Grid>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Add Guarantor Dialog ───────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth='sm' fullWidth>
        <DialogTitle className='flex items-center justify-between'>
          <span>Add Guarantor</span>
          <IconButton size='small' onClick={closeDialog} disabled={saving}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box className='flex flex-col gap-5 mbs-2'>
            {saveError && (
              <Alert severity='error' onClose={() => setSaveError(null)}>{saveError}</Alert>
            )}

            {/* Personal */}
            <Box>
              <SectionLabel icon='ri-user-3-line' label='Personal Information' />
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    required
                    label='First Name'
                    placeholder='First name'
                    value={form.firstName}
                    onChange={e => field('firstName', e.target.value)}
                    error={formErrors.firstName}
                    helperText={formErrors.firstName ? 'Required' : ''}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    required
                    label='Last Name'
                    placeholder='Last name'
                    value={form.lastName}
                    onChange={e => field('lastName', e.target.value)}
                    error={formErrors.lastName}
                    helperText={formErrors.lastName ? 'Required' : ''}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    select
                    size='small'
                    fullWidth
                    label='Relationship to Tenant (Optional)'
                    value={form.relationship}
                    onChange={e => field('relationship', e.target.value)}
                  >
                    {RELATIONSHIPS.map(r => (
                      <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Contact */}
            <Box>
              <SectionLabel icon='ri-contacts-line' label='Contact Details' />
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    required
                    label='Phone'
                    placeholder='+233 XX XXX XXXX'
                    value={form.phone}
                    onChange={e => field('phone', e.target.value)}
                    error={formErrors.phone}
                    helperText={formErrors.phone ? 'Required' : ''}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Email (Optional)'
                    type='email'
                    placeholder='email@example.com'
                    value={form.email}
                    onChange={e => field('email', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Employment */}
            <Box>
              <SectionLabel icon='ri-briefcase-line' label='Employment' />
              <Grid container spacing={4}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Employer (Optional)'
                    placeholder='Company or organisation'
                    value={form.employerName}
                    onChange={e => field('employerName', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Job Title (Optional)'
                    placeholder='Role or position'
                    value={form.jobTitle}
                    onChange={e => field('jobTitle', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Work Address (Optional)'
                    placeholder='Office or work location'
                    value={form.workAddress}
                    onChange={e => field('workAddress', e.target.value)}
                  />
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Notes */}
            <Box>
              <SectionLabel icon='ri-file-text-line' label='Notes (Optional)' />
              <TextField
                size='small'
                fullWidth
                multiline
                rows={3}
                placeholder='Any additional notes about this guarantor…'
                value={form.notes}
                onChange={e => field('notes', e.target.value)}
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions className='gap-2 pbs-4'>
          <Button variant='outlined' color='secondary' onClick={closeDialog} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color='inherit' /> : <i className='ri-user-add-line' />}
          >
            {saving ? 'Saving…' : 'Add Guarantor'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm ────────────────────────────────────────────── */}
      <Dialog open={!!deleteId} onClose={() => !deleting && setDeleteId(null)} maxWidth='xs' fullWidth>
        <DialogTitle className='flex items-center gap-2'>
          <i className='ri-error-warning-line' style={{ color: 'var(--mui-palette-error-main)' }} />
          Remove Guarantor
        </DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this guarantor? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions className='gap-2 pbs-4'>
          <Button variant='outlined' color='secondary' onClick={() => setDeleteId(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={() => deleteId && handleDelete(deleteId)}
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} color='inherit' /> : <i className='ri-delete-bin-line' />}
          >
            {deleting ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
