'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.toLocaleString('en-US', { month: 'long' })
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

// Type Imports
import type { CommunicationType } from '@/types/communication/communicationTypes'

type ViewCommunicationDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  communication: CommunicationType | null
  onReply?: () => void
  onSendNotice?: () => void
}

const ViewCommunicationDialog = ({ open, setOpen, communication, onReply, onSendNotice }: ViewCommunicationDialogProps) => {
  // Type and Status color mapping
  const communicationTypeObj: {
    [key: string]: {
      color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
      icon: string
    }
  } = {
    email: { color: 'primary', icon: 'ri-mail-line' },
    sms: { color: 'success', icon: 'ri-message-2-line' },
    notification: { color: 'info', icon: 'ri-notification-line' },
    message: { color: 'warning', icon: 'ri-chat-3-line' }
  }

  const communicationStatusObj: {
    [key: string]: {
      color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
    }
  } = {
    sent: { color: 'info' },
    delivered: { color: 'success' },
    read: { color: 'primary' },
    failed: { color: 'error' }
  }

  if (!communication) return null

  const typeConfig = communicationTypeObj[communication.type] || { color: 'secondary', icon: 'ri-file-line' }
  const statusConfig = communicationStatusObj[communication.status] || { color: 'secondary' }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span className='font-medium'>Communication Details</span>
        <IconButton size='small' onClick={() => setOpen(false)}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent className='flex flex-col gap-6'>
        {/* Header Information */}
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
              <Typography variant='h6' className='font-medium'>
                {communication.subject}
              </Typography>
              <div className='flex items-center gap-2'>
                <Chip
                  variant='tonal'
                  label={communication.type}
                  size='small'
                  color={typeConfig.color}
                  icon={<i className={typeConfig.icon} />}
                  className='capitalize'
                />
                <Chip
                  variant='tonal'
                  label={communication.status}
                  size='small'
                  color={statusConfig.color}
                  className='capitalize'
                />
              </div>
            </div>
            <Divider />
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Date
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {formatDate(communication.date)}
                </Typography>
              </Grid>
              {communication.propertyName && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='body2' color='text.secondary' className='mbe-1'>
                    Property
                  </Typography>
                  <Typography variant='body1' className='font-medium'>
                    {communication.propertyName}
                  </Typography>
                </Grid>
              )}
              {communication.unitNo && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='body2' color='text.secondary' className='mbe-1'>
                    Unit
                  </Typography>
                  <Typography variant='body1' className='font-medium'>
                    {communication.unitNo}
                  </Typography>
                </Grid>
              )}
              {communication.tenantName && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='body2' color='text.secondary' className='mbe-1'>
                    Tenant
                  </Typography>
                  <Typography variant='body1' className='font-medium'>
                    {communication.tenantName}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* From/To Information */}
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-2'>
                  From
                </Typography>
                <div className='flex items-center gap-3'>
                  <CustomAvatar src={communication.fromAvatar} skin='light' size={40}>
                    {getInitials(communication.from)}
                  </CustomAvatar>
                  <Typography variant='body1' className='font-medium'>
                    {communication.from}
                  </Typography>
                </div>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-2'>
                  To
                </Typography>
                <div className='flex items-center gap-3'>
                  <CustomAvatar src={communication.toAvatar} skin='light' size={40}>
                    {getInitials(communication.to)}
                  </CustomAvatar>
                  <Typography variant='body1' className='font-medium'>
                    {communication.to}
                  </Typography>
                </div>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Message Content */}
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <Typography variant='body2' color='text.secondary' className='mbe-2'>
              Message
            </Typography>
            <Typography variant='body1' className='whitespace-pre-wrap'>
              {communication.message}
            </Typography>
          </CardContent>
        </Card>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={() => setOpen(false)}>
          Close
        </Button>
        {onReply && (
          <Button
            variant='outlined'
            color='primary'
            startIcon={<i className='ri-reply-line' />}
            onClick={() => {
              onReply()
              setOpen(false)
            }}
          >
            Reply
          </Button>
        )}
        {onSendNotice && (
          <Button
            variant='contained'
            color='primary'
            startIcon={<i className='ri-notification-line' />}
            onClick={() => {
              onSendNotice()
              setOpen(false)
            }}
          >
            Send Notice
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ViewCommunicationDialog

