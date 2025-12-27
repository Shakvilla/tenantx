'use client'

import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import InputAdornment from '@mui/material/InputAdornment'

// API Imports
import { createUnit, updateUnit, type CreateUnitPayload, type UpdateUnitPayload, type PropertyUnit } from '@/lib/api/properties'

const unitTypes = [
  { value: 'studio', label: 'Studio' },
  { value: '1br', label: '1 Bedroom' },
  { value: '2br', label: '2 Bedrooms' },
  { value: '3br', label: '3 Bedrooms' },
  { value: '4br+', label: '4+ Bedrooms' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' }
]

const unitStatuses = [
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'reserved', label: 'Reserved' }
]

const rentPeriods = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'biannual', label: 'Biannual (6 months)' },
  { value: 'annual', label: 'Annual (12 months)' }
]

interface Props {
  open: boolean
  onClose: () => void
  propertyId: string
  editUnit?: PropertyUnit | null
  onSuccess: () => void
}

const AddUnitDialog = ({ open, onClose, propertyId, editUnit, onSuccess }: Props) => {
  const isEdit = Boolean(editUnit)

  // Form state
  const [formData, setFormData] = useState({
    unitNo: '',
    type: '1br' as CreateUnitPayload['type'],
    rent: '',
    rentPeriod: 'monthly' as 'monthly' | 'biannual' | 'annual',
    deposit: '',
    floor: '',
    bedrooms: '',
    bathrooms: '',
    sizeSqft: '',
    status: 'available' as CreateUnitPayload['status']
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Populate form when editing
  useEffect(() => {
    if (editUnit) {
      setFormData({
        unitNo: editUnit.unit_no || '',
        type: (editUnit.type as CreateUnitPayload['type']) || '1br',
        rent: editUnit.rent?.toString() || '',
        rentPeriod: 'monthly', // Default for existing units
        deposit: editUnit.deposit?.toString() || '',
        floor: '',
        bedrooms: editUnit.bedrooms?.toString() || '',
        bathrooms: editUnit.bathrooms?.toString() || '',
        sizeSqft: editUnit.size_sqft?.toString() || '',
        status: editUnit.status || 'available'
      })
    } else {
      // Reset form for new unit
      setFormData({
        unitNo: '',
        type: '1br',
        rent: '',
        rentPeriod: 'monthly',
        deposit: '',
        floor: '',
        bedrooms: '',
        bathrooms: '',
        sizeSqft: '',
        status: 'available'
      })
    }

    setError(null)
  }, [editUnit, open])

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.unitNo.trim()) {
      setError('Unit number is required')
      
return
    }

    if (!formData.rent || parseFloat(formData.rent) <= 0) {
      setError('Valid rent amount is required')
      
return
    }

    setLoading(true)
    setError(null)

    try {
      if (isEdit && editUnit) {
        // Update existing unit
        const payload: UpdateUnitPayload = {
          unitNo: formData.unitNo,
          type: formData.type,
          rent: parseFloat(formData.rent),
          deposit: formData.deposit ? parseFloat(formData.deposit) : undefined,
          floor: formData.floor ? parseInt(formData.floor) : undefined,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
          sizeSqft: formData.sizeSqft ? parseFloat(formData.sizeSqft) : undefined,
          status: formData.status
        }

        const response = await updateUnit(editUnit.id, payload)

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to update unit')
        }
      } else {
        // Create new unit
        const payload: CreateUnitPayload = {
          unitNo: formData.unitNo,
          type: formData.type,
          rent: parseFloat(formData.rent),
          deposit: formData.deposit ? parseFloat(formData.deposit) : undefined,
          floor: formData.floor ? parseInt(formData.floor) : undefined,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
          sizeSqft: formData.sizeSqft ? parseFloat(formData.sizeSqft) : undefined,
          status: formData.status
        }

        const response = await createUnit(propertyId, payload)

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to create unit')
        }
      }

      onSuccess()
      onClose()
    } catch (err) {
      console.error('Error saving unit:', err)
      setError(err instanceof Error ? err.message : 'Failed to save unit')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Unit Number"
              value={formData.unitNo}
              onChange={handleChange('unitNo')}
              fullWidth
              required
              placeholder="e.g., Unit 101"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Type"
              value={formData.type}
              onChange={handleChange('type')}
              fullWidth
            >
              {unitTypes.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Rent (GHS)"
              type="number"
              value={formData.rent}
              onChange={handleChange('rent')}
              fullWidth
              required
              InputProps={{
                startAdornment: <InputAdornment position="start">₵</InputAdornment>
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              select
              label="Rent Period"
              value={formData.rentPeriod}
              onChange={handleChange('rentPeriod')}
              fullWidth
            >
              {rentPeriods.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Deposit"
              type="number"
              value={formData.deposit}
              onChange={handleChange('deposit')}
              fullWidth
              InputProps={{
                startAdornment: <InputAdornment position="start">₵</InputAdornment>
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Bedrooms"
              type="number"
              value={formData.bedrooms}
              onChange={handleChange('bedrooms')}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Bathrooms"
              type="number"
              value={formData.bathrooms}
              onChange={handleChange('bathrooms')}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Size (sqft)"
              type="number"
              value={formData.sizeSqft}
              onChange={handleChange('sizeSqft')}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Floor"
              type="number"
              value={formData.floor}
              onChange={handleChange('floor')}
              fullWidth
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              select
              label="Status"
              value={formData.status}
              onChange={handleChange('status')}
              fullWidth
            >
              {unitStatuses.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {isEdit ? 'Update Unit' : 'Add Unit'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddUnitDialog
