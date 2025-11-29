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
import Chip from '@mui/material/Chip'
import Rating from '@mui/material/Rating'
import Divider from '@mui/material/Divider'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Type Imports
import type { MaintainerType } from '@/types/maintenance/maintainerTypes'

type ViewMaintainerDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  maintainer: MaintainerType | null
  onEdit: () => void
}

const ViewMaintainerDialog = ({ open, setOpen, maintainer, onEdit }: ViewMaintainerDialogProps) => {
  // Status color mapping
  const maintainerStatusObj: {
    [key: string]: {
      color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
    }
  } = {
    active: { color: 'success' },
    inactive: { color: 'warning' }
  }

  if (!maintainer) return null

  const statusConfig = maintainerStatusObj[maintainer.status] || { color: 'secondary' }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between pbs-6 pbe-4 pli-6'>
        <Box className='flex items-center gap-3'>
          <CustomAvatar src={maintainer.avatar} skin='light' size={60}>
            {getInitials(maintainer.name)}
          </CustomAvatar>
          <Box className='flex flex-col'>
            <Typography variant='h6' className='font-medium'>
              {maintainer.name}
            </Typography>
            <Typography variant='body2' color='text.secondary'>
              {maintainer.email}
            </Typography>
          </Box>
        </Box>
        <IconButton size='small' onClick={() => setOpen(false)}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent className='flex flex-col gap-4 pbs-6'>
        {/* Status and Specialization */}
        <Box className='flex flex-wrap items-center gap-2'>
          <Chip
            variant='tonal'
            label={maintainer.status}
            size='small'
            color={statusConfig.color}
            className='capitalize'
          />
          <Chip variant='tonal' label={maintainer.specialization} size='small' color='primary' />
        </Box>

        {/* Rating and Jobs */}
        <Card variant='outlined'>
          <CardContent className='flex flex-col gap-4'>
            <Box className='flex items-center justify-between'>
              <Typography variant='body2' color='text.secondary'>
                Rating
              </Typography>
              <Box className='flex items-center gap-2'>
                <Rating value={maintainer.rating || 0} readOnly size='small' precision={0.1} />
                <Typography variant='body2' className='font-medium'>
                  {maintainer.rating?.toFixed(1) || '0.0'} / 5.0
                </Typography>
              </Box>
            </Box>
            <Divider />
            <Box className='flex items-center justify-between'>
              <Typography variant='body2' color='text.secondary'>
                Total Jobs
              </Typography>
              <Typography variant='body1' className='font-medium'>
                {maintainer.totalJobs || 0}
              </Typography>
            </Box>
            <Divider />
            <Box className='flex items-center justify-between'>
              <Typography variant='body2' color='text.secondary'>
                Completed Jobs
              </Typography>
              <Typography variant='body1' className='font-medium' color='success.main'>
                {maintainer.completedJobs || 0}
              </Typography>
            </Box>
            <Divider />
            <Box className='flex items-center justify-between'>
              <Typography variant='body2' color='text.secondary'>
                Completion Rate
              </Typography>
              <Typography variant='body1' className='font-medium'>
                {maintainer.totalJobs && maintainer.totalJobs > 0
                  ? ((maintainer.completedJobs || 0) / maintainer.totalJobs * 100).toFixed(1)
                  : '0.0'}%
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='h6' className='font-medium mbe-4'>
              Contact Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Email
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {maintainer.email || '-'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Phone
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {maintainer.phone || '-'}
                </Typography>
              </Grid>
              {maintainer.address && (
                <Grid size={{ xs: 12 }}>
                  <Typography variant='body2' color='text.secondary' className='mbe-1'>
                    Address
                  </Typography>
                  <Typography variant='body1' className='font-medium'>
                    {maintainer.address}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card variant='outlined'>
          <CardContent>
            <Typography variant='h6' className='font-medium mbe-4'>
              Additional Information
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Specialization
                </Typography>
                <Chip variant='tonal' label={maintainer.specialization} size='small' color='primary' />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Status
                </Typography>
                <Chip
                  variant='tonal'
                  label={maintainer.status}
                  size='small'
                  color={statusConfig.color}
                  className='capitalize'
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={() => setOpen(false)}>
          Close
        </Button>
        <Button variant='contained' color='primary' startIcon={<i className='ri-pencil-line' />} onClick={onEdit}>
          Edit Maintainer
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ViewMaintainerDialog

