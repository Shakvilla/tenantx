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
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Box from '@mui/material/Box'

// API Imports
import {
  createMaintenanceCategory,
  updateMaintenanceCategory,
  type MaintenanceCategory
} from '@/lib/api/maintenance'

// Common Remix icon names useful for maintenance categories
const ICON_SUGGESTIONS = [
  'ri-tools-line',
  'ri-hammer-line',
  'ri-flashlight-line',
  'ri-drop-line',
  'ri-fire-line',
  'ri-building-line',
  'ri-door-line',
  'ri-window-line',
  'ri-paint-brush-line',
  'ri-leaf-line',
  'ri-recycle-line',
  'ri-shield-line',
  'ri-bug-line',
  'ri-computer-line',
  'ri-wifi-line',
  'ri-lock-line',
  'ri-car-line',
  'ri-road-map-line',
]

type Props = {
  open: boolean
  handleClose: () => void
  onSuccess: () => void
  mode: 'add' | 'edit'
  editData?: MaintenanceCategory | null
}

const emptyForm = { name: '', description: '', icon: '', isActive: true }

const AddMaintenanceCategoryDialog = ({ open, handleClose, onSuccess, mode, editData }: Props) => {
  const [formData, setFormData] = useState({ ...emptyForm })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    if (mode === 'edit' && editData) {
      setFormData({
        name: editData.name ?? '',
        description: editData.description ?? '',
        icon: editData.icon ?? '',
        isActive: editData.isActive ?? true
      })
    } else {
      setFormData({ ...emptyForm })
    }
  }, [open, mode, editData])

  const handleSubmit = async () => {
    if (!formData.name.trim()) { setError('Category name is required.'); return }
    setSubmitting(true)
    setError(null)
    try {
      if (mode === 'edit' && editData) {
        await updateMaintenanceCategory(editData.id, {
          name: formData.name.trim(),
          description: formData.description || undefined,
          icon: formData.icon || undefined,
          isActive: formData.isActive
        })
      } else {
        await createMaintenanceCategory({
          name: formData.name.trim(),
          description: formData.description || undefined,
          icon: formData.icon || undefined
        })
      }
      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle className='flex items-center justify-between pbs-5 pbe-3 pli-6'>
        <Typography variant='h6' component='span' className='font-medium'>
          {mode === 'edit' ? 'Edit Category' : 'New Maintenance Category'}
        </Typography>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent className='pbs-4'>
        {error && <Alert severity='error' className='mbe-4' onClose={() => setError(null)}>{error}</Alert>}

        <Grid container spacing={4}>
          {/* Name */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth label='Name *' size='small'
              value={formData.name}
              onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
              placeholder='e.g. Plumbing, Electrical, HVAC'
            />
          </Grid>

          {/* Description */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth label='Description' size='small' multiline rows={2}
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder='Brief description of what this category covers'
            />
          </Grid>

          {/* Icon picker */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth label='Icon (Remix icon class)' size='small'
              value={formData.icon}
              onChange={e => setFormData(p => ({ ...p, icon: e.target.value }))}
              placeholder='e.g. ri-tools-line'
              slotProps={{
                input: {
                  startAdornment: formData.icon
                    ? <i className={`${formData.icon} text-lg mie-2`} />
                    : <i className='ri-image-line text-lg mie-2 opacity-40' />
                }
              }}
            />
            {/* Quick icon suggestions */}
            <Box className='flex flex-wrap gap-2 mbs-3'>
              {ICON_SUGGESTIONS.map(icon => (
                <IconButton
                  key={icon}
                  size='small'
                  onClick={() => setFormData(p => ({ ...p, icon }))}
                  sx={{
                    border: '1px solid',
                    borderColor: formData.icon === icon ? 'primary.main' : 'divider',
                    borderRadius: 1,
                    color: formData.icon === icon ? 'primary.main' : 'text.secondary',
                    '&:hover': { borderColor: 'primary.main', color: 'primary.main' }
                  }}
                  title={icon}
                >
                  <i className={`${icon} text-base`} />
                </IconButton>
              ))}
            </Box>
            <Typography variant='caption' color='text.secondary'>
              Click an icon above or type any Remix icon class name
            </Typography>
          </Grid>

          {/* Active toggle — edit mode only */}
          {mode === 'edit' && (
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={e => setFormData(p => ({ ...p, isActive: e.target.checked }))}
                  />
                }
                label={formData.isActive ? 'Active' : 'Inactive'}
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
          {mode === 'edit' ? 'Save Changes' : 'Create Category'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddMaintenanceCategoryDialog
