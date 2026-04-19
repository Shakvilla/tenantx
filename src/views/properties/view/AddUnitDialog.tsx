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
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

// API Imports
import { createUnit, updateUnit } from '@/lib/api/units'
import { getStoredTenantId } from '@/lib/api/storage'
import type { Unit as PropertyUnit } from '@/lib/api/units'
import type { CreateUnitPayload, UpdateUnitPayload } from '@/lib/validation/schemas/unit.schema'

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

const unitAmenities = [
  { id: 'furnished', label: 'Furnished' },
  { id: 'ac', label: 'Air Conditioning' },
  { id: 'balcony', label: 'Balcony' },
  { id: 'laundry', label: 'In-unit Laundry' },
  { id: 'parking', label: 'Parking Space' },
  { id: 'kitchen_cabinets', label: 'Kitchen Cabinets' },
  { id: 'wardrobes', label: 'Built-in Wardrobes' },
  { id: 'wifi', label: 'WiFi / Internet' }
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
    status: 'available' as CreateUnitPayload['status'],
    amenities: {} as Record<string, boolean>,
    images: [] as string[],
    imageUrlInput: '',
    features: {} as Record<string, any>,
    metadata: {} as Record<string, any>
  })

  const [activeTab, setActiveTab] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Populate form when editing
  useEffect(() => {
    if (editUnit && open) {
      const amenitiesMap: Record<string, boolean> = {}
      if (editUnit.amenities) {
        editUnit.amenities.forEach(amenity => {
          amenitiesMap[amenity] = true
        })
      }

      setFormData({
        unitNo: editUnit.unitNo || '',
        type: (editUnit.type as CreateUnitPayload['type']) || '1br',
        rent: editUnit.rent?.toString() || '',
        rentPeriod: (editUnit.metadata?.rentPeriod as any) || 'monthly',
        deposit: editUnit.deposit?.toString() || '',
        floor: editUnit.floor?.toString() || '',
        bedrooms: editUnit.bedrooms?.toString() || '',
        bathrooms: editUnit.bathrooms?.toString() || '',
        sizeSqft: editUnit.sizeSqft?.toString() || '',
        status: editUnit.status || 'available',
        amenities: amenitiesMap,
        images: editUnit.images || [],
        imageUrlInput: '',
        features: editUnit.features || {},
        metadata: editUnit.metadata || {}
      })
      setActiveTab(0)
    } else if (open) {
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
        status: 'available',
        amenities: {},
        images: [],
        imageUrlInput: '',
        features: {},
        metadata: {}
      })
      setActiveTab(0)
    }

    setError(null)
  }, [editUnit, open])

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }))
  }

  const handleAmenityChange = (id: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [id]: e.target.checked
      }
    }))
  }

  const handleAddImage = () => {
    if (formData.imageUrlInput.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, prev.imageUrlInput.trim()],
        imageUrlInput: ''
      }))
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
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

    const tenantId = getStoredTenantId()

    if (!tenantId) {
      setError('No tenant ID found')

      return
    }

    setLoading(true)
    setError(null)

    try {
      const amenitiesArray = Object.entries(formData.amenities)
        .filter(([, checked]) => checked)
        .map(([id]) => id)

      const payload: CreateUnitPayload = {
        unitNo: formData.unitNo,
        type: formData.type,
        rent: parseFloat(formData.rent),
        deposit: formData.deposit ? parseFloat(formData.deposit) : undefined,
        floor: formData.floor ? parseInt(formData.floor) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        sizeSqft: formData.sizeSqft ? parseFloat(formData.sizeSqft) : undefined,
        status: formData.status,
        currency: 'GHS',
        amenities: amenitiesArray.length > 0 ? amenitiesArray : undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        features: Object.keys(formData.features).length > 0 ? formData.features : undefined,
        metadata: {
          ...formData.metadata,
          rentPeriod: formData.rentPeriod
        }
      }

      if (isEdit && editUnit) {
        const response = await updateUnit(tenantId, editUnit.id, payload)

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to update unit')
        }
      } else {
        const response = await createUnit(tenantId, propertyId, payload)

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>{isEdit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
      {error && (
        <Alert severity='error' sx={{ mx: 3, mt: 2 }}>
          {error}
        </Alert>
      )}
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label='unit dialog tabs'>
            <Tab label='General' />
            <Tab label='Features' />
            <Tab label='Media' />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label='Unit Number'
                  value={formData.unitNo}
                  onChange={handleChange('unitNo')}
                  fullWidth
                  required
                  placeholder='e.g., Unit 101'
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label='Type' value={formData.type} onChange={handleChange('type')} fullWidth>
                  {unitTypes.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label='Rent (GHS)'
                  type='number'
                  value={formData.rent}
                  onChange={handleChange('rent')}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>₵</InputAdornment>
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label='Rent Period' value={formData.rentPeriod} onChange={handleChange('rentPeriod')} fullWidth>
                  {rentPeriods.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label='Deposit'
                  type='number'
                  value={formData.deposit}
                  onChange={handleChange('deposit')}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position='start'>₵</InputAdornment>
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label='Bedrooms'
                  type='number'
                  value={formData.bedrooms}
                  onChange={handleChange('bedrooms')}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label='Bathrooms'
                  type='number'
                  value={formData.bathrooms}
                  onChange={handleChange('bathrooms')}
                  fullWidth
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label='Size (sqft)'
                  type='number'
                  value={formData.sizeSqft}
                  onChange={handleChange('sizeSqft')}
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label='Floor' type='number' value={formData.floor} onChange={handleChange('floor')} fullWidth />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select label='Status' value={formData.status} onChange={handleChange('status')} fullWidth>
                  {unitStatuses.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Box>
              <Typography variant='subtitle2' sx={{ mb: 2 }}>
                Unit Amenities
              </Typography>
              <FormGroup sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                {unitAmenities.map(amenity => (
                  <FormControlLabel
                    key={amenity.id}
                    control={
                      <Checkbox
                        checked={formData.amenities[amenity.id] || false}
                        onChange={handleAmenityChange(amenity.id)}
                      />
                    }
                    label={amenity.label}
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant='subtitle2' sx={{ mb: 2 }}>
                Media & Images
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  label='Image URL'
                  value={formData.imageUrlInput}
                  onChange={handleChange('imageUrlInput')}
                  fullWidth
                  placeholder='https://example.com/image.jpg'
                  size='small'
                />
                <Button variant='outlined' onClick={handleAddImage}>
                  Add
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {formData.images.length === 0 ? (
                  <Typography variant='body2' color='text.secondary'>
                    No images added yet.
                  </Typography>
                ) : (
                  formData.images.map((url, index) => (
                    <Chip
                      key={index}
                      label={url.length > 30 ? url.substring(0, 30) + '...' : url}
                      onDelete={() => handleRemoveImage(index)}
                      variant='outlined'
                      size='small'
                    />
                  ))
                )}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant='contained'
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
