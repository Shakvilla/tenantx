'use client'

// React Imports
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import Box from '@mui/material/Box'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'
import LinearProgress from '@mui/material/LinearProgress'
import Link from '@mui/material/Link'

// Third-party Imports
import { useDropzone } from 'react-dropzone'

// API Imports
import {
  createAgreement,
  updateAgreement,
  type Agreement,
  type AgreementType,
  type PaymentFrequency
} from '@/lib/api/agreements'
import { getProperties } from '@/lib/api/properties'
import { getAllUnits } from '@/lib/api/units'
import { getOccupants, type OccupantRecord } from '@/lib/api/occupants'
import { getStoredTenantId } from '@/lib/api/storage'
import { uploadImage } from '@/lib/imagekit'

// Component Imports
import RichTextEditor from '@/components/form/RichTextEditor'

type Props = {
  open: boolean
  handleClose: () => void
  editAgreement?: Agreement | null
  onSaved: (agreement: Agreement) => void
}

type FormData = {
  type: AgreementType
  occupantId: string
  propertyId: string
  unitId: string
  startDate: string
  endDate: string
  signedDate: string
  rent: string
  securityDeposit: string
  lateFee: string
  totalAmount: string
  currency: string
  paymentFrequency: PaymentFrequency
  duration: string
  terms: string
  conditions: string
  renewalOptions: string
  documentUrl: string
}

const initialData: FormData = {
  type: 'LEASE',
  occupantId: '',
  propertyId: '',
  unitId: '',
  startDate: '',
  endDate: '',
  signedDate: '',
  rent: '',
  securityDeposit: '',
  lateFee: '',
  totalAmount: '',
  currency: 'GHS',
  paymentFrequency: 'MONTHLY',
  duration: '',
  terms: '',
  conditions: '',
  renewalOptions: '',
  documentUrl: ''
}

function agreementToForm(a: Agreement): FormData {
  return {
    type: a.type,
    occupantId: a.occupantId ?? '',
    propertyId: a.propertyId ?? '',
    unitId: a.unitId ?? '',
    startDate: a.startDate ?? '',
    endDate: a.endDate ?? '',
    signedDate: a.signedDate ?? '',
    rent: a.rent != null ? String(a.rent) : '',
    securityDeposit: a.securityDeposit != null ? String(a.securityDeposit) : '',
    lateFee: a.lateFee != null ? String(a.lateFee) : '',
    totalAmount: a.totalAmount != null ? String(a.totalAmount) : '',
    currency: a.currency ?? 'GHS',
    paymentFrequency: a.paymentFrequency ?? 'MONTHLY',
    duration: a.duration ?? '',
    terms: a.terms ?? '',
    conditions: a.conditions ?? '',
    renewalOptions: a.renewalOptions ?? '',
    documentUrl: a.documentUrl ?? ''
  }
}

// Accepted MIME types for the document dropzone
const ACCEPTED_DOC_TYPES = {
  'application/pdf': ['.pdf'],
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg']
}

const getFileIcon = (type: string) => {
  if (type === 'application/pdf') return 'ri-file-pdf-2-line'
  if (type.startsWith('image/')) return 'ri-image-line'
  return 'ri-file-line'
}

const AddAgreementDialog = ({ open, handleClose, editAgreement, onSaved }: Props) => {
  const [formData, setFormData] = useState<FormData>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, boolean>>>({})
  const [expanded, setExpanded] = useState<string | false>('basic-info')
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Document upload state
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docUploading, setDocUploading] = useState(false)
  const [docUploadError, setDocUploadError] = useState<string | null>(null)

  // Reference data
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [allUnits, setAllUnits] = useState<{ id: string; unitNumber: string; propertyId: string }[]>([])
  const [occupants, setOccupants] = useState<OccupantRecord[]>([])
  const [loadingRefs, setLoadingRefs] = useState(false)

  const isEdit = Boolean(editAgreement)

  // Tracks whether the current propertyId change came from form initialization
  // (edit-mode load) vs. a deliberate user change. We use a ref so it doesn't
  // trigger re-renders and is always in sync with the effect execution order.
  const skipUnitReset = useRef(false)

  // Load reference data when dialog opens
  useEffect(() => {
    if (!open) return
    const tenantId = getStoredTenantId()
    if (!tenantId) return

    setLoadingRefs(true)
    Promise.all([
      getProperties(tenantId, { size: 200 }),
      getAllUnits(tenantId, { size: 500 }),
      getOccupants(tenantId, { size: 200, status: 'active' })
    ])
      .then(([propRes, unitRes, occupantRes]) => {
        setProperties((propRes.data ?? []).map((p: any) => ({ id: p.id, name: p.name })))
        setAllUnits((unitRes.data ?? []).map((u: any) => ({ id: u.id, unitNumber: u.unitNo, propertyId: u.propertyId })))
        setOccupants(Array.isArray(occupantRes) ? occupantRes : (occupantRes.data ?? []))
      })
      .catch(() => {})
      .finally(() => setLoadingRefs(false))
  }, [open])

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      // Mark the upcoming propertyId change as an initialization (not user-driven),
      // so the unit-reset effect below doesn't wipe the pre-selected unit in edit mode.
      skipUnitReset.current = true
      setFormData(editAgreement ? agreementToForm(editAgreement) : initialData)
      setErrors({})
      setApiError(null)
      setExpanded('basic-info')
      setDocFile(null)
      setDocUploadError(null)
    }
  }, [open, editAgreement])

  const filteredUnits = useMemo(
    () => (formData.propertyId ? allUnits.filter(u => u.propertyId === formData.propertyId) : []),
    [formData.propertyId, allUnits]
  )

  // Reset unit when property changes — but skip on form initialization so that
  // edit mode keeps its pre-selected unit when the form first loads.
  useEffect(() => {
    if (skipUnitReset.current) {
      skipUnitReset.current = false
      return
    }
    setFormData(prev => ({ ...prev, unitId: '' }))
  }, [formData.propertyId])

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }))
  }

  // ── Document drop handler ────────────────────────────────────────────────────

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted.length) return
    const file = accepted[0]
    setDocFile(file)
    setDocUploadError(null)
    setDocUploading(true)
    try {
      const result = await uploadImage(file, { folder: '/tenantx/agreements' })
      setFormData(prev => ({ ...prev, documentUrl: result.url }))
    } catch (err: any) {
      setDocUploadError(err?.message ?? 'Upload failed. Please try again.')
      setDocFile(null)
    } finally {
      setDocUploading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_DOC_TYPES,
    maxFiles: 1,
    multiple: false,
    disabled: docUploading
  })

  const clearDocument = () => {
    setDocFile(null)
    setDocUploadError(null)
    setFormData(prev => ({ ...prev, documentUrl: '' }))
  }

  // ── Validation & submit ──────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, boolean>> = {}
    if (!formData.occupantId) e.occupantId = true
    if (!formData.propertyId) e.propertyId = true
    if (!formData.unitId)     e.unitId = true
    if (!formData.startDate)  e.startDate = true
    if (!formData.endDate)    e.endDate = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setApiError(null)

    const selectedOccupant = occupants.find(o => o.id === formData.occupantId)
    const selectedProperty  = properties.find(p => p.id === formData.propertyId)
    const selectedUnit      = allUnits.find(u => u.id === formData.unitId)

    const payload = {
      type: formData.type,
      occupantId: formData.occupantId || undefined,
      occupantName: selectedOccupant
        ? `${selectedOccupant.firstName} ${selectedOccupant.lastName}`
        : undefined,
      propertyId: formData.propertyId || undefined,
      propertyName: selectedProperty?.name,
      unitId: formData.unitId || undefined,
      unitNo: selectedUnit?.unitNumber,
      startDate: formData.startDate,
      endDate: formData.endDate,
      signedDate: formData.signedDate || null,
      rent: formData.rent ? parseFloat(formData.rent) : null,
      securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : null,
      lateFee: formData.lateFee ? parseFloat(formData.lateFee) : null,
      totalAmount: formData.totalAmount ? parseFloat(formData.totalAmount) : null,
      currency: formData.currency,
      paymentFrequency: formData.paymentFrequency,
      duration: formData.duration || undefined,
      terms: formData.terms || undefined,
      conditions: formData.conditions || undefined,
      renewalOptions: formData.renewalOptions || undefined,
      documentUrl: formData.documentUrl || undefined
    }

    try {
      let saved: Agreement
      if (isEdit && editAgreement) {
        saved = await updateAgreement(editAgreement.id, payload)
      } else {
        saved = await createAgreement(payload)
      }
      onSaved(saved)
      handleClose()
    } catch (err: any) {
      setApiError(err?.message ?? 'Failed to save agreement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
    setErrors({})
    setApiError(null)
    setDocFile(null)
    setDocUploadError(null)
  }

  return (
    <Dialog open={open} onClose={handleReset} maxWidth='lg' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>{isEdit ? 'Edit Agreement' : 'Add Agreement'}</span>
        <IconButton size='small' onClick={handleReset} sx={{ color: 'warning.main' }}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {apiError && <Alert severity='error' className='mbe-4'>{apiError}</Alert>}

        <div className='flex flex-col gap-4 mbs-2'>

          {/* ── Basic Information ── */}
          <Accordion
            expanded={expanded === 'basic-info'}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? 'basic-info' : false)}
          >
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-file-contract-line text-xl' />
                <Typography variant='h6'>Basic Information</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                {isEdit && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      size='small'
                      fullWidth
                      label='Agreement Number'
                      value={editAgreement?.agreementNumber ?? ''}
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                )}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel id='type-label'>Type</InputLabel>
                    <Select
                      labelId='type-label'
                      label='Type'
                      value={formData.type}
                      onChange={e => handleChange('type', e.target.value as AgreementType)}
                    >
                      <MenuItem value='LEASE'>Lease</MenuItem>
                      <MenuItem value='CONTRACT'>Contract</MenuItem>
                      <MenuItem value='OTHER'>Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Duration'
                    placeholder='e.g. 12 months'
                    value={formData.duration}
                    onChange={e => handleChange('duration', e.target.value)}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ── Parties ── */}
          <Accordion
            expanded={expanded === 'parties'}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? 'parties' : false)}
          >
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-group-line text-xl' />
                <Typography variant='h6'>Parties</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {loadingRefs ? <Skeleton variant='rectangular' height={40} /> : (
                    <FormControl fullWidth size='small' error={Boolean(errors.occupantId)}>
                      <InputLabel id='occupant-label'>Occupant *</InputLabel>
                      <Select
                        labelId='occupant-label'
                        label='Occupant *'
                        value={formData.occupantId}
                        onChange={e => handleChange('occupantId', e.target.value)}
                      >
                        <MenuItem value=''>Select Occupant</MenuItem>
                        {occupants.map(o => (
                          <MenuItem key={o.id} value={o.id}>
                            {o.firstName} {o.lastName}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.occupantId && (
                        <Typography variant='caption' color='error' className='mts-1 mli-3'>
                          This field is required.
                        </Typography>
                      )}
                    </FormControl>
                  )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  {loadingRefs ? <Skeleton variant='rectangular' height={40} /> : (
                    <FormControl fullWidth size='small' error={Boolean(errors.propertyId)}>
                      <InputLabel id='property-label'>Property *</InputLabel>
                      <Select
                        labelId='property-label'
                        label='Property *'
                        value={formData.propertyId}
                        onChange={e => handleChange('propertyId', e.target.value)}
                      >
                        <MenuItem value=''>Select Property</MenuItem>
                        {properties.map(p => (
                          <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                        ))}
                      </Select>
                      {errors.propertyId && (
                        <Typography variant='caption' color='error' className='mts-1 mli-3'>
                          This field is required.
                        </Typography>
                      )}
                    </FormControl>
                  )}
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  {loadingRefs ? <Skeleton variant='rectangular' height={40} /> : (
                    <FormControl fullWidth size='small' error={Boolean(errors.unitId)} disabled={!formData.propertyId}>
                      <InputLabel id='unit-label'>Unit *</InputLabel>
                      <Select
                        labelId='unit-label'
                        label='Unit *'
                        value={formData.unitId}
                        onChange={e => handleChange('unitId', e.target.value)}
                      >
                        <MenuItem value=''>Select Unit</MenuItem>
                        {filteredUnits.map(u => (
                          <MenuItem key={u.id} value={u.id}>{u.unitNumber}</MenuItem>
                        ))}
                      </Select>
                      {errors.unitId && (
                        <Typography variant='caption' color='error' className='mts-1 mli-3'>
                          This field is required.
                        </Typography>
                      )}
                    </FormControl>
                  )}
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ── Dates ── */}
          <Accordion
            expanded={expanded === 'dates'}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? 'dates' : false)}
          >
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-calendar-line text-xl' />
                <Typography variant='h6'>Dates</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Start Date *'
                    type='date'
                    value={formData.startDate}
                    onChange={e => handleChange('startDate', e.target.value)}
                    error={Boolean(errors.startDate)}
                    helperText={errors.startDate ? 'Required.' : ''}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='End Date *'
                    type='date'
                    value={formData.endDate}
                    onChange={e => handleChange('endDate', e.target.value)}
                    error={Boolean(errors.endDate)}
                    helperText={errors.endDate ? 'Required.' : ''}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Signed Date'
                    type='date'
                    value={formData.signedDate}
                    onChange={e => handleChange('signedDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ── Financial ── */}
          <Accordion
            expanded={expanded === 'financial'}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? 'financial' : false)}
          >
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-money-dollar-circle-line text-xl' />
                <Typography variant='h6'>Financial</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                {(['totalAmount', 'rent', 'securityDeposit', 'lateFee'] as const).map(field => (
                  <Grid key={field} size={{ xs: 12, sm: 6 }}>
                    <TextField
                      size='small'
                      fullWidth
                      type='number'
                      label={
                        field === 'totalAmount' ? 'Total Amount' :
                        field === 'rent' ? 'Rent' :
                        field === 'securityDeposit' ? 'Security Deposit' :
                        'Late Fee'
                      }
                      value={formData[field]}
                      onChange={e => handleChange(field, e.target.value)}
                      slotProps={{ input: { startAdornment: <InputAdornment position='start'>₵</InputAdornment> } }}
                    />
                  </Grid>
                ))}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel id='freq-label'>Payment Frequency</InputLabel>
                    <Select
                      labelId='freq-label'
                      label='Payment Frequency'
                      value={formData.paymentFrequency}
                      onChange={e => handleChange('paymentFrequency', e.target.value as PaymentFrequency)}
                    >
                      <MenuItem value='MONTHLY'>Monthly</MenuItem>
                      <MenuItem value='QUARTERLY'>Quarterly</MenuItem>
                      <MenuItem value='YEARLY'>Yearly</MenuItem>
                      <MenuItem value='ONE_TIME'>One-time</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ── Terms & Conditions ── */}
          <Accordion
            expanded={expanded === 'terms'}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? 'terms' : false)}
          >
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-file-text-line text-xl' />
                <Typography variant='h6'>Terms & Conditions</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                  <RichTextEditor
                    label='Terms'
                    placeholder='Enter the agreement terms…'
                    value={formData.terms}
                    onChange={v => handleChange('terms', v)}
                    minHeight={140}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <RichTextEditor
                    label='Conditions'
                    placeholder='Enter the agreement conditions…'
                    value={formData.conditions}
                    onChange={v => handleChange('conditions', v)}
                    minHeight={140}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <RichTextEditor
                    label='Renewal Options'
                    placeholder='Describe any renewal options…'
                    value={formData.renewalOptions}
                    onChange={v => handleChange('renewalOptions', v)}
                    minHeight={100}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* ── Documents ── */}
          <Accordion
            expanded={expanded === 'documents'}
            onChange={(_, isExpanded) => setExpanded(isExpanded ? 'documents' : false)}
          >
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-file-upload-line text-xl' />
                <Typography variant='h6'>Documents</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={4}>

                {/* Uploaded file preview / existing URL */}
                {formData.documentUrl && !docFile && (
                  <Grid size={{ xs: 12 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        border: theme => `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        bgcolor: 'action.hover'
                      }}
                    >
                      <i className='ri-file-line text-2xl text-primary' />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant='body2' noWrap>
                          <Link href={formData.documentUrl} target='_blank' rel='noopener noreferrer'>
                            View existing document
                          </Link>
                        </Typography>
                        <Typography variant='caption' color='text.secondary' noWrap>
                          {formData.documentUrl}
                        </Typography>
                      </Box>
                      <IconButton size='small' color='error' onClick={clearDocument} title='Remove document'>
                        <i className='ri-close-circle-line' />
                      </IconButton>
                    </Box>
                  </Grid>
                )}

                {/* Newly-selected file (before or after upload) */}
                {docFile && (
                  <Grid size={{ xs: 12 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        border: theme => `1px solid ${theme.palette.divider}`,
                        borderRadius: 1,
                        bgcolor: 'action.hover'
                      }}
                    >
                      <i className={`${getFileIcon(docFile.type)} text-2xl text-primary`} />
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant='body2' fontWeight={500} noWrap>{docFile.name}</Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {(docFile.size / 1024).toFixed(1)} KB
                          {formData.documentUrl ? ' — uploaded ✓' : ''}
                        </Typography>
                        {docUploading && <LinearProgress sx={{ mt: 0.5 }} />}
                      </Box>
                      {!docUploading && (
                        <IconButton size='small' color='error' onClick={clearDocument} title='Remove'>
                          <i className='ri-close-circle-line' />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>
                )}

                {/* Upload error */}
                {docUploadError && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity='error' onClose={() => setDocUploadError(null)}>{docUploadError}</Alert>
                  </Grid>
                )}

                {/* Dropzone — shown when no file selected */}
                {!docFile && !formData.documentUrl && (
                  <Grid size={{ xs: 12 }}>
                    <Box
                      {...getRootProps()}
                      sx={{
                        border: theme => `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
                        borderRadius: 1,
                        p: 4,
                        textAlign: 'center',
                        cursor: docUploading ? 'not-allowed' : 'pointer',
                        bgcolor: isDragActive ? 'action.selected' : 'action.hover',
                        transition: 'border-color 0.2s, background-color 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          bgcolor: 'action.selected'
                        }
                      }}
                    >
                      <input {...getInputProps()} />
                      <i className='ri-upload-cloud-2-line text-4xl text-primary mb-2' style={{ display: 'block' }} />
                      <Typography variant='body1' fontWeight={500}>
                        {isDragActive ? 'Drop file here…' : 'Drag & drop or click to upload'}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        PDF, PNG or JPEG — max 10 MB
                      </Typography>
                    </Box>
                  </Grid>
                )}

                {/* Replace button — shown after a file is already attached */}
                {(docFile || formData.documentUrl) && !docUploading && (
                  <Grid size={{ xs: 12 }}>
                    <Box
                      {...getRootProps()}
                      sx={{ display: 'inline-block', cursor: 'pointer' }}
                    >
                      <input {...getInputProps()} />
                      <Button
                        variant='outlined'
                        size='small'
                        startIcon={<i className='ri-upload-2-line' />}
                        component='span'
                      >
                        Replace file
                      </Button>
                    </Box>
                  </Grid>
                )}

              </Grid>
            </AccordionDetails>
          </Accordion>

        </div>
      </DialogContent>

      <DialogActions className='gap-2 p-5'>
        <Button variant='outlined' color='secondary' onClick={handleReset} disabled={submitting || docUploading}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={onSubmit}
          disabled={submitting || docUploading}
          startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <i className='ri-save-line' />}
        >
          {submitting ? 'Saving…' : isEdit ? 'Update' : 'Save Now'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddAgreementDialog
