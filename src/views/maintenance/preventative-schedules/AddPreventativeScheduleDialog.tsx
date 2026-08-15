'use client'

import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'

// API Imports
import {
  createPreventativeSchedule,
  updatePreventativeSchedule,
  getMaintenanceCategories,
  type PreventativeSchedule,
  type MaintenanceCategory
} from '@/lib/api/maintenance'
import { getProperties } from '@/lib/api/properties'
import { getUnitsByProperty } from '@/lib/api/units'
import { getStoredTenantId } from '@/lib/api/storage'
import type { Property, Unit } from '@/types/property'

type Props = {
  open: boolean
  handleClose: () => void
  onSuccess: () => void
  mode: 'add' | 'edit'
  editData?: PreventativeSchedule | null
}

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (Every 3 months)' },
  { value: 'biannual', label: 'Biannual (Every 6 months)' },
  { value: 'annual', label: 'Annual (Yearly)' }
]

const PRIORITIES = ['low', 'medium', 'high', 'urgent']

const emptyForm = {
  title: '',
  description: '',
  categoryId: '',
  propertyId: '',
  unitId: '',
  priority: 'medium',
  frequency: 'monthly',
  nextDueDate: '',
  isActive: true
}

const AddPreventativeScheduleDialog = ({ open, handleClose, onSuccess, mode, editData }: Props) => {
  const [formData, setFormData] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Dropdown data
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [categories, setCategories] = useState<MaintenanceCategory[]>([])
  const [loadingProps, setLoadingProps] = useState(false)
  const [loadingUnits, setLoadingUnits] = useState(false)

  // Load properties + categories on open
  useEffect(() => {
    if (!open) return
    const tenantId = getStoredTenantId() ?? ''
    setLoadingProps(true)
    Promise.all([
      getProperties(tenantId, { size: 200 }),
      getMaintenanceCategories(true, tenantId)
    ])
      .then(([propsRes, cats]) => {
        setProperties(Array.isArray(propsRes.data) ? propsRes.data : [])
        setCategories(Array.isArray(cats) ? cats : [])
      })
      .catch(() => {})
      .finally(() => setLoadingProps(false))

    // Pre-fill form in edit mode
    if (mode === 'edit' && editData) {
      setFormData({
        title: editData.title ?? '',
        description: editData.description ?? '',
        categoryId: editData.categoryId ?? '',
        propertyId: editData.propertyId ?? '',
        unitId: editData.unitId ?? '',
        priority: editData.priority ?? 'medium',
        frequency: editData.frequency ?? 'monthly',
        nextDueDate: editData.nextDueDate ?? '',
        isActive: editData.isActive ?? true
      })
    } else {
      setFormData({ ...emptyForm })
    }
    setError(null)
  }, [open, mode, editData])

  // Load units when property changes
  useEffect(() => {
    if (!formData.propertyId) { setUnits([]); return }
    const tenantId = getStoredTenantId() ?? ''
    setLoadingUnits(true)
    getUnitsByProperty(tenantId, formData.propertyId, { size: 200 })
      .then(res => setUnits(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUnits([]))
      .finally(() => setLoadingUnits(false))
  }, [formData.propertyId])

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) =>
    setFormData(prev => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.propertyId || !formData.frequency || !formData.nextDueDate) {
      setError('Title, property, frequency, and first due date are required.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description || undefined,
        categoryId: formData.categoryId || undefined,
        propertyId: formData.propertyId,
        unitId: formData.unitId || undefined,
        priority: formData.priority,
        frequency: formData.frequency,
        nextDueDate: formData.nextDueDate
      }
      if (mode === 'edit' && editData) {
        await updatePreventativeSchedule(editData.id, { ...payload, isActive: formData.isActive })
      } else {
        await createPreventativeSchedule(payload)
      }
      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save schedule')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle className='flex items-center justify-between pbs-5 pbe-3 pli-6'>
        <Typography variant='h6' component='span' className='font-medium'>
          {mode === 'edit' ? 'Edit Schedule' : 'New Preventative Schedule'}
        </Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent className='pbs-4'>
        {error && <Alert severity='error' className='mbe-4' onClose={() => setError(null)}>{error}</Alert>}

        <Grid container spacing={4}>
          {/* Title */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth label='Title *' size='small'
              value={formData.title} onChange={set('title')}
              placeholder='e.g. Monthly fire extinguisher inspection'
            />
          </Grid>

          {/* Description */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth label='Description' size='small' multiline rows={2}
              value={formData.description} onChange={set('description')}
            />
          </Grid>

          {/* Property */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small' disabled={loadingProps}>
              <InputLabel>Property *</InputLabel>
              <Select label='Property *' value={formData.propertyId} onChange={e => setFormData(p => ({ ...p, propertyId: e.target.value, unitId: '' }))}>
                <MenuItem value=''>Select property</MenuItem>
                {properties.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Unit */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small' disabled={!formData.propertyId || loadingUnits}>
              <InputLabel>Unit (optional)</InputLabel>
              <Select label='Unit (optional)' value={formData.unitId} onChange={set('unitId')}>
                <MenuItem value=''>All units / Common area</MenuItem>
                {units.map(u => <MenuItem key={u.id} value={u.id}>{u.unitNo}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Category */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Category (optional)</InputLabel>
              <Select label='Category (optional)' value={formData.categoryId} onChange={set('categoryId')}>
                <MenuItem value=''>None</MenuItem>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Priority */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Priority</InputLabel>
              <Select label='Priority' value={formData.priority} onChange={set('priority')}>
                {PRIORITIES.map(p => <MenuItem key={p} value={p} className='capitalize'>{p}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Frequency */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Frequency *</InputLabel>
              <Select label='Frequency *' value={formData.frequency} onChange={set('frequency')}>
                {FREQUENCIES.map(f => <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Next Due Date */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth label='First Due Date *' size='small' type='date'
              value={formData.nextDueDate} onChange={set('nextDueDate')}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          {/* isActive toggle — edit mode only */}
          {mode === 'edit' && (
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))}
                  />
                }
                label={formData.isActive ? 'Schedule is Active' : 'Schedule is Inactive'}
              />
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant='contained' onClick={handleSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : undefined}
        >
          {mode === 'edit' ? 'Save Changes' : 'Create Schedule'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddPreventativeScheduleDialog
