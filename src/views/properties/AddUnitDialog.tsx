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

// API Imports
import { createUnit, updateUnit, type CreateUnitPayload, type UpdateUnitPayload } from '@/lib/api/properties'

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
  tenantName: string
  type: 'studio' | '1br' | '2br' | '3br' | '4br+' | 'commercial' | 'office' | 'retail'
}

const initialData: FormDataType = {
  unitNumber: '',
  propertyId: '',
  status: '',
  rent: '',
  rentPeriod: 'monthly',
  bedrooms: '',
  bathrooms: '',
  size: '',
  tenantName: '',
  type: '1br'
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
        rentPeriod: 'monthly' as FormDataType['rentPeriod'], // Default to monthly for existing units
        bedrooms: editData.bedrooms?.toString() || '',
        bathrooms: editData.bathrooms?.toString() || '',
        size: sizeValue,
        tenantName: editData.tenantName || '',
        type: '1br' // Default type
      }
    }

    return initialData
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

  const handleInputChange = (field: keyof FormDataType, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}

    if (!formData.unitNumber.trim()) newErrors.unitNumber = true
    if (!formData.propertyId) newErrors.propertyId = true
    if (!formData.status) newErrors.status = true
    if (!formData.rent.trim()) newErrors.rent = true

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setApiError(null)

    try {
      // Map 'occupied' status - API expects 'available', 'occupied', 'maintenance', 'reserved'
      const statusForApi = formData.status as CreateUnitPayload['status']

      if (mode === 'add') {
        // Create new unit via API
        const payload: CreateUnitPayload = {
          unitNo: formData.unitNumber,
          type: formData.type,
          rent: parseFloat(formData.rent),
          status: statusForApi,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
          sizeSqft: formData.size ? parseFloat(formData.size) : undefined
        }

        const response = await createUnit(formData.propertyId, payload)

        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to create unit')
        }
      } else if (mode === 'edit' && editData?.id) {
        // Update existing unit via API
        const payload: UpdateUnitPayload = {
          unitNo: formData.unitNumber,
          type: formData.type,
          rent: parseFloat(formData.rent),
          status: statusForApi,
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
          sizeSqft: formData.size ? parseFloat(formData.size) : undefined
        }

        const response = await updateUnit(editData.id, payload)

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
      <DialogContent>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }} onClose={() => setApiError(null)}>
            {apiError}
          </Alert>
        )}
        <div className='flex flex-col gap-4 mbs-4'>
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
