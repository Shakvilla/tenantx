'use client'

// React Imports
import { useState, useEffect } from 'react'

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
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Type Imports
import type { CommunicationType } from '@/types/communication/communicationTypes'

type ReplyDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  communication: CommunicationType | null
  communicationData?: CommunicationType[]
  setData: (data: CommunicationType[]) => void
}

type FormDataType = {
  subject: string
  message: string
}

// Vars
const initialData: FormDataType = {
  subject: '',
  message: ''
}

const ReplyDialog = ({ open, setOpen, communication, communicationData, setData }: ReplyDialogProps) => {
  // States
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})

  // Reset form when dialog opens/closes or communication changes
  useEffect(() => {
    if (open && communication) {
      const replySubject = communication.subject.startsWith('Re:')
        ? communication.subject
        : `Re: ${communication.subject}`

      setFormData({
        subject: replySubject,
        message: ''
      })
      setErrors({})
    }
  }, [open, communication])

  // Handle input change
  const handleInputChange = (field: keyof FormDataType, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}

    if (!formData.subject.trim()) {
      newErrors.subject = true
    }

    if (!formData.message.trim()) {
      newErrors.message = true
    }

    setErrors(newErrors)
    
return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = () => {
    if (!validateForm() || !communication) return

    const today = new Date()

    const newCommunication: CommunicationType = {
      id: (communicationData?.length || 0) + 1,
      subject: formData.subject,
      from: 'Property Manager',
      fromAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3',
      to: communication.from,
      toAvatar: communication.fromAvatar,
      message: formData.message,
      date: today.toISOString().split('T')[0],
      type: communication.type === 'email' ? 'email' : 'message',
      status: 'sent',
      propertyName: communication.propertyName,
      unitNo: communication.unitNo,
      tenantName: communication.from
    }

    if (communicationData) {
      setData([newCommunication, ...communicationData])
    }

    handleClose()
  }

  // Handle reset
  const handleClose = () => {
    setFormData(initialData)
    setErrors({})
    setOpen(false)
  }

  if (!communication) return null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span className='font-medium'>Reply</span>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent className='flex flex-col gap-4'>
        {/* Original Message Preview */}
        <Card variant='outlined'>
          <CardContent className='flex flex-col gap-3'>
            <div className='flex items-center justify-between'>
              <Typography variant='body2' color='text.secondary' className='font-medium'>
                Original Message
              </Typography>
              <Chip
                variant='tonal'
                label={communication.type}
                size='small'
                color='primary'
                className='capitalize'
              />
            </div>
            <Divider />
            <div className='flex items-center gap-3'>
              <CustomAvatar src={communication.fromAvatar} skin='light' size={32}>
                {getInitials(communication.from)}
              </CustomAvatar>
              <div className='flex flex-col'>
                <Typography variant='body2' className='font-medium'>
                  {communication.from}
                </Typography>
                <Typography variant='caption' color='text.secondary'>
                  {communication.date}
                </Typography>
              </div>
            </div>
            <Typography variant='body2' className='font-medium' color='text.primary'>
              {communication.subject}
            </Typography>
            <Typography variant='body2' color='text.secondary' className='whitespace-pre-wrap'>
              {communication.message}
            </Typography>
          </CardContent>
        </Card>

        {/* Reply Form */}
        <Grid container spacing={4}>
          {/* To (Recipient) - Read Only */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='To'
              value={communication.from}
              disabled
              InputProps={{
                startAdornment: (
                  <CustomAvatar src={communication.fromAvatar} skin='light' size={24} className='mie-2'>
                    {getInitials(communication.from)}
                  </CustomAvatar>
                )
              }}
            />
          </Grid>

          {/* Subject */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='Subject *'
              placeholder='Enter reply subject'
              value={formData.subject}
              onChange={e => handleInputChange('subject', e.target.value)}
              error={Boolean(errors.subject)}
              helperText={errors.subject ? 'This field is required.' : ''}
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
              placeholder='Enter your reply'
              value={formData.message}
              onChange={e => handleInputChange('message', e.target.value)}
              error={Boolean(errors.message)}
              helperText={errors.message ? 'This field is required.' : ''}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose}>
          Cancel
        </Button>
        <Button variant='contained' color='primary' onClick={handleSubmit} startIcon={<i className='ri-send-plane-line' />}>
          Send Reply
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReplyDialog

