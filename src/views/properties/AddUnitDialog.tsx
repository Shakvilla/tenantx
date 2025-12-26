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
  status: 'occupied' | 'vacant' | 'maintenance' | ''
  rent: string
  bedrooms: string
  bathrooms: string
  size: string
  tenantName: string
}

const initialData: FormDataType = {
  unitNumber: '',
  propertyId: '',
  status: '',
  rent: '',
  bedrooms: '',
  bathrooms: '',
  size: '',
  tenantName: ''
}

const AddUnitDialog = ({ open, handleClose, properties, unitsData, setData, editData, mode = 'add' }: Props) => {
  // States
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})

  // Get initial form data based on mode
  const getInitialFormData = (): FormDataType => {
    if (mode === 'edit' && editData) {
      return {
        unitNumber: editData.unitNumber || '',
        propertyId: editData.propertyId?.toString() || '',
        status: editData.status || '',
        rent: editData.rent || '',
        bedrooms: editData.bedrooms?.toString() || '',
        bathrooms: editData.bathrooms?.toString() || '',
        size: editData.size || '',
        tenantName: editData.tenantName || ''
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
    if (!formData.bedrooms) newErrors.bedrooms = true
    if (!formData.bathrooms) newErrors.bathrooms = true
    if (!formData.size.trim()) newErrors.size = true

    if (formData.status === 'occupied' && !formData.tenantName.trim()) {
      newErrors.tenantName = true
    }

    setErrors(newErrors)
    
return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    const selectedProperty = properties.find(p => p.id.toString() === formData.propertyId)

    if (mode === 'add') {
      const newUnit = {
        id: Date.now().toString(),
        unitNumber: formData.unitNumber,
        propertyName: selectedProperty?.name || '',
        propertyId: formData.propertyId,
        tenantName: formData.status === 'occupied' ? formData.tenantName : null,
        status: formData.status as 'occupied' | 'vacant' | 'maintenance',
        rent: formData.rent,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        size: formData.size
      }

      if (unitsData && setData) {
        setData([...unitsData, newUnit])
      }
    } else if (mode === 'edit' && editData) {
      const updatedUnit = {
        ...editData,
        unitNumber: formData.unitNumber,
        propertyName: selectedProperty?.name || editData.propertyName || '',
        propertyId: formData.propertyId,
        tenantName: formData.status === 'occupied' ? formData.tenantName : null,
        status: formData.status as 'occupied' | 'vacant' | 'maintenance',
        rent: formData.rent,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        size: formData.size
      }

      if (unitsData && setData) {
        setData(
          unitsData.map(unit => (unit.id === editData.id ? { ...unit, ...updatedUnit } : unit))
        )
      }
    }

    handleClose()
    setFormData(initialData)
    setErrors({})
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
    setErrors({})
  }

  return (
    <Dialog open={open} onClose={handleReset} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>{mode === 'edit' ? 'Edit Unit' : 'Add Unit'}</span>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
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
              <FormControl fullWidth error={Boolean(errors.status)} size='small'>
                <InputLabel id='status-label'>Status</InputLabel>
                <Select
                  size='small'
                  labelId='status-label'
                  label='Status'
                  value={formData.status}
                  onChange={e => handleInputChange('status', e.target.value)}
                >
                  <MenuItem value=''>Select Status</MenuItem>
                  <MenuItem value='occupied'>Occupied</MenuItem>
                  <MenuItem value='vacant'>Vacant</MenuItem>
                  <MenuItem value='maintenance'>Maintenance</MenuItem>
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
                label='Rent'
                placeholder='e.g., ₵1,200'
                value={formData.rent}
                onChange={e => handleInputChange('rent', e.target.value)}
                error={Boolean(errors.rent)}
                helperText={errors.rent ? 'This field is required.' : ''}
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
                error={Boolean(errors.bedrooms)}
                helperText={errors.bedrooms ? 'This field is required.' : ''}
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
                error={Boolean(errors.bathrooms)}
                helperText={errors.bathrooms ? 'This field is required.' : ''}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                size='small'
                fullWidth
                label='Size'
                placeholder='e.g., 850 sqft'
                value={formData.size}
                onChange={e => handleInputChange('size', e.target.value)}
                error={Boolean(errors.size)}
                helperText={errors.size ? 'This field is required.' : ''}
              />
            </Grid>
            {formData.status === 'occupied' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  size='small'
                  fullWidth
                  label='Tenant Name'
                  placeholder='Enter tenant name'
                  value={formData.tenantName}
                  onChange={e => handleInputChange('tenantName', e.target.value)}
                  error={Boolean(errors.tenantName)}
                  helperText={errors.tenantName ? 'Tenant name is required for occupied units.' : ''}
                />
              </Grid>
            )}
          </Grid>
        </div>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleReset}>
          Cancel
        </Button>
        <Button variant='contained' color='primary' onClick={handleSubmit}>
          {mode === 'edit' ? 'Update' : 'Add'} Unit
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddUnitDialog

