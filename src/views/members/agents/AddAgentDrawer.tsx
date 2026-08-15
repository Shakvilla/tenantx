'use client'

import { useState, useEffect } from 'react'

import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { createAgent, updateAgent } from '@/lib/api/agents'
import type { AgentType, CreateAgentPayload } from '@/types/members/agentTypes'

type FormData = {
  name: string
  email: string
  phone: string
  gender: string
  dateOfBirth: string
  ghanaCardNumber: string
  location: string
  status: string
  commissionType: string
  commissionRate: string
  primaryGuarantor: string
  primaryGuarantorPhone: string
  secondaryGuarantor: string
  secondaryGuarantorPhone: string
}

const empty: FormData = {
  name: '', email: '', phone: '', gender: '', dateOfBirth: '',
  ghanaCardNumber: '', location: '', status: 'active',
  commissionType: 'percentage', commissionRate: '10',
  primaryGuarantor: '', primaryGuarantorPhone: '',
  secondaryGuarantor: '', secondaryGuarantorPhone: ''
}

interface Props {
  open: boolean
  handleClose: () => void
  editAgent?: AgentType | null
  onSuccess: () => void
}

const AddAgentDrawer = ({ open, handleClose, editAgent, onSuccess }: Props) => {
  const [formData, setFormData] = useState<FormData>(empty)
  const [errors, setErrors]     = useState<Partial<Record<keyof FormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  useEffect(() => {
    if (editAgent) {
      setFormData({
        name: editAgent.name || '',
        email: editAgent.email || '',
        phone: editAgent.phone || '',
        gender: editAgent.gender || '',
        dateOfBirth: editAgent.dateOfBirth?.slice(0, 10) || '',
        ghanaCardNumber: editAgent.ghanaCardNumber || '',
        location: editAgent.location || '',
        status: editAgent.status || 'active',
        commissionType: editAgent.commissionType || 'percentage',
        commissionRate: String(editAgent.commissionRate ?? '10'),
        primaryGuarantor: editAgent.primaryGuarantor || '',
        primaryGuarantorPhone: editAgent.primaryGuarantorPhone || '',
        secondaryGuarantor: editAgent.secondaryGuarantor || '',
        secondaryGuarantorPhone: editAgent.secondaryGuarantorPhone || ''
      })
    } else {
      setFormData(empty)
    }
    setErrors({})
    setServerError(null)
  }, [editAgent, open])

  const set = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!formData.name.trim())  newErrors.name  = 'Required'
    if (!formData.phone.trim()) newErrors.phone = 'Required'
    if (!formData.commissionRate || Number(formData.commissionRate) <= 0)
      newErrors.commissionRate = 'Must be greater than 0'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    setServerError(null)
    try {
      const payload: CreateAgentPayload = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim(),
        gender: formData.gender || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        ghanaCardNumber: formData.ghanaCardNumber.trim() || undefined,
        location: formData.location.trim() || undefined,
        status: formData.status as any,
        commissionType: formData.commissionType as any,
        commissionRate: Number(formData.commissionRate),
        primaryGuarantor: formData.primaryGuarantor.trim() || undefined,
        primaryGuarantorPhone: formData.primaryGuarantorPhone.trim() || undefined,
        secondaryGuarantor: formData.secondaryGuarantor.trim() || undefined,
        secondaryGuarantorPhone: formData.secondaryGuarantorPhone.trim() || undefined
      }
      if (editAgent) {
        await updateAgent(editAgent.id, payload)
      } else {
        await createAgent(payload)
      }
      onSuccess()
      handleClose()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Failed to save agent')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    handleClose()
    setFormData(empty)
    setErrors({})
    setServerError(null)
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 600 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>{editAgent ? 'Edit Agent' : 'Add Agent'}</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='overflow-y-auto p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          {serverError && (
            <Typography color='error' variant='body2'>{serverError}</Typography>
          )}
          <Grid container spacing={4}>

            {/* Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label='Name *' placeholder='Full name'
                value={formData.name} onChange={e => set('name', e.target.value)}
                error={!!errors.name} helperText={errors.name}
              />
            </Grid>

            {/* Phone */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label='Phone *' placeholder='e.g. 0244123456'
                value={formData.phone} onChange={e => set('phone', e.target.value)}
                error={!!errors.phone} helperText={errors.phone}
              />
            </Grid>

            {/* Email */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label='Email' type='email' placeholder='agent@email.com'
                value={formData.email} onChange={e => set('email', e.target.value)}
              />
            </Grid>

            {/* Gender */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select label='Gender' value={formData.gender} onChange={e => set('gender', e.target.value)}>
                  <MenuItem value='Male'>Male</MenuItem>
                  <MenuItem value='Female'>Female</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Date of Birth */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth type='date' label='Date of Birth'
                value={formData.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>

            {/* Ghana Card */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label='Ghana Card Number'
                value={formData.ghanaCardNumber} onChange={e => set('ghanaCardNumber', e.target.value)}
              />
            </Grid>

            {/* Location */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label='Location' placeholder='e.g. Accra, East Legon'
                value={formData.location} onChange={e => set('location', e.target.value)}
              />
            </Grid>

            {/* Status */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select label='Status' value={formData.status} onChange={e => set('status', e.target.value)}>
                  <MenuItem value='active'>Active</MenuItem>
                  <MenuItem value='inactive'>Inactive</MenuItem>
                  <MenuItem value='suspended'>Suspended</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Commission section */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' color='text.secondary' className='font-medium'>
                Commission Settings
              </Typography>
            </Grid>

            {/* Commission Type */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Commission Type</InputLabel>
                <Select label='Commission Type' value={formData.commissionType} onChange={e => set('commissionType', e.target.value)}>
                  <MenuItem value='percentage'>Percentage of rent</MenuItem>
                  <MenuItem value='fixed'>Fixed amount</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Commission Rate */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='number'
                label={formData.commissionType === 'percentage' ? 'Commission Rate (%)' : 'Commission Amount'}
                value={formData.commissionRate}
                onChange={e => set('commissionRate', e.target.value)}
                error={!!errors.commissionRate}
                helperText={errors.commissionRate || (formData.commissionType === 'percentage' ? 'Standard Ghana rate: 10%' : 'Fixed fee per deal')}
                slotProps={{
                  input: {
                    endAdornment: <InputAdornment position='end'>
                      {formData.commissionType === 'percentage' ? '%' : 'GHS'}
                    </InputAdornment>
                  }
                }}
              />
            </Grid>

            {/* Guarantors */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='subtitle2' color='text.secondary' className='font-medium'>
                Guarantors
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label='Primary Guarantor'
                value={formData.primaryGuarantor} onChange={e => set('primaryGuarantor', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label='Primary Guarantor Phone'
                value={formData.primaryGuarantorPhone} onChange={e => set('primaryGuarantorPhone', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label='Secondary Guarantor'
                value={formData.secondaryGuarantor} onChange={e => set('secondaryGuarantor', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth label='Secondary Guarantor Phone'
                value={formData.secondaryGuarantorPhone} onChange={e => set('secondaryGuarantorPhone', e.target.value)}
              />
            </Grid>
          </Grid>

          <div className='flex items-center gap-4 mt-4'>
            <Button variant='contained' type='submit' disabled={submitting} fullWidth>
              {submitting ? 'Saving…' : editAgent ? 'Update Agent' : 'Add Agent'}
            </Button>
            <Button variant='outlined' color='error' onClick={handleReset} fullWidth>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddAgentDrawer
