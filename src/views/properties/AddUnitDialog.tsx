'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Chip from '@mui/material/Chip'
import InputAdornment from '@mui/material/InputAdornment'
import Divider from '@mui/material/Divider'

// API Imports
import { createUnit, updateUnit } from '@/lib/api/units'
import { getStoredTenantId } from '@/lib/api/storage'
import type { CreateUnitPayload, UpdateUnitPayload } from '@/lib/validation/schemas/unit.schema'

type Property = {
  id: number | string
  name: string
}

type UnitEditData = {
  id?: string
  unitNumber?: string
  propertyId?: string
  propertyName?: string
  status?: 'occupied' | 'vacant' | 'maintenance'
  rent?: string
  bedrooms?: number | string
  bathrooms?: number | string
  size?: string
  tenantName?: string | null
}

type Props = {
  open: boolean
  handleClose: () => void
  properties: Property[]
  unitsData?: any[]
  setData: (data: any[]) => void
  editData?: UnitEditData | null
  mode?: 'add' | 'edit'
}

type FormDataType = {
  unitNumber: string
  propertyId: string
  status: 'occupied' | 'available' | 'maintenance' | 'reserved' | ''
  rent: string
  rentPeriod: 'monthly' | 'biannual' | 'annual' | ''
  bedrooms: string
  bathrooms: string
  size: string
  floor: string
  type: 'studio' | '1br' | '2br' | '3br' | '4br+' | 'commercial' | 'office' | 'retail'
  amenities: Record<string, boolean>
  images: string[]
  imageUrlInput: string
  features: Record<string, any>
  metadata: Record<string, any>
}

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

const initialData: FormDataType = {
  unitNumber: '',
  propertyId: '',
  status: '',
  rent: '',
  rentPeriod: 'monthly',
  bedrooms: '',
  bathrooms: '',
  size: '',
  floor: '',
  type: '1br',
  amenities: {},
  images: [],
  imageUrlInput: '',
  features: {},
  metadata: {}
}

const AddUnitDialog = ({ open, handleClose, properties, editData, mode = 'add' }: Props) => {
  // States
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Get initial form data based on mode
  const getInitialFormData = (): FormDataType => {
    if (mode === 'edit' && editData) {
      // Parse rent from formatted string like "₵1,200" to number string
      const rentValue = editData.rent?.replace(/[₵,]/g, '') || ''

      // Parse size from formatted string like "850 sqft" to just number
      const sizeValue = editData.size?.replace(/[^0-9.]/g, '') || ''

      // Map 'vacant' status to 'available' for API
      const statusValue = editData.status === 'vacant' ? 'available' : (editData.status || '')

      return {
        unitNumber: editData.unitNumber || '',
        propertyId: editData.propertyId?.toString() || '',
        status: statusValue as FormDataType['status'],
        rent: rentValue,
        rentPeriod: (editData as any).metadata?.rentPeriod || 'monthly',
        bedrooms: editData.bedrooms?.toString() || '',
        bathrooms: editData.bathrooms?.toString() || '',
        size: sizeValue,
        floor: (editData as any).floor?.toString() || '',
        type: (editData as any).type || '1br',
        amenities: {}, // We'd need the full unit object for these
        images: (editData as any).images || [],
        imageUrlInput: '',
        features: (editData as any).features || {},
        metadata: (editData as any).metadata || {}
      }
    }

    return initialData
  }

  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  // Reset form when dialog opens/closes or editData changes
  useEffect(() => {
    if (open) {
      const newFormData = getInitialFormData()

      setFormData(newFormData)
      setErrors({})
      setApiError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData, mode])

  const handleInputChange = (field: keyof FormDataType | string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field as keyof FormDataType]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }
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

  const validateForm = (): boolean => {
    // We only validate the subset of fields present in our form against the API schema requirements
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}

    // Required fields check based on CreateUnitSchema
    if (!formData.unitNumber.trim()) newErrors.unitNumber = true
    if (!formData.propertyId) newErrors.propertyId = true
    if (!formData.status) newErrors.status = true

    // Rent must be positive
    const rentVal = parseFloat(formData.rent)

    if (!formData.rent.trim() || isNaN(rentVal) || rentVal < 0) {
      newErrors.rent = true
    }

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    const tenantId = getStoredTenantId()

    if (!tenantId) {
      setApiError('No tenant ID found')

      return
    }

    setLoading(true)
    setApiError(null)

    try {
      const amenitiesArray = Object.entries(formData.amenities)
        .filter(([, checked]) => checked)
        .map(([id]) => id)

      const payload: CreateUnitPayload = {
        unitNo: formData.unitNumber,
        type: formData.type,
        rent: parseFloat(formData.rent),
        deposit: undefined, // Add if needed in this form
        floor: formData.floor ? parseInt(formData.floor) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        sizeSqft: formData.size ? parseFloat(formData.size) : undefined,
        status: formData.status as CreateUnitPayload['status'],
        currency: 'GHS',
        amenities: amenitiesArray.length > 0 ? amenitiesArray : undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        features: Object.keys(formData.features).length > 0 ? formData.features : undefined,
        metadata: {
          ...formData.metadata,
          rentPeriod: formData.rentPeriod
        }
      }

      if (mode === 'add') {
        const response = await createUnit(tenantId, formData.propertyId, payload)

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to create unit')
        }
      } else if (mode === 'edit' && editData?.id) {
        const response = await updateUnit(tenantId, editData.id, payload)

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to update unit')
        }
      }

      handleClose()
      setFormData(initialData)
      setErrors({})
    } catch (err) {
      console.error('Error saving unit:', err)
      setApiError(err instanceof Error ? err.message : 'Failed to save unit')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
    setErrors({})
    setApiError(null)
  }

  return (
    <Dialog open={open} onClose={handleReset} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>{mode === 'edit' ? 'Edit Unit' : 'Add Unit'}</span>
        <IconButton size='small' onClick={handleReset} disabled={loading}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
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
            <div className='flex flex-col gap-4'>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Unit Number'
                    placeholder='e.g., Unit 101'
                    value={formData.unitNumber}
                    onChange={e => handleInputChange('unitNumber', e.target.value)}
                    error={Boolean(errors.unitNumber)}
                    helperText={errors.unitNumber ? 'This field is required.' : ''}
                    disabled={loading}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={Boolean(errors.propertyId)} size='small'>
                    <InputLabel id='property-label'>Property</InputLabel>
                    <Select
                      size='small'
                      labelId='property-label'
                      label='Property'
                      value={formData.propertyId}
                      onChange={e => handleInputChange('propertyId', e.target.value)}
                      disabled={loading || mode === 'edit'}
                    >
                      <MenuItem value=''>Select Property</MenuItem>
                      {properties.map(property => (
                        <MenuItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.propertyId && (
                      <Typography variant='caption' color='error' className='mts-1'>
                        This field is required.
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel id='type-label'>Type</InputLabel>
                    <Select
                      size='small'
                      labelId='type-label'
                      label='Type'
                      value={formData.type}
                      onChange={e => handleInputChange('type', e.target.value)}
                      disabled={loading}
                    >
                      <MenuItem value='studio'>Studio</MenuItem>
                      <MenuItem value='1br'>1 Bedroom</MenuItem>
                      <MenuItem value='2br'>2 Bedrooms</MenuItem>
                      <MenuItem value='3br'>3 Bedrooms</MenuItem>
                      <MenuItem value='4br+'>4+ Bedrooms</MenuItem>
                      <MenuItem value='commercial'>Commercial</MenuItem>
                      <MenuItem value='office'>Office</MenuItem>
                      <MenuItem value='retail'>Retail</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={Boolean(errors.status)} size='small'>
                    <InputLabel id='status-label'>Status</InputLabel>
                    <Select
                      size='small'
                      labelId='status-label'
                      label='Status'
                      value={formData.status}
                      onChange={e => handleInputChange('status', e.target.value)}
                      disabled={loading}
                    >
                      <MenuItem value=''>Select Status</MenuItem>
                      <MenuItem value='available'>Available</MenuItem>
                      <MenuItem value='occupied'>Occupied</MenuItem>
                      <MenuItem value='maintenance'>Maintenance</MenuItem>
                      <MenuItem value='reserved'>Reserved</MenuItem>
                    </Select>
                    {errors.status && (
                      <Typography variant='caption' color='error' className='mts-1'>
                        This field is required.
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Rent (GHS)'
                    type='number'
                    placeholder='e.g., 1200'
                    value={formData.rent}
                    onChange={e => handleInputChange('rent', e.target.value)}
                    error={Boolean(errors.rent)}
                    helperText={errors.rent ? 'This field is required.' : ''}
                    disabled={loading}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel id='rent-period-label'>Rent Period</InputLabel>
                    <Select
                      size='small'
                      labelId='rent-period-label'
                      label='Rent Period'
                      value={formData.rentPeriod}
                      onChange={e => handleInputChange('rentPeriod', e.target.value)}
                      disabled={loading}
                    >
                      <MenuItem value='monthly'>Monthly</MenuItem>
                      <MenuItem value='biannual'>Biannual (6 months)</MenuItem>
                      <MenuItem value='annual'>Annual (12 months)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Size (sqft)'
                    type='number'
                    placeholder='e.g., 850'
                    value={formData.size}
                    onChange={e => handleInputChange('size', e.target.value)}
                    disabled={loading}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Floor'
                    type='number'
                    placeholder='e.g., 1'
                    value={formData.floor}
                    onChange={e => handleInputChange('floor', e.target.value)}
                    disabled={loading}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Bedrooms'
                    type='number'
                    placeholder='e.g., 2'
                    value={formData.bedrooms}
                    onChange={e => handleInputChange('bedrooms', e.target.value)}
                    disabled={loading}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Bathrooms'
                    type='number'
                    placeholder='e.g., 1'
                    value={formData.bathrooms}
                    onChange={e => handleInputChange('bathrooms', e.target.value)}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </div>
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
                  onChange={e => handleInputChange('imageUrlInput', e.target.value)}
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
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleReset} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSubmit}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {mode === 'edit' ? 'Update' : 'Add'} Unit
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddUnitDialog
