'use client'

// React Imports
import { } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

// Type Imports
import type { DocumentType } from '@/types/documents/documentTypes'

type ViewDocumentDialogProps = {
  open: boolean
  handleClose: () => void
  document: DocumentType | null
}

const ViewDocumentDialog = ({ open, handleClose, document }: ViewDocumentDialogProps) => {
  if (!document) {
    return null
  }

  // Handle Download
  const handleDownload = () => {
    // In a real app, this would trigger a download
    console.log(`Downloading document: ${document.documentType}`)
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>Document Preview</span>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div className='flex flex-col gap-6'>
          {/* Document Info Card */}
          <Card variant='outlined'>
            <CardContent>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='caption' color='text.secondary'>
                      Document Type
                    </Typography>
                    <Typography variant='body1' className='font-medium'>
                      {document.documentType}
                    </Typography>
                  </div>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='caption' color='text.secondary'>
                      Status
                    </Typography>
                    <Typography variant='body1' className='font-medium capitalize'>
                      {document.status}
                    </Typography>
                  </div>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='caption' color='text.secondary'>
                      Tenant
                    </Typography>
                    <div className='flex items-center gap-2 mts-1'>
                      <Avatar src={document.tenantAvatar} sx={{ width: 24, height: 24 }} />
                      <Typography variant='body1' className='font-medium'>
                        {document.tenantName}
                      </Typography>
                    </div>
                  </div>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <div className='flex flex-col gap-1'>
                    <Typography variant='caption' color='text.secondary'>
                      Property & Unit
                    </Typography>
                    <Typography variant='body1' className='font-medium'>
                      {`${document.propertyName} - ${document.unitNo}`}
                    </Typography>
                  </div>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Document Preview Placeholder */}
          <Box
            sx={{
              height: 400,
              width: '100%',
              backgroundColor: 'var(--mui-palette-action-hover)',
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              border: '1px dashed var(--mui-palette-divider)'
            }}
          >
            <i className='ri-file-text-line text-[100px] text-secondary opacity-20' />
            <Typography color='text.secondary'>Document preview is not available in this demo</Typography>
            <Button
              variant='outlined'
              size='small'
              startIcon={<i className='ri-download-line' />}
              onClick={handleDownload}
            >
              Download to view full content
            </Button>
          </Box>
        </div>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose}>
          Close
        </Button>
        <Button variant='contained' color='primary' startIcon={<i className='ri-download-line' />} onClick={handleDownload}>
          Download
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ViewDocumentDialog
