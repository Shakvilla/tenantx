'use client'

// React Imports
import { useState, useEffect, useRef, useMemo } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Autocomplete from '@mui/material/Autocomplete'
import InputAdornment from '@mui/material/InputAdornment'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'

// Type Imports
import type { MaintenanceRequestType } from '@/types/maintenance/maintenanceRequestTypes'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'

type Property = { id: number | string; name: string; image?: string }
type Unit = { id: number | string; unitNumber: string; propertyId: string; propertyName: string }
type Tenant = {
  id: number | string
  name: string
  email?: string
  avatar?: string
  propertyId?: string
  unitId?: string
}
type Maintainer = { id: number | string; name: string; email?: string; avatar?: string; specialization?: string }

type Props = {
  open: boolean
  handleClose: () => void
  requestData?: MaintenanceRequestType[]
  setData: (data: MaintenanceRequestType[]) => void
  editData?: MaintenanceRequestType | null
  mode?: 'add' | 'edit'
  properties?: Property[]
  units?: Unit[]
  tenants?: Tenant[]
  maintainers?: Maintainer[]
}

type FormDataType = {
  propertyId: string
  unitId: string
  tenantId: string
  issue: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'new' | 'pending' | 'in-progress' | 'completed' | 'rejected'
  assignedToId: string
  requestedDate: string
  images: File[]
}

// Vars
const initialData: FormDataType = {
  propertyId: '',
  unitId: '',
  tenantId: '',
  issue: '',
  description: '',
  priority: 'medium',
  status: 'new',
  assignedToId: '',
  requestedDate: new Date().toISOString().split('T')[0],
  images: []
}

// Sample data
const sampleProperties: Property[] = [
  {
    id: 1,
    name: 'A living room with mexican mansion blue',
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0'
  },
  {
    id: 2,
    name: 'Rendering of a modern villa',
    image:
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=2148&auto=format&fit=crop&ixlib=rb-4.1.0'
  },
  {
    id: 3,
    name: 'Beautiful modern style luxury home exterior sunset',
    image:
      'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0'
  },
  {
    id: 4,
    name: 'A house with a lot of windows and a lot of plants',
    image:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0'
  },
  {
    id: 5,
    name: 'Design of a modern house as mansion blue couch',
    image:
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=2340&auto=format&fit=crop&ixlib=rb-4.1.0'
  },
  {
    id: 6,
    name: 'Depending on the location and design',
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2350&auto=format&fit=crop&ixlib=rb-4.1.0'
  }
]

const sampleUnits: Unit[] = [
  { id: 1, unitNumber: 'Unit no 1', propertyId: '5', propertyName: 'Design of a modern house as mansion blue couch' },
  {
    id: 2,
    unitNumber: 'Unit no 2',
    propertyId: '3',
    propertyName: 'Beautiful modern style luxury home exterior sunset'
  },
  { id: 3, unitNumber: 'Unit no 3', propertyId: '1', propertyName: 'A living room with mexican mansion blue' },
  {
    id: 4,
    unitNumber: 'Unit no 4',
    propertyId: '4',
    propertyName: 'A house with a lot of windows and a lot of plants'
  },
  { id: 5, unitNumber: 'Unit no 5', propertyId: '2', propertyName: 'Rendering of a modern villa' },
  { id: 6, unitNumber: 'Unit no 6', propertyId: '2', propertyName: 'Rendering of a modern villa' },
  {
    id: 7,
    unitNumber: 'Unit no 7',
    propertyId: '3',
    propertyName: 'Beautiful modern style luxury home exterior sunset'
  },
  { id: 8, unitNumber: 'Unit no 8', propertyId: '6', propertyName: 'Depending on the location and design' },
  { id: 9, unitNumber: 'Unit no 9', propertyId: '1', propertyName: 'A living room with mexican mansion blue' },
  {
    id: 10,
    unitNumber: 'Unit no 10',
    propertyId: '4',
    propertyName: 'A house with a lot of windows and a lot of plants'
  },
  { id: 11, unitNumber: 'Unit no 11', propertyId: '5', propertyName: 'Design of a modern house as mansion blue couch' },
  { id: 12, unitNumber: 'Unit no 12', propertyId: '1', propertyName: 'A living room with mexican mansion blue' }
]

const sampleTenants: Tenant[] = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john.doe@example.com',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    propertyId: '1',
    unitId: '3'
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    propertyId: '2',
    unitId: '6'
  },
  {
    id: 3,
    name: 'Bob Johnson',
    email: 'bob.johnson@example.com',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    propertyId: '3',
    unitId: '2'
  },
  {
    id: 4,
    name: 'Alice Brown',
    email: 'alice.brown@example.com',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    propertyId: '4',
    unitId: '4'
  },
  {
    id: 5,
    name: 'Charlie Wilson',
    email: 'charlie.wilson@example.com',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    propertyId: '5',
    unitId: '11'
  }
]

const sampleMaintainers: Maintainer[] = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@example.com',
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'Plumbing'
  },
  {
    id: 2,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    avatar:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'Electrical'
  },
  {
    id: 3,
    name: 'Michael Brown',
    email: 'michael.brown@example.com',
    avatar:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'HVAC'
  },
  {
    id: 4,
    name: 'Emily Davis',
    email: 'emily.davis@example.com',
    avatar:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
    specialization: 'Carpentry'
  }
]

const AddMaintenanceRequestDialog = ({
  open,
  handleClose,
  requestData,
  setData,
  editData,
  mode = 'add',
  properties = sampleProperties,
  units = sampleUnits,
  tenants = sampleTenants,
  maintainers = sampleMaintainers
}: Props) => {
  // States
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Filter units and tenants based on property selection
  const filteredUnits = useMemo(() => {
    if (!formData.propertyId) return []
    return units.filter(unit => unit.propertyId === formData.propertyId)
  }, [formData.propertyId, units])

  const filteredTenants = useMemo(() => {
    if (!formData.propertyId && !formData.unitId) return []
    return tenants.filter(tenant => {
      if (formData.unitId) {
        return tenant.unitId === formData.unitId
      }
      return tenant.propertyId === formData.propertyId
    })
  }, [formData.propertyId, formData.unitId, tenants])

  // Reset form when dialog opens/closes or editData changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && editData) {
        const property = properties.find(p => p.name === editData.propertyName)
        const unit = units.find(u => u.unitNumber === editData.unitNo)
        const tenant = tenants.find(t => t.name === editData.tenantName)
        const maintainer = maintainers.find(m => m.name === editData.assignedTo)

        setFormData({
          propertyId: property?.id.toString() || '',
          unitId: unit?.id.toString() || '',
          tenantId: tenant?.id.toString() || '',
          issue: editData.issue || '',
          description: editData.description || '',
          priority: editData.priority || 'medium',
          status: editData.status || 'new',
          assignedToId: maintainer?.id.toString() || '',
          requestedDate: editData.requestedDate || new Date().toISOString().split('T')[0],
          images: []
        })
        setImagePreviews(editData.images || [])
      } else {
        setFormData(initialData)
        setImagePreviews([])
      }
      setErrors({})
    } else {
      // Clean up preview URLs
      imagePreviews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview)
        }
      })
      setFormData(initialData)
      setErrors({})
      setImagePreviews([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData, mode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          URL.revokeObjectURL(preview)
        }
      })
    }
  }, [imagePreviews])

  // Handle input change
  const handleInputChange = (field: keyof FormDataType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }

    // Reset dependent fields
    if (field === 'propertyId') {
      setFormData(prev => ({ ...prev, unitId: '', tenantId: '' }))
    }
    if (field === 'unitId') {
      setFormData(prev => ({ ...prev, tenantId: '' }))
    }
  }

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrors(prev => ({ ...prev, images: true }))
        return false
      }
      return true
    })

    const newPreviews = validFiles.map(file => URL.createObjectURL(file))
    setImagePreviews(prev => [...prev, ...newPreviews])
    setFormData(prev => ({ ...prev, images: [...prev.images, ...validFiles] }))
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: false }))
    }
  }

  // Handle remove image
  const handleRemoveImage = (index: number) => {
    const previewToRemove = imagePreviews[index]
    if (previewToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(previewToRemove)
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== index))
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}

    if (!formData.propertyId.trim()) {
      newErrors.propertyId = true
    }
    if (!formData.unitId.trim()) {
      newErrors.unitId = true
    }
    if (!formData.tenantId.trim()) {
      newErrors.tenantId = true
    }
    if (!formData.issue.trim()) {
      newErrors.issue = true
    }
    if (!formData.requestedDate.trim()) {
      newErrors.requestedDate = true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = () => {
    if (!validateForm()) return

    const property = properties.find(p => p.id.toString() === formData.propertyId)
    const unit = units.find(u => u.id.toString() === formData.unitId)
    const tenant = tenants.find(t => t.id.toString() === formData.tenantId)
    const maintainer = maintainers.find(m => m.id.toString() === formData.assignedToId)

    const imageUrls = imagePreviews.filter(preview => !preview.startsWith('blob:'))

    if (mode === 'edit' && editData) {
      // Update existing request
      const updatedRequest: MaintenanceRequestType = {
        ...editData,
        propertyName: property?.name || '',
        propertyImage: property?.image,
        unitNo: unit?.unitNumber || '',
        tenantName: tenant?.name || '',
        tenantAvatar: tenant?.avatar,
        issue: formData.issue,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        assignedTo: maintainer?.name,
        assignedToAvatar: maintainer?.avatar,
        requestedDate: formData.requestedDate,
        images: imageUrls
      }

      if (requestData) {
        setData(requestData.map(r => (r.id === editData.id ? updatedRequest : r)))
      }
    } else {
      // Create new request
      const newRequest: MaintenanceRequestType = {
        id: (requestData?.length || 0) + 1,
        propertyName: property?.name || '',
        propertyImage: property?.image,
        unitNo: unit?.unitNumber || '',
        tenantName: tenant?.name || '',
        tenantAvatar: tenant?.avatar,
        issue: formData.issue,
        description: formData.description,
        priority: formData.priority,
        status: formData.status,
        assignedTo: maintainer?.name,
        assignedToAvatar: maintainer?.avatar,
        requestedDate: formData.requestedDate,
        images: imageUrls
      }

      if (requestData) {
        setData([newRequest, ...requestData])
      }
    }

    handleReset()
  }

  // Handle reset
  const handleReset = () => {
    // Clean up preview URLs
    imagePreviews.forEach(preview => {
      if (preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview)
      }
    })
    setFormData(initialData)
    setErrors({})
    setImagePreviews([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleReset} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span className='font-medium'>{mode === 'edit' ? 'Edit Maintenance Request' : 'Add Maintenance Request'}</span>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent className='flex flex-col gap-4'>
        <Grid container spacing={4}>
          {/* Property */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small' error={Boolean(errors.propertyId)}>
              <InputLabel id='property-label'>Property *</InputLabel>
              <Select
                labelId='property-label'
                label='Property *'
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

          {/* Unit */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small' error={Boolean(errors.unitId)} disabled={!formData.propertyId}>
              <InputLabel id='unit-label'>Unit *</InputLabel>
              <Select
                labelId='unit-label'
                label='Unit *'
                value={formData.unitId}
                onChange={e => handleInputChange('unitId', e.target.value)}
              >
                <MenuItem value=''>Select Unit</MenuItem>
                {filteredUnits.map(unit => (
                  <MenuItem key={unit.id} value={unit.id.toString()}>
                    {unit.unitNumber}
                  </MenuItem>
                ))}
              </Select>
              {errors.unitId && (
                <Typography variant='caption' color='error' className='mts-1'>
                  This field is required.
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Tenant */}
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              size='small'
              fullWidth
              options={filteredTenants}
              getOptionLabel={option => `${option.name} (${option.email || 'No Email'})`}
              value={filteredTenants.find(t => t.id.toString() === formData.tenantId) || null}
              onChange={(_, newValue) => {
                handleInputChange('tenantId', newValue?.id.toString() || '')
              }}
              disabled={!formData.propertyId}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Select Tenant *'
                  placeholder='Search tenant...'
                  error={Boolean(errors.tenantId)}
                  helperText={errors.tenantId ? 'This field is required.' : ''}
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position='start'>
                            <i className='ri-search-line text-textSecondary' />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      )
                    }
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <div className='flex items-center gap-2'>
                    <CustomAvatar src={option.avatar} skin='light' size={28}>
                      {getInitials(option.name)}
                    </CustomAvatar>
                    <div className='flex flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {option.name}
                      </Typography>
                      <Typography variant='caption'>{option.email}</Typography>
                    </div>
                  </div>
                </li>
              )}
            />
          </Grid>

          {/* Issue */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='Issue *'
              placeholder='Enter issue description'
              value={formData.issue}
              onChange={e => handleInputChange('issue', e.target.value)}
              error={Boolean(errors.issue)}
              helperText={errors.issue ? 'This field is required.' : ''}
            />
          </Grid>

          {/* Description */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              size='small'
              label='Description'
              placeholder='Enter detailed description'
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
            />
          </Grid>

          {/* Priority */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='priority-label'>Priority</InputLabel>
              <Select
                labelId='priority-label'
                label='Priority'
                value={formData.priority}
                onChange={e => handleInputChange('priority', e.target.value)}
              >
                <MenuItem value='low'>Low</MenuItem>
                <MenuItem value='medium'>Medium</MenuItem>
                <MenuItem value='high'>High</MenuItem>
                <MenuItem value='urgent'>Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Status */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='status-label'>Status</InputLabel>
              <Select
                labelId='status-label'
                label='Status'
                value={formData.status}
                onChange={e => handleInputChange('status', e.target.value)}
              >
                <MenuItem value='new'>New</MenuItem>
                <MenuItem value='pending'>Pending</MenuItem>
                <MenuItem value='in-progress'>In Progress</MenuItem>
                <MenuItem value='completed'>Completed</MenuItem>
                <MenuItem value='rejected'>Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Assigned To */}
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              size='small'
              fullWidth
              options={maintainers}
              getOptionLabel={option => `${option.name} (${option.specialization || 'General'})`}
              value={maintainers.find(m => m.id.toString() === formData.assignedToId) || null}
              onChange={(_, newValue) => {
                handleInputChange('assignedToId', newValue?.id.toString() || '')
              }}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Assign To (Optional)'
                  placeholder='Search maintainer...'
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position='start'>
                            <i className='ri-search-line text-textSecondary' />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      )
                    }
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <div className='flex items-center gap-2'>
                    <CustomAvatar src={option.avatar} skin='light' size={28}>
                      {getInitials(option.name)}
                    </CustomAvatar>
                    <div className='flex flex-col'>
                      <Typography className='font-medium' color='text.primary'>
                        {option.name}
                      </Typography>
                      <Typography variant='caption'>{option.specialization}</Typography>
                    </div>
                  </div>
                </li>
              )}
            />
          </Grid>

          {/* Requested Date */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              type='date'
              label='Requested Date *'
              value={formData.requestedDate}
              onChange={e => handleInputChange('requestedDate', e.target.value)}
              error={Boolean(errors.requestedDate)}
              helperText={errors.requestedDate ? 'This field is required.' : ''}
              InputLabelProps={{
                shrink: true
              }}
            />
          </Grid>

          {/* Images */}
          <Grid size={{ xs: 12 }}>
            <Box className='flex flex-col gap-2'>
              <Typography variant='body2' color='text.secondary'>
                Images (Optional)
              </Typography>
              <Button variant='outlined' size='small' component='label' startIcon={<i className='ri-upload-line' />}>
                Upload Images
                <input ref={fileInputRef} type='file' hidden accept='image/*' multiple onChange={handleImageChange} />
              </Button>
              {errors.images && (
                <Typography variant='caption' color='error'>
                  Image size should be less than 5MB each.
                </Typography>
              )}
              {imagePreviews.length > 0 && (
                <Box className='flex flex-wrap gap-2 mts-2'>
                  {imagePreviews.map((preview, index) => (
                    <Box key={index} className='relative'>
                      <Avatar variant='rounded' src={preview} sx={{ width: 80, height: 80 }}>
                        <i className='ri-image-line text-2xl' />
                      </Avatar>
                      <IconButton
                        size='small'
                        className='absolute -top-2 -right-2'
                        sx={{
                          bgcolor: 'error.main',
                          color: 'white',
                          width: 24,
                          height: 24,
                          '&:hover': { bgcolor: 'error.dark' }
                        }}
                        onClick={() => handleRemoveImage(index)}
                      >
                        <i className='ri-close-line text-sm' />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleReset}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSubmit}
          startIcon={<i className={mode === 'edit' ? 'ri-save-line' : 'ri-add-line'} />}
        >
          {mode === 'edit' ? 'Update Request' : 'Add Request'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddMaintenanceRequestDialog
