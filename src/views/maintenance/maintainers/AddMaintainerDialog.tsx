'use client'

// React Imports
import { useState, useEffect, useRef } from 'react'

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
import Box from '@mui/material/Box'

// Type Imports
import type { MaintainerType } from '@/types/maintenance/maintainerTypes'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'

type Props = {
  open: boolean
  handleClose: () => void
  maintainerData?: MaintainerType[]
  setData: (data: MaintainerType[]) => void
  editData?: MaintainerType | null
  mode?: 'add' | 'edit'
}

type FormDataType = {
  name: string
  email: string
  phone: string
  specialization: string
  status: 'active' | 'inactive'
  address: string
  avatar: File | null
  rating: number
}

// Vars
const initialData: FormDataType = {
  name: '',
  email: '',
  phone: '',
  specialization: '',
  status: 'active',
  address: '',
  avatar: null,
  rating: 0
}

const specializations = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Carpentry',
  'Painting',
  'General Maintenance',
  'Roofing',
  'Flooring',
  'Landscaping'
]

const AddMaintainerDialog = ({ open, handleClose, maintainerData, setData, editData, mode = 'add' }: Props) => {
  // States
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when dialog opens/closes or editData changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && editData) {
        setFormData({
          name: editData.name || '',
          email: editData.email || '',
          phone: editData.phone || '',
          specialization: editData.specialization || '',
          status: editData.status || 'active',
          address: editData.address || '',
          avatar: null,
          rating: editData.rating || 0
        })
        setAvatarPreview(editData.avatar || null)
      } else {
        setFormData(initialData)
        setAvatarPreview(null)
      }
      setErrors({})
    } else {
      // Clean up preview URL when dialog closes
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
      setFormData(initialData)
      setErrors({})
      setAvatarPreview(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData, mode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  // Handle input change
  const handleInputChange = (field: keyof FormDataType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }
  }

  // Handle avatar upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setErrors(prev => ({ ...prev, avatar: true }))
        return
      }
      // Clean up previous preview URL
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
      setFormData(prev => ({ ...prev, avatar: file }))
      setAvatarPreview(URL.createObjectURL(file))
      if (errors.avatar) {
        setErrors(prev => ({ ...prev, avatar: false }))
      }
    }
  }

  // Handle remove avatar
  const handleRemoveAvatar = () => {
    // Clean up preview URL
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }
    setFormData(prev => ({ ...prev, avatar: null }))
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}

    if (!formData.name.trim()) {
      newErrors.name = true
    }
    if (!formData.email.trim()) {
      newErrors.email = true
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = true
    }
    if (!formData.phone.trim()) {
      newErrors.phone = true
    }
    if (!formData.specialization.trim()) {
      newErrors.specialization = true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = () => {
    if (!validateForm()) return

    const avatarUrl = avatarPreview || editData?.avatar

    if (mode === 'edit' && editData) {
      // Update existing maintainer
      const updatedMaintainer: MaintainerType = {
        ...editData,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        specialization: formData.specialization,
        status: formData.status,
        address: formData.address,
        avatar: avatarUrl,
        rating: formData.rating || editData.rating || 0
      }

      if (maintainerData) {
        setData(maintainerData.map(m => (m.id === editData.id ? updatedMaintainer : m)))
      }
    } else {
      // Create new maintainer
      const newMaintainer: MaintainerType = {
        id: (maintainerData?.length || 0) + 1,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        specialization: formData.specialization,
        status: formData.status,
        address: formData.address,
        avatar: avatarUrl,
        rating: 0,
        totalJobs: 0,
        completedJobs: 0
      }

      if (maintainerData) {
        setData([newMaintainer, ...maintainerData])
      }
    }

    handleReset()
  }

  // Handle reset
  const handleReset = () => {
    setFormData(initialData)
    setErrors({})
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleReset} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span className='font-medium'>{mode === 'edit' ? 'Edit Maintainer' : 'Add Maintainer'}</span>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent className='flex flex-col gap-4'>
        {/* Avatar Upload */}
        <Box className='flex flex-col items-center gap-4'>
          <CustomAvatar src={avatarPreview || editData?.avatar} skin='light' size={100}>
            {getInitials(formData.name || 'MA')}
          </CustomAvatar>
          <div className='flex gap-2'>
            <Button variant='outlined' size='small' component='label' startIcon={<i className='ri-upload-line' />}>
              Upload Photo
              <input ref={fileInputRef} type='file' hidden accept='image/*' onChange={handleAvatarChange} />
            </Button>
            {avatarPreview && (
              <Button
                variant='outlined'
                color='error'
                size='small'
                startIcon={<i className='ri-delete-bin-line' />}
                onClick={handleRemoveAvatar}
              >
                Remove
              </Button>
            )}
          </div>
          {errors.avatar && (
            <Typography variant='caption' color='error'>
              Image size should be less than 5MB
            </Typography>
          )}
        </Box>

        <Grid container spacing={4}>
          {/* Name */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Name *'
              placeholder='Enter maintainer name'
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              error={Boolean(errors.name)}
              helperText={errors.name ? 'This field is required.' : ''}
            />
          </Grid>

          {/* Email */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Email *'
              placeholder='Enter email address'
              type='email'
              value={formData.email}
              onChange={e => handleInputChange('email', e.target.value)}
              error={Boolean(errors.email)}
              helperText={errors.email ? 'Please enter a valid email address.' : ''}
            />
          </Grid>

          {/* Phone */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Phone *'
              placeholder='Enter phone number'
              value={formData.phone}
              onChange={e => handleInputChange('phone', e.target.value)}
              error={Boolean(errors.phone)}
              helperText={errors.phone ? 'This field is required.' : ''}
            />
          </Grid>

          {/* Specialization */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small' error={Boolean(errors.specialization)}>
              <InputLabel id='specialization-label'>Specialization *</InputLabel>
              <Select
                labelId='specialization-label'
                label='Specialization *'
                value={formData.specialization}
                onChange={e => handleInputChange('specialization', e.target.value)}
              >
                <MenuItem value=''>Select Specialization</MenuItem>
                {specializations.map(spec => (
                  <MenuItem key={spec} value={spec}>
                    {spec}
                  </MenuItem>
                ))}
              </Select>
              {errors.specialization && (
                <Typography variant='caption' color='error' className='mts-1'>
                  This field is required.
                </Typography>
              )}
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
                <MenuItem value='active'>Active</MenuItem>
                <MenuItem value='inactive'>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Address */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Address'
              placeholder='Enter address'
              value={formData.address}
              onChange={e => handleInputChange('address', e.target.value)}
            />
          </Grid>

          {/* Rating (only in edit mode) */}
          {mode === 'edit' && (
            <Grid size={{ xs: 12 }}>
              <Typography variant='body2' color='text.secondary' className='mbe-1'>
                Rating
              </Typography>
              <Typography variant='body1' className='font-medium'>
                {editData?.rating?.toFixed(1) || '0.0'} / 5.0
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Rating is calculated based on completed jobs
              </Typography>
            </Grid>
          )}
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
          {mode === 'edit' ? 'Update Maintainer' : 'Add Maintainer'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddMaintainerDialog
