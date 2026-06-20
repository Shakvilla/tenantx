'use client'

// React Imports
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'

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
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'

// API Imports
import {
  createOccupant,
  updateOccupant,
  uploadOccupantAvatar,
  type CreateOccupantPayload,
  type UpdateOccupantPayload,
  type OccupantRecord
} from '@/lib/api/occupants'
import { getAllUnits } from '@/lib/api/units'
import { getStoredTenantId } from '@/lib/api/storage'

type Property = { id: number | string; name: string }

type AddressType = {
  country: string
  state: string
  city: string
  zipCode: string
  address: string
}

type FormDataType = {
  firstName: string
  lastName: string
  email: string
  phone: string
  occupation: string
  dob: string
  familyMembers: string
  ghanaCardId: string
  idType: string
  // Emergency contact
  ecName: string
  ecPhone: string
  ecRelationship: string
  previousAddress: AddressType
  permanentAddress: AddressType
  propertyId: string
  unitId: string
  unitNo: string
  moveInDate: string
  moveOutDate: string
}

const emptyAddress: AddressType = { country: '', state: '', city: '', zipCode: '', address: '' }

const initialData: FormDataType = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  occupation: '',
  dob: '',
  familyMembers: '',
  ghanaCardId: '',
  idType: '',
  ecName: '',
  ecPhone: '',
  ecRelationship: '',
  previousAddress: { ...emptyAddress },
  permanentAddress: { ...emptyAddress },
  propertyId: '',
  unitId: '',
  unitNo: '',
  moveInDate: '',
  moveOutDate: ''
}

type Props = {
  open: boolean
  handleClose: () => void
  properties: Property[]
  editData?: OccupantRecord | null
  mode?: 'add' | 'edit'
}

const AddOccupantDialog = ({ open, handleClose, properties, editData, mode = 'add' }: Props) => {
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})
  const [expanded, setExpanded] = useState<string | false>('occupant-info')
  const [isSaving, setIsSaving] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [availableUnits, setAvailableUnits] = useState<Array<{ id: string; unitNo: string }>>([])
  const [isLoadingUnits, setIsLoadingUnits] = useState(false)

  // Avatar state — separate from form fields
  const [existingAvatarUrl, setExistingAvatarUrl] = useState<string | null>(null)
  const [existingAvatarFileId, setExistingAvatarFileId] = useState<string | null>(null)
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null)
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  // ID card image state
  const [existingFrontUrl, setExistingFrontUrl] = useState<string | null>(null)
  const [existingFrontFileId, setExistingFrontFileId] = useState<string | null>(null)
  const [newFrontFile, setNewFrontFile] = useState<File | null>(null)
  const [newFrontPreview, setNewFrontPreview] = useState<string | null>(null)
  const frontInputRef = useRef<HTMLInputElement>(null)

  const [existingBackUrl, setExistingBackUrl] = useState<string | null>(null)
  const [existingBackFileId, setExistingBackFileId] = useState<string | null>(null)
  const [newBackFile, setNewBackFile] = useState<File | null>(null)
  const [newBackPreview, setNewBackPreview] = useState<string | null>(null)
  const backInputRef = useRef<HTMLInputElement>(null)

  // Fetch available units for a given property
  const fetchUnitsForProperty = useCallback(async (propertyId: string) => {
    if (!propertyId) {
      setAvailableUnits([])

      return
    }

    const tenantId = getStoredTenantId()

    if (!tenantId) return

    setIsLoadingUnits(true)

    try {
      const response = await getAllUnits(tenantId, { propertyId, status: 'available', size: 100 })

      if (response?.data) {
        setAvailableUnits(response.data.map(u => ({ id: u.id, unitNo: u.unitNo })))
      }
    } catch (err) {
      console.error('Failed to fetch units:', err)
      setAvailableUnits([])
    } finally {
      setIsLoadingUnits(false)
    }
  }, [])

  useEffect(() => {
    if (formData.propertyId) fetchUnitsForProperty(formData.propertyId)
    else setAvailableUnits([])
  }, [formData.propertyId, fetchUnitsForProperty])

  // In edit mode, always include the occupant's currently-assigned unit even if it's not
  // "available" (it will be "occupied"). Without this, the reset-unitId effect clears the
  // field and validation fails before the form can submit.
  const filteredUnits = useMemo(() => {
    if (mode === 'edit' && editData?.unitId && editData?.unitNo) {
      const alreadyPresent = availableUnits.some(u => u.id === editData.unitId)

      if (!alreadyPresent) {
        return [{ id: editData.unitId, unitNo: editData.unitNo }, ...availableUnits]
      }
    }

    return availableUnits
  }, [availableUnits, mode, editData?.unitId, editData?.unitNo])

  // Populate form when dialog opens
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && editData) {
        const ec = editData.emergencyContact || {}

        setFormData({
          firstName: editData.firstName || '',
          lastName: editData.lastName || '',
          email: editData.email || '',
          phone: editData.phone || '',
          occupation: (ec.occupation as string) || '',
          dob: (ec.dob as string) || '',
          familyMembers: ec.familyMembersCount?.toString() || '',
          ghanaCardId: editData.ghanaCardId || '',
          idType: editData.idType || '',
          ecName: (ec.name as string) || '',
          ecPhone: (ec.phone as string) || '',
          ecRelationship: (ec.relationship as string) || '',
          previousAddress: {
            country: (ec.previousAddress as any)?.country || '',
            state: (ec.previousAddress as any)?.state || '',
            city: (ec.previousAddress as any)?.city || '',
            zipCode: (ec.previousAddress as any)?.zipCode || '',
            address: (ec.previousAddress as any)?.address || ''
          },
          permanentAddress: {
            country: (ec.permanentAddress as any)?.country || '',
            state: (ec.permanentAddress as any)?.state || '',
            city: (ec.permanentAddress as any)?.city || '',
            zipCode: (ec.permanentAddress as any)?.zipCode || '',
            address: (ec.permanentAddress as any)?.address || ''
          },
          propertyId: editData.propertyId || '',
          unitId: editData.unitId || '',
          unitNo: editData.unitNo || '',
          moveInDate: editData.moveInDate ? editData.moveInDate.split('T')[0] : '',
          moveOutDate: editData.moveOutDate ? editData.moveOutDate.split('T')[0] : ''
        })
        setExistingAvatarUrl(editData.avatar || null)
        setExistingAvatarFileId(editData.avatarFileId || null)
        setExistingFrontUrl(editData.idCardFrontUrl || null)
        setExistingFrontFileId(editData.idCardFrontFileId || null)
        setExistingBackUrl(editData.idCardBackUrl || null)
        setExistingBackFileId(editData.idCardBackFileId || null)
      } else {
        setFormData({ ...initialData, previousAddress: { ...emptyAddress }, permanentAddress: { ...emptyAddress } })
        setExistingAvatarUrl(null)
        setExistingAvatarFileId(null)
        setExistingFrontUrl(null)
        setExistingFrontFileId(null)
        setExistingBackUrl(null)
        setExistingBackFileId(null)
      }

      // Clear any pending new avatar/ID card images
      if (newAvatarPreview) URL.revokeObjectURL(newAvatarPreview)
      setNewAvatarFile(null)
      setNewAvatarPreview(null)
      if (newFrontPreview) URL.revokeObjectURL(newFrontPreview)
      setNewFrontFile(null)
      setNewFrontPreview(null)
      if (newBackPreview) URL.revokeObjectURL(newBackPreview)
      setNewBackFile(null)
      setNewBackPreview(null)

      setErrors({})
      setExpanded('occupant-info')
      setApiError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData, mode])

  // Reset unitId if no longer valid after property change
  useEffect(() => {
    if (formData.propertyId && formData.unitId && !filteredUnits.find(u => u.id === formData.unitId)) {
      setFormData(prev => ({ ...prev, unitId: '', unitNo: '' }))
    }
  }, [formData.propertyId, filteredUnits, formData.unitId])

  // Sync unitNo when unitId changes
  useEffect(() => {
    if (formData.unitId) {
      const selectedUnit = filteredUnits.find(u => u.id === formData.unitId)

      if (selectedUnit && selectedUnit.unitNo !== formData.unitNo) {
        setFormData(prev => ({ ...prev, unitNo: selectedUnit.unitNo }))
      }
    } else if (formData.unitNo !== '') {
      setFormData(prev => ({ ...prev, unitNo: '' }))
    }
  }, [formData.unitId, filteredUnits, formData.unitNo])

  const handleInputChange = (field: keyof FormDataType, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }))
  }

  const handleAddressChange = (type: 'previousAddress' | 'permanentAddress', field: string, value: string) => {
    setFormData(prev => ({ ...prev, [type]: { ...prev[type], [field]: value } }))
  }

  const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) return
    if (newAvatarPreview) URL.revokeObjectURL(newAvatarPreview)
    setNewAvatarFile(file)
    setNewAvatarPreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  const handleRemoveNewAvatar = () => {
    if (newAvatarPreview) URL.revokeObjectURL(newAvatarPreview)
    setNewAvatarFile(null)
    setNewAvatarPreview(null)
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}

    if (!formData.firstName.trim()) newErrors.firstName = true
    if (!formData.lastName.trim()) newErrors.lastName = true
    if (!formData.email.trim()) newErrors.email = true
    if (!formData.phone.trim()) newErrors.phone = true
    if (!formData.propertyId) newErrors.propertyId = true
    if (!formData.unitId) newErrors.unitId = true
    if (!formData.moveInDate) newErrors.moveInDate = true

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (formData.email && !emailRegex.test(formData.email)) newErrors.email = true

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

    setIsSaving(true)
    setApiError(null)

    try {
      // Build emergencyContact map — stores ec fields + extra profile data
      const emergencyContact: Record<string, any> = {}

      if (formData.ecName) emergencyContact.name = formData.ecName
      if (formData.ecPhone) emergencyContact.phone = formData.ecPhone
      if (formData.ecRelationship) emergencyContact.relationship = formData.ecRelationship
      if (formData.occupation) emergencyContact.occupation = formData.occupation
      if (formData.dob) emergencyContact.dob = formData.dob
      if (formData.familyMembers) emergencyContact.familyMembersCount = parseInt(formData.familyMembers) || 0

      const hasPrevAddr = Object.values(formData.previousAddress).some(v => v)

      if (hasPrevAddr) emergencyContact.previousAddress = formData.previousAddress

      const hasPermAddr = Object.values(formData.permanentAddress).some(v => v)

      if (hasPermAddr) emergencyContact.permanentAddress = formData.permanentAddress

      // Upload new avatar if selected
      let avatarUrl: string | undefined = existingAvatarUrl || undefined
      let avatarFileId: string | undefined = existingAvatarFileId || undefined

      if (newAvatarFile) {
        const occupantId = mode === 'edit' ? editData?.id : undefined
        const uploaded = await uploadOccupantAvatar(tenantId, newAvatarFile, occupantId)

        avatarUrl = uploaded.url
        avatarFileId = uploaded.fileId
      }

      // Upload ID card images if selected
      const { uploadImages } = await import('@/lib/imagekit')
      const occupantFolder = mode === 'edit' && editData?.id
        ? `/tenantx/${tenantId}/occupants/${editData.id}/id`
        : `/tenantx/${tenantId}/occupants/id`

      let frontUrl: string | undefined = existingFrontUrl || undefined
      let frontFileId: string | undefined = existingFrontFileId || undefined
      if (newFrontFile) {
        const [uploaded] = await uploadImages([newFrontFile], { folder: occupantFolder })
        frontUrl = uploaded.url
        frontFileId = uploaded.fileId
      }

      let backUrl: string | undefined = existingBackUrl || undefined
      let backFileId: string | undefined = existingBackFileId || undefined
      if (newBackFile) {
        const [uploaded] = await uploadImages([newBackFile], { folder: occupantFolder })
        backUrl = uploaded.url
        backFileId = uploaded.fileId
      }

      const payload: CreateOccupantPayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        avatar: avatarUrl,
        avatarFileId,
        status: 'active',
        propertyId: formData.propertyId || undefined,
        unitId: formData.unitId || undefined,
        unitNo: formData.unitNo || undefined,
        moveInDate: formData.moveInDate ? new Date(formData.moveInDate).toISOString() : undefined,
        moveOutDate: formData.moveOutDate ? new Date(formData.moveOutDate).toISOString() : undefined,
        emergencyContact: Object.keys(emergencyContact).length > 0 ? emergencyContact : undefined,
        ghanaCardId: formData.ghanaCardId || undefined,
        idType: formData.idType || undefined,
        idCardFrontUrl: frontUrl,
        idCardFrontFileId: frontFileId,
        idCardBackUrl: backUrl,
        idCardBackFileId: backFileId
      }

      if (mode === 'edit' && editData?.id) {
        await updateOccupant(tenantId, editData.id, payload as UpdateOccupantPayload)
      } else {
        await createOccupant(tenantId, payload)
      }

      if (newAvatarPreview) URL.revokeObjectURL(newAvatarPreview)
      if (newFrontPreview) URL.revokeObjectURL(newFrontPreview)
      if (newBackPreview) URL.revokeObjectURL(newBackPreview)
      handleClose()
      setFormData({ ...initialData, previousAddress: { ...emptyAddress }, permanentAddress: { ...emptyAddress } })
      setNewAvatarFile(null)
      setNewAvatarPreview(null)
      setNewFrontFile(null)
      setNewFrontPreview(null)
      setNewBackFile(null)
      setNewBackPreview(null)
      setErrors({})
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to save occupant')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (newAvatarPreview) URL.revokeObjectURL(newAvatarPreview)
    setNewAvatarFile(null)
    setNewAvatarPreview(null)
    if (newFrontPreview) URL.revokeObjectURL(newFrontPreview)
    setNewFrontFile(null)
    setNewFrontPreview(null)
    if (newBackPreview) URL.revokeObjectURL(newBackPreview)
    setNewBackFile(null)
    setNewBackPreview(null)
    handleClose()
    setFormData({ ...initialData, previousAddress: { ...emptyAddress }, permanentAddress: { ...emptyAddress } })
    setErrors({})
  }

  const addressFields: Array<{ key: keyof AddressType; label: string; sm: number }> = [
    { key: 'country', label: 'Country', sm: 6 },
    { key: 'state', label: 'State', sm: 6 },
    { key: 'city', label: 'City', sm: 6 },
    { key: 'zipCode', label: 'Zip Code', sm: 6 },
    { key: 'address', label: 'Address', sm: 12 }
  ]

  return (
    <Dialog open={open} onClose={handleReset} maxWidth='lg' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>{mode === 'edit' ? 'Edit Occupant' : 'Add Occupant'}</span>
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

          {/* Occupant Information */}
          <Accordion expanded={expanded === 'occupant-info'} onChange={handleAccordionChange('occupant-info')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-user-3-line text-xl' />
                <Typography variant='h6'>Occupant Information</Typography>
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
                    placeholder='Phone number'
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
                    placeholder='Email address'
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
                    placeholder='Occupation'
                    value={formData.occupation}
                    onChange={e => handleInputChange('occupation', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Date of Birth'
                    type='date'
                    value={formData.dob}
                    onChange={e => handleInputChange('dob', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Family Members'
                    type='number'
                    placeholder='Number of family members'
                    value={formData.familyMembers}
                    onChange={e => handleInputChange('familyMembers', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Ghana Card ID'
                    placeholder='GHA-XXXXXXXXX-X'
                    value={formData.ghanaCardId}
                    onChange={e => handleInputChange('ghanaCardId', e.target.value)}
                    inputProps={{ maxLength: 20 }}
                    helperText='National ID number (optional)'
                  />
                </Grid>

                {/* Avatar upload */}
                <Grid size={{ xs: 12 }}>
                  <input
                    ref={avatarInputRef}
                    type='file'
                    accept='image/*'
                    style={{ display: 'none' }}
                    onChange={handleAvatarFileChange}
                  />
                  <Box className='flex items-center gap-4'>
                    <Tooltip title='Click to change photo' placement='top'>
                      <Avatar
                        src={newAvatarPreview ?? existingAvatarUrl ?? undefined}
                        sx={{ width: 80, height: 80, cursor: 'pointer', border: '2px dashed', borderColor: 'divider' }}
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <i className='ri-user-3-line text-3xl' />
                      </Avatar>
                    </Tooltip>
                    <Box className='flex flex-col gap-2'>
                      <Typography variant='body2' color='text.primary' className='font-medium'>
                        {newAvatarFile ? newAvatarFile.name : 'Profile Photo'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        JPG, PNG or GIF. Max 5MB.
                      </Typography>
                      <Box className='flex gap-2'>
                        <Button
                          size='small'
                          variant='outlined'
                          startIcon={<i className='ri-upload-cloud-line' />}
                          onClick={() => avatarInputRef.current?.click()}
                        >
                          {newAvatarFile || existingAvatarUrl ? 'Change' : 'Upload'}
                        </Button>
                        {(newAvatarFile || existingAvatarUrl) && (
                          <Button
                            size='small'
                            variant='outlined'
                            color='error'
                            onClick={() => {
                              handleRemoveNewAvatar()
                              setExistingAvatarUrl(null)
                              setExistingAvatarFileId(null)
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Emergency Contact */}
          <Accordion
            expanded={expanded === 'emergency-contact'}
            onChange={handleAccordionChange('emergency-contact')}
          >
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-alert-line text-xl' />
                <Typography variant='h6'>Emergency Contact</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Contact Name'
                    placeholder='Full name'
                    value={formData.ecName}
                    onChange={e => handleInputChange('ecName', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Contact Phone'
                    placeholder='Phone number'
                    value={formData.ecPhone}
                    onChange={e => handleInputChange('ecPhone', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Relationship'
                    placeholder='e.g. Spouse, Parent'
                    value={formData.ecRelationship}
                    onChange={e => handleInputChange('ecRelationship', e.target.value)}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ID Document */}
          <Accordion
            expanded={expanded === 'id-document'}
            onChange={handleAccordionChange('id-document')}
          >
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-id-card-line text-xl' />
                <Typography variant='h6'>ID Document</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                {/* ID type */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel id='id-type-label'>ID Type</InputLabel>
                    <Select
                      labelId='id-type-label'
                      label='ID Type'
                      value={formData.idType}
                      onChange={e => handleInputChange('idType', e.target.value)}
                    >
                      <MenuItem value=''>— Select ID type —</MenuItem>
                      {['Ghana Card', 'Passport', 'Voter ID', 'NHIS Card', "Driver's Licence", 'Other'].map(t => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* hidden file inputs */}
                <input ref={frontInputRef} type='file' accept='image/*,application/pdf' style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return
                    if (newFrontPreview) URL.revokeObjectURL(newFrontPreview)
                    setNewFrontFile(f); setNewFrontPreview(URL.createObjectURL(f)); e.target.value = ''
                  }} />
                <input ref={backInputRef} type='file' accept='image/*,application/pdf' style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]; if (!f) return
                    if (newBackPreview) URL.revokeObjectURL(newBackPreview)
                    setNewBackFile(f); setNewBackPreview(URL.createObjectURL(f)); e.target.value = ''
                  }} />

                {/* Front */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box className='flex flex-col gap-2'>
                    <Typography variant='body2' color='text.secondary' className='font-medium'>Front of ID</Typography>
                    {(newFrontPreview || existingFrontUrl) && (
                      <Box
                        component='img'
                        src={newFrontPreview ?? existingFrontUrl ?? undefined}
                        alt='ID front'
                        sx={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                      />
                    )}
                    <Box className='flex gap-2'>
                      <Button size='small' variant='outlined' startIcon={<i className='ri-upload-cloud-line' />}
                        onClick={() => frontInputRef.current?.click()}>
                        {(newFrontFile || existingFrontUrl) ? 'Change' : 'Upload Front'}
                      </Button>
                      {(newFrontFile || existingFrontUrl) && (
                        <Button size='small' variant='outlined' color='error' onClick={() => {
                          if (newFrontPreview) URL.revokeObjectURL(newFrontPreview)
                          setNewFrontFile(null); setNewFrontPreview(null); setExistingFrontUrl(null); setExistingFrontFileId(null)
                        }}>Remove</Button>
                      )}
                    </Box>
                    <Typography variant='caption' color='text.secondary'>JPG, PNG or PDF. Max 5MB.</Typography>
                  </Box>
                </Grid>

                {/* Back */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box className='flex flex-col gap-2'>
                    <Typography variant='body2' color='text.secondary' className='font-medium'>Back of ID</Typography>
                    {(newBackPreview || existingBackUrl) && (
                      <Box
                        component='img'
                        src={newBackPreview ?? existingBackUrl ?? undefined}
                        alt='ID back'
                        sx={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                      />
                    )}
                    <Box className='flex gap-2'>
                      <Button size='small' variant='outlined' startIcon={<i className='ri-upload-cloud-line' />}
                        onClick={() => backInputRef.current?.click()}>
                        {(newBackFile || existingBackUrl) ? 'Change' : 'Upload Back'}
                      </Button>
                      {(newBackFile || existingBackUrl) && (
                        <Button size='small' variant='outlined' color='error' onClick={() => {
                          if (newBackPreview) URL.revokeObjectURL(newBackPreview)
                          setNewBackFile(null); setNewBackPreview(null); setExistingBackUrl(null); setExistingBackFileId(null)
                        }}>Remove</Button>
                      )}
                    </Box>
                    <Typography variant='caption' color='text.secondary'>JPG, PNG or PDF. Max 5MB.</Typography>
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Previous Address */}
          <Accordion
            expanded={expanded === 'previous-address'}
            onChange={handleAccordionChange('previous-address')}
          >
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-map-pin-line text-xl' />
                <Typography variant='h6'>Previous Address</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                {addressFields.map(({ key, label, sm }) => (
                  <Grid size={{ xs: 12, sm }} key={key}>
                    <TextField
                      size='small'
                      fullWidth
                      label={label}
                      placeholder={label}
                      value={formData.previousAddress[key]}
                      onChange={e => handleAddressChange('previousAddress', key, e.target.value)}
                    />
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Permanent Address */}
          <Accordion
            expanded={expanded === 'permanent-address'}
            onChange={handleAccordionChange('permanent-address')}
          >
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-map-pin-2-line text-xl' />
                <Typography variant='h6'>Permanent Address</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                {addressFields.map(({ key, label, sm }) => (
                  <Grid size={{ xs: 12, sm }} key={key}>
                    <TextField
                      size='small'
                      fullWidth
                      label={label}
                      placeholder={label}
                      value={formData.permanentAddress[key]}
                      onChange={e => handleAddressChange('permanentAddress', key, e.target.value)}
                    />
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Property Details */}
          <Accordion
            expanded={expanded === 'property-details'}
            onChange={handleAccordionChange('property-details')}
          >
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
                      labelId='property-label'
                      label='Property Name'
                      value={formData.propertyId}
                      onChange={e => handleInputChange('propertyId', e.target.value)}
                    >
                      <MenuItem value=''>Select Property</MenuItem>
                      {properties.map(p => (
                        <MenuItem key={p.id} value={p.id.toString()}>
                          {p.name}
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
                  <FormControl
                    fullWidth
                    error={Boolean(errors.unitId)}
                    size='small'
                    disabled={!formData.propertyId || isLoadingUnits}
                  >
                    <InputLabel id='unit-label'>{isLoadingUnits ? 'Loading units...' : 'Unit'}</InputLabel>
                    <Select
                      labelId='unit-label'
                      label={isLoadingUnits ? 'Loading units...' : 'Unit'}
                      value={formData.unitId}
                      onChange={e => handleInputChange('unitId', e.target.value)}
                      endAdornment={isLoadingUnits ? <CircularProgress size={20} sx={{ mr: 3 }} /> : null}
                    >
                      <MenuItem value=''>
                        {isLoadingUnits ? 'Loading...' : filteredUnits.length === 0 ? 'No available units' : 'Select Unit'}
                      </MenuItem>
                      {filteredUnits.map(u => (
                        <MenuItem key={u.id} value={u.id}>
                          {u.unitNo}
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
                    label='Move In Date'
                    type='date'
                    value={formData.moveInDate}
                    onChange={e => handleInputChange('moveInDate', e.target.value)}
                    error={Boolean(errors.moveInDate)}
                    helperText={errors.moveInDate ? 'This field is required.' : ''}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Move Out Date'
                    type='date'
                    value={formData.moveOutDate}
                    onChange={e => handleInputChange('moveOutDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
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
          {isSaving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddOccupantDialog
