'use client'

// React Imports
import { useState, useEffect, useCallback } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Avatar from '@mui/material/Avatar'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Grid from '@mui/material/Grid2'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { DocumentType } from '@/types/documents/documentTypes'
import { getDocumentDownloadUrl } from '@/lib/document-storage'

type ViewDocumentDialogProps = {
  open: boolean
  handleClose: () => void
  document: DocumentType | null
}

const ViewDocumentDialog = ({ open, handleClose, document }: ViewDocumentDialogProps) => {
  // Document files are private in ImageKit, so `document.fileUrl` 401s on its
  // own. The signed link is minted when the dialog opens and expires in 5
  // minutes — long enough to view/download, short enough that a copied link is
  // worthless afterwards. The preview iframe needs it for exactly the same
  // reason the Download button does.
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [linkLoading, setLinkLoading] = useState(false)

  const hasFile = Boolean(document?.fileUrl)

  useEffect(() => {
    if (!open || !document?.id || !hasFile) {
      setSignedUrl(null)
      return
    }
    let cancelled = false
    setLinkLoading(true)
    getDocumentDownloadUrl(document.id)
      .then(url => { if (!cancelled) setSignedUrl(url) })
      .catch(() => { if (!cancelled) setSignedUrl(null) })
      .finally(() => { if (!cancelled) setLinkLoading(false) })
    return () => { cancelled = true }
  }, [open, document?.id, hasFile])

  // Handle Download
  const handleDownload = useCallback(() => {
    if (signedUrl) {
      window.open(signedUrl, '_blank', 'noopener,noreferrer')
    }
  }, [signedUrl])

  if (!document) {
    return null
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
                {document.agreementNumber && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <div className='flex flex-col gap-1'>
                      <Typography variant='caption' color='text.secondary'>
                        Agreement
                      </Typography>
                      <Typography variant='body1' className='font-medium'>
                        {document.agreementNumber}
                      </Typography>
                    </div>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>

          {/* Reject reason */}
          {document.status === 'rejected' && document.rejectReason && (
            <Box sx={{ p: 2, bgcolor: 'error.lighterOpacity', borderRadius: 1, border: '1px solid', borderColor: 'error.light' }}>
              <Typography variant='body2' color='error' fontWeight={600} className='mbe-1'>
                Rejection reason
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {document.rejectReason}
              </Typography>
            </Box>
          )}

          {/* Document Preview — the signed URL, never the stored (private) one. */}
          {hasFile ? (
            linkLoading ? (
              <Box
                sx={{
                  height: 480,
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
                <CircularProgress size={40} />
                <Typography color='text.secondary'>Preparing preview…</Typography>
              </Box>
            ) : signedUrl ? (
              <Box
                component='iframe'
                src={signedUrl}
                sx={{ width: '100%', height: 480, border: '1px solid var(--mui-palette-divider)', borderRadius: 1 }}
                title='Document preview'
              />
            ) : (
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
                <Typography color='text.secondary'>
                  {document.fileName || 'No file attached'}
                </Typography>
              </Box>
            )
          ) : (
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
              <Typography color='text.secondary'>
                {document.fileName || 'No file attached'}
              </Typography>
            </Box>
          )}
        </div>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose}>
          Close
        </Button>
        <Tooltip title={hasFile ? '' : 'No file attached'}>
          {/* span keeps the tooltip working while the button is disabled */}
          <span>
            <Button
              variant='contained'
              color='primary'
              startIcon={<i className='ri-download-line' />}
              onClick={handleDownload}
              disabled={!hasFile || linkLoading || !signedUrl}
            >
              Download
            </Button>
          </span>
        </Tooltip>
      </DialogActions>
    </Dialog>
  )
}

export default ViewDocumentDialog