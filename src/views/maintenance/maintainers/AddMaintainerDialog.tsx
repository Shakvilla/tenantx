'use client'

import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid2'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import OutlinedInput from '@mui/material/OutlinedInput'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// API Imports
import {
  createMaintainer,
  updateMaintainer,
  type Maintainer,
  type CreateMaintainerPayload,
  type UpdateMaintainerPayload
} from '@/lib/api/maintenance'

// ─── Types ───────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  handleClose: () => void
  onSuccess: () => void
  editData?: Maintainer | null
  mode?: 'add' | 'edit'
}

type FormData = {
  name: string
  email: string
  phone: string
  companyName: string
  specializations: string[]
  status: string
  insuranceExpiryDate: string
  taxId: string
}

const BLANK: FormData = {
  name: '',
  email: '',
  phone: '',
  companyName: '',
  specializations: [],
  status: 'ACTIVE',
  insuranceExpiryDate: '',
  taxId: ''
}

const SPECIALIZATION_OPTIONS = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Carpentry',
  'Painting',
  'General Maintenance',
  'Roofing',
  'Flooring',
  'Landscaping',
  'Masonry',
  'Welding',
  'Pest Control'
]

// ─── Component ───────────────────────────────────────────────────────────────

const AddMaintainerDialog = ({ open, handleClose, onSuccess, editData, mode = 'add' }: Props) => {
  const [formData, setFormData] = useState<FormData>(BLANK)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // ── Populate form on open ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    setApiError(null)
    setErrors({})

    if (mode === 'edit' && editData) {
      setFormData({
        name: editData.name ?? '',
        email: editData.email ?? '',
        phone: editData.phone ?? '',
        companyName: editData.companyName ?? '',
        specializations: editData.specializations ?? [],
        status: editData.status ?? 'ACTIVE',
        insuranceExpiryDate: editData.insuranceExpiryDate
          ? editData.insuranceExpiryDate.substring(0, 10) // ISO date → yyyy-MM-dd
          : '',
        taxId: editData.taxId ?? ''
      })
    } else {
      setFormData(BLANK)
    }
  }, [open, editData, mode])

  // ── Helpers ───────────────────────────────────────────────────────────────
  const set = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!formData.name.trim()) e.name = 'Name is required'
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      e.email = 'Enter a valid email address'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setApiError(null)

    try {
      if (mode === 'edit' && editData) {
        const payload: UpdateMaintainerPayload = {
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          companyName: formData.companyName || undefined,
          specializations: formData.specializations.length ? formData.specializations : undefined,
          status: formData.status,
          insuranceExpiryDate: formData.insuranceExpiryDate || undefined,
          taxId: formData.taxId || undefined
        }
        await updateMaintainer(editData.id, payload)
      } else {
        const payload: CreateMaintainerPayload = {
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          companyName: formData.companyName || undefined,
          specializations: formData.specializations.length ? formData.specializations : undefined,
          insuranceExpiryDate: formData.insuranceExpiryDate || undefined,
          taxId: formData.taxId || undefined
        }
        await createMaintainer(payload)
      }

      onSuccess()
      handleClose()
    } catch (err: any) {
      setApiError(err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span className='font-medium'>{mode === 'edit' ? 'Edit Maintainer' : 'Add Maintainer'}</span>
        <IconButton size='small' onClick={handleClose} disabled={submitting}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent className='flex flex-col gap-4 pbs-4'>
        {apiError && <Alert severity='error' onClose={() => setApiError(null)}>{apiError}</Alert>}

        <Grid container spacing={4}>
          {/* Name */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth size='small' label='Name *' placeholder='Full name'
              value={formData.name} onChange={e => set('name', e.target.value)}
              error={Boolean(errors.name)} helperText={errors.name}
            />
          </Grid>

          {/* Email */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth size='small' label='Email' placeholder='email@example.com' type='email'
              value={formData.email} onChange={e => set('email', e.target.value)}
              error={Boolean(errors.email)} helperText={errors.email}
            />
          </Grid>

          {/* Phone */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth size='small' label='Phone' placeholder='+233 XX XXX XXXX'
              value={formData.phone} onChange={e => set('phone', e.target.value)}
            />
          </Grid>

          {/* Company */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth size='small' label='Company Name' placeholder='Company or business name'
              value={formData.companyName} onChange={e => set('companyName', e.target.value)}
            />
          </Grid>

          {/* Specializations (multi-select) */}
          <Grid size={{ xs: 12, sm: mode === 'edit' ? 6 : 12 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='spec-label'>Specializations</InputLabel>
              <Select
                labelId='spec-label'
                multiple
                value={formData.specializations}
                onChange={e => set('specializations', typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                input={<OutlinedInput label='Specializations' />}
                renderValue={selected => (
                  <Box className='flex flex-wrap gap-1'>
                    {(selected as string[]).map(v => <Chip key={v} label={v} size='small' />)}
                  </Box>
                )}
              >
                {SPECIALIZATION_OPTIONS.map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Status — edit mode only */}
          {mode === 'edit' && (
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size='small'>
                <InputLabel id='status-label'>Status</InputLabel>
                <Select
                  labelId='status-label' label='Status'
                  value={formData.status} onChange={e => set('status', e.target.value)}
                >
                  <MenuItem value='ACTIVE'>Active</MenuItem>
                  <MenuItem value='INACTIVE'>Inactive</MenuItem>
                  <MenuItem value='SUSPENDED'>Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Tax ID */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth size='small' label='Tax ID' placeholder='Tax identification number'
              value={formData.taxId} onChange={e => set('taxId', e.target.value)}
            />
          </Grid>

          {/* Insurance Expiry */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth size='small' label='Insurance Expiry Date' type='date'
              InputLabelProps={{ shrink: true }}
              value={formData.insuranceExpiryDate}
              onChange={e => set('insuranceExpiryDate', e.target.value)}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant='contained' color='primary' onClick={handleSubmit} disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <i className={mode === 'edit' ? 'ri-save-line' : 'ri-add-line'} />}
        >
          {submitting ? 'Saving…' : mode === 'edit' ? 'Update Maintainer' : 'Add Maintainer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddMaintainerDialog
