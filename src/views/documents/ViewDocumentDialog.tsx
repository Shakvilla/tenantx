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
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Util Imports
import { getInitials } from '@/utils/getInitials'

// Type Imports
import type { DocumentType } from '@/types/documents/documentTypes'

type ViewDocumentDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  document: DocumentType | null
  onAccept?: () => void
  onReject?: () => void
}

const ViewDocumentDialog = ({ open, setOpen, document, onAccept, onReject }: ViewDocumentDialogProps) => {
  // Status color mapping
  const documentStatusObj: {
    [key: string]: {
      color: 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary'
      textColor?: string
    }
  } = {
    accepted: { color: 'primary' },
    rejected: { color: 'warning', textColor: '#f44336' },
    pending: { color: 'info' }
  }

  const handleDownload = (imageUrl?: string) => {
    if (imageUrl) {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = `document-${document?.id || 'download'}`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (!document) return null

  const statusConfig = documentStatusObj[document.status] || { color: 'secondary' }

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth='lg' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span className='font-medium'>Document Details</span>
        <IconButton size='small' onClick={() => setOpen(false)}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent className='flex flex-col gap-6'>
        {/* Document Images - Side by Side */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card className='relative'>
              <Box className='relative'>
                <Avatar
                  variant='rounded'
                  src={document.documentImage}
                  alt={document.documentType}
                  sx={{
                    width: '100%',
                    height: 400,
                    objectFit: 'cover',
                    borderRadius: '4px 4px 0 0'
                  }}
                >
                  <i className='ri-file-line text-6xl' />
                </Avatar>
                <IconButton
                  className='absolute top-2 right-2'
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    boxShadow: 2
                  }}
                  size='small'
                  onClick={() => handleDownload(document.documentImage)}
                >
                  <i className='ri-download-line' />
                </IconButton>
              </Box>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Card className='relative'>
              <Box className='relative'>
                <Avatar
                  variant='rounded'
                  src={document.tenantAvatar || document.documentImage}
                  alt='Additional Document'
                  sx={{
                    width: '100%',
                    height: 400,
                    objectFit: 'cover',
                    borderRadius: '4px 4px 0 0'
                  }}
                >
                  <i className='ri-file-line text-6xl' />
                </Avatar>
                <IconButton
                  className='absolute top-2 right-2'
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    boxShadow: 2
                  }}
                  size='small'
                  onClick={() => handleDownload(document.tenantAvatar || document.documentImage)}
                >
                  <i className='ri-download-line' />
                </IconButton>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Document Details */}
        <Card>
          <CardContent className='flex flex-col gap-4'>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  SL
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {document.id}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Document Type
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {document.documentType}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Property
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {document.propertyName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Unit
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {document.unitNo}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Tenant Name
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {document.tenantName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Status
                </Typography>
                <Typography
                  variant='body1'
                  className='font-medium capitalize'
                  sx={{ color: statusConfig.textColor || 'inherit' }}
                >
                  {document.status}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={() => setOpen(false)}>
          Close
        </Button>
        {document.status !== 'accepted' && onAccept && (
          <Button
            variant='contained'
            color='primary'
            startIcon={<i className='ri-checkbox-circle-line' />}
            onClick={() => {
              onAccept()
              setOpen(false)
            }}
          >
            Accept
          </Button>
        )}
        {document.status !== 'rejected' && onReject && (
          <Button
            variant='outlined'
            color='warning'
            startIcon={<i className='ri-close-circle-line' />}
            onClick={() => {
              onReject()
              setOpen(false)
            }}
          >
            Reject
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default ViewDocumentDialog

