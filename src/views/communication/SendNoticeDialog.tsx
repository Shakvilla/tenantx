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
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'

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
  setOpen: (open: boolean) => void
  communicationData?: CommunicationType[]
  setData: (data: CommunicationType[]) => void
  properties?: Property[]
  units?: Unit[]
  tenants?: Tenant[]
  initialRecipient?: string
  initialPropertyId?: string
  initialUnitId?: string
}

type FormDataType = {
  subject: string
  notice: string
  propertyId: string
  unitId: string
  tenantIds: string[]
  sendToAll: boolean
  priority: 'normal' | 'high' | 'urgent'
}

// Vars
const initialData: FormDataType = {
  subject: '',
  notice: '',
  propertyId: '',
  unitId: '',
  tenantIds: [],
  sendToAll: false,
  priority: 'normal'
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

const SendNoticeDialog = ({
  open,
  setOpen,
  communicationData,
  setData,
  properties = sampleProperties,
  units = sampleUnits,
  tenants = sampleTenants,
  initialRecipient,
  initialPropertyId,
  initialUnitId
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
    if (formData.sendToAll) return tenants
    if (!formData.propertyId && !formData.unitId) return []
    if (formData.unitId) {
      return tenants.filter(tenant => tenant.unitId === formData.unitId)
    }
    return tenants.filter(tenant => tenant.propertyId === formData.propertyId)
  }, [formData.propertyId, formData.unitId, formData.sendToAll, tenants])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        ...initialData,
        propertyId: initialPropertyId || '',
        unitId: initialUnitId || ''
      })
      setErrors({})
    }
  }, [open, initialPropertyId, initialUnitId])

  // Handle input change
  const handleInputChange = (field: keyof FormDataType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }

    // Reset dependent fields when property/unit changes
    if (field === 'propertyId') {
      setFormData(prev => ({ ...prev, unitId: '', tenantIds: [] }))
    }
    if (field === 'unitId') {
      setFormData(prev => ({ ...prev, tenantIds: [] }))
    }
    if (field === 'sendToAll') {
      setFormData(prev => ({ ...prev, propertyId: '', unitId: '', tenantIds: [] }))
    }
  }

  // Handle tenant selection
  const handleTenantToggle = (tenantId: string) => {
    setFormData(prev => {
      const newTenantIds = prev.tenantIds.includes(tenantId)
        ? prev.tenantIds.filter(id => id !== tenantId)
        : [...prev.tenantIds, tenantId]
      return { ...prev, tenantIds: newTenantIds }
    })
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}

    if (!formData.subject.trim()) {
      newErrors.subject = true
    }
    if (!formData.notice.trim()) {
      newErrors.notice = true
    }
    if (!formData.sendToAll && !formData.propertyId && formData.tenantIds.length === 0) {
      newErrors.tenantIds = true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = () => {
    if (!validateForm()) return

    const today = new Date()
    const formattedDate = `${today.getDate()} ${today.toLocaleString('en-US', { month: 'long' })} ${today.getFullYear()}`

    // Determine recipients
    const recipients = formData.sendToAll
      ? tenants
      : formData.tenantIds.length > 0
        ? tenants.filter(t => formData.tenantIds.includes(t.id.toString()))
        : filteredTenants

    // Create notices for each recipient
    const newNotices: CommunicationType[] = recipients.map((tenant, index) => {
      const property = properties.find(p => p.id.toString() === tenant.propertyId)
      const unit = units.find(u => u.id.toString() === tenant.unitId)

      return {
        id: (communicationData?.length || 0) + index + 1,
        subject: formData.subject,
        from: 'Property Manager',
        fromAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
        to: tenant.name,
        toAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
        message: formData.notice,
        date: today.toISOString().split('T')[0],
        type: 'notification',
        status: 'sent',
        propertyName: property?.name,
        unitNo: unit?.unitNumber,
        tenantName: tenant.name
      }
    })

    if (communicationData) {
      setData([...newNotices, ...communicationData])
    }

    handleClose()
  }

  // Handle reset
  const handleClose = () => {
    setFormData(initialData)
    setErrors({})
    setOpen(false)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span className='font-medium'>Send Notice</span>
        <IconButton size='small' onClick={handleClose}>
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
              placeholder='Enter notice subject'
              value={formData.subject}
              onChange={e => handleInputChange('subject', e.target.value)}
              error={Boolean(errors.subject)}
              helperText={errors.subject ? 'This field is required.' : ''}
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
                <MenuItem value='normal'>Normal</MenuItem>
                <MenuItem value='high'>High</MenuItem>
                <MenuItem value='urgent'>Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Send to All */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.sendToAll}
                  onChange={e => handleInputChange('sendToAll', e.target.checked)}
                />
              }
              label='Send to All Tenants'
            />
          </Grid>

          {/* Property (if not sending to all) */}
          {!formData.sendToAll && (
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
          )}

          {/* Unit (if not sending to all) */}
          {!formData.sendToAll && (
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
          )}

          {/* Tenant Selection (if not sending to all) */}
          {!formData.sendToAll && filteredTenants.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Typography variant='body2' color='text.secondary' className='mbe-2'>
                Select Tenants {formData.propertyId || formData.unitId ? '(Optional)' : '*'}
              </Typography>
              <Box className='flex flex-wrap gap-2 p-4 border rounded-lg max-h-[200px] overflow-y-auto'>
                {filteredTenants.map(tenant => (
                  <Chip
                    key={tenant.id}
                    label={tenant.name}
                    onClick={() => handleTenantToggle(tenant.id.toString())}
                    onDelete={
                      formData.tenantIds.includes(tenant.id.toString())
                        ? () => handleTenantToggle(tenant.id.toString())
                        : undefined
                    }
                    color={formData.tenantIds.includes(tenant.id.toString()) ? 'primary' : 'default'}
                    variant={formData.tenantIds.includes(tenant.id.toString()) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
              {errors.tenantIds && (
                <Typography variant='caption' color='error' className='mts-1'>
                  Please select at least one tenant or a property/unit.
                </Typography>
              )}
            </Grid>
          )}

          {/* Notice Content */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={6}
              size='small'
              label='Notice *'
              placeholder='Enter notice content'
              value={formData.notice}
              onChange={e => handleInputChange('notice', e.target.value)}
              error={Boolean(errors.notice)}
              helperText={errors.notice ? 'This field is required.' : ''}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={handleSubmit}
          startIcon={<i className='ri-notification-line' />}
        >
          Send Notice
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SendNoticeDialog

