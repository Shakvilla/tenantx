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
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, string>>>({})
  const [expanded, setExpanded] = useState<string | false>('occupant-info')
  const [isSaving, setIsSaving] = useState(false)

  // Escape used to throw away a part-filled form without a word. The onboarding
  // wizard already confirms before discarding ("Leave onboarding?"); this form
  // did not, so the same key did opposite things two screens apart.
  const [confirmDiscard, setConfirmDiscard] = useState(false)

  // Whatever the form held the moment it opened, so "dirty" means the user typed
  // something rather than merely that the form was populated from a record.
  const baselineRef = useRef<string>('')
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

        const hydrated: FormDataType = {
          firstName: editData.firstName || '',
          lastName: editData.lastName || '',
          email: editData.email || '',
          phone: editData.phone || '',
          occupation: editData.occupation || '',
          dob: editData.dob || '',
          familyMembers: editData.familyMembersCount != null ? editData.familyMembersCount.toString() : '',
          ghanaCardId: editData.ghanaCardId || '',
          idType: editData.idType || '',
          ecName: (ec.name as string) || '',
          ecPhone: (ec.phone as string) || '',
          ecRelationship: (ec.relationship as string) || '',
          previousAddress: {
            country: editData.previousAddress?.country || '',
            state: editData.previousAddress?.state || '',
            city: editData.previousAddress?.city || '',
            zipCode: editData.previousAddress?.zipCode || '',
            address: editData.previousAddress?.address || ''
          },
          permanentAddress: {
            country: editData.permanentAddress?.country || '',
            state: editData.permanentAddress?.state || '',
            city: editData.permanentAddress?.city || '',
            zipCode: editData.permanentAddress?.zipCode || '',
            address: editData.permanentAddress?.address || ''
          },
          propertyId: editData.propertyId || '',
          unitId: editData.unitId || '',
          unitNo: editData.unitNo || '',
          moveInDate: editData.moveInDate ? editData.moveInDate.split('T')[0] : '',
          moveOutDate: editData.moveOutDate ? editData.moveOutDate.split('T')[0] : ''
        }

        setFormData(hydrated)

        // Same object, so the baseline is exactly what the user was shown.
        baselineRef.current = JSON.stringify(hydrated)
        setExistingAvatarUrl(editData.avatar || null)
        setExistingAvatarFileId(editData.avatarFileId || null)
      } else {
        const blank: FormDataType = {
          ...initialData,
          previousAddress: { ...emptyAddress },
          permanentAddress: { ...emptyAddress }
        }

        setFormData(blank)
        baselineRef.current = JSON.stringify(blank)
        setExistingAvatarUrl(null)
        setExistingAvatarFileId(null)
      }

      // Clear any pending new avatar
      if (newAvatarPreview) URL.revokeObjectURL(newAvatarPreview)
      setNewAvatarFile(null)
      setNewAvatarPreview(null)

      setErrors({})
      setExpanded('occupant-info')
      setApiError(null)
      setConfirmDiscard(false)
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
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    // Ghana mobile numbers: local 0XXXXXXXXX (10 digits) or international +233XXXXXXXXX.
    const phoneRegex = /^(?:\+233|0)\d{9}$/

    const newErrors: Partial<Record<keyof FormDataType, string>> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.'
    else if (/\d/.test(formData.firstName)) newErrors.firstName = 'Name cannot contain numbers.'

    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.'
    else if (/\d/.test(formData.lastName)) newErrors.lastName = 'Name cannot contain numbers.'

    if (!formData.email.trim()) newErrors.email = 'Email is required.'
    else if (!emailRegex.test(formData.email.trim())) newErrors.email = 'Enter a valid email address.'

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required.'
    else if (!phoneRegex.test(formData.phone.replace(/\s/g, '')))
      newErrors.phone = 'Enter a valid Ghana phone number, e.g. 0244123456.'

    if (!formData.propertyId) newErrors.propertyId = 'Property is required.'
    if (!formData.unitId) newErrors.unitId = 'Unit is required.'
    if (!formData.moveInDate) newErrors.moveInDate = 'Move-in date is required.'

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

      const hasPrevAddr = Object.values(formData.previousAddress).some(v => v)

      const hasPermAddr = Object.values(formData.permanentAddress).some(v => v)

      // Upload new avatar if selected
      let avatarUrl: string | undefined = existingAvatarUrl || undefined
      let avatarFileId: string | undefined = existingAvatarFileId || undefined

      if (newAvatarFile) {
        const occupantId = mode === 'edit' ? editData?.id : undefined
        const uploaded = await uploadOccupantAvatar(tenantId, newAvatarFile, occupantId)

        avatarUrl = uploaded.url
        avatarFileId = uploaded.fileId
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
        occupation: formData.occupation || undefined,
        familyMembersCount: formData.familyMembers ? (parseInt(formData.familyMembers) || 0) : undefined,
        dob: formData.dob || undefined,
        previousAddress: hasPrevAddr ? formData.previousAddress : undefined,
        permanentAddress: hasPermAddr ? formData.permanentAddress : undefined,
        ghanaCardId: formData.ghanaCardId || undefined,
        idType: formData.idType || undefined
      }

      if (mode === 'edit' && editData?.id) {
        await updateOccupant(tenantId, editData.id, payload as UpdateOccupantPayload)
      } else {
        await createOccupant(tenantId, payload)
      }

      if (newAvatarPreview) URL.revokeObjectURL(newAvatarPreview)
      handleClose()
      setFormData({ ...initialData, previousAddress: { ...emptyAddress }, permanentAddress: { ...emptyAddress } })
      setNewAvatarFile(null)
      setNewAvatarPreview(null)
      setErrors({})
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to save occupant')
    } finally {
      setIsSaving(false)
    }
  }

  const discard = () => {
    if (newAvatarPreview) URL.revokeObjectURL(newAvatarPreview)
    setNewAvatarFile(null)
    setNewAvatarPreview(null)
    setConfirmDiscard(false)
    handleClose()
    setFormData({ ...initialData, previousAddress: { ...emptyAddress }, permanentAddress: { ...emptyAddress } })
    setErrors({})
  }

  /** True once the form differs from what it held when it opened. */
  const isDirty = () =>
    Boolean(newAvatarFile) || JSON.stringify(formData) !== baselineRef.current

  const handleReset = () => {
    if (isDirty()) {
      setConfirmDiscard(true)

      return
    }

    discard()
  }

  const addressFields: Array<{ key: keyof AddressType; label: string; sm: number }> = [
    { key: 'country', label: 'Country', sm: 6 },
    { key: 'state', label: 'State', sm: 6 },
    { key: 'city', label: 'City', sm: 6 },
    { key: 'zipCode', label: 'Zip Code', sm: 6 },
    { key: 'address', label: 'Address', sm: 12 }
  ]

  return (
    <>
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
                    helperText={errors.firstName || ''}
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
                    helperText={errors.lastName || ''}
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
                    helperText={errors.phone || ''}
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
                    helperText={errors.email || ''}
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

          {/* Identification — number and type only; no scans are held */}
          <Accordion
            expanded={expanded === 'id-document'}
            onChange={handleAccordionChange('id-document')}
          >
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-id-card-line text-xl' />
                <Typography variant='h6'>Identification</Typography>
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
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='ID Number'
                    placeholder='GHA-XXXXXXXXX-X'
                    value={formData.ghanaCardId}
                    onChange={e => handleInputChange('ghanaCardId', e.target.value)}
                    inputProps={{ maxLength: 20 }}
                    helperText='The number only — we do not keep a copy of the card'
                  />
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

    {/*
      Escape on a part-filled form used to close everything and throw the typing
      away silently. This is the same shape as the onboarding wizard's
      "Leave onboarding?", so the key does the same thing on both screens.
    */}
    <Dialog open={confirmDiscard} onClose={() => setConfirmDiscard(false)} maxWidth='xs' fullWidth>
      <DialogTitle>Discard what you have entered?</DialogTitle>
      <DialogContent>
        <Typography variant='body2'>
          You have filled in part of this {mode === 'edit' ? 'occupant' : 'new occupant'} and it has not been
          saved. Closing now loses it.
        </Typography>
      </DialogContent>
      <DialogActions className='gap-2'>
        <Button variant='outlined' color='secondary' onClick={() => setConfirmDiscard(false)}>
          Keep editing
        </Button>
        <Button variant='contained' color='error' onClick={discard}>
          Discard
        </Button>
      </DialogActions>
    </Dialog>
    </>
  )
}

export default AddOccupantDialog
