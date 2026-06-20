'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'

// API Imports
import { sendNotice as sendNoticeApi } from '@/lib/api/communications'

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
  email?: string
  propertyId?: string
  unitId?: string
}

type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess: () => void
  properties?: Property[]
  units?: Unit[]
  tenants?: Tenant[]
  initialRecipient?: string
  initialPropertyId?: string
  initialUnitId?: string
}

type FormDataType = {
  subject: string
  notice: string
  /** '' = all properties */
  propertyId: string
  /** '' = all units in property */
  unitId: string
  /** empty = all tenants in scope; non-empty = cherry-picked */
  tenantIds: string[]
  priority: 'normal' | 'high' | 'urgent'
}

const initialData: FormDataType = {
  subject: '',
  notice: '',
  propertyId: '',
  unitId: '',
  tenantIds: [],
  priority: 'normal'
}

const SendNoticeDialog = ({
  open,
  setOpen,
  onSuccess,
  properties = [],
  units = [],
  tenants = [],
  initialRecipient: _initialRecipient,
  initialPropertyId,
  initialUnitId
}: Props) => {
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)

  // ---- Derived lists ----

  const filteredUnits = useMemo(() => {
    if (!formData.propertyId) return units
    return units.filter(u => u.propertyId === formData.propertyId)
  }, [formData.propertyId, units])

  /**
   * Tenants visible in the chip picker — scoped by property + unit filter.
   * Empty propertyId = all tenants across all properties.
   */
  const scopedTenants = useMemo(() => {
    let result = tenants
    if (formData.propertyId) result = result.filter(t => t.propertyId === formData.propertyId)
    if (formData.unitId)     result = result.filter(t => t.unitId     === formData.unitId)
    return result
  }, [formData.propertyId, formData.unitId, tenants])

  /**
   * The actual recipients that will receive the notice.
   * If tenantIds is non-empty → those specific people.
   * If empty → everyone in scope (property / unit / all).
   */
  const recipients = useMemo(
    () =>
      formData.tenantIds.length > 0
        ? scopedTenants.filter(t => formData.tenantIds.includes(t.id.toString()))
        : scopedTenants,
    [formData.tenantIds, scopedTenants]
  )

  const allSelected =
    scopedTenants.length > 0 && formData.tenantIds.length === scopedTenants.length

  // ---- Scope label for the info banner ----
  const scopeLabel = useMemo(() => {
    if (formData.unitId) {
      const u = units.find(u => u.id.toString() === formData.unitId)
      return u ? `unit ${u.unitNumber}` : 'selected unit'
    }
    if (formData.propertyId) {
      const p = properties.find(p => p.id.toString() === formData.propertyId)
      return p ? p.name : 'selected property'
    }
    return 'all properties'
  }, [formData.propertyId, formData.unitId, properties, units])

  // ---- Lifecycle ----

  useEffect(() => {
    if (open) {
      setFormData({
        ...initialData,
        propertyId: initialPropertyId || '',
        unitId:     initialUnitId     || ''
      })
      setErrors({})
    }
  }, [open, initialPropertyId, initialUnitId])

  // Reset unitId & tenantIds when property changes
  const handlePropertyChange = (value: string) => {
    setFormData(prev => ({ ...prev, propertyId: value, unitId: '', tenantIds: [] }))
    if (errors.tenantIds) setErrors(prev => ({ ...prev, tenantIds: false }))
  }

  // Reset tenantIds when unit changes
  const handleUnitChange = (value: string) => {
    setFormData(prev => ({ ...prev, unitId: value, tenantIds: [] }))
  }

  const handleTenantToggle = (tenantId: string) => {
    setFormData(prev => ({
      ...prev,
      tenantIds: prev.tenantIds.includes(tenantId)
        ? prev.tenantIds.filter(id => id !== tenantId)
        : [...prev.tenantIds, tenantId]
    }))
  }

  const handleSelectAll = () => {
    setFormData(prev => ({
      ...prev,
      tenantIds: allSelected ? [] : scopedTenants.map(t => t.id.toString())
    }))
  }

  const handleFieldChange = (field: keyof FormDataType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field as string]) setErrors(prev => ({ ...prev, [field]: false }))
  }

  // ---- Validation ----

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}
    if (!formData.subject.trim()) newErrors.subject = true
    if (!formData.notice.trim())  newErrors.notice  = true
    if (recipients.length === 0)  newErrors.tenantIds = true
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ---- Submit ----

  const handleSubmit = async () => {
    if (!validateForm()) return
    setSubmitting(true)
    try {
      const selectedProperty = properties.find(p => p.id.toString() === formData.propertyId)
      const selectedUnit      = units.find(u => u.id.toString() === formData.unitId)

      await sendNoticeApi({
        subject:        formData.subject,
        message:        formData.notice,
        recipientNames: recipients.map(t => t.name),
        propertyId:     selectedProperty?.id.toString(),
        propertyName:   selectedProperty?.name,
        unitId:         selectedUnit?.id.toString(),
        unitNo:         selectedUnit?.unitNumber
      })
      onSuccess()
      handleClose()
    } catch (err) {
      console.error('Failed to send notice:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData(initialData)
    setErrors({})
    setOpen(false)
  }

  // ---- Render ----

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span className='font-medium'>Send Notice</span>
        <IconButton size='small' onClick={handleClose}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent className='flex flex-col gap-4'>
        <Grid container spacing={4}>

          {/* Subject */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth size='small' label='Subject *' placeholder='Enter notice subject'
              value={formData.subject}
              onChange={e => handleFieldChange('subject', e.target.value)}
              error={Boolean(errors.subject)}
              helperText={errors.subject ? 'This field is required.' : ''}
            />
          </Grid>

          {/* Priority */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='priority-label'>Priority</InputLabel>
              <Select
                labelId='priority-label' label='Priority' value={formData.priority}
                onChange={e => handleFieldChange('priority', e.target.value)}
              >
                <MenuItem value='normal'>Normal</MenuItem>
                <MenuItem value='high'>High</MenuItem>
                <MenuItem value='urgent'>Urgent</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Spacer on sm+ */}
          <Grid size={{ xs: 12, sm: 6 }} />

          <Grid size={{ xs: 12 }}>
            <Divider>
              <Typography variant='caption' color='text.secondary'>Recipient Scope</Typography>
            </Divider>
          </Grid>

          {/* Property filter */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel id='property-label'>Property</InputLabel>
              <Select
                labelId='property-label' label='Property' value={formData.propertyId}
                onChange={e => handlePropertyChange(e.target.value)}
              >
                <MenuItem value=''>All Properties</MenuItem>
                {properties.map(p => (
                  <MenuItem key={p.id} value={p.id.toString()}>{p.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Unit filter */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small' disabled={!formData.propertyId}>
              <InputLabel id='unit-label'>Unit</InputLabel>
              <Select
                labelId='unit-label' label='Unit' value={formData.unitId}
                onChange={e => handleUnitChange(e.target.value)}
              >
                <MenuItem value=''>All Units</MenuItem>
                {filteredUnits.map(u => (
                  <MenuItem key={u.id} value={u.id.toString()}>{u.unitNumber}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Recipients info banner */}
          <Grid size={{ xs: 12 }}>
            <Alert
              severity={recipients.length > 0 ? 'info' : 'warning'}
              icon={<i className={recipients.length > 0 ? 'ri-team-line' : 'ri-error-warning-line'} />}
            >
              {recipients.length > 0
                ? <>This notice will be sent to <strong>{recipients.length} tenant{recipients.length !== 1 ? 's' : ''}</strong> in <strong>{scopeLabel}</strong>.</>
                : <>No tenants found in <strong>{scopeLabel}</strong>. Select a different scope or add tenants first.</>
              }
            </Alert>
          </Grid>

          {/* Tenant chip picker */}
          {scopedTenants.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <div className='flex items-center justify-between mbe-2'>
                <Typography variant='body2' color='text.secondary'>
                  {formData.tenantIds.length > 0
                    ? `${formData.tenantIds.length} of ${scopedTenants.length} selected — click Send to notify only these tenants`
                    : 'Sending to all tenants in scope — click individual chips to narrow selection'}
                </Typography>
                <Button size='small' variant='text' onClick={handleSelectAll}>
                  {allSelected ? 'Clear All' : 'Select All'}
                </Button>
              </div>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  p: 2,
                  border: theme => `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  maxHeight: 200,
                  overflowY: 'auto'
                }}
              >
                {scopedTenants.map(tenant => {
                  const selected = formData.tenantIds.includes(tenant.id.toString())
                  return (
                    <Chip
                      key={tenant.id}
                      label={tenant.name}
                      size='small'
                      onClick={() => handleTenantToggle(tenant.id.toString())}
                      onDelete={selected ? () => handleTenantToggle(tenant.id.toString()) : undefined}
                      color={selected ? 'primary' : 'default'}
                      variant={selected ? 'filled' : 'outlined'}
                    />
                  )
                })}
              </Box>
              {errors.tenantIds && (
                <Typography variant='caption' color='error' sx={{ mt: 0.5 }}>
                  No recipients found. Adjust the scope or select tenants manually.
                </Typography>
              )}
            </Grid>
          )}

          {/* Notice content */}
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth multiline rows={6} size='small'
              label='Notice *' placeholder='Enter notice content'
              value={formData.notice}
              onChange={e => handleFieldChange('notice', e.target.value)}
              error={Boolean(errors.notice)}
              helperText={errors.notice ? 'This field is required.' : ''}
            />
          </Grid>

        </Grid>
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant='contained' color='primary' onClick={handleSubmit}
          disabled={submitting || recipients.length === 0}
          startIcon={submitting ? <CircularProgress size={16} /> : <i className='ri-notification-line' />}
        >
          Send to {recipients.length} Tenant{recipients.length !== 1 ? 's' : ''}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SendNoticeDialog
