'use client'

import { useState, useRef, useCallback } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'

import { replaceDocumentFile } from '@/lib/api/documents'
import { getStoredTenantId } from '@/lib/api/storage'
import {
  uploadDocument,
  formatFileSize,
  ALLOWED_EXTENSIONS,
  ALLOWED_TYPES,
  MAX_FILE_SIZE_MB
} from '@/lib/document-storage'
import type { DocumentType } from '@/types/documents/documentTypes'

const FILE_ICONS: Record<string, string> = {
  pdf:  'ri-file-pdf-line',
  jpg:  'ri-image-line',
  jpeg: 'ri-image-line',
  png:  'ri-image-line',
  docx: 'ri-file-word-line'
}

type UploadState =
  | { status: 'idle' }
  | { status: 'uploading'; progress: number; fileName: string }
  | { status: 'done';  fileName: string; fileUrl: string; fileId: string; bytes: number; format: string }
  | { status: 'error'; message: string }

type Props = {
  open:      boolean
  setOpen:   (open: boolean) => void
  document:  DocumentType | null
  onSuccess: () => void
}

/**
 * Replace a document's stored file. The new file is uploaded to ImageKit
 * (private, same as the original) and then PUT to
 * /api/v1/documents/{id}/file — the backend records it and deletes the old
 * file from ImageKit server-side. Rejected documents return to pending so the
 * replacement is reviewed on its own merits.
 */
const ReplaceFileDialog = ({ open, setOpen, document, onSuccess }: Props) => {
  const [upload,     setUpload]     = useState<UploadState>({ status: 'idle' })
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)

    if (!ALLOWED_TYPES.includes(file.type)) {
      setUpload({ status: 'error', message: 'Unsupported file type. Please upload a PDF, JPG, PNG, or DOCX.' })
      return
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setUpload({ status: 'error', message: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.` })
      return
    }

    setUpload({ status: 'uploading', progress: 0, fileName: file.name })

    const tenantId = getStoredTenantId() ?? 'unknown'
    const ext      = file.name.split('.').pop()?.toLowerCase() ?? ''

    try {
      const result = await uploadDocument(file, tenantId, (pct) => {
        setUpload({ status: 'uploading', progress: pct, fileName: file.name })
      })
      setUpload({
        status:   'done',
        fileName: file.name,
        fileUrl:  result.publicUrl,
        fileId:   result.fileId,
        bytes:    result.bytes,
        format:   ext
      })
    } catch (err: any) {
      setUpload({ status: 'error', message: err?.message ?? 'Upload failed. Please try again.' })
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
    // Reset input so the same file can be re-selected after clearing
    e.target.value = ''
  }

  const clearFile = () => {
    setUpload({ status: 'idle' })
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async () => {
    if (!document || upload.status !== 'done') return

    setSubmitting(true)
    setError(null)
    try {
      await replaceDocumentFile(document.id, {
        fileUrl:  upload.fileUrl,
        fileName: upload.fileName,
        fileId:   upload.fileId
      })
      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to replace the file. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setUpload({ status: 'idle' })
    setError(null)
    setOpen(false)
  }

  const renderDropZone = () => {
    if (upload.status === 'uploading') {
      return (
        <Box className='flex flex-col gap-2 p-4 border rounded' sx={{ borderColor: 'primary.main', borderStyle: 'solid' }}>
          <div className='flex items-center gap-2'>
            <CircularProgress size={16} />
            <Typography variant='body2' color='text.secondary' className='truncate'>
              Uploading {upload.fileName}…
            </Typography>
          </div>
          <LinearProgress variant='determinate' value={upload.progress} sx={{ borderRadius: 1 }} />
          <Typography variant='caption' color='text.secondary'>{upload.progress}%</Typography>
        </Box>
      )
    }

    if (upload.status === 'done') {
      const ext  = upload.format?.toLowerCase() ?? ''
      const icon = FILE_ICONS[ext] ?? 'ri-file-line'
      return (
        <Box
          className='flex items-center justify-between p-3 border rounded'
          sx={{ borderColor: 'success.main', borderStyle: 'solid', bgcolor: 'success.lighterOpacity' }}
        >
          <div className='flex items-center gap-3'>
            <i className={`${icon} text-2xl text-success`} />
            <div>
              <Typography variant='body2' className='font-medium truncate max-w-[260px]'>
                {upload.fileName}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                {formatFileSize(upload.bytes)} · {upload.format?.toUpperCase()}
              </Typography>
            </div>
          </div>
          <div className='flex items-center gap-1'>
            <Chip label='Uploaded' color='success' size='small' variant='tonal' />
            <IconButton size='small' onClick={clearFile} title='Remove file'>
              <i className='ri-close-line text-sm' />
            </IconButton>
          </div>
        </Box>
      )
    }

    if (upload.status === 'error') {
      return (
        <Box className='flex flex-col gap-2'>
          <Alert severity='error' onClose={clearFile}>{upload.message}</Alert>
          <Button
            variant='outlined' size='small' color='secondary'
            startIcon={<i className='ri-upload-2-line' />}
            onClick={() => fileInputRef.current?.click()}
          >
            Try Again
          </Button>
        </Box>
      )
    }

    // Idle — drop zone
    return (
      <Box
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className='flex flex-col items-center gap-2 p-6 border-2 border-dashed rounded cursor-pointer transition-colors'
        sx={{
          borderColor: 'divider',
          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
        }}
      >
        <i className='ri-upload-cloud-2-line text-4xl text-secondary' />
        <Typography variant='body2' color='text.secondary' className='text-center'>
          <span className='font-medium text-primary' style={{ cursor: 'pointer' }}>Click to browse</span>
          {' '}or drag & drop a file here
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          PDF, JPG, PNG, DOCX · Max {MAX_FILE_SIZE_MB} MB
        </Typography>
      </Box>
    )
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span className='font-medium'>Replace File</span>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent className='flex flex-col gap-5 pbs-4'>
        <input
          ref={fileInputRef}
          type='file'
          accept={ALLOWED_EXTENSIONS}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />

        <Alert severity='info' icon={<i className='ri-information-line' />}>
          {document?.fileName
            ? `The current file "${document.fileName}" will be replaced. ${document.status === 'rejected' ? 'The document will return to pending for review.' : ''}`
            : 'No file is currently attached to this document. Replacing will attach one.'}
        </Alert>

        {error && <Alert severity='error' onClose={() => setError(null)}>{error}</Alert>}

        {renderDropZone()}
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={submitting || upload.status !== 'done'}
          endIcon={
            submitting
              ? <CircularProgress size={16} color='inherit' />
              : <i className='ri-save-line' />
          }
        >
          {submitting ? 'Replacing…' : 'Replace File'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ReplaceFileDialog