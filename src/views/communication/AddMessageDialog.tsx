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
import CircularProgress from '@mui/material/CircularProgress'

// API Imports
import { createCommunication } from '@/lib/api/communications'

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
  onSuccess: () => void
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

const AddMessageDialog = ({
  open,
  handleClose,
  onSuccess,
  properties = [],
  units = [],
  tenants = []
}: Props) => {
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)

  const filteredUnits = useMemo(() => {
    if (!formData.propertyId) return []
    return units.filter(unit => unit.propertyId === formData.propertyId)
  }, [formData.propertyId, units])

  const filteredTenants = useMemo(() => {
    if (!formData.propertyId && !formData.unitId) return tenants
    if (formData.unitId) return tenants.filter(t => t.unitId === formData.unitId)
    return tenants.filter(t => t.propertyId === formData.propertyId)
  }, [formData.propertyId, formData.unitId, tenants])

  useEffect(() => {
    if (open) {
      setFormData(initialData)
      setErrors({})
    }
  }, [open])

  const handleInputChange = (field: keyof FormDataType, value: any) => {
    if (field === 'propertyId') {
      setFormData(prev => ({ ...prev, propertyId: value, unitId: '', tenantId: '', to: '', toId: '' }))
    } else if (field === 'unitId') {
      setFormData(prev => ({ ...prev, unitId: value, tenantId: '', to: '', toId: '' }))
    } else if (field === 'tenantId') {
      const selected = filteredTenants.find(t => t.id.toString() === value)
      if (selected) setFormData(prev => ({ ...prev, tenantId: value, to: selected.name, toId: selected.id.toString() }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }))
  }

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
    if (errors.tenantId) setErrors(prev => ({ ...prev, tenantId: false }))
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}
    if (!formData.subject.trim()) newErrors.subject = true
    if (!formData.to.trim()) newErrors.to = true
    if (!formData.message.trim()) newErrors.message = true
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      const selectedProperty = properties.find(p => p.id.toString() === formData.propertyId)
      const selectedUnit = units.find(u => u.id.toString() === formData.unitId)
      const selectedTenant = tenants.find(t => t.id.toString() === formData.tenantId)

      await createCommunication({
        subject: formData.subject,
        toName: formData.to,
        message: formData.message,
        type: formData.type,
        occupantId: selectedTenant?.id.toString(),
        occupantName: selectedTenant?.name,
        propertyId: selectedProperty?.id.toString(),
        propertyName: selectedProperty?.name,
        unitId: selectedUnit?.id.toString(),
        unitNo: selectedUnit?.unitNumber
      })
      onSuccess()
      handleClose()
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSubmitting(false)
    }
  }

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
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth size='small' label='Subject *' placeholder='Enter message subject'
              value={formData.subject}
              onChange={e => handleInputChange('subject', e.target.value)}
              error={Boolean(errors.subject)}
              helperText={errors.subject ? 'This field is required.' : ''}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='type-label'>Type *</InputLabel>
              <Select labelId='type-label' label='Type *' value={formData.type}
                onChange={e => handleInputChange('type', e.target.value)}>
                <MenuItem value='email'>Email</MenuItem>
                <MenuItem value='sms'>SMS</MenuItem>
                <MenuItem value='notification'>Notification</MenuItem>
                <MenuItem value='message'>Message</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='property-label'>Property (Optional)</InputLabel>
              <Select labelId='property-label' label='Property (Optional)' value={formData.propertyId}
                onChange={e => handleInputChange('propertyId', e.target.value)}>
                <MenuItem value=''>Select Property</MenuItem>
                {properties.map(p => (
                  <MenuItem key={p.id} value={p.id.toString()}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small' disabled={!formData.propertyId}>
              <InputLabel id='unit-label'>Unit (Optional)</InputLabel>
              <Select labelId='unit-label' label='Unit (Optional)' value={formData.unitId}
                onChange={e => handleInputChange('unitId', e.target.value)}>
                <MenuItem value=''>Select Unit</MenuItem>
                {filteredUnits.map(u => (
                  <MenuItem key={u.id} value={u.id.toString()}>{u.unitNumber}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Autocomplete
              size='small' fullWidth
              options={filteredTenants}
              getOptionLabel={o => `${o.name}${o.email ? ` (${o.email})` : ''}`}
              value={filteredTenants.find(t => t.id.toString() === formData.tenantId) || null}
              onChange={(_, v) => handleTenantSelect(v)}
              renderInput={params => (
                <TextField
                  {...params} label='Select Tenant (Optional)' placeholder='Search tenant...'
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
                      <Typography variant='caption' color='text.secondary'>({option.email})</Typography>
                    )}
                  </div>
                </li>
              )}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth size='small' label='To *' placeholder='Recipient name'
              value={formData.to}
              onChange={e => handleInputChange('to', e.target.value)}
              error={Boolean(errors.to)}
              helperText={errors.to ? 'This field is required.' : ''}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth multiline rows={6} size='small' label='Message *' placeholder='Enter your message'
              value={formData.message}
              onChange={e => handleInputChange('message', e.target.value)}
              error={Boolean(errors.message)}
              helperText={errors.message ? 'This field is required.' : ''}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleReset} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant='contained' color='primary' onClick={handleSubmit} disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} /> : <i className='ri-send-plane-line' />}
        >
          Send Message
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddMessageDialog
