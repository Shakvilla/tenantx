// Documentation: /docs/agreement/agreement-module.md

'use client'

// React Imports
import { useState, useEffect, useRef, useMemo } from 'react'

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

// Type Imports
import type { Agreement, AgreementFormDataType, AgreementType, AgreementStatus, PaymentFrequency } from '@/types/agreement/agreementTypes'

type Property = {
  id: number | string
  name: string
}

type Unit = {
  id: number | string
  unitNumber: string
  propertyId: string
  propertyName: string
}

type Tenant = {
  id: number | string
  name: string
}

type Props = {
  open: boolean
  handleClose: () => void
  properties: Property[]
  units: Unit[]
  tenants: Tenant[]
  agreementsData?: Agreement[]
  setData: (data: Agreement[]) => void
  editData?: Agreement | null
  mode?: 'add' | 'edit'
}

const initialData: AgreementFormDataType = {
  agreementNumber: '',
  type: 'lease',
  status: 'pending',
  tenantId: '',
  propertyId: '',
  unitId: '',
  startDate: '',
  endDate: '',
  signedDate: '',
  amount: '',
  rent: '',
  securityDeposit: '',
  lateFee: '',
  paymentFrequency: 'monthly',
  terms: '',
  conditions: '',
  duration: '',
  renewalOptions: '',
  documentFile: null
}

const AddAgreementDialog = ({
  open,
  handleClose,
  properties,
  units,
  tenants,
  agreementsData,
  setData,
  editData,
  mode = 'add'
}: Props) => {
  // States
  const [formData, setFormData] = useState<AgreementFormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof AgreementFormDataType, boolean>>>({})
  const [expanded, setExpanded] = useState<string | false>('basic-info')
  const [previewDocument, setPreviewDocument] = useState<string | null>(null)

  // Refs for file input
  const documentFileRef = useRef<HTMLInputElement>(null)
  const previousPropertyIdRef = useRef<string>('')

  // Get filtered units based on selected property (memoized to prevent infinite loops)
  const filteredUnits = useMemo(() => {
    return units.filter(unit => unit.propertyId === formData.propertyId)
  }, [units, formData.propertyId])

  // Get initial form data based on mode
  const getInitialFormData = (): AgreementFormDataType => {
    if (mode === 'edit' && editData) {
      const unit = units.find(u => u.unitNumber === editData.unitNo || u.id.toString() === editData.unitId?.toString())
      const tenant = tenants.find(t => t.name === editData.tenantName || t.id.toString() === editData.tenantId?.toString())

      return {
        agreementNumber: editData.agreementNumber || '',
        type: editData.type || 'lease',
        status: editData.status || 'pending',
        tenantId: tenant?.id.toString() || editData.tenantId?.toString() || '',
        propertyId: editData.propertyId?.toString() || '',
        unitId: unit?.id.toString() || editData.unitId?.toString() || '',
        startDate: editData.startDate || '',
        endDate: editData.endDate || '',
        signedDate: editData.signedDate || '',
        amount: editData.amount || '',
        rent: editData.rent || '',
        securityDeposit: editData.securityDeposit || '',
        lateFee: editData.lateFee || '',
        paymentFrequency: editData.paymentFrequency || 'monthly',
        terms: editData.terms || '',
        conditions: editData.conditions || '',
        duration: editData.duration || '',
        renewalOptions: editData.renewalOptions || '',
        documentFile: null
      }
    }
    return initialData
  }

  // Reset form when dialog opens/closes or editData changes
  useEffect(() => {
    if (open) {
      const newFormData = getInitialFormData()
      setFormData(newFormData)
      setErrors({})
      setExpanded('basic-info')
      setPreviewDocument(editData?.documentUrl || null)
      previousPropertyIdRef.current = newFormData.propertyId
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData, mode])

  // Reset unitId when property changes (only when property actually changes, not on every render)
  useEffect(() => {
    if (formData.propertyId !== previousPropertyIdRef.current) {
      previousPropertyIdRef.current = formData.propertyId
      // Only reset if current unitId doesn't exist in new filtered units
      if (formData.unitId) {
        const currentUnitExists = filteredUnits.find(u => u.id.toString() === formData.unitId)
        if (!currentUnitExists) {
          setFormData(prev => ({ ...prev, unitId: '' }))
        }
      }
    }
  }, [formData.propertyId, formData.unitId, filteredUnits])

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewDocument && previewDocument.startsWith('blob:')) {
        URL.revokeObjectURL(previewDocument)
      }
    }
  }, [previewDocument])

  const handleExpandChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const handleInputChange = (field: keyof AgreementFormDataType, value: string | AgreementType | AgreementStatus | PaymentFrequency) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }
  }

  const handleFileChange = (file: File | null) => {
    setFormData(prev => ({ ...prev, documentFile: file }))
    if (file) {
      const previewUrl = URL.createObjectURL(file)
      setPreviewDocument(previewUrl)
    } else {
      setPreviewDocument(null)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AgreementFormDataType, boolean>> = {}

    if (!formData.agreementNumber.trim()) newErrors.agreementNumber = true
    if (!formData.tenantId) newErrors.tenantId = true
    if (!formData.propertyId) newErrors.propertyId = true
    if (!formData.unitId) newErrors.unitId = true
    if (!formData.startDate) newErrors.startDate = true
    if (!formData.endDate) newErrors.endDate = true
    if (!formData.amount.trim()) newErrors.amount = true

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) {
      return
    }

    const selectedProperty = properties.find(p => p.id.toString() === formData.propertyId)
    const selectedUnit = units.find(u => u.id.toString() === formData.unitId)
    const selectedTenant = tenants.find(t => t.id.toString() === formData.tenantId)

    if (mode === 'add') {
      const newAgreement: Agreement = {
        id: Date.now(),
        agreementNumber: formData.agreementNumber,
        type: formData.type,
        status: formData.status,
        tenantId: formData.tenantId,
        tenantName: selectedTenant?.name || '',
        propertyId: formData.propertyId,
        propertyName: selectedProperty?.name || '',
        unitId: formData.unitId,
        unitNo: selectedUnit?.unitNumber || '',
        startDate: formData.startDate,
        endDate: formData.endDate,
        signedDate: formData.signedDate || undefined,
        amount: formData.amount,
        rent: formData.rent || undefined,
        securityDeposit: formData.securityDeposit || undefined,
        lateFee: formData.lateFee || undefined,
        paymentFrequency: formData.paymentFrequency,
        terms: formData.terms || undefined,
        conditions: formData.conditions || undefined,
        duration: formData.duration || undefined,
        renewalOptions: formData.renewalOptions || undefined,
        documentUrl: previewDocument || undefined
      }

      if (agreementsData && setData) {
        setData([...agreementsData, newAgreement])
      }
    } else if (mode === 'edit' && editData) {
      const updatedAgreement: Agreement = {
        ...editData,
        agreementNumber: formData.agreementNumber,
        type: formData.type,
        status: formData.status,
        tenantId: formData.tenantId,
        tenantName: selectedTenant?.name || editData.tenantName,
        propertyId: formData.propertyId,
        propertyName: selectedProperty?.name || editData.propertyName,
        unitId: formData.unitId,
        unitNo: selectedUnit?.unitNumber || editData.unitNo,
        startDate: formData.startDate,
        endDate: formData.endDate,
        signedDate: formData.signedDate || editData.signedDate,
        amount: formData.amount,
        rent: formData.rent || editData.rent,
        securityDeposit: formData.securityDeposit || editData.securityDeposit,
        lateFee: formData.lateFee || editData.lateFee,
        paymentFrequency: formData.paymentFrequency,
        terms: formData.terms || editData.terms,
        conditions: formData.conditions || editData.conditions,
        duration: formData.duration || editData.duration,
        renewalOptions: formData.renewalOptions || editData.renewalOptions,
        documentUrl: previewDocument || editData.documentUrl
      }

      if (agreementsData && setData) {
        setData(agreementsData.map(agreement => (agreement.id === editData.id ? updatedAgreement : agreement)))
      }
    }

    handleClose()
    setFormData(initialData)
    setErrors({})
    setPreviewDocument(null)
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
    setErrors({})
    setPreviewDocument(null)
  }

  return (
    <Dialog open={open} onClose={handleReset} maxWidth='lg' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>{mode === 'edit' ? 'Edit Agreement' : 'Add Agreement'}</span>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div className='flex flex-col gap-4 mbs-4'>
          {/* Basic Information Section */}
          <Accordion expanded={expanded === 'basic-info'} onChange={handleExpandChange('basic-info')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-file-contract-line text-xl' />
                <Typography variant='h6'>Basic Information</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Agreement Number'
                    placeholder='AGR-001'
                    value={formData.agreementNumber}
                    onChange={e => handleInputChange('agreementNumber', e.target.value)}
                    error={Boolean(errors.agreementNumber)}
                    helperText={errors.agreementNumber ? 'This field is required.' : ''}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel id='type-label'>Type</InputLabel>
                    <Select
                      size='small'
                      labelId='type-label'
                      label='Type'
                      value={formData.type}
                      onChange={e => handleInputChange('type', e.target.value as AgreementType)}
                    >
                      <MenuItem value='lease'>Lease</MenuItem>
                      <MenuItem value='contract'>Contract</MenuItem>
                      <MenuItem value='other'>Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel id='status-label'>Status</InputLabel>
                    <Select
                      size='small'
                      labelId='status-label'
                      label='Status'
                      value={formData.status}
                      onChange={e => handleInputChange('status', e.target.value as AgreementStatus)}
                    >
                      <MenuItem value='active'>Active</MenuItem>
                      <MenuItem value='expired'>Expired</MenuItem>
                      <MenuItem value='pending'>Pending</MenuItem>
                      <MenuItem value='terminated'>Terminated</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Duration'
                    placeholder='12 months'
                    value={formData.duration}
                    onChange={e => handleInputChange('duration', e.target.value)}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Parties Section */}
          <Accordion expanded={expanded === 'parties'} onChange={handleExpandChange('parties')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-group-line text-xl' />
                <Typography variant='h6'>Parties</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={Boolean(errors.tenantId)} size='small'>
                    <InputLabel id='tenant-label'>Tenant</InputLabel>
                    <Select
                      size='small'
                      labelId='tenant-label'
                      label='Tenant'
                      value={formData.tenantId}
                      onChange={e => handleInputChange('tenantId', e.target.value)}
                    >
                      <MenuItem value=''>Select Tenant</MenuItem>
                      {tenants.map(tenant => (
                        <MenuItem key={tenant.id} value={tenant.id.toString()}>
                          {tenant.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.tenantId && (
                      <Typography variant='caption' color='error' className='mts-1'>
                        This field is required.
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={Boolean(errors.propertyId)} size='small'>
                    <InputLabel id='property-label'>Property</InputLabel>
                    <Select
                      size='small'
                      labelId='property-label'
                      label='Property'
                      value={formData.propertyId}
                      onChange={e => handleInputChange('propertyId', e.target.value)}
                    >
                      <MenuItem value=''>Select Property</MenuItem>
                      {properties.map(property => (
                        <MenuItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.propertyId && (
                      <Typography variant='caption' color='error' className='mts-1'>
                        This field is required.
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth error={Boolean(errors.unitId)} size='small' disabled={!formData.propertyId}>
                    <InputLabel id='unit-label'>Unit</InputLabel>
                    <Select
                      size='small'
                      labelId='unit-label'
                      label='Unit'
                      value={formData.unitId}
                      onChange={e => handleInputChange('unitId', e.target.value)}
                    >
                      <MenuItem value=''>Select Unit</MenuItem>
                      {filteredUnits.map(unit => (
                        <MenuItem key={unit.id} value={unit.id.toString()}>
                          {unit.unitNumber}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.unitId && (
                      <Typography variant='caption' color='error' className='mts-1'>
                        This field is required.
                      </Typography>
                    )}
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Dates Section */}
          <Accordion expanded={expanded === 'dates'} onChange={handleExpandChange('dates')}>
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
                    label='Start Date'
                    type='date'
                    value={formData.startDate}
                    onChange={e => handleInputChange('startDate', e.target.value)}
                    error={Boolean(errors.startDate)}
                    helperText={errors.startDate ? 'This field is required.' : ''}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='End Date'
                    type='date'
                    value={formData.endDate}
                    onChange={e => handleInputChange('endDate', e.target.value)}
                    error={Boolean(errors.endDate)}
                    helperText={errors.endDate ? 'This field is required.' : ''}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Signed Date'
                    type='date'
                    value={formData.signedDate}
                    onChange={e => handleInputChange('signedDate', e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Financial Section */}
          <Accordion expanded={expanded === 'financial'} onChange={handleExpandChange('financial')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-money-dollar-circle-line text-xl' />
                <Typography variant='h6'>Financial</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Total Amount'
                    placeholder='₵14,400'
                    value={formData.amount}
                    onChange={e => handleInputChange('amount', e.target.value)}
                    error={Boolean(errors.amount)}
                    helperText={errors.amount ? 'This field is required.' : ''}
                    required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Rent'
                    placeholder='₵1,200'
                    value={formData.rent}
                    onChange={e => handleInputChange('rent', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Security Deposit'
                    placeholder='₵2,400'
                    value={formData.securityDeposit}
                    onChange={e => handleInputChange('securityDeposit', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Late Fee'
                    placeholder='₵50'
                    value={formData.lateFee}
                    onChange={e => handleInputChange('lateFee', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel id='payment-frequency-label'>Payment Frequency</InputLabel>
                    <Select
                      size='small'
                      labelId='payment-frequency-label'
                      label='Payment Frequency'
                      value={formData.paymentFrequency}
                      onChange={e => handleInputChange('paymentFrequency', e.target.value as PaymentFrequency)}
                    >
                      <MenuItem value='monthly'>Monthly</MenuItem>
                      <MenuItem value='quarterly'>Quarterly</MenuItem>
                      <MenuItem value='yearly'>Yearly</MenuItem>
                      <MenuItem value='one-time'>One-time</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Terms Section */}
          <Accordion expanded={expanded === 'terms'} onChange={handleExpandChange('terms')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-file-text-line text-xl' />
                <Typography variant='h6'>Terms & Conditions</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Terms'
                    placeholder='Enter terms...'
                    value={formData.terms}
                    onChange={e => handleInputChange('terms', e.target.value)}
                    multiline
                    rows={4}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Conditions'
                    placeholder='Enter conditions...'
                    value={formData.conditions}
                    onChange={e => handleInputChange('conditions', e.target.value)}
                    multiline
                    rows={4}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    size='small'
                    fullWidth
                    label='Renewal Options'
                    placeholder='Enter renewal options...'
                    value={formData.renewalOptions}
                    onChange={e => handleInputChange('renewalOptions', e.target.value)}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Documents Section */}
          <Accordion expanded={expanded === 'documents'} onChange={handleExpandChange('documents')}>
            <AccordionSummary expandIcon={<i className='ri-arrow-down-s-line' />}>
              <div className='flex items-center gap-2'>
                <i className='ri-file-upload-line text-xl' />
                <Typography variant='h6'>Documents</Typography>
              </div>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={6}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant='body2' className='font-medium mbe-2'>
                    Agreement Document
                  </Typography>
                  <input
                    ref={documentFileRef}
                    type='file'
                    accept='.pdf,.doc,.docx'
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0] || null
                      handleFileChange(file)
                      if (e.target) {
                        e.target.value = ''
                      }
                    }}
                  />
                  <Box className='flex flex-col gap-2'>
                    {previewDocument ? (
                      <>
                        <Box className='border rounded p-2'>
                          <Typography variant='body2' color='text.primary'>
                            Document uploaded
                          </Typography>
                        </Box>
                        <Box className='flex gap-2'>
                          <Button
                            variant='outlined'
                            size='small'
                            onClick={() => documentFileRef.current?.click()}
                            startIcon={<i className='ri-edit-line' />}
                            fullWidth
                          >
                            Change
                          </Button>
                          <Button
                            variant='outlined'
                            size='small'
                            color='error'
                            onClick={() => handleFileChange(null)}
                            startIcon={<i className='ri-delete-bin-line' />}
                            fullWidth
                          >
                            Remove
                          </Button>
                        </Box>
                      </>
                    ) : (
                      <Button
                        variant='outlined'
                        size='small'
                        onClick={() => documentFileRef.current?.click()}
                        startIcon={<i className='ri-file-upload-line' />}
                        fullWidth
                      >
                        Choose File
                      </Button>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
        </div>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleReset}>
          Cancel
        </Button>
        <Button variant='contained' color='primary' onClick={handleSubmit}>
          {mode === 'edit' ? 'Update' : 'Save Now'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddAgreementDialog

