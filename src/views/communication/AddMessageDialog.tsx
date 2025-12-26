'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

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

// Type Imports
import type { CommunicationType } from '@/types/communication/communicationTypes'

type Property = {
  id: number | string
  name: string
}

type Unit = {
  id: number | string
  unitNumber: string
  propertyId: string
  propertyName: string
}

type Tenant = {
  id: number | string
  name: string
  email?: string
  propertyId?: string
  unitId?: string
}

type Props = {
  open: boolean
  handleClose: () => void
  communicationData?: CommunicationType[]
  setData: (data: CommunicationType[]) => void
  properties?: Property[]
  units?: Unit[]
  tenants?: Tenant[]
}

type FormDataType = {
  subject: string
  type: 'email' | 'sms' | 'notification' | 'message'
  to: string
  toId?: string
  message: string
  propertyId: string
  unitId: string
  tenantId: string
}

// Vars
const initialData: FormDataType = {
  subject: '',
  type: 'email',
  to: '',
  toId: '',
  message: '',
  propertyId: '',
  unitId: '',
  tenantId: ''
}

// Sample data
const sampleProperties: Property[] = [
  { id: 1, name: 'A living room with mexican mansion blue' },
  { id: 2, name: 'Rendering of a modern villa' },
  { id: 3, name: 'Beautiful modern style luxury home exterior sunset' },
  { id: 4, name: 'A house with a lot of windows and a lot of plants' },
  { id: 5, name: 'Design of a modern house as mansion blue couch' },
  { id: 6, name: 'Depending on the location and design' }
]

const sampleUnits: Unit[] = [
  { id: 1, unitNumber: 'Unit no 1', propertyId: '5', propertyName: 'Design of a modern house as mansion blue couch' },
  { id: 2, unitNumber: 'Unit no 2', propertyId: '3', propertyName: 'Beautiful modern style luxury home exterior sunset' },
  { id: 3, unitNumber: 'Unit no 3', propertyId: '1', propertyName: 'A living room with mexican mansion blue' },
  { id: 4, unitNumber: 'Unit no 4', propertyId: '4', propertyName: 'A house with a lot of windows and a lot of plants' },
  { id: 5, unitNumber: 'Unit no 5', propertyId: '2', propertyName: 'Rendering of a modern villa' },
  { id: 6, unitNumber: 'Unit no 6', propertyId: '2', propertyName: 'Rendering of a modern villa' },
  { id: 7, unitNumber: 'Unit no 7', propertyId: '3', propertyName: 'Beautiful modern style luxury home exterior sunset' },
  { id: 8, unitNumber: 'Unit no 8', propertyId: '6', propertyName: 'Depending on the location and design' },
  { id: 9, unitNumber: 'Unit no 9', propertyId: '1', propertyName: 'A living room with mexican mansion blue' },
  { id: 10, unitNumber: 'Unit no 10', propertyId: '4', propertyName: 'A house with a lot of windows and a lot of plants' },
  { id: 11, unitNumber: 'Unit no 11', propertyId: '5', propertyName: 'Design of a modern house as mansion blue couch' },
  { id: 12, unitNumber: 'Unit no 12', propertyId: '6', propertyName: 'Depending on the location and design' }
]

const sampleTenants: Tenant[] = [
  { id: 1, name: 'Brokin Simon', email: 'brokin@example.com', propertyId: '1', unitId: '3' },
  { id: 2, name: 'Andrew Paul', email: 'andrew@example.com', propertyId: '2', unitId: '2' },
  { id: 3, name: 'Mrtle Hale', email: 'mrtle@example.com', propertyId: '3', unitId: '6' },
  { id: 4, name: 'Timothy', email: 'timothy@example.com', propertyId: '5', unitId: '4' },
  { id: 5, name: 'John Doe', email: 'john@example.com', propertyId: '4', unitId: '1' },
  { id: 6, name: 'Jane Smith', email: 'jane@example.com', propertyId: '6', unitId: '5' },
  { id: 7, name: 'Robert Johnson', email: 'robert@example.com', propertyId: '1', unitId: '7' },
  { id: 8, name: 'Sarah Williams', email: 'sarah@example.com', propertyId: '2', unitId: '8' },
  { id: 9, name: 'Michael Brown', email: 'michael@example.com', propertyId: '3', unitId: '9' },
  { id: 10, name: 'Emily Davis', email: 'emily@example.com', propertyId: '4', unitId: '10' },
  { id: 11, name: 'David Wilson', email: 'david@example.com', propertyId: '5', unitId: '11' },
  { id: 12, name: 'Lisa Anderson', email: 'lisa@example.com', propertyId: '6', unitId: '12' }
]

const AddMessageDialog = ({
  open,
  handleClose,
  communicationData,
  setData,
  properties = sampleProperties,
  units = sampleUnits,
  tenants = sampleTenants
}: Props) => {
  // States
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})

  // Filtered units and tenants based on property/unit selection
  const filteredUnits = useMemo(() => {
    if (!formData.propertyId) return []
    
return units.filter(unit => unit.propertyId === formData.propertyId)
  }, [formData.propertyId, units])

  const filteredTenants = useMemo(() => {
    if (!formData.propertyId && !formData.unitId) return tenants

    if (formData.unitId) {
      return tenants.filter(tenant => tenant.unitId === formData.unitId)
    }

    
return tenants.filter(tenant => tenant.propertyId === formData.propertyId)
  }, [formData.propertyId, formData.unitId, tenants])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData(initialData)
      setErrors({})
    }
  }, [open])

  // Handle input change
  const handleInputChange = (field: keyof FormDataType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }

    // Reset dependent fields when property/unit changes
    if (field === 'propertyId') {
      setFormData(prev => ({ ...prev, unitId: '', tenantId: '', to: '', toId: '' }))
    }

    if (field === 'unitId') {
      setFormData(prev => ({ ...prev, tenantId: '', to: '', toId: '' }))
    }

    if (field === 'tenantId') {
      const selectedTenant = filteredTenants.find(t => t.id.toString() === value)

      if (selectedTenant) {
        setFormData(prev => ({ ...prev, to: selectedTenant.name, toId: selectedTenant.id.toString() }))
      }
    }
  }

  // Handle tenant selection from autocomplete
  const handleTenantSelect = (tenant: Tenant | null) => {
    if (tenant) {
      setFormData(prev => ({
        ...prev,
        tenantId: tenant.id.toString(),
        to: tenant.name,
        toId: tenant.id.toString(),
        propertyId: tenant.propertyId || prev.propertyId,
        unitId: tenant.unitId || prev.unitId
      }))
    } else {
      setFormData(prev => ({ ...prev, tenantId: '', to: '', toId: '' }))
    }

    if (errors.tenantId) {
      setErrors(prev => ({ ...prev, tenantId: false }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}

    if (!formData.subject.trim()) {
      newErrors.subject = true
    }

    if (!formData.to.trim()) {
      newErrors.to = true
    }

    if (!formData.message.trim()) {
      newErrors.message = true
    }

    setErrors(newErrors)
    
return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = () => {
    if (!validateForm()) return

    const today = new Date()
    const formattedDate = `${today.getDate()} ${today.toLocaleString('en-US', { month: 'long' })} ${today.getFullYear()}`

    const newCommunication: CommunicationType = {
      id: (communicationData?.length || 0) + 1,
      subject: formData.subject,
      from: 'Property Manager',
      fromAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
      to: formData.to,
      toAvatar: filteredTenants.find(t => t.id.toString() === formData.tenantId)?.email
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
        : undefined,
      message: formData.message,
      date: today.toISOString().split('T')[0],
      type: formData.type,
      status: 'sent',
      propertyName: properties.find(p => p.id.toString() === formData.propertyId)?.name,
      unitNo: units.find(u => u.id.toString() === formData.unitId)?.unitNumber,
      tenantName: formData.to
    }

    if (communicationData) {
      setData([newCommunication, ...communicationData])
    }

    handleClose()
  }

  // Handle reset
  const handleReset = () => {
    setFormData(initialData)
    setErrors({})
    handleClose()
  }

  return (
    <Dialog open={open} onClose={handleReset} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span className='font-medium'>New Message</span>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent className='flex flex-col gap-4'>
        <Grid container spacing={4}>
          {/* Subject */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='Subject *'
              placeholder='Enter message subject'
              value={formData.subject}
              onChange={e => handleInputChange('subject', e.target.value)}
              error={Boolean(errors.subject)}
              helperText={errors.subject ? 'This field is required.' : ''}
            />
          </Grid>

          {/* Type */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small' error={Boolean(errors.type)}>
              <InputLabel id='type-label'>Type *</InputLabel>
              <Select
                labelId='type-label'
                label='Type *'
                value={formData.type}
                onChange={e => handleInputChange('type', e.target.value)}
              >
                <MenuItem value='email'>Email</MenuItem>
                <MenuItem value='sms'>SMS</MenuItem>
                <MenuItem value='notification'>Notification</MenuItem>
                <MenuItem value='message'>Message</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Property (Optional) */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='property-label'>Property (Optional)</InputLabel>
              <Select
                labelId='property-label'
                label='Property (Optional)'
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
            </FormControl>
          </Grid>

          {/* Unit (Optional, depends on Property) */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small' disabled={!formData.propertyId}>
              <InputLabel id='unit-label'>Unit (Optional)</InputLabel>
              <Select
                labelId='unit-label'
                label='Unit (Optional)'
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
            </FormControl>
          </Grid>

          {/* Tenant Selection (Searchable) */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              size='small'
              fullWidth
              options={filteredTenants}
              getOptionLabel={option => `${option.name}${option.email ? ` (${option.email})` : ''}`}
              value={filteredTenants.find(t => t.id.toString() === formData.tenantId) || null}
              onChange={(_, newValue) => handleTenantSelect(newValue)}
              renderInput={params => (
                <TextField
                  {...params}
                  label='Select Tenant (Optional)'
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
                    <Typography>{option.name}</Typography>
                    {option.email && (
                      <Typography variant='caption' color='text.secondary'>
                        ({option.email})
                      </Typography>
                    )}
                  </div>
                </li>
              )}
            />
          </Grid>

          {/* To (Recipient) */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='To *'
              placeholder='Enter recipient name or email'
              value={formData.to}
              onChange={e => handleInputChange('to', e.target.value)}
              error={Boolean(errors.to)}
              helperText={errors.to ? 'This field is required.' : ''}
            />
          </Grid>

          {/* Message */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={6}
              size='small'
              label='Message *'
              placeholder='Enter your message'
              value={formData.message}
              onChange={e => handleInputChange('message', e.target.value)}
              error={Boolean(errors.message)}
              helperText={errors.message ? 'This field is required.' : ''}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleReset}>
          Cancel
        </Button>
        <Button variant='contained' color='primary' onClick={handleSubmit} startIcon={<i className='ri-send-plane-line' />}>
          Send Message
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddMessageDialog

