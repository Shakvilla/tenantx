'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import Avatar from '@mui/material/Avatar'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import { styled } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Styled Component Imports
import StepperWrapper from '@core/styles/stepper'

// API Imports
import { saveDraft as saveDraftApi, updateDraft } from '@/lib/api/properties'

type PropertyEditData = {
  id?: string
  name?: string
  type?: string
  condition?: string
  region?: string
  district?: string
  city?: string
  gpsCode?: string
  description?: string
  bedrooms?: number | string
  bathrooms?: number | string
  rooms?: number | string
  amenities?: Record<string, boolean>
  images?: string[] // URLs for existing images
  thumbnailIndex?: number | null
  price?: string
  address?: string
}

type Props = {
  open: boolean
  handleClose: () => void
  propertyData?: any[]
  setData: (data: any[]) => void
  editData?: PropertyEditData | null
  mode?: 'add' | 'edit'
}

type StepProps = {
  icon: string
  title: string
  subtitle: string
}

const steps: StepProps[] = [
  {
    icon: 'ri-home-line',
    title: 'STEP 1',
    subtitle: 'Basic Information'
  },
  {
    icon: 'ri-home-line',
    title: 'STEP 2',
    subtitle: 'Property Features'
  },
  {
    icon: 'ri-image-line',
    title: 'STEP 3',
    subtitle: 'Upload Images'
  },

  {
    icon: 'ri-check-double-line',
    title: 'SUBMIT: Submit',
    subtitle: 'Submit'
  }
]

type Amenity = {
  id: string
  name: string
  description: string
}

type FormDataType = {
  propertyName: string
  propertyType: string
  condition: string
  region: string
  district: string
  city: string
  gpsCode: string
  description: string
  bedrooms: string
  bathrooms: string
  rooms: string
  amenities: Record<string, boolean>
  images: File[]
  thumbnailIndex: number | null
}

const amenitiesList: Amenity[] = [
  {
    id: 'electricity',
    name: '24-hour Electricity',
    description: 'Uninterrupted electricity supply'
  },
  {
    id: 'kitchenCabinets',
    name: 'Kitchen Cabinets',
    description: 'Ultra modern kitchen cabinets'
  },
  {
    id: 'popCeiling',
    name: 'POP Ceiling',
    description: 'Modern Pop ceiling'
  },
  {
    id: 'tiledFloor',
    name: 'Tiled Floor',
    description: 'Standard and beautiful tiled floor'
  },
  {
    id: 'diningArea',
    name: 'Dining Area',
    description: 'Spacious dining area'
  },
  {
    id: 'parking',
    name: 'Parking Space',
    description: 'Dedicated parking space'
  },
  {
    id: 'security',
    name: 'Security',
    description: '24/7 security surveillance'
  },
  {
    id: 'wifi',
    name: 'WiFi',
    description: 'High-speed internet connection'
  }
]

const initialData: FormDataType = {
  propertyName: '',
  propertyType: '',
  condition: '',
  region: '',
  district: '',
  city: '',
  gpsCode: '',
  description: '',
  bedrooms: '',
  bathrooms: '',
  rooms: '',
  amenities: amenitiesList.reduce(
    (acc, amenity) => {
      acc[amenity.id] = false
      
return acc
    },
    {} as Record<string, boolean>
  ),
  images: [],
  thumbnailIndex: null
}

// Styled Components
const UploadArea = styled(Box)(({ theme }) => ({
  border: '2px dashed',
  borderColor: 'var(--mui-palette-divider)',
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  backgroundColor: 'var(--mui-palette-background-paper)',
  '&:hover': {
    borderColor: 'var(--mui-palette-primary-main)',
    backgroundColor: 'var(--mui-palette-action-hover)'
  }
}))

const ImagePreviewCard = styled(Card, {
  shouldForwardProp: prop => prop !== 'isThumbnail'
})<{ isThumbnail?: boolean }>(({ theme, isThumbnail }) => ({
  position: 'relative',
  border: isThumbnail ? `2px solid ${theme.palette.primary.main}` : '1px solid',
  borderColor: isThumbnail ? theme.palette.primary.main : 'var(--mui-palette-divider)',
  '& .remove-button': {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.8)'
    }
  },
  '& .thumbnail-button': {
    position: 'absolute',
    top: theme.spacing(1),
    left: theme.spacing(1),
    zIndex: 10,
    backgroundColor: isThumbnail ? theme.palette.primary.main : 'rgba(0, 0, 0, 0.6)',
    color: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    '&:hover': {
      backgroundColor: isThumbnail ? theme.palette.primary.dark : 'rgba(0, 0, 0, 0.8)'
    }
  },
  '& .thumbnail-badge': {
    position: 'absolute',
    bottom: theme.spacing(1),
    left: theme.spacing(1),
    zIndex: 10,
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    padding: theme.spacing(0.5, 1),
    borderRadius: theme.shape.borderRadius,
    fontSize: '0.75rem',
    fontWeight: 500,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5)
  }
}))

const AddPropertyDialog = ({ open, handleClose, propertyData, setData, editData, mode = 'add' }: Props) => {
  // States
  const [activeStep, setActiveStep] = useState(0)

  // Initialize form data based on mode
  const getInitialFormData = (): FormDataType => {
    if (mode === 'edit' && editData) {
      return {
        propertyName: editData.name || '',
        propertyType: editData.type || '',
        condition: editData.condition || '',
        region: editData.region || '',
        district: editData.district || '',
        city: editData.city || '',
        gpsCode: editData.gpsCode || '',
        description: editData.description || '',
        bedrooms: editData.bedrooms?.toString() || '',
        bathrooms: editData.bathrooms?.toString() || '',
        rooms: editData.rooms?.toString() || '',
        amenities:
          editData.amenities ||
          amenitiesList.reduce(
            (acc, amenity) => {
              acc[amenity.id] = false
              
return acc
            },
            {} as Record<string, boolean>
          ),
        images: [], // Will be handled separately for existing images
        thumbnailIndex: editData.thumbnailIndex ?? null
      }
    }

    
return {
      ...initialData,
      amenities:
        initialData.amenities ||
        amenitiesList.reduce(
          (acc, amenity) => {
            acc[amenity.id] = false
            
return acc
          },
          {} as Record<string, boolean>
        ),
      images: initialData.images || [],
      thumbnailIndex: initialData.thumbnailIndex ?? null
    }
  }

  const [formData, setFormData] = useState<FormDataType>(getInitialFormData)
  const [existingImages, setExistingImages] = useState<string[]>(editData?.images || [])
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})
  const [isSaving, setIsSaving] = useState(false)
  const [draftId, setDraftId] = useState<string | null>(editData?.id || null)

  // Reset form when dialog opens/closes or editData changes
  useEffect(() => {
    if (open) {
      const newFormData = getInitialFormData()

      setFormData(newFormData)
      setExistingImages(editData?.images || [])
      setActiveStep(0)
      setErrors({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData, mode])

  // Vars
  const isLastStep = activeStep === steps.length - 1

  const handleInputChange = (field: keyof FormDataType, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }


      // Ensure amenities is always defined
      if (!updated.amenities) {
        updated.amenities = amenitiesList.reduce(
          (acc, amenity) => {
            acc[amenity.id] = false
            
return acc
          },
          {} as Record<string, boolean>
        )
      }

      
return updated
    })

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files

    if (files) {
      const fileArray = Array.from(files)

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...fileArray]
      }))
    }
  }

  const handleRemoveImage = (index: number) => {
    setFormData(prev => {
      const newImages = (prev.images || []).filter((_, i) => i !== index)
      let newThumbnailIndex = prev.thumbnailIndex

      // Adjust thumbnail index if needed
      if (prev.thumbnailIndex !== null) {
        if (prev.thumbnailIndex === index) {
          // If removing the thumbnail, reset it
          newThumbnailIndex = null
        } else if (prev.thumbnailIndex > index) {
          // If removing an image before the thumbnail, adjust the index
          newThumbnailIndex = prev.thumbnailIndex - 1
        }
      }

      return {
        ...prev,
        images: newImages,
        thumbnailIndex: newThumbnailIndex
      }
    })
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const files = e.dataTransfer.files

    if (files) {
      const fileArray = Array.from(files).filter(file => file.type.startsWith('image/'))

      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...fileArray]
      }))
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleSetThumbnail = (index: number) => {
    setFormData(prev => ({
      ...prev,
      thumbnailIndex: index
    }))
  }

  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}

    if (step === 0) {
      // Validate Step 1: Basic Information
      if (!formData.propertyName.trim()) newErrors.propertyName = true
      if (!formData.propertyType) newErrors.propertyType = true
      if (!formData.condition) newErrors.condition = true
      if (!formData.region) newErrors.region = true
      if (!formData.district) newErrors.district = true
      if (!formData.city) newErrors.city = true
    } else if (step === 1) {
      // Validate Step 2: Property Features
      if (!formData.bedrooms) newErrors.bedrooms = true
      if (!formData.bathrooms) newErrors.bathrooms = true
      if (!formData.rooms) newErrors.rooms = true
    }

    setErrors(newErrors)
    
return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      if (validateStep(activeStep)) {
        setActiveStep(prevActiveStep => prevActiveStep + 1)
      }
    } else {
      // Submit
      handleSubmit()
    }
  }

  const handlePrev = () => {
    if (activeStep > 0) {
      setActiveStep(prevActiveStep => prevActiveStep - 1)
    }
  }

  const handleStep = (step: number) => () => {
    if (step <= activeStep) {
      setActiveStep(step)
    }
  }

  const handleSubmit = () => {
    // TODO: Implement submit logic
    console.log('Form submitted:', formData)


    // Clean up object URLs
    if (formData.images && formData.images.length > 0) {
      formData.images.forEach(image => {
        URL.revokeObjectURL(URL.createObjectURL(image))
      })
    }

    handleClose()

    const resetData: FormDataType = {
      ...initialData,
      amenities: amenitiesList.reduce(
        (acc, amenity) => {
          acc[amenity.id] = false
          
return acc
        },
        {} as Record<string, boolean>
      ),
      images: [],
      thumbnailIndex: null
    }

    setFormData(resetData)
    setActiveStep(0)
    setErrors({})
  }

  const handleSaveDraft = async () => {
    // Validate at least the property name exists
    if (!formData.propertyName.trim()) {
      setErrors({ propertyName: true })
      return
    }

    setIsSaving(true)

    try {
      // Transform amenities from Record<string, boolean> to string[]
      const amenitiesArray = Object.entries(formData.amenities || {})
        .filter(([, enabled]) => enabled)
        .map(([id]) => id)

      // Build draft payload
      const draftPayload = {
        name: formData.propertyName,
        address: {
          street: formData.city, // Using city as street for now
          city: formData.city,
          country: 'Ghana'
        },
        type: formData.propertyType?.toLowerCase() || undefined,
        ownership: 'own' as const, // Default for drafts
        region: formData.region || undefined,
        district: formData.district || undefined,
        gpsCode: formData.gpsCode || undefined,
        description: formData.description || undefined,
        condition: formData.condition?.toLowerCase() || undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms.replace('+', '')) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms.replace('+', '')) : undefined,
        rooms: formData.rooms ? parseInt(formData.rooms.replace('+', '')) : undefined,
        amenities: amenitiesArray.length > 0 ? amenitiesArray : undefined,
        thumbnailIndex: formData.thumbnailIndex ?? undefined,
        // Note: images need to be uploaded to storage first (handled separately)
      }

      // Call API - if editing draft, update; otherwise save new
      if (mode === 'edit' && editData?.id) {
        const response = await updateDraft(editData.id, draftPayload)
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to update draft')
        }
        setDraftId(editData.id)
      } else if (draftId) {
        const response = await updateDraft(draftId, draftPayload)
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to update draft')
        }
      } else {
        const response = await saveDraftApi(draftPayload)
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to save draft')
        }
        setDraftId(response.data.id)
      }

      // Show success (you could add a toast notification here)
      console.log('Draft saved successfully')
    } catch (error) {
      console.error('Failed to save draft:', error)
      // Show error (you could add a toast notification here)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    // Clean up object URLs
    if (formData.images && formData.images.length > 0) {
      formData.images.forEach(image => {
        URL.revokeObjectURL(URL.createObjectURL(image))
      })
    }

    handleClose()
    const resetData = getInitialFormData()

    setFormData(resetData)
    setExistingImages(editData?.images || [])
    setActiveStep(0)
    setErrors({})
  }

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className='flex flex-col gap-4'>
            <Grid container spacing={6}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  size='small'
                  fullWidth
                  label='Property Name'
                  placeholder='Enter property name'
                  value={formData.propertyName}
                  onChange={e => handleInputChange('propertyName', e.target.value)}
                  error={Boolean(errors.propertyName)}
                  helperText={errors.propertyName ? 'This field is required.' : ''}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={Boolean(errors.propertyType)} size='small'>
                  <InputLabel id='property-type-label'>Property Type</InputLabel>
                  <Select
                    size='small'
                    labelId='property-type-label'
                    label='Property Type'
                    value={formData.propertyType}
                    onChange={e => handleInputChange('propertyType', e.target.value)}
                  >
                    <MenuItem value=''>Select Property Type</MenuItem>
                    <MenuItem value='House'>House</MenuItem>
                    <MenuItem value='Apartment'>Apartment</MenuItem>
                  </Select>
                  {errors.propertyType && (
                    <Typography variant='caption' color='error' className='mts-1'>
                      This field is required.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={Boolean(errors.condition)} size='small'>
                  <InputLabel id='condition-label'>Condition</InputLabel>
                  <Select
                    size='small'
                    labelId='condition-label'
                    label='Condition'
                    value={formData.condition}
                    onChange={e => handleInputChange('condition', e.target.value)}
                  >
                    <MenuItem value=''>Select Condition</MenuItem>
                    <MenuItem value='New'>New</MenuItem>
                    <MenuItem value='Good'>Good</MenuItem>
                    <MenuItem value='Fair'>Fair</MenuItem>
                    <MenuItem value='Poor'>Poor</MenuItem>
                  </Select>
                  {errors.condition && (
                    <Typography variant='caption' color='error' className='mts-1'>
                      This field is required.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={Boolean(errors.region)} size='small'>
                  <InputLabel id='region-label'>Region</InputLabel>
                  <Select
                    size='small'
                    labelId='region-label'
                    label='Region'
                    value={formData.region}
                    onChange={e => handleInputChange('region', e.target.value)}
                  >
                    <MenuItem value=''>Select Region</MenuItem>
                    <MenuItem value='Greater Accra'>Greater Accra</MenuItem>
                    <MenuItem value='Ashanti'>Ashanti</MenuItem>
                    <MenuItem value='Western'>Western</MenuItem>
                    <MenuItem value='Central'>Central</MenuItem>
                  </Select>
                  {errors.region && (
                    <Typography variant='caption' color='error' className='mts-1'>
                      This field is required.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={Boolean(errors.district)} size='small'>
                  <InputLabel id='district-label'>District</InputLabel>
                  <Select
                    size='small'
                    labelId='district-label'
                    label='District'
                    value={formData.district}
                    onChange={e => handleInputChange('district', e.target.value)}
                  >
                    <MenuItem value=''>Select District</MenuItem>
                    <MenuItem value='Adenta'>Adenta</MenuItem>
                    <MenuItem value='Tema'>Tema</MenuItem>
                    <MenuItem value='Accra'>Accra</MenuItem>
                  </Select>
                  {errors.district && (
                    <Typography variant='caption' color='error' className='mts-1'>
                      This field is required.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={Boolean(errors.city)} size='small'>
                  <InputLabel id='city-label'>City</InputLabel>
                  <Select
                    labelId='city-label'
                    label='City'
                    value={formData.city}
                    onChange={e => handleInputChange('city', e.target.value)}
                  >
                    <MenuItem value=''>Select City</MenuItem>
                    <MenuItem value='Accra'>Accra</MenuItem>
                    <MenuItem value='Kumasi'>Kumasi</MenuItem>
                    <MenuItem value='Tema'>Tema</MenuItem>
                  </Select>
                  {errors.city && (
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
                  label='GPS CODE'
                  placeholder='Enter GPS code'
                  value={formData.gpsCode}
                  onChange={e => handleInputChange('gpsCode', e.target.value)}
                  InputProps={{
                    endAdornment: <i className='ri-map-pin-line text-xl' />
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  size='small'
                  fullWidth
                  multiline
                  rows={4}
                  label='Description'
                  placeholder='Enter property description'
                  value={formData.description}
                  onChange={e => handleInputChange('description', e.target.value)}
                />
              </Grid>
            </Grid>
          </div>
        )
      case 1:
        return (
          <div className='flex flex-col gap-6'>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth error={Boolean(errors.bedrooms)} size='small'>
                  <InputLabel id='bedrooms-label'>Bedrooms</InputLabel>
                  <Select
                    size='small'
                    labelId='bedrooms-label'
                    label='Bedrooms'
                    value={formData.bedrooms}
                    onChange={e => handleInputChange('bedrooms', e.target.value)}
                  >
                    <MenuItem value=''>Select Bedrooms</MenuItem>
                    <MenuItem value='1'>1</MenuItem>
                    <MenuItem value='2'>2</MenuItem>
                    <MenuItem value='3'>3</MenuItem>
                    <MenuItem value='4'>4</MenuItem>
                    <MenuItem value='5'>5</MenuItem>
                    <MenuItem value='6+'>6+</MenuItem>
                  </Select>
                  {errors.bedrooms && (
                    <Typography variant='caption' color='error' className='mts-1'>
                      This field is required.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth error={Boolean(errors.bathrooms)} size='small'>
                  <InputLabel id='bathrooms-label'>Bathrooms</InputLabel>
                  <Select
                    size='small'
                    labelId='bathrooms-label'
                    label='Bathrooms'
                    value={formData.bathrooms}
                    onChange={e => handleInputChange('bathrooms', e.target.value)}
                  >
                    <MenuItem value=''>Select Bathrooms</MenuItem>
                    <MenuItem value='1'>1</MenuItem>
                    <MenuItem value='2'>2</MenuItem>
                    <MenuItem value='3'>3</MenuItem>
                    <MenuItem value='4'>4</MenuItem>
                    <MenuItem value='5+'>5+</MenuItem>
                  </Select>
                  {errors.bathrooms && (
                    <Typography variant='caption' color='error' className='mts-1'>
                      This field is required.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <FormControl fullWidth error={Boolean(errors.rooms)} size='small'>
                  <InputLabel id='rooms-label'>Rooms</InputLabel>
                  <Select
                    size='small'
                    labelId='rooms-label'
                    label='Rooms'
                    value={formData.rooms}
                    onChange={e => handleInputChange('rooms', e.target.value)}
                  >
                    <MenuItem value=''>Select Rooms</MenuItem>
                    <MenuItem value='1'>1</MenuItem>
                    <MenuItem value='2'>2</MenuItem>
                    <MenuItem value='3'>3</MenuItem>
                    <MenuItem value='4'>4</MenuItem>
                    <MenuItem value='5'>5</MenuItem>
                    <MenuItem value='6+'>6+</MenuItem>
                  </Select>
                  {errors.rooms && (
                    <Typography variant='caption' color='error' className='mts-1'>
                      This field is required.
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            <Box className='flex flex-col gap-4 md:h-[400px] py-8 px-4 border-2 rounded-sm overflow-auto'>
              <div className='flex flex-col gap-1'>
                <Typography variant='h6' className='font-semibold' color='text.primary'>
                  Property Amenities
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Check all the amenities available in this property
                </Typography>
              </div>

              <div className='flex flex-col gap-4'>
                {amenitiesList.map(amenity => (
                  <Box
                    key={amenity.id}
                    className='flex items-center justify-between p-4 border rounded-lg hover:bg-actionHover transition-colors'
                  >
                    <div className='flex flex-col gap-1 flex-1'>
                      <Typography variant='body1' className='font-medium' color='text.primary'>
                        {amenity.name}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        {amenity.description}
                      </Typography>
                    </div>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={(formData.amenities && formData.amenities[amenity.id]) || false}
                          onChange={e => {
                            setFormData(prev => ({
                              ...prev,
                              amenities: {
                                ...(prev.amenities || {}),
                                [amenity.id]: e.target.checked
                              }
                            }))
                          }}
                          color='primary'
                        />
                      }
                      label=''
                    />
                  </Box>
                ))}
              </div>
            </Box>
          </div>
        )
      case 2:
        return (
          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-2'>
              <Typography variant='h6' className='font-semibold' color='text.primary'>
                Upload Property Images
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Upload images of your property. You can upload multiple images at once.
              </Typography>
            </div>

            <input
              type='file'
              id='image-upload'
              multiple
              accept='image/*'
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />

            <UploadArea
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('image-upload')?.click()}
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
                <Button
                  variant='outlined'
                  color='primary'
                  size='small'
                  startIcon={<i className='ri-upload-cloud-line' />}
                >
                  Choose Files
                </Button>
              </div>
            </UploadArea>

            {/* Existing Images (from edit mode) */}
            {existingImages && existingImages.length > 0 && (
              <div className='flex flex-col gap-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='body1' className='font-medium' color='text.primary'>
                      Existing Images ({existingImages.length})
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Current property images
                    </Typography>
                  </div>
                </div>
                <Grid container spacing={3}>
                  {existingImages.map((imageUrl, index) => {
                    const totalIndex = index // Existing images come first

                    const isThumbnail =
                      formData.thumbnailIndex === totalIndex && formData.thumbnailIndex < existingImages.length

                    
return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`existing-${index}`}>
                        <ImagePreviewCard isThumbnail={isThumbnail}>
                          <CardMedia
                            component='img'
                            image={imageUrl}
                            alt={`Existing property image ${index + 1}`}
                            sx={{
                              height: 200,
                              objectFit: 'cover'
                            }}
                          />
                          <IconButton
                            className='thumbnail-button'
                            size='small'
                            onClick={() => handleSetThumbnail(totalIndex)}
                            aria-label={isThumbnail ? 'Thumbnail selected' : 'Set as thumbnail'}
                            title={isThumbnail ? 'Thumbnail selected' : 'Click to set as thumbnail'}
                            sx={{
                              backgroundColor: isThumbnail ? 'var(--mui-palette-primary-main)' : 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: isThumbnail ? 'var(--mui-palette-primary-dark)' : 'rgba(0, 0, 0, 0.8)'
                              }
                            }}
                          >
                            <i className={isThumbnail ? 'ri-check-line' : 'ri-image-line'} />
                          </IconButton>
                          <IconButton
                            className='remove-button'
                            size='small'
                            onClick={() => {
                              // Remove from existing images
                              const newExisting = existingImages.filter((_, i) => i !== index)

                              setExistingImages(newExisting)


                              // Adjust thumbnail index if needed
                              if (formData.thumbnailIndex === totalIndex) {
                                setFormData(prev => ({ ...prev, thumbnailIndex: null }))
                              } else if (formData.thumbnailIndex !== null && formData.thumbnailIndex > totalIndex) {
                                setFormData(prev => ({ ...prev, thumbnailIndex: prev.thumbnailIndex! - 1 }))
                              }
                            }}
                            aria-label='Remove image'
                          >
                            <i className='ri-close-line' />
                          </IconButton>
                          {isThumbnail && (
                            <div className='thumbnail-badge'>
                              <i className='ri-star-fill' />
                              Thumbnail
                            </div>
                          )}
                        </ImagePreviewCard>
                      </Grid>
                    )
                  })}
                </Grid>
              </div>
            )}

            {/* New Uploaded Images */}
            {formData.images && formData.images.length > 0 && (
              <div className='flex flex-col gap-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='body1' className='font-medium' color='text.primary'>
                      New Uploaded Images ({formData.images.length})
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Click the image icon on any photo to set it as the thumbnail
                    </Typography>
                  </div>
                  {formData.thumbnailIndex !== null && formData.thumbnailIndex >= (existingImages?.length || 0) && (
                    <Typography variant='body2' color='primary' className='font-medium'>
                      <i className='ri-image-line mr-1' />
                      Thumbnail selected
                    </Typography>
                  )}
                </div>
                <Grid container spacing={3}>
                  {formData.images.map((image, index) => {
                    const imageUrl = URL.createObjectURL(image)
                    const totalIndex = (existingImages?.length || 0) + index
                    const isThumbnail = formData.thumbnailIndex === totalIndex

                    
return (
                      <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                        <ImagePreviewCard isThumbnail={isThumbnail}>
                          <CardMedia
                            component='img'
                            image={imageUrl}
                            alt={`Property image ${index + 1}`}
                            sx={{
                              height: 200,
                              objectFit: 'cover'
                            }}
                          />
                          <IconButton
                            className='thumbnail-button'
                            size='small'
                            onClick={() => handleSetThumbnail(totalIndex)}
                            aria-label={isThumbnail ? 'Thumbnail selected' : 'Set as thumbnail'}
                            title={isThumbnail ? 'Thumbnail selected' : 'Click to set as thumbnail'}
                            sx={{
                              backgroundColor: isThumbnail ? 'var(--mui-palette-primary-main)' : 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              '&:hover': {
                                backgroundColor: isThumbnail ? 'var(--mui-palette-primary-dark)' : 'rgba(0, 0, 0, 0.8)'
                              }
                            }}
                          >
                            <i className={isThumbnail ? 'ri-check-line' : 'ri-image-line'} />
                          </IconButton>
                          <IconButton
                            className='remove-button'
                            size='small'
                            onClick={() => {
                              // If removing thumbnail, reset thumbnail index
                              if (formData.thumbnailIndex === totalIndex) {
                                setFormData(prev => ({ ...prev, thumbnailIndex: null }))
                              } else if (formData.thumbnailIndex !== null && formData.thumbnailIndex > totalIndex) {
                                setFormData(prev => ({ ...prev, thumbnailIndex: prev.thumbnailIndex! - 1 }))
                              }

                              handleRemoveImage(index)
                            }}
                            aria-label='Remove image'
                          >
                            <i className='ri-close-line' />
                          </IconButton>
                          {isThumbnail && (
                            <Box className='thumbnail-badge'>
                              <i className='ri-star-fill mr-1' />
                              Thumbnail
                            </Box>
                          )}
                          <Box className='p-2'>
                            <Typography variant='caption' color='text.secondary' className='block truncate'>
                              {image.name}
                            </Typography>
                            <Typography variant='caption' color='text.secondary'>
                              {(image.size / 1024 / 1024).toFixed(2)} MB
                            </Typography>
                          </Box>
                        </ImagePreviewCard>
                      </Grid>
                    )
                  })}
                </Grid>
              </div>
            )}
          </div>
        )
      case 3:
        const selectedAmenities = amenitiesList.filter(amenity => formData.amenities[amenity.id])

        
return (
          <div className='flex flex-col gap-6'>
            <div className='flex flex-col gap-2'>
              <Typography variant='h6' className='font-semibold' color='text.primary'>
                Review Your Property Information
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                Please review all the details before submitting
              </Typography>
            </div>

            {/* Step 1: Basic Information */}
            <Card variant='outlined'>
              <CardContent>
                <div className='flex items-center gap-2 mbe-4'>
                  <Avatar
                    variant='rounded'
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: 'var(--mui-palette-primary-lightOpacity)',
                      color: 'var(--mui-palette-primary-main)'
                    }}
                  >
                    <i className='ri-home-line' />
                  </Avatar>
                  <Typography variant='h6' className='font-semibold' color='text.primary'>
                    Basic Information
                  </Typography>
                </div>
                <Divider className='mbe-4' />
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex flex-col gap-1'>
                      <Typography variant='caption' color='text.secondary'>
                        Property Name
                      </Typography>
                      <Typography variant='body1' className='font-medium' color='text.primary'>
                        {formData.propertyName || '-'}
                      </Typography>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex flex-col gap-1'>
                      <Typography variant='caption' color='text.secondary'>
                        Property Type
                      </Typography>
                      <Typography variant='body1' className='font-medium' color='text.primary'>
                        {formData.propertyType || '-'}
                      </Typography>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex flex-col gap-1'>
                      <Typography variant='caption' color='text.secondary'>
                        Condition
                      </Typography>
                      <Typography variant='body1' className='font-medium' color='text.primary'>
                        {formData.condition || '-'}
                      </Typography>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex flex-col gap-1'>
                      <Typography variant='caption' color='text.secondary'>
                        GPS Code
                      </Typography>
                      <Typography variant='body1' className='font-medium' color='text.primary'>
                        {formData.gpsCode || '-'}
                      </Typography>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <div className='flex flex-col gap-1'>
                      <Typography variant='caption' color='text.secondary'>
                        Region
                      </Typography>
                      <Typography variant='body1' className='font-medium' color='text.primary'>
                        {formData.region || '-'}
                      </Typography>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <div className='flex flex-col gap-1'>
                      <Typography variant='caption' color='text.secondary'>
                        District
                      </Typography>
                      <Typography variant='body1' className='font-medium' color='text.primary'>
                        {formData.district || '-'}
                      </Typography>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <div className='flex flex-col gap-1'>
                      <Typography variant='caption' color='text.secondary'>
                        City
                      </Typography>
                      <Typography variant='body1' className='font-medium' color='text.primary'>
                        {formData.city || '-'}
                      </Typography>
                    </div>
                  </Grid>
                  {formData.description && (
                    <Grid size={{ xs: 12 }}>
                      <div className='flex flex-col gap-1'>
                        <Typography variant='caption' color='text.secondary'>
                          Description
                        </Typography>
                        <Typography variant='body1' color='text.primary'>
                          {formData.description}
                        </Typography>
                      </div>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Step 2: Property Features */}
            <Card variant='outlined'>
              <CardContent>
                <div className='flex items-center gap-2 mbe-4'>
                  <Avatar
                    variant='rounded'
                    sx={{
                      width: 32,
                      height: 32,
                      backgroundColor: 'var(--mui-palette-primary-lightOpacity)',
                      color: 'var(--mui-palette-primary-main)'
                    }}
                  >
                    <i className='ri-home-line' />
                  </Avatar>
                  <Typography variant='h6' className='font-semibold' color='text.primary'>
                    Property Features
                  </Typography>
                </div>
                <Divider className='mbe-4' />
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <div className='flex flex-col gap-1'>
                      <Typography variant='caption' color='text.secondary'>
                        Bedrooms
                      </Typography>
                      <Typography variant='body1' className='font-medium' color='text.primary'>
                        {formData.bedrooms || '-'}
                      </Typography>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <div className='flex flex-col gap-1'>
                      <Typography variant='caption' color='text.secondary'>
                        Bathrooms
                      </Typography>
                      <Typography variant='body1' className='font-medium' color='text.primary'>
                        {formData.bathrooms || '-'}
                      </Typography>
                    </div>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <div className='flex flex-col gap-1'>
                      <Typography variant='caption' color='text.secondary'>
                        Rooms
                      </Typography>
                      <Typography variant='body1' className='font-medium' color='text.primary'>
                        {formData.rooms || '-'}
                      </Typography>
                    </div>
                  </Grid>
                  {selectedAmenities.length > 0 && (
                    <Grid size={{ xs: 12 }}>
                      <div className='flex flex-col gap-2'>
                        <Typography variant='caption' color='text.secondary'>
                          Amenities
                        </Typography>
                        <div className='flex flex-wrap gap-2'>
                          {selectedAmenities.map(amenity => (
                            <Chip
                              key={amenity.id}
                              label={amenity.name}
                              size='small'
                              variant='tonal'
                              color='primary'
                              icon={<i className='ri-check-line' />}
                            />
                          ))}
                        </div>
                      </div>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Step 3: Uploaded Images */}
            {formData.images && formData.images.length > 0 && (
              <Card variant='outlined'>
                <CardContent>
                  <div className='flex items-center gap-2 mbe-4'>
                    <Avatar
                      variant='rounded'
                      sx={{
                        width: 32,
                        height: 32,
                        backgroundColor: 'var(--mui-palette-primary-lightOpacity)',
                        color: 'var(--mui-palette-primary-main)'
                      }}
                    >
                      <i className='ri-image-line' />
                    </Avatar>
                    <Typography variant='h6' className='font-semibold' color='text.primary'>
                      Uploaded Images
                    </Typography>
                  </div>
                  <Divider className='mbe-4' />
                  <div className='flex flex-col gap-2'>
                    <Typography variant='body2' color='text.secondary'>
                      Total Images: {formData.images.length}
                      {formData.thumbnailIndex !== null && (
                        <span className='text-primary ml-2'>
                          <i className='ri-check-line mr-1' />
                          Thumbnail selected
                        </span>
                      )}
                    </Typography>
                    <Grid container spacing={2}>
                      {formData.images.slice(0, 6).map((image, index) => {
                        const imageUrl = URL.createObjectURL(image)
                        const isThumbnail = formData.thumbnailIndex === index

                        
return (
                          <Grid size={{ xs: 6, sm: 4, md: 3 }} key={index}>
                            <Box
                              sx={{
                                position: 'relative',
                                border: isThumbnail ? '2px solid' : '1px solid',
                                borderColor: isThumbnail
                                  ? 'var(--mui-palette-primary-main)'
                                  : 'var(--mui-palette-divider)',
                                borderRadius: 1,
                                overflow: 'hidden'
                              }}
                            >
                              <CardMedia
                                component='img'
                                image={imageUrl}
                                alt={`Property image ${index + 1}`}
                                sx={{
                                  height: 100,
                                  objectFit: 'cover'
                                }}
                              />
                              {isThumbnail && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    backgroundColor: 'var(--mui-palette-primary-main)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: 24,
                                    height: 24,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem'
                                  }}
                                >
                                  <i className='ri-star-fill' />
                                </Box>
                              )}
                            </Box>
                          </Grid>
                        )
                      })}
                    </Grid>
                    {formData.images.length > 6 && (
                      <Typography variant='caption' color='text.secondary' className='mts-2'>
                        + {formData.images.length - 6} more images
                      </Typography>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )
      default:
        return null
    }
  }

  return (
    <Dialog
      fullWidth
      maxWidth='md'
      open={open}
      onClose={handleReset}
      scroll='body'
      closeAfterTransition={false}
      PaperProps={{
        sx: {
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle variant='h4' className='flex gap-2 flex-col pbs-6 pbe-4 pli-6'>
        <div className='flex items-center justify-end'>
          <IconButton onClick={handleReset} size='small'>
            <i className='ri-close-line text-2xl' />
          </IconButton>
        </div>
        <div className='flex items-center justify-center'>
          <div className='flex flex-col items-center justify-center gap-1'>
            <Typography variant='h4' className='font-semibold'>
              {mode === 'edit' ? 'Edit Property' : 'Add Property'}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {mode === 'edit'
                ? 'Update the property information below.'
                : 'Provide accurate information about this property. Take Images as well.'}
            </Typography>
          </div>
        </div>
      </DialogTitle>
      <DialogContent className='pli-6 pbe-6'>
        <div className='flex gap-6 pbs-1 flex-col md:flex-row'>
          <StepperWrapper>
            <Stepper
              nonLinear
              activeStep={activeStep}
              orientation='vertical'
              connector={<></>}
              className='flex flex-col gap-6 min-is-[220px]'
            >
              {steps.map((step, index) => {
                return (
                  <Step key={index} onClick={handleStep(index)}>
                    <StepLabel icon={<></>} className='p-0 cursor-pointer'>
                      <div className='step-label gap-4'>
                        <Avatar
                          variant='rounded'
                          className={classnames(
                            { 'bg-primary text-white shadow-xs': activeStep === index },
                            { 'bg-primaryLight text-primary': activeStep > index },
                            { 'bg-actionHover': activeStep < index }
                          )}
                        >
                          <i className={step.icon} />
                        </Avatar>
                        <div className='flex flex-col gap-1'>
                          <Typography
                            className={classnames('font-medium', {
                              'text-primary': activeStep === index || activeStep > index
                            })}
                            color={activeStep < index ? 'text.secondary' : 'text.primary'}
                          >
                            {step.title}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {step.subtitle}
                          </Typography>
                        </div>
                      </div>
                    </StepLabel>
                  </Step>
                )
              })}
            </Stepper>
          </StepperWrapper>
          <div className='flex-1 flex flex-col gap-4'>
            {renderStepContent()}
            <div className='flex items-center justify-between gap-4 mts-4 pt-4 border-t'>
              <Button
                variant='outlined'
                onClick={handlePrev}
                disabled={activeStep === 0}
                startIcon={<i className='ri-arrow-left-line' />}
              >
                Previous
              </Button>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outlined'
                  color='primary'
                  onClick={handleSaveDraft}
                  startIcon={<i className='ri-save-line' />}
                >
                  SAVE DRAFT 🗐
                </Button>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={handleNext}
                  endIcon={<i className='ri-arrow-right-line' />}
                >
                  {isLastStep ? 'Submit' : 'Next'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddPropertyDialog
