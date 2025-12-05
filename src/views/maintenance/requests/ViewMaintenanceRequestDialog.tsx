// Documentation: /docs/maintenance/view-maintenance-request.md

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
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardMedia from '@mui/material/CardMedia'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Type Imports
import type { MaintenanceRequestType } from '@/types/maintenance/maintenanceRequestTypes'

type ViewMaintenanceRequestDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  request: MaintenanceRequestType | null
  onEdit: () => void
}

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const day = date.getDate()
  const month = date.toLocaleString('en-US', { month: 'long' })
  const year = date.getFullYear()
  return `${day} ${month} ${year}`
}

const ViewMaintenanceRequestDialog = ({ open, setOpen, request, onEdit }: ViewMaintenanceRequestDialogProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Status color mapping
  const requestStatusObj: {
    [key: string]: {
      color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
    }
  } = {
    new: { color: 'info' },
    pending: { color: 'warning' },
    'in-progress': { color: 'primary' },
    completed: { color: 'success' },
    rejected: { color: 'error' }
  }

  // Priority color mapping
  const priorityObj: {
    [key: string]: {
      color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
    }
  } = {
    low: { color: 'info' },
    medium: { color: 'warning' },
    high: { color: 'error' },
    urgent: { color: 'error' }
  }

  if (!request) return null

  const statusConfig = requestStatusObj[request.status] || { color: 'secondary' }
  const priorityConfig = priorityObj[request.priority] || { color: 'secondary' }
  const images = request.images && request.images.length > 0 ? request.images : []

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between pbs-6 pbe-4 pli-6'>
        <Box className='flex items-center gap-3'>
          <CustomAvatar src={request.propertyImage} skin='light' size={60} variant='rounded'>
            {getInitials(request.propertyName || 'P')}
          </CustomAvatar>
          <Box className='flex flex-col'>
            <Typography variant='h6' className='font-medium'>
              {request.issue}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {request.propertyName} - {request.unitNo}
            </Typography>
          </Box>
        </Box>
        <IconButton size='small' onClick={() => setOpen(false)}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent className='flex flex-col gap-4 pbs-6'>
        {/* Status and Priority */}
        <Box className='flex flex-wrap items-center gap-2'>
          <Chip
            variant='tonal'
            label={request.status.replace('-', ' ')}
            size='small'
            color={statusConfig.color}
            className='capitalize'
          />
          <Chip
            variant='tonal'
            label={request.priority}
            size='small'
            color={priorityConfig.color}
            className='capitalize'
          />
        </Box>

        {/* Request Details */}
        <Card variant='outlined'>
          <CardContent className='flex flex-col gap-4'>
            <Box className='flex items-center justify-between'>
              <Typography variant='body2' color='text.secondary'>
                Issue
              </Typography>
              <Typography variant='body1' className='font-medium'>
                {request.issue}
              </Typography>
            </Box>
            {request.description && (
              <>
                <Divider />
                <Box className='flex flex-col gap-2'>
                  <Typography variant='body2' color='text.secondary'>
                    Description
                  </Typography>
                  <Typography variant='body1' className='font-medium'>
                    {request.description}
                  </Typography>
                </Box>
              </>
            )}
            <Divider />
            <Box className='flex items-center justify-between'>
              <Typography variant='body2' color='text.secondary'>
                Requested Date
              </Typography>
              <Typography variant='body1' className='font-medium'>
                {formatDate(request.requestedDate)}
              </Typography>
            </Box>
            {request.completedDate && (
              <>
                <Divider />
                <Box className='flex items-center justify-between'>
                  <Typography variant='body2' color='text.secondary'>
                    Completed Date
                  </Typography>
                  <Typography variant='body1' className='font-medium' color='success.main'>
                    {formatDate(request.completedDate)}
                  </Typography>
                </Box>
              </>
            )}
          </CardContent>
        </Card>

        {/* Property and Tenant Information */}
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='h6' className='font-medium mbe-4'>
              Property & Tenant Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Property
                </Typography>
                <Box className='flex items-center gap-2'>
                  <CustomAvatar src={request.propertyImage} skin='light' size={32} variant='rounded'>
                    {getInitials(request.propertyName || 'P')}
                  </CustomAvatar>
                  <Typography variant='body1' className='font-medium'>
                    {request.propertyName || '-'}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Unit Number
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {request.unitNo || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Tenant
                </Typography>
                <Box className='flex items-center gap-2'>
                  <CustomAvatar src={request.tenantAvatar} skin='light' size={32}>
                    {getInitials(request.tenantName)}
                  </CustomAvatar>
                  <Typography variant='body1' className='font-medium'>
                    {request.tenantName || '-'}
                  </Typography>
                </Box>
              </Grid>
              {request.assignedTo && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant='body2' color='text.secondary' className='mbe-1'>
                    Assigned To
                  </Typography>
                  <Box className='flex items-center gap-2'>
                    <CustomAvatar src={request.assignedToAvatar} skin='light' size={32}>
                      {getInitials(request.assignedTo)}
                    </CustomAvatar>
                    <Typography variant='body1' className='font-medium'>
                      {request.assignedTo}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Images */}
        {images.length > 0 && (
          <Card variant='outlined'>
            <CardContent>
              <Typography variant='h6' className='font-medium mbe-4'>
                Request Images
              </Typography>
              <div className='flex flex-col gap-4'>
                {/* Main Image */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    height: 300,
                    borderRadius: 1,
                    overflow: 'hidden',
                    backgroundColor: 'var(--mui-palette-action-hover)'
                  }}
                >
                  <CardMedia
                    component='img'
                    image={images[selectedImageIndex]}
                    alt='Maintenance request image'
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>

                {/* Thumbnail Grid */}
                {images.length > 1 && (
                  <Grid container spacing={2}>
                    {images.map((image, index) => (
                      <Grid size={{ xs: 4, sm: 3 }} key={index}>
                        <Box
                          onClick={() => setSelectedImageIndex(index)}
                          sx={{
                            position: 'relative',
                            width: '100%',
                            height: 100,
                            borderRadius: 1,
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: selectedImageIndex === index ? '2px solid' : '1px solid',
                            borderColor:
                              selectedImageIndex === index
                                ? 'var(--mui-palette-primary-main)'
                                : 'var(--mui-palette-divider)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: 'var(--mui-palette-primary-main)',
                              transform: 'scale(1.02)'
                            }
                          }}
                        >
                          <CardMedia
                            component='img'
                            image={image}
                            alt={`Request image ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                          />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={() => setOpen(false)}>
          Close
        </Button>
        <Button variant='contained' color='primary' startIcon={<i className='ri-pencil-line' />} onClick={onEdit}>
          Edit Request
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ViewMaintenanceRequestDialog

