'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import LinearProgress from '@mui/material/LinearProgress'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'

import { createDocument } from '@/lib/api/documents'
import { getOccupants, type OccupantRecord } from '@/lib/api/occupants'
import { getProperties } from '@/lib/api/properties'
import { getStoredTenantId } from '@/lib/api/storage'
import {
  uploadDocument,
  formatFileSize,
  ALLOWED_EXTENSIONS,
  ALLOWED_TYPES,
  MAX_FILE_SIZE_MB
} from '@/lib/supabase-storage'
import type { Property } from '@/types/property'

// ---------------------------------------------------------------------------

const DOCUMENT_TYPES = ['ID Card', 'Passport', 'Lease Agreement', 'Contract', 'Other']

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

type FormData = {
  documentType: string
  occupantId:   string
  occupantName: string
  propertyId:   string
  propertyName: string
  unitId:       string
  unitNo:       string
}

const EMPTY: FormData = {
  documentType: '',
  occupantId:   '',
  occupantName: '',
  propertyId:   '',
  propertyName: '',
  unitId:       '',
  unitNo:       ''
}

type Props = {
  open:      boolean
  setOpen:   (open: boolean) => void
  onSuccess: () => void
}

// ---------------------------------------------------------------------------

const AddDocumentDialog = ({ open, setOpen, onSuccess }: Props) => {
  const [form,       setForm]       = useState<FormData>(EMPTY)
  const [upload,     setUpload]     = useState<UploadState>({ status: 'idle' })
  const [submitting, setSubmitting] = useState(false)
  const [errors,     setErrors]     = useState<Partial<Record<keyof FormData, string>>>({})

  const [occupants,   setOccupants]   = useState<OccupantRecord[]>([])
  const [properties,  setProperties]  = useState<Property[]>([])
  const [loadingRefs, setLoadingRefs] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ---- Load tenants + properties when dialog opens ----

  useEffect(() => {
    if (!open) return
    const tenantId = getStoredTenantId()
    if (!tenantId) return

    setLoadingRefs(true)

    Promise.all([
      getOccupants(tenantId, { size: 200, status: 'active' }).catch(() => ({ data: [] })),
      getProperties(tenantId, { size: 200 }).catch(() => ({ data: [] }))
    ])
      .then(([occRes, propRes]) => {
        setOccupants(Array.isArray(occRes?.data) ? (occRes.data as OccupantRecord[]) : [])
        setProperties(Array.isArray(propRes?.data) ? (propRes.data as Property[]) : [])
      })
      .finally(() => setLoadingRefs(false))
  }, [open])

  // ---- Units derived from selected property ----

  const selectedProperty = properties.find(p => p.id === form.propertyId)
  const units: { id: string; unitNo: string }[] = (selectedProperty as any)?.units ?? []

  // ---- Form field helpers ----

  const set = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleOccupantChange = (id: string) => {
    const occ = occupants.find(o => o.id === id)
    if (!occ) { set('occupantId', ''); return }
    setForm(prev => ({
      ...prev,
      occupantId:   occ.id,
      occupantName: `${occ.firstName} ${occ.lastName}`,
      propertyId:   occ.propertyId   ?? prev.propertyId,
      propertyName: occ.propertyName ?? prev.propertyName,
      unitId:       occ.unitId  ?? prev.unitId,
      unitNo:       occ.unitNo  ?? prev.unitNo
    }))
    setErrors(prev => ({ ...prev, occupantId: undefined }))
  }

  const handlePropertyChange = (id: string) => {
    const prop = properties.find(p => p.id === id)
    setForm(prev => ({
      ...prev,
      propertyId:   id,
      propertyName: prop?.name ?? '',
      unitId:       '',
      unitNo:       ''
    }))
  }

  const handleUnitChange = (id: string) => {
    const unit = units.find(u => u.id === id)
    setForm(prev => ({ ...prev, unitId: id, unitNo: unit?.unitNo ?? '' }))
  }

  // ---- File upload ----

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setUpload({ status: 'error', message: 'Unsupported file type. Please upload a PDF, JPG, PNG, or DOCX.' })
      return
    }

    // Validate size
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

  // ---- Submit ----

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!form.documentType) errs.documentType = 'Required'
    if (!form.occupantId)   errs.occupantId   = 'Required'
    if (!form.propertyId)   errs.propertyId   = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    if (upload.status === 'uploading') return // wait for upload to finish

    setSubmitting(true)
    try {
      await createDocument({
        documentType: form.documentType,
        occupantId:   form.occupantId,
        occupantName: form.occupantName,
        propertyId:   form.propertyId,
        propertyName: form.propertyName,
        unitId:       form.unitId   || undefined,
        unitNo:       form.unitNo   || undefined,
        fileUrl:      upload.status === 'done' ? upload.fileUrl : undefined,
        fileName:     upload.status === 'done' ? upload.fileName : undefined,
        fileId:       upload.status === 'done' ? upload.fileId  : undefined
      })
      onSuccess()
      handleClose()
    } catch (err) {
      console.error('Failed to create document:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setForm(EMPTY)
    setErrors({})
    setUpload({ status: 'idle' })
    setOpen(false)
  }

  // ---- Upload drop zone UI ----

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

  // ---- Render ----

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span className='font-medium'>Upload Document</span>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent className='flex flex-col gap-5 pbs-4'>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type='file'
          accept={ALLOWED_EXTENSIONS}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />

        {loadingRefs ? (
          <div className='flex justify-center py-6'>
            <CircularProgress size={28} />
          </div>
        ) : (
          <Grid container spacing={3}>
            {/* Document type */}
            <Grid size={{ xs: 12 }}>
              <TextField
                select fullWidth size='small' label='Document Type *'
                value={form.documentType}
                onChange={e => set('documentType', e.target.value)}
                error={!!errors.documentType}
                helperText={errors.documentType}
              >
                {DOCUMENT_TYPES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Grid>

            {/* Tenant */}
            <Grid size={{ xs: 12 }}>
              <TextField
                select fullWidth size='small' label='Tenant *'
                value={form.occupantId}
                onChange={e => handleOccupantChange(e.target.value)}
                error={!!errors.occupantId}
                helperText={errors.occupantId}
              >
                {occupants.length === 0 && (
                  <MenuItem disabled value=''>No active tenants found</MenuItem>
                )}
                {occupants.map(o => (
                  <MenuItem key={o.id} value={o.id}>
                    {o.firstName} {o.lastName}{o.unitNo ? ` — Unit ${o.unitNo}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Property */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select fullWidth size='small' label='Property *'
                value={form.propertyId}
                onChange={e => handlePropertyChange(e.target.value)}
                error={!!errors.propertyId}
                helperText={errors.propertyId}
              >
                {properties.length === 0 && (
                  <MenuItem disabled value=''>No properties found</MenuItem>
                )}
                {properties.map(p => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* Unit */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select fullWidth size='small' label='Unit'
                value={form.unitId}
                onChange={e => handleUnitChange(e.target.value)}
                disabled={!form.propertyId}
              >
                <MenuItem value=''>None / N/A</MenuItem>
                {units.map(u => (
                  <MenuItem key={u.id} value={u.id}>{u.unitNo}</MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* File upload */}
            <Grid size={{ xs: 12 }}>
              <Typography variant='body2' color='text.secondary' className='mbe-2'>
                Document File <Typography component='span' variant='caption' color='text.disabled'>(optional but recommended)</Typography>
              </Typography>
              {renderDropZone()}
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={submitting || loadingRefs || upload.status === 'uploading'}
          endIcon={
            submitting
              ? <CircularProgress size={16} color='inherit' />
              : <i className='ri-save-line' />
          }
        >
          {submitting ? 'Saving…' : 'Save Document'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddDocumentDialog
