'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'

// API Imports
import {
  createExpenseConfig,
  updateExpenseConfig,
  type ExpenseConfig
} from '@/lib/api/expenses'

// Type Imports
import type { ExpenseConfigType } from '@/types/expenses/expenseConfigTypes'

type Props = {
  open: boolean
  handleClose: () => void
  editConfig?: ExpenseConfigType | null
  onSaved: (config: ExpenseConfigType) => void
}

type FormData = {
  item: string
  category: string
  isActive: boolean
}

const initialData: FormData = {
  item: '',
  category: '',
  isActive: true
}

const expenseCategories = [
  { label: 'Administrative', value: 'ADMINISTRATIVE' },
  { label: 'Occupancy',      value: 'OCCUPANCY' },
  { label: 'Maintenance',    value: 'MAINTENANCE' },
  { label: 'Utilities',      value: 'UTILITIES' },
  { label: 'Other',          value: 'OTHER' }
]

const AddExpenseConfigDrawer = ({ open, handleClose, editConfig, onSaved }: Props) => {
  const [formData, setFormData] = useState<FormData>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const isEdit = Boolean(editConfig)

  useEffect(() => {
    if (open) {
      if (editConfig) {
        setFormData({
          item: editConfig.item,
          category: editConfig.category ?? '',
          isActive: editConfig.isActive
        })
      } else {
        setFormData(initialData)
      }
      setErrors({})
      setApiError(null)
    }
  }, [open, editConfig])

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, boolean>> = {}

    if (!formData.item.trim()) newErrors.item = true
    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setApiError(null)

    try {
      let saved: ExpenseConfig

      if (isEdit && editConfig) {
        saved = await updateExpenseConfig(editConfig.id, {
          item: formData.item.trim(),
          category: formData.category || undefined,
          isActive: formData.isActive
        })
      } else {
        saved = await createExpenseConfig({
          item: formData.item.trim(),
          category: formData.category || undefined
        })
      }

      onSaved({
        id: saved.id,
        item: saved.item,
        category: saved.category,
        isActive: saved.isActive,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt
      })
      handleClose()
    } catch (err: any) {
      setApiError(err?.message ?? 'Failed to save expense config')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
    setErrors({})
    setApiError(null)
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 500, md: 600 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>{isEdit ? 'Edit Expense Item' : 'Add Expense Item'}</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='overflow-y-auto p-5' style={{ maxHeight: 'calc(100vh - 80px)' }}>
        {apiError && (
          <Alert severity='error' className='mbe-4'>
            {apiError}
          </Alert>
        )}
        <form onSubmit={onSubmit} className='flex flex-col gap-5'>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Expense Item *'
                placeholder='e.g. Electricity'
                value={formData.item}
                onChange={e => handleChange('item', e.target.value)}
                error={Boolean(errors.item)}
                helperText={errors.item ? 'This field is required.' : ''}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id='category-select'>Category</InputLabel>
                <Select
                  label='Category'
                  value={formData.category}
                  onChange={e => handleChange('category', e.target.value)}
                  labelId='category-select'
                >
                  <MenuItem value=''>
                    <em>None</em>
                  </MenuItem>
                  {expenseCategories.map(cat => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {isEdit && (
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={e => handleChange('isActive', e.target.checked)}
                    />
                  }
                  label='Active'
                />
              </Grid>
            )}
          </Grid>

          <div className='flex items-center gap-4 mts-4'>
            <Button
              variant='contained'
              type='submit'
              color='primary'
              fullWidth
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : undefined}
            >
              {submitting ? 'Saving…' : 'Submit'}
            </Button>
            <Button variant='outlined' color='error' type='reset' onClick={handleReset} fullWidth disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddExpenseConfigDrawer
