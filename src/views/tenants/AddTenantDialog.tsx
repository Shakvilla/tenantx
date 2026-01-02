'use client'

// React Imports
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

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
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'

// API Imports
import { createTenant, updateTenant, uploadTenantImage, type CreateTenantPayload, type UpdateTenantPayload } from '@/lib/api/tenants'
import { getAllUnits } from '@/lib/api/units'

import type { Unit } from '@/types/property'

type Property = {
  id: number | string
  name: string
}


type TenantEditData = {
  id?: string | number
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  occupation?: string
  age?: number | string
  familyMembers?: number | string
  password?: string
  previousAddress?: {
    country: string
    state: string
    city: string
    zipCode: string
    address: string
  }
  permanentAddress?: {
    country: string
    state: string
    city: string
    zipCode: string
    address: string
  }
  propertyId?: string
  unitId?: string
  roomNo?: string
  propertyName?: string
  leaseStartDate?: string
  leaseEndDate?: string
  avatar?: string
  ghanaCardFront?: string
  ghanaCardBack?: string
}

type Tenant = {
  id: number | string
  name: string
  firstName: string
  lastName: string
  email: string
  phone: string
  occupation: string
  age: number
  familyMembers: number
  password: string
  roomNo: string
  propertyName: string
  propertyId: string
  numberOfUnits: number
  status: 'active' | 'inactive'
  avatar?: string
  previousAddress?: {
    country: string
    state: string
    city: string
    zipCode: string
    address: string
  }
  permanentAddress?: {
    country: string
    state: string
    city: string
    zipCode: string
    address: string
  }
  leaseStartDate?: string
  leaseEndDate?: string
  ghanaCardFront?: string
  ghanaCardBack?: string
}

type Props = {
  open: boolean
  handleClose: () => void
  properties: Property[]
  units: Unit[]
  tenantsData?: any[]
  setData: (data: any[]) => void
  editData?: TenantEditData | null
  mode?: 'add' | 'edit'
}

type FormDataType = {
  firstName: string
  lastName: string
  email: string
  phone: string
  occupation: string
  age: string
  familyMembers: string
  password: string
  unitNo: string // Added to store unit number
  previousAddress: {
    country: string
    state: string
    city: string
    zipCode: string
    address: string
  }
  permanentAddress: {
    country: string
    state: string
    city: string
    zipCode: string
    address: string
  }
  propertyId: string
  unitId: string
  leaseStartDate: string
  leaseEndDate: string
  tenantPicture: File | null
  ghanaCardFront: File | null
  ghanaCardBack: File | null
}

const initialData: FormDataType = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  occupation: '',
  age: '',
  familyMembers: '',
  password: '',
  unitNo: '',
  previousAddress: {
    country: '',
    state: '',
    city: '',
    zipCode: '',
    address: ''
  },
  permanentAddress: {
    country: '',
    state: '',
    city: '',
    zipCode: '',
    address: ''
  },
  propertyId: '',
  unitId: '',
  leaseStartDate: '',
  leaseEndDate: '',
  tenantPicture: null,
  ghanaCardFront: null,
  ghanaCardBack: null
}

const AddTenantDialog = ({
  open,
  handleClose,
  properties,
  units,
  tenantsData,
  setData,
  editData,
  mode = 'add'
}: Props) => {
  // States
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})
  const [expanded, setExpanded] = useState<string | false>('tenant-info')
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const [previewImages, setPreviewImages] = useState<{
    tenantPicture: string | null
    ghanaCardFront: string | null
    ghanaCardBack: string | null
  }>({
    tenantPicture: null,
    ghanaCardFront: null,
    ghanaCardBack: null
  })

  // Dynamic units state - fetched based on selected property
  const [availableUnits, setAvailableUnits] = useState<Array<{ id: string; unit_no: string }>>([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)

  // Refs for file inputs
  const tenantPictureRef = useRef<HTMLInputElement>(null)
  const ghanaCardFrontRef = useRef<HTMLInputElement>(null)
  const ghanaCardBackRef = useRef<HTMLInputElement>(null)

  // Fetch available units when property is selected
  const fetchUnitsForProperty = useCallback(async (propertyId: string) => {
    if (!propertyId) {
      setAvailableUnits([])
      return
    }

    setIsLoadingUnits(true)
    try {
      const response = await getAllUnits({ 
        propertyId, 
        status: 'available',
        pageSize: 100 
      })
      
      if (response?.data) {
        setAvailableUnits(response.data.map(u => ({ 
          id: u.id, 
          unit_no: u.unit_no 
        })))
      }
    } catch (err) {
      console.error('Failed to fetch units:', err)
      setAvailableUnits([])
    } finally {
      setIsLoadingUnits(false)
    }
  }, [])

  // Fetch units when property changes
  useEffect(() => {
    if (formData.propertyId) {
      fetchUnitsForProperty(formData.propertyId)
    } else {
      setAvailableUnits([])
    }
  }, [formData.propertyId, fetchUnitsForProperty])

  // Get filtered units based on selected property - memoized to prevent infinite re-renders
  // Falls back to passed units prop if available, otherwise uses dynamically fetched units
  const filteredUnits = useMemo(
    () => {
      // Use dynamically fetched available units
      if (availableUnits.length > 0) {
        return availableUnits.map(u => ({
          id: u.id,
          unit_no: u.unit_no,
          property_id: formData.propertyId,
          propertyName: ''
        }))
      }
      // Fallback to prop-based units
      return units.filter((unit: Unit) => unit.property_id === formData.propertyId)
    },
    [availableUnits, units, formData.propertyId]
  )

  // Get initial form data based on mode
  const getInitialFormData = (): FormDataType => {
    if (mode === 'edit' && editData) {
      // Find unit by unitId or by roomNo
      const unit = editData.unitId
        ? units.find(u => u.id.toString() === editData.unitId)
        : units.find((u: Unit) => u.property_id === editData.propertyId && u.unit_no === editData.roomNo)
      
      // Merge address objects to ensure all fields are present
      // Always merge with initialData to ensure all fields exist
      const previousAddress = {
        country: editData.previousAddress?.country ?? initialData.previousAddress.country,
        state: editData.previousAddress?.state ?? initialData.previousAddress.state,
        city: editData.previousAddress?.city ?? initialData.previousAddress.city,
        zipCode: editData.previousAddress?.zipCode ?? initialData.previousAddress.zipCode,
        address: editData.previousAddress?.address ?? initialData.previousAddress.address
      }

      const permanentAddress = {
        country: editData.permanentAddress?.country ?? initialData.permanentAddress.country,
        state: editData.permanentAddress?.state ?? initialData.permanentAddress.state,
        city: editData.permanentAddress?.city ?? initialData.permanentAddress.city,
        zipCode: editData.permanentAddress?.zipCode ?? initialData.permanentAddress.zipCode,
        address: editData.permanentAddress?.address ?? initialData.permanentAddress.address
      }
      
      return {
        firstName: editData.firstName || '',
        lastName: editData.lastName || '',
        email: editData.email || '',
        phone: editData.phone || '',
        occupation: editData.occupation || '',
        age: editData.age?.toString() || '',
        familyMembers: editData.familyMembers?.toString() || '',
        password: editData.password || '',
        unitNo: unit?.unit_no || '',
        previousAddress,
        permanentAddress,
        propertyId: editData.propertyId || '',
        unitId: unit?.id.toString() || editData.unitId || '',
        leaseStartDate: editData.leaseStartDate || '',
        leaseEndDate: editData.leaseEndDate || '',
        tenantPicture: null,
        ghanaCardFront: null,
        ghanaCardBack: null
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
      setExpanded('tenant-info')
      setPreviewImages({
        tenantPicture: editData?.avatar || null,
        ghanaCardFront: editData?.ghanaCardFront || null,
        ghanaCardBack: editData?.ghanaCardBack || null
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData, mode])

  // Reset unitId when property changes - only if unitId is not already empty
  useEffect(() => {
    // Guard: Only reset if unitId is not already empty and doesn't match any filtered unit
    if (formData.propertyId && formData.unitId && !filteredUnits.find(u => u.id.toString() === formData.unitId)) {
      setFormData(prev => ({ ...prev, unitId: '', unitNo: '' })) // Also reset unitNo
    }
  }, [formData.propertyId, filteredUnits, formData.unitId])

  // Update unitNo when unitId changes
  useEffect(() => {
    if (formData.unitId) {
      const selectedUnit = filteredUnits.find(u => u.id.toString() === formData.unitId);
      if (selectedUnit && selectedUnit.unit_no !== formData.unitNo) {
        setFormData(prev => ({ ...prev, unitNo: selectedUnit.unit_no }));
      }
    } else if (formData.unitNo !== '') {
      setFormData(prev => ({ ...prev, unitNo: '' }));
    }
  }, [formData.unitId, filteredUnits, formData.unitNo]);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      if (previewImages.tenantPicture && previewImages.tenantPicture.startsWith('blob:')) {
        URL.revokeObjectURL(previewImages.tenantPicture)
      }

      if (previewImages.ghanaCardFront && previewImages.ghanaCardFront.startsWith('blob:')) {
        URL.revokeObjectURL(previewImages.ghanaCardFront)
      }

      if (previewImages.ghanaCardBack && previewImages.ghanaCardBack.startsWith('blob:')) {
        URL.revokeObjectURL(previewImages.ghanaCardBack)
      }
    }
  }, [previewImages])

  const handleExpandChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const handleInputChange = (field: keyof FormDataType, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }
  }

  const handleAddressChange = (
    type: 'previousAddress' | 'permanentAddress',
    field: string,
    value: string
  ) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }))
  }

  const handleFileChange = (type: 'tenantPicture' | 'ghanaCardFront' | 'ghanaCardBack', file: File | null) => {
    setFormData(prev => ({ ...prev, [type]: file }))

    if (file) {
      const previewUrl = URL.createObjectURL(file)

      setPreviewImages(prev => ({ ...prev, [type]: previewUrl }))
    } else {
      setPreviewImages(prev => ({ ...prev, [type]: null }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}

    if (!formData.firstName.trim()) newErrors.firstName = true
    if (!formData.lastName.trim()) newErrors.lastName = true
    if (!formData.email.trim()) newErrors.email = true
    if (!formData.phone.trim()) newErrors.phone = true
    if (!formData.occupation.trim()) newErrors.occupation = true
    if (!formData.age.trim()) newErrors.age = true
    if (!formData.familyMembers.trim()) newErrors.familyMembers = true
    if (!formData.password.trim()) newErrors.password = true
    if (!formData.propertyId) newErrors.propertyId = true
    if (!formData.unitId) newErrors.unitId = true
    if (!formData.leaseStartDate) newErrors.leaseStartDate = true
    if (!formData.leaseEndDate) newErrors.leaseEndDate = true

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = true
    }

    setErrors(newErrors)
    
return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSaving(true)
    setApiError(null)

    try {
      const selectedUnit = filteredUnits.find(u => u.id.toString() === formData.unitId)
      const selectedProperty = properties.find(p => p.id.toString() === formData.propertyId)
      const tenantFullName = `${formData.firstName} ${formData.lastName}`
      const propertyName = selectedProperty?.name || 'Unknown'

      // Upload images if provided
      let avatarUrl: string | undefined

      if (formData.tenantPicture) {
        try {
          const uploadResult = await uploadTenantImage(
            formData.tenantPicture,
            propertyName,
            tenantFullName,
            'avatar'
          )
          avatarUrl = uploadResult.data?.url
        } catch (uploadErr) {
          console.error('Failed to upload avatar:', uploadErr)
          // Continue without avatar if upload fails
        }
      }

      // Upload Ghana card front if provided (for future use)
      if (formData.ghanaCardFront) {
        try {
          await uploadTenantImage(
            formData.ghanaCardFront,
            propertyName,
            tenantFullName,
            'ghanaCardFront'
          )
        } catch (uploadErr) {
          console.error('Failed to upload Ghana card front:', uploadErr)
        }
      }

      // Upload Ghana card back if provided (for future use)
      if (formData.ghanaCardBack) {
        try {
          await uploadTenantImage(
            formData.ghanaCardBack,
            propertyName,
            tenantFullName,
            'ghanaCardBack'
          )
        } catch (uploadErr) {
          console.error('Failed to upload Ghana card back:', uploadErr)
        }
      }

      if (mode === 'add') {
        // Build API payload
        // Convert date inputs (YYYY-MM-DD) to ISO datetime format
        const moveInDate = formData.leaseStartDate 
          ? new Date(formData.leaseStartDate).toISOString() 
          : undefined
        const moveOutDate = formData.leaseEndDate 
          ? new Date(formData.leaseEndDate).toISOString() 
          : undefined

        const payload: CreateTenantPayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          password: formData.password || undefined, // Add password field
          status: 'active', // Default to active
          propertyId: formData.propertyId || undefined,
          unitId: formData.unitId || undefined,
          unitNo: selectedUnit?.unit_no || undefined,
          moveInDate: formData.leaseStartDate ? new Date(formData.leaseStartDate).toISOString() : undefined,
          moveOutDate: formData.leaseEndDate ? new Date(formData.leaseEndDate).toISOString() : undefined,
          avatar: avatarUrl,
          // Add metadata fields
          metadata: {
            occupation: formData.occupation,
            dob: formData.age, // Mapping age/dob field
            familyMembersCount: parseInt(formData.familyMembers) || 0,
            permanentAddress: {
              country: formData.permanentAddress.country,
              state: formData.permanentAddress.state,
              city: formData.permanentAddress.city,
              zipCode: formData.permanentAddress.zipCode,
              address: formData.permanentAddress.address
            },
            previousAddress: {
              country: formData.previousAddress.country,
              state: formData.previousAddress.state,
              city: formData.previousAddress.city,
              zipCode: formData.previousAddress.zipCode,
              address: formData.previousAddress.address
            }
          }
        }

        const response = await createTenant(payload)
        
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to create tenant')
        }

        console.log('Tenant created:', response.data)
      } else if (mode === 'edit' && editData?.id) {
        // Build update payload
        // Convert date inputs (YYYY-MM-DD) to ISO datetime format
        const moveInDate = formData.leaseStartDate 
          ? new Date(formData.leaseStartDate).toISOString() 
          : undefined
        const moveOutDate = formData.leaseEndDate 
          ? new Date(formData.leaseEndDate).toISOString() 
          : undefined

        const payload: UpdateTenantPayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          propertyId: formData.propertyId || undefined,
          unitId: formData.unitId || undefined,
          unitNo: selectedUnit?.unit_no || undefined,
          moveInDate,
          moveOutDate,
          avatar: avatarUrl,
        }

        const response = await updateTenant(editData.id.toString(), payload)
        
        if (!response.success) {
          throw new Error(response.error?.message || 'Failed to update tenant')
        }

        console.log('Tenant updated:', response.data)
      }

      handleClose()
      setFormData(initialData)
      setErrors({})
      setPreviewImages({ tenantPicture: null, ghanaCardFront: null, ghanaCardBack: null })
    } catch (error) {
      // console.error('Failed to save tenant:', error)
      setApiError(error instanceof Error ? error.message : 'Failed to save tenant')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
    setErrors({})
    setPreviewImages({ tenantPicture: null, ghanaCardFront: null, ghanaCardBack: null })
  }

  return (
    <Dialog open={open} onClose={handleReset} maxWidth='lg' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>{mode === 'edit' ? 'Edit Tenant' : 'Add Tenant'}</span>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div className='flex flex-col gap-4 mbs-4'>
          {apiError && (
            <Alert severity='error' onClose={() => setApiError(null)}>
              {apiError}
            </Alert>
          )}
          {/* Tenant Information Section */}
          <Accordion expanded={expanded === 'tenant-info'} onChange={handleExpandChange('tenant-info')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-user-3-line text-xl' />
                <Typography variant='h6'>Tenant Information</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='First Name'
                    placeholder='First name'
                    value={formData.firstName}
                    onChange={e => handleInputChange('firstName', e.target.value)}
                    error={Boolean(errors.firstName)}
                    helperText={errors.firstName ? 'This field is required.' : ''}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Last Name'
                    placeholder='Last name'
                    value={formData.lastName}
                    onChange={e => handleInputChange('lastName', e.target.value)}
                    error={Boolean(errors.lastName)}
                    helperText={errors.lastName ? 'This field is required.' : ''}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Phone Number'
                    placeholder='Number here'
                    value={formData.phone}
                    onChange={e => handleInputChange('phone', e.target.value)}
                    error={Boolean(errors.phone)}
                    helperText={errors.phone ? 'This field is required.' : ''}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Email'
                    type='email'
                    placeholder='Email here'
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    error={Boolean(errors.email)}
                    helperText={errors.email ? 'Please enter a valid email address.' : ''}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Occupation'
                    placeholder='Occupation here'
                    value={formData.occupation}
                    onChange={e => handleInputChange('occupation', e.target.value)}
                    error={Boolean(errors.occupation)}
                    helperText={errors.occupation ? 'This field is required.' : ''}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Age'
                    type='number'
                    placeholder='Age'
                    value={formData.age}
                    onChange={e => handleInputChange('age', e.target.value)}
                    error={Boolean(errors.age)}
                    helperText={errors.age ? 'This field is required.' : ''}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Family Members'
                    placeholder='Family members'
                    value={formData.familyMembers}
                    onChange={e => handleInputChange('familyMembers', e.target.value)}
                    error={Boolean(errors.familyMembers)}
                    helperText={errors.familyMembers ? 'This field is required.' : ''}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Password'
                    type='password'
                    placeholder='Password'
                    value={formData.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                    error={Boolean(errors.password)}
                    helperText={errors.password ? 'This field is required.' : ''}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Typography variant='body2' className='font-medium mbe-2'>
                    Image <span className='text-error'>*</span>
                  </Typography>
                  <input
                    ref={tenantPictureRef}
                    type='file'
                    accept='image/*'
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0] || null

                      handleFileChange('tenantPicture', file)


                      // Reset input to allow selecting the same file again
                      if (e.target) {
                        e.target.value = ''
                      }
                    }}
                  />
                  <Box className='flex items-center gap-4'>
                    {previewImages.tenantPicture ? (
                      <>
                        <Avatar
                          src={previewImages.tenantPicture}
                          sx={{ width: 100, height: 100 }}
                          onClick={() => tenantPictureRef.current?.click()}
                          className='cursor-pointer border-2 border-divider'
                        />
                        <Box className='flex flex-col gap-2'>
                          <Button
                            variant='outlined'
                            size='small'
                            onClick={() => tenantPictureRef.current?.click()}
                            startIcon={<i className='ri-edit-line' />}
                          >
                            Change Image
                          </Button>
                          <Button
                            variant='outlined'
                            size='small'
                            color='error'
                            onClick={() => handleFileChange('tenantPicture', null)}
                            startIcon={<i className='ri-delete-bin-line' />}
                          >
                            Remove
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Button
                        variant='outlined'
                        size='small'
                        onClick={() => tenantPictureRef.current?.click()}
                        startIcon={<i className='ri-image-add-line' />}
                      >
                        Choose File
                      </Button>
                    )}
                    {!previewImages.tenantPicture && (
                      <Typography variant='body2' color='text.secondary'>
                        No file chosen
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='body2' className='font-medium mbe-2'>
                    Ghana Card - Front <span className='text-error'>*</span>
                  </Typography>
                  <input
                    ref={ghanaCardFrontRef}
                    type='file'
                    accept='image/*'
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0] || null

                      handleFileChange('ghanaCardFront', file)

                      if (e.target) {
                        e.target.value = ''
                      }
                    }}
                  />
                  <Box className='flex flex-col gap-2'>
                    {previewImages.ghanaCardFront ? (
                      <>
                        <Box
                          className='border rounded p-2 cursor-pointer hover:bg-actionHover transition-colors'
                          onClick={() => ghanaCardFrontRef.current?.click()}
                        >
                          <img
                            src={previewImages.ghanaCardFront}
                            alt='Ghana Card Front'
                            style={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 4 }}
                          />
                        </Box>
                        <Box className='flex gap-2'>
                          <Button
                            variant='outlined'
                            size='small'
                            onClick={() => ghanaCardFrontRef.current?.click()}
                            startIcon={<i className='ri-edit-line' />}
                            fullWidth
                          >
                            Change
                          </Button>
                          <Button
                            variant='outlined'
                            size='small'
                            color='error'
                            onClick={() => handleFileChange('ghanaCardFront', null)}
                            startIcon={<i className='ri-delete-bin-line' />}
                            fullWidth
                          >
                            Remove
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Button
                        variant='outlined'
                        size='small'
                        onClick={() => ghanaCardFrontRef.current?.click()}
                        startIcon={<i className='ri-file-upload-line' />}
                        fullWidth
                      >
                        Choose File
                      </Button>
                    )}
                    {!previewImages.ghanaCardFront && (
                      <Typography variant='body2' color='text.secondary' className='text-center'>
                        No file chosen
                      </Typography>
                    )}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='body2' className='font-medium mbe-2'>
                    Ghana Card - Back <span className='text-error'>*</span>
                  </Typography>
                  <input
                    ref={ghanaCardBackRef}
                    type='file'
                    accept='image/*'
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0] || null

                      handleFileChange('ghanaCardBack', file)

                      if (e.target) {
                        e.target.value = ''
                      }
                    }}
                  />
                  <Box className='flex flex-col gap-2'>
                    {previewImages.ghanaCardBack ? (
                      <>
                        <Box
                          className='border rounded p-2 cursor-pointer hover:bg-actionHover transition-colors'
                          onClick={() => ghanaCardBackRef.current?.click()}
                        >
                          <img
                            src={previewImages.ghanaCardBack}
                            alt='Ghana Card Back'
                            style={{ width: '100%', maxHeight: 150, objectFit: 'contain', borderRadius: 4 }}
                          />
                        </Box>
                        <Box className='flex gap-2'>
                          <Button
                            variant='outlined'
                            size='small'
                            onClick={() => ghanaCardBackRef.current?.click()}
                            startIcon={<i className='ri-edit-line' />}
                            fullWidth
                          >
                            Change
                          </Button>
                          <Button
                            variant='outlined'
                            size='small'
                            color='error'
                            onClick={() => handleFileChange('ghanaCardBack', null)}
                            startIcon={<i className='ri-delete-bin-line' />}
                            fullWidth
                          >
                            Remove
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Button
                        variant='outlined'
                        size='small'
                        onClick={() => ghanaCardBackRef.current?.click()}
                        startIcon={<i className='ri-file-upload-line' />}
                        fullWidth
                      >
                        Choose File
                      </Button>
                    )}
                    {!previewImages.ghanaCardBack && (
                      <Typography variant='body2' color='text.secondary' className='text-center'>
                        No file chosen
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Previous Address Section */}
          <Accordion expanded={expanded === 'previous-address'} onChange={handleExpandChange('previous-address')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-map-pin-line text-xl' />
                <Typography variant='h6'>Previous Address</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Country'
                    placeholder='Country'
                    value={formData.previousAddress.country}
                    onChange={e => handleAddressChange('previousAddress', 'country', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='State'
                    placeholder='State'
                    value={formData.previousAddress.state}
                    onChange={e => handleAddressChange('previousAddress', 'state', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='City'
                    placeholder='City'
                    value={formData.previousAddress.city}
                    onChange={e => handleAddressChange('previousAddress', 'city', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Zip Code'
                    placeholder='Zip Code'
                    value={formData.previousAddress.zipCode}
                    onChange={e => handleAddressChange('previousAddress', 'zipCode', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Address'
                    placeholder='Address'
                    value={formData.previousAddress.address}
                    onChange={e => handleAddressChange('previousAddress', 'address', e.target.value)}
                    required
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Permanent Address Section */}
          <Accordion expanded={expanded === 'permanent-address'} onChange={handleExpandChange('permanent-address')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-map-pin-line text-xl' />
                <Typography variant='h6'>Permanent Address</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Country'
                    placeholder='Country'
                    value={formData.permanentAddress.country}
                    onChange={e => handleAddressChange('permanentAddress', 'country', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='State'
                    placeholder='State'
                    value={formData.permanentAddress.state}
                    onChange={e => handleAddressChange('permanentAddress', 'state', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='City'
                    placeholder='City'
                    value={formData.permanentAddress.city}
                    onChange={e => handleAddressChange('permanentAddress', 'city', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Zip Code'
                    placeholder='Zip Code'
                    value={formData.permanentAddress.zipCode}
                    onChange={e => handleAddressChange('permanentAddress', 'zipCode', e.target.value)}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Address'
                    placeholder='Address'
                    value={formData.permanentAddress.address}
                    onChange={e => handleAddressChange('permanentAddress', 'address', e.target.value)}
                    required
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Property Details Section */}
          <Accordion expanded={expanded === 'property-details'} onChange={handleExpandChange('property-details')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-building-line text-xl' />
                <Typography variant='h6'>Property Details</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={Boolean(errors.propertyId)} size='small'>
                    <InputLabel id='property-label'>Property Name</InputLabel>
                    <Select
                      size='small'
                      labelId='property-label'
                      label='Property Name'
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
                  <FormControl fullWidth error={Boolean(errors.unitId)} size='small' disabled={!formData.propertyId || isLoadingUnits}>
                    <InputLabel id='unit-label'>
                      {isLoadingUnits ? 'Loading units...' : 'Unit Name'}
                    </InputLabel>
                    <Select
                      size='small'
                      labelId='unit-label'
                      label={isLoadingUnits ? 'Loading units...' : 'Unit Name'}
                      value={formData.unitId}
                      onChange={e => handleInputChange('unitId', e.target.value)}
                      endAdornment={isLoadingUnits ? <CircularProgress size={20} sx={{ mr: 3 }} /> : null}
                    >
                      <MenuItem value=''>
                        {isLoadingUnits ? 'Loading...' : (filteredUnits.length === 0 ? 'No available units' : 'Select Unit')}
                      </MenuItem>
                      {filteredUnits.map(unit => (
                        <MenuItem key={unit.id} value={unit.id}>
                          {unit.unit_no}
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
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Lease Start date'
                    type='date'
                    value={formData.leaseStartDate}
                    onChange={e => handleInputChange('leaseStartDate', e.target.value)}
                    error={Boolean(errors.leaseStartDate)}
                    helperText={errors.leaseStartDate ? 'This field is required.' : ''}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Lease End date'
                    type='date'
                    value={formData.leaseEndDate}
                    onChange={e => handleInputChange('leaseEndDate', e.target.value)}
                    error={Boolean(errors.leaseEndDate)}
                    helperText={errors.leaseEndDate ? 'This field is required.' : ''}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </div>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleReset} disabled={isSaving}>
          Cancel
        </Button>
        <Button 
          variant='contained' 
          color='primary' 
          onClick={handleSubmit}
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={16} color='inherit' /> : null}
        >
          {isSaving ? 'Saving...' : (mode === 'edit' ? 'Update' : 'Save Now')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddTenantDialog
