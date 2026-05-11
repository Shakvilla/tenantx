'use client'

// React Imports
import { useState, useEffect, useCallback, useMemo } from 'react'

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

// API Imports
import {
  createOccupant,
  updateOccupant,
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
  avatarUrl: string
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
  avatarUrl: '',
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

  const filteredUnits = useMemo(() => availableUnits, [availableUnits])

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
          avatarUrl: editData.avatar || '',
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
      } else {
        setFormData({ ...initialData, previousAddress: { ...emptyAddress }, permanentAddress: { ...emptyAddress } })
      }

      setErrors({})
      setExpanded('occupant-info')
      setApiError(null)
    }
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

      const payload: CreateOccupantPayload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        avatar: formData.avatarUrl || undefined,
        status: 'active',
        propertyId: formData.propertyId || undefined,
        unitId: formData.unitId || undefined,
        unitNo: formData.unitNo || undefined,
        moveInDate: formData.moveInDate ? new Date(formData.moveInDate).toISOString() : undefined,
        moveOutDate: formData.moveOutDate ? new Date(formData.moveOutDate).toISOString() : undefined,
        emergencyContact: Object.keys(emergencyContact).length > 0 ? emergencyContact : undefined
      }

      if (mode === 'edit' && editData?.id) {
        const updatePayload: UpdateOccupantPayload = { ...payload }
        const response = await updateOccupant(tenantId, editData.id, updatePayload)

        if (!response.success) throw new Error(response.error?.message || 'Failed to update occupant')
      } else {
        const response = await createOccupant(tenantId, payload)

        if (!response.success) throw new Error(response.error?.message || 'Failed to create occupant')
      }

      handleClose()
      setFormData({ ...initialData, previousAddress: { ...emptyAddress }, permanentAddress: { ...emptyAddress } })
      setErrors({})
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to save occupant')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
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
                <Grid size={{ xs: 12, sm: 8 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Avatar URL'
                    placeholder='https://example.com/avatar.jpg'
                    value={formData.avatarUrl}
                    onChange={e => handleInputChange('avatarUrl', e.target.value)}
                  />
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
