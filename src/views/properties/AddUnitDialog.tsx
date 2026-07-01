'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'

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
import Avatar from '@mui/material/Avatar'
import CardMedia from '@mui/material/CardMedia'
import { styled } from '@mui/material/styles'

// API Imports
import { createUnit, updateUnit, uploadUnitImages } from '@/lib/api/units'
import { getStoredTenantId } from '@/lib/api/storage'
import type { CreateUnitPayload } from '@/lib/validation/schemas/unit.schema'

// ---------------------------------------------------------------------------
// Styled upload area (matches AddPropertyDialog)
// ---------------------------------------------------------------------------
const UploadArea = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 0.2s, background-color 0.2s',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover
  }
}))

const ImagePreviewCard = styled(Box, {
  shouldForwardProp: prop => prop !== 'isThumbnail'
})<{ isThumbnail?: boolean }>(({ theme, isThumbnail }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
  border: isThumbnail ? `2px solid ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
  '& .remove-button': {
    position: 'absolute',
    top: 8,
    right: 8,
    opacity: 0,
    transition: 'opacity 0.2s',
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: 'white',
    '&:hover': { backgroundColor: 'rgba(0,0,0,0.8)' }
  },
  '&:hover .remove-button': { opacity: 1 }
}))

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Property = {
  id: number | string
  name: string
}

type UnitEditData = {
  id?: string
  unitNumber?: string
  propertyId?: string
  propertyName?: string
  status?: 'occupied' | 'vacant' | 'maintenance' | 'available' | 'reserved' | string
  rent?: string | number
  currency?: string
  bedrooms?: number | string
  bathrooms?: number | string
  size?: string
  floor?: string | number
  type?: string
  tenantName?: string | null
  images?: string[]
  imageFileIds?: string[]
  features?: Record<string, any>
  metadata?: Record<string, any>
}

type Props = {
  open: boolean
  handleClose: () => void
  properties: Property[]
  unitsData?: any[]
  setData?: (data: any[]) => void
  editData?: UnitEditData | null
  mode?: 'add' | 'edit'
  onSuccess?: () => void
}

type NewImageItem = { file: File; preview: string }

type FormDataType = {
  unitNumber: string
  propertyId: string
  status: 'occupied' | 'available' | 'maintenance' | 'reserved' | ''
  rent: string
  currency: string
  rentPeriod: 'monthly' | 'biannual' | 'annual' | ''
  bedrooms: string
  bathrooms: string
  size: string
  floor: string
  type: 'studio' | '1br' | '2br' | '3br' | '4br+' | 'commercial' | 'office' | 'retail'
  amenities: Record<string, boolean>
  newImages: NewImageItem[]
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
  currency: 'GHS',
  rentPeriod: 'monthly',
  bedrooms: '',
  bathrooms: '',
  size: '',
  floor: '',
  type: '1br',
  amenities: {},
  newImages: [] as NewImageItem[],
  features: {},
  metadata: {}
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const AddUnitDialog = ({ open, handleClose, properties, editData, mode = 'add', onSuccess }: Props) => {
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Parallel arrays for existing images in edit mode
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [existingImageFileIds, setExistingImageFileIds] = useState<string[]>([])

  const getInitialFormData = (): FormDataType => {
    if (mode === 'edit' && editData) {
      const rentRaw = editData.rent?.toString() || ''
      const rentValue = rentRaw.replace(/[₵,]/g, '')
      const sizeRaw = editData.size?.toString() || ''
      const sizeValue = sizeRaw.replace(/[^0-9.]/g, '')
      const statusValue = editData.status === 'vacant' ? 'available' : (editData.status || '')

      return {
        unitNumber: editData.unitNumber || '',
        propertyId: editData.propertyId?.toString() || '',
        status: statusValue as FormDataType['status'],
        rent: rentValue,
        currency: editData.currency || 'GHS',
        rentPeriod: editData.metadata?.rentPeriod || 'monthly',
        bedrooms: editData.bedrooms?.toString() || '',
        bathrooms: editData.bathrooms?.toString() || '',
        size: sizeValue,
        floor: editData.floor?.toString() || '',
        type: (editData.type || '1br') as FormDataType['type'],
        amenities: {},
        newImages: [] as NewImageItem[],
        features: editData.features || {},
        metadata: editData.metadata || {}
      }
    }

    return initialData
  }

  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  // Reset form and existing image state when dialog opens
  useEffect(() => {
    if (open) {
      setFormData(getInitialFormData())
      setErrors({})
      setApiError(null)
      setActiveTab(0)
      setExistingImages(editData?.images || [])
      setExistingImageFileIds(editData?.imageFileIds || [])
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
      amenities: { ...prev.amenities, [id]: e.target.checked }
    }))
  }

  // Helper: turn File[] into NewImageItem[] with blob preview URLs
  const toImageItems = useCallback((files: File[]): NewImageItem[] =>
    files.map(file => ({ file, preview: URL.createObjectURL(file) })), [])

  // Revoke blob URLs to avoid memory leaks
  const revokeItems = useCallback((items: NewImageItem[]) => {
    items.forEach(item => URL.revokeObjectURL(item.preview))
  }, [])

  // File-picker handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const items = toImageItems(Array.from(e.target.files))
    setFormData(prev => ({ ...prev, newImages: [...prev.newImages, ...items] }))
    e.target.value = '' // allow re-selecting the same file
  }

  // Drag-and-drop support
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) {
      const items = toImageItems(files)
      setFormData(prev => ({ ...prev, newImages: [...prev.newImages, ...items] }))
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleRemoveNewImage = (index: number) => {
    setFormData(prev => {
      const removed = prev.newImages[index]
      if (removed) URL.revokeObjectURL(removed.preview)

      return { ...prev, newImages: prev.newImages.filter((_, i) => i !== index) }
    })
  }

  // Revoke all preview URLs when dialog closes
  useEffect(() => {
    if (!open) {
      revokeItems(formData.newImages)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index))
    setExistingImageFileIds(prev => prev.filter((_, i) => i !== index))
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}

    if (!formData.unitNumber.trim()) newErrors.unitNumber = true
    if (!formData.propertyId) newErrors.propertyId = true
    if (!formData.status) newErrors.status = true

    const rentVal = parseFloat(formData.rent)

    if (!formData.rent.trim() || isNaN(rentVal) || rentVal < 0) newErrors.rent = true

    setErrors(newErrors)

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

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

      // Start with existing (non-removed) images and their fileIds
      let imageUrls: string[] = [...existingImages]
      let imageFileIds: string[] = [...existingImageFileIds]

      // Upload any newly-selected files
      if (formData.newImages && formData.newImages.length > 0) {
        const unitId = mode === 'edit' ? editData?.id : undefined
        const uploadResponse = await uploadUnitImages(tenantId, formData.newImages.map(i => i.file), unitId)

        if (!uploadResponse.success || !uploadResponse.data) {
          throw new Error(uploadResponse.error?.message || 'Image upload failed')
        }

        const newUrls = uploadResponse.data.images.map(img => img.url)
        const newFileIds = uploadResponse.data.images.map(img => img.fileId)

        imageUrls = [...imageUrls, ...newUrls]
        imageFileIds = [...imageFileIds, ...newFileIds]
      }

      const payload: CreateUnitPayload = {
        unitNo: formData.unitNumber,
        type: formData.type,
        rent: parseFloat(formData.rent),
        deposit: undefined,
        floor: formData.floor ? parseInt(formData.floor) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        sizeSqft: formData.size ? parseFloat(formData.size) : undefined,
        status: formData.status as CreateUnitPayload['status'],
        currency: formData.currency,
        amenities: amenitiesArray.length > 0 ? amenitiesArray : undefined,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        imageFileIds: imageFileIds.length > 0 ? imageFileIds : undefined,
        features: Object.keys(formData.features).length > 0 ? formData.features : undefined,
        metadata: {
          ...formData.metadata,
          rentPeriod: formData.rentPeriod
        }
      }

      if (mode === 'add') {
        const response = await createUnit(tenantId, formData.propertyId, payload)

        if (!response.success) throw new Error(response.error?.message || 'Failed to create unit')
      } else if (mode === 'edit' && editData?.id) {
        const response = await updateUnit(tenantId, editData.id, payload)

        if (!response.success) throw new Error(response.error?.message || 'Failed to update unit')
      }

      handleClose()
      onSuccess?.()
      setFormData(initialData)
      setErrors({})
    } catch (err) {
      console.warn('Error saving unit:', err)
      setApiError(err instanceof Error ? err.message : 'Failed to save unit')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    revokeItems(formData.newImages)
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
        {apiError && (
          <Alert severity='error' sx={{ mx: 3, mt: 2 }} onClose={() => setApiError(null)}>
            {apiError}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label='unit dialog tabs'>
            <Tab label='General' />
            <Tab label='Features' />
            <Tab label='Media' />
          </Tabs>
        </Box>

        <Box sx={{ p: 3 }}>
          {/* ----------------------------------------------------------------
              Tab 0 – General
          ---------------------------------------------------------------- */}
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
                    label={`Rent (${formData.currency})`}
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
                    <InputLabel id='currency-label'>Currency</InputLabel>
                    <Select
                      size='small'
                      labelId='currency-label'
                      label='Currency'
                      value={formData.currency}
                      onChange={e => handleInputChange('currency', e.target.value)}
                      disabled={loading}
                    >
                      <MenuItem value='GHS'>GHS — Ghana Cedi (₵)</MenuItem>
                      <MenuItem value='USD'>USD — US Dollar ($)</MenuItem>
                    </Select>
                  </FormControl>
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

          {/* ----------------------------------------------------------------
              Tab 1 – Features / Amenities
          ---------------------------------------------------------------- */}
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

          {/* ----------------------------------------------------------------
              Tab 2 – Media / Images
          ---------------------------------------------------------------- */}
          {activeTab === 2 && (
            <Box className='flex flex-col gap-6'>
              <div className='flex flex-col gap-2'>
                <Typography variant='h6' className='font-semibold' color='text.primary'>
                  Upload Unit Images
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Upload images of this unit. You can upload multiple images at once.
                </Typography>
              </div>

              {/* Hidden file input */}
              <input
                type='file'
                id='unit-image-upload'
                multiple
                accept='image/*'
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />

              {/* Drop zone */}
              <UploadArea
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById('unit-image-upload')?.click()}
              >
                <div className='flex flex-col items-center gap-3'>
                  <Avatar
                    variant='rounded'
                    sx={{
                      width: 64,
                      height: 64,
                      backgroundColor: 'var(--mui-palette-primary-lightOpacity)',
                      color: 'var(--mui-palette-primary-main)'
                    }}
                  >
                    <i className='ri-image-add-line text-4xl' />
                  </Avatar>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='body1' className='font-medium' color='text.primary'>
                      Drop images here or click to upload
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Supports: JPG, PNG, GIF (Max 10MB per image)
                    </Typography>
                  </div>
                  <Button variant='outlined' color='primary' size='small' startIcon={<i className='ri-upload-cloud-line' />}>
                    Choose Files
                  </Button>
                </div>
              </UploadArea>

              {/* Existing images (edit mode) */}
              {existingImages.length > 0 && (
                <div className='flex flex-col gap-4'>
                  <Typography variant='body1' className='font-medium' color='text.primary'>
                    Existing Images ({existingImages.length})
                  </Typography>
                  <Grid container spacing={3}>
                    {existingImages.map((url, index) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`existing-${index}`}>
                        <ImagePreviewCard>
                          <CardMedia
                            component='img'
                            image={url}
                            alt={`Unit image ${index + 1}`}
                            sx={{ height: 160, objectFit: 'cover' }}
                          />
                          <IconButton
                            className='remove-button'
                            size='small'
                            onClick={() => handleRemoveExistingImage(index)}
                            aria-label='Remove image'
                          >
                            <i className='ri-delete-bin-line' />
                          </IconButton>
                        </ImagePreviewCard>
                      </Grid>
                    ))}
                  </Grid>
                </div>
              )}

              {/* Newly selected files (previewed from local blob) */}
              {formData.newImages && formData.newImages.length > 0 && (
                <div className='flex flex-col gap-4'>
                  <Typography variant='body1' className='font-medium' color='text.primary'>
                    New Images ({formData.newImages.length})
                  </Typography>
                  <Grid container spacing={3}>
                    {formData.newImages.map((item, index) => (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`new-${index}`}>
                        <ImagePreviewCard>
                          <CardMedia
                            component='img'
                            image={item.preview}
                            alt={item.file.name}
                            sx={{ height: 160, objectFit: 'cover' }}
                          />
                          <IconButton
                            className='remove-button'
                            size='small'
                            onClick={() => handleRemoveNewImage(index)}
                            aria-label='Remove image'
                          >
                            <i className='ri-delete-bin-line' />
                          </IconButton>
                        </ImagePreviewCard>
                      </Grid>
                    ))}
                  </Grid>
                </div>
              )}

              {existingImages.length === 0 && formData.newImages.length === 0 && (
                <Typography variant='body2' color='text.secondary'>
                  No images added yet.
                </Typography>
              )}
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
