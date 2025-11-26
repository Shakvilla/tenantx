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
import CardMedia from '@mui/material/CardMedia'
import { styled } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Styled Component Imports
import StepperWrapper from '@core/styles/stepper'

type Props = {
  open: boolean
  handleClose: () => void
  propertyData?: any[]
  setData: (data: any[]) => void
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

const AddPropertyDialog = ({ open, handleClose, propertyData, setData }: Props) => {
  // States
  const [activeStep, setActiveStep] = useState(0)
  const [formData, setFormData] = useState<FormDataType>(() => {
    // Ensure amenities and images are always initialized
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
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})

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

  const handleSaveDraft = () => {
    // TODO: Implement save draft logic
    console.log('Draft saved:', formData)
  }

  const handleReset = () => {
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

            {formData.images && formData.images.length > 0 && (
              <div className='flex flex-col gap-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='body1' className='font-medium' color='text.primary'>
                      Uploaded Images ({formData.images.length})
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Click the image icon on any photo to set it as the thumbnail
                    </Typography>
                  </div>
                  {formData.thumbnailIndex !== null && (
                    <Typography variant='body2' color='primary' className='font-medium'>
                      <i className='ri-image-line mr-1' />
                      Thumbnail selected
                    </Typography>
                  )}
                </div>
                <Grid container spacing={3}>
                  {formData.images.map((image, index) => {
                    const imageUrl = URL.createObjectURL(image)
                    const isThumbnail = formData.thumbnailIndex === index
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
                            onClick={() => handleSetThumbnail(index)}
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
                              if (formData.thumbnailIndex === index) {
                                setFormData(prev => ({ ...prev, thumbnailIndex: null }))
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
        return (
          <div className='flex flex-col gap-4'>
            <Typography variant='body1' color='text.secondary'>
              Payment Details form will be implemented here
            </Typography>
          </div>
        )
      case 4:
        return (
          <div className='flex flex-col gap-4'>
            <Typography variant='body1' color='text.secondary'>
              Review and submit your property information
            </Typography>
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
              Add Property
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              Provide accurate information about this property. Take Images as well.
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
