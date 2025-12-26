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
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Type Imports
import type { DocumentType } from '@/types/documents/documentTypes'

type RejectDocumentDialogProps = {
  open: boolean
  setOpen: (open: boolean) => void
  documentData: DocumentType | null
  onConfirm: (rejectReason: string) => void
}

const RejectDocumentDialog = ({ open, setOpen, documentData, onConfirm }: RejectDocumentDialogProps) => {
  // States
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState(false)

  const handleClose = () => {
    setRejectReason('')
    setError(false)
    setOpen(false)
  }

  const handleConfirm = () => {
    if (!rejectReason.trim()) {
      setError(true)
      
return
    }

    onConfirm(rejectReason)
    handleClose()
  }

  const handleDownload = (imageUrl?: string) => {
    if (imageUrl) {
      const link = document.createElement('a')

      link.href = imageUrl
      link.download = `document-${documentData?.id || 'download'}`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  if (!documentData) return null

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='lg' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span className='font-medium'>Document Reject</span>
        <IconButton size='small' onClick={handleClose} sx={{ color: 'warning.main' }}>
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
                  src={documentData.documentImage}
                  alt={documentData.documentType}
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
                  onClick={() => handleDownload(documentData.documentImage)}
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
                  src={documentData.tenantAvatar || documentData.documentImage}
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
                  onClick={() => handleDownload(documentData.tenantAvatar || documentData.documentImage)}
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
                  {documentData.id}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Document Type
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {documentData.documentType}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Property
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {documentData.propertyName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Unit
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {documentData.unitNo}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Tenant Name
                </Typography>
                <Typography variant='body1' className='font-medium'>
                  {documentData.tenantName}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant='body2' color='text.secondary' className='mbe-1'>
                  Status
                </Typography>
                <Typography variant='body1' className='font-medium capitalize' sx={{ color: '#f44336' }}>
                  Rejected
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Reject Reason Input */}
        <Box className='flex flex-col gap-2'>
          <Typography variant='body2' color='text.secondary'>
            Reject Reason<span className='text-error'>*</span>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder='Write here'
            value={rejectReason}
            onChange={e => {
              setRejectReason(e.target.value)
              setError(false)
            }}
            error={error}
            helperText={error ? 'Reject reason is required' : ''}
          />
        </Box>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose}>
          Cancel
        </Button>
        <Button variant='contained' color='primary' onClick={handleConfirm} endIcon={<i className='ri-arrow-right-line' />}>
          Save Now
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default RejectDocumentDialog

