'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

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
import InputAdornment from '@mui/material/InputAdornment'
import Divider from '@mui/material/Divider'
import Autocomplete from '@mui/material/Autocomplete'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// API Imports
import { createInvoice, updateInvoice, type Invoice, type InvoiceItem } from '@/lib/api/invoices'
import { getProperties } from '@/lib/api/properties'
import { getAllUnits } from '@/lib/api/units'
import { getOccupants } from '@/lib/api/occupants'
import { getStoredTenantId } from '@/lib/api/storage'
import type { Property, Unit } from '@/types/property'
import type { OccupantRecord } from '@/lib/api/occupants'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

type Props = {
  open: boolean
  handleClose: () => void
  editInvoice?: Invoice | null
  onSaved: (invoice: Invoice) => void
}

type LocalItem = {
  id: number   // temp local id for list key
  description: string
  quantity: number
  price: number
}

type FormData = {
  propertyId: string
  unitId: string
  occupantId: string
  invoiceMonth: string   // MM/YYYY
  dueDate: string        // YYYY-MM-DD
  amount: string
  invoiceType: string
  status: string
  description: string
  invoiceItems: LocalItem[]
}

const initialData: FormData = {
  propertyId: '',
  unitId: '',
  occupantId: '',
  invoiceMonth: '',
  dueDate: '',
  amount: '',
  invoiceType: '',
  status: 'DRAFT',
  description: '',
  invoiceItems: []
}

const AddInvoiceDialog = ({ open, handleClose, editInvoice, onSaved }: Props) => {
  const [formData, setFormData] = useState<FormData>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Reference data
  const [properties, setProperties] = useState<Property[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [occupants, setOccupants] = useState<OccupantRecord[]>([])
  const [loadingRefs, setLoadingRefs] = useState(false)

  const isEdit = Boolean(editInvoice)

  // Load reference data when dialog opens
  useEffect(() => {
    if (!open) return
    const tenantId = getStoredTenantId() ?? ''

    setLoadingRefs(true)
    Promise.all([
      getProperties(tenantId, { size: 200 }),
      getAllUnits(tenantId, { size: 500 }),
      getOccupants(tenantId, { size: 500 })
    ])
      .then(([propsRes, unitsRes, occupantsRes]) => {
        setProperties(Array.isArray(propsRes.data) ? propsRes.data : [])
        setUnits(Array.isArray(unitsRes.data) ? unitsRes.data : [])
        const occ = occupantsRes.data
        setOccupants(Array.isArray(occ) ? occ : [])
      })
      .catch(() => {})
      .finally(() => setLoadingRefs(false))
  }, [open])

  // Pre-fill form for edit mode
  useEffect(() => {
    if (!open) return
    setApiError(null)
    setErrors({})

    if (isEdit && editInvoice) {
      const today = editInvoice.issuedDate || new Date().toISOString().split('T')[0]
      const [year, month] = today.split('-')
      const invoiceMonth = editInvoice.invoiceMonth || `${month}/${year}`

      setFormData({
        propertyId: editInvoice.propertyId ?? '',
        unitId: editInvoice.unitId ?? '',
        occupantId: editInvoice.occupantId ?? '',
        invoiceMonth,
        dueDate: editInvoice.dueDate ?? '',
        amount: editInvoice.amount.toString(),
        invoiceType: editInvoice.invoiceType ?? '',
        status: editInvoice.status ?? 'DRAFT',
        description: editInvoice.description ?? '',
        invoiceItems: (editInvoice.invoiceItems ?? []).map((item, i) => ({ ...item, id: i }))
      })
    } else {
      const today = new Date()
      const mm = String(today.getMonth() + 1).padStart(2, '0')
      const yyyy = today.getFullYear()
      setFormData({
        ...initialData,
        invoiceMonth: `${mm}/${yyyy}`,
        dueDate: today.toISOString().split('T')[0]
      })
    }
  }, [open, editInvoice, isEdit])

  // Derived: filter units by selected property
  const filteredUnits = useMemo(
    () => (formData.propertyId ? units.filter(u => u.propertyId === formData.propertyId) : []),
    [units, formData.propertyId]
  )

  // Derived: filter occupants by selected unit
  const filteredOccupants = useMemo(() => {
    if (!formData.unitId) return occupants
    return occupants.filter(o => o.unitId === formData.unitId)
  }, [occupants, formData.unitId])

  const calculateTotal = useMemo(
    () => formData.invoiceItems.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [formData.invoiceItems]
  )

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const next: FormData = { ...prev, [field]: value }
      if (field === 'propertyId') { next.unitId = ''; next.occupantId = '' }
      if (field === 'unitId') next.occupantId = ''
      return next
    })
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }))
  }

  // Invoice month input: auto-format to MM/YYYY
  const handleMonthChange = (value: string) => {
    const digits = value.replace(/\D/g, '')
    let formatted = digits
    if (digits.length > 2) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 6)}`
    if (formatted.length <= 7) handleChange('invoiceMonth', formatted)
  }

  // Line items
  const addItem = () =>
    setFormData(prev => ({
      ...prev,
      invoiceItems: [...prev.invoiceItems, { id: Date.now(), description: '', quantity: 1, price: 0 }]
    }))

  const removeItem = (id: number) =>
    setFormData(prev => ({ ...prev, invoiceItems: prev.invoiceItems.filter(i => i.id !== id) }))

  const updateItem = (id: number, field: keyof LocalItem, value: string | number) =>
    setFormData(prev => ({
      ...prev,
      invoiceItems: prev.invoiceItems.map(i => (i.id === id ? { ...i, [field]: value } : i))
    }))

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormData, boolean>> = {}
    if (!formData.propertyId) e.propertyId = true
    if (!formData.unitId) e.unitId = true
    if (!formData.invoiceMonth) e.invoiceMonth = true
    if (!formData.dueDate) e.dueDate = true
    if (!formData.invoiceType.trim()) e.invoiceType = true
    if (!formData.description.trim()) e.description = true
    const amt = formData.invoiceItems.length > 0 ? calculateTotal : parseFloat(formData.amount) || 0
    if (amt <= 0) e.amount = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setApiError(null)

    // Resolve display names
    const selectedProperty = properties.find(p => p.id === formData.propertyId)
    const selectedUnit = units.find(u => u.id === formData.unitId)
    const selectedOccupant = formData.occupantId
      ? occupants.find(o => o.id === formData.occupantId)
      : null

    // Build issuedDate from invoiceMonth (MM/YYYY → YYYY-MM-01)
    const [month, year] = formData.invoiceMonth.split('/')
    const issuedDate = `${year}-${month}-01`

    const amountValue =
      formData.invoiceItems.length > 0 ? calculateTotal : parseFloat(formData.amount) || 0

    const payload = {
      occupantId: selectedOccupant?.id,
      occupantName: selectedOccupant
        ? `${selectedOccupant.firstName} ${selectedOccupant.lastName}`
        : undefined,
      occupantEmail: selectedOccupant?.email,
      propertyId: formData.propertyId,
      propertyName: selectedProperty?.name,
      unitId: formData.unitId,
      unitNo: selectedUnit?.unitNo,
      invoiceMonth: formData.invoiceMonth,
      issuedDate,
      dueDate: formData.dueDate,
      amount: amountValue,
      status: formData.status,
      invoiceType: formData.invoiceType,
      description: formData.description,
      invoiceItems:
        formData.invoiceItems.length > 0
          ? formData.invoiceItems.map(({ description, quantity, price }) => ({
              description,
              quantity,
              price
            }))
          : undefined
    }

    try {
      let saved: Invoice
      if (isEdit && editInvoice) {
        saved = await updateInvoice(editInvoice.id, payload)
      } else {
        saved = await createInvoice(payload as any)
      }
      onSaved(saved)
      handleClose()
    } catch (err: any) {
      setApiError(err?.message ?? 'Failed to save invoice')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setFormData(initialData)
    setErrors({})
    setApiError(null)
    handleClose()
  }

  const selectedOccupantObj = formData.occupantId
    ? occupants.find(o => o.id === formData.occupantId) ?? null
    : null

  return (
    <Dialog open={open} onClose={handleReset} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>{isEdit ? 'Edit Invoice' : 'Create Invoice'}</span>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <div className='flex flex-col gap-4 mbs-4'>
          {apiError && <Alert severity='error'>{apiError}</Alert>}

          {/* Row 1: Property, Unit, Tenant */}
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size='small' error={Boolean(errors.propertyId)} disabled={loadingRefs}>
                <InputLabel id='property-label'>Select Property *</InputLabel>
                <Select
                  labelId='property-label'
                  label='Select Property *'
                  value={formData.propertyId}
                  onChange={e => handleChange('propertyId', e.target.value)}
                >
                  <MenuItem value=''>Select property</MenuItem>
                  {properties.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </Select>
                {errors.propertyId && (
                  <Typography variant='caption' color='error' className='mts-1'>This field is required.</Typography>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size='small' error={Boolean(errors.unitId)} disabled={!formData.propertyId || loadingRefs}>
                <InputLabel id='unit-label'>Select Unit *</InputLabel>
                <Select
                  labelId='unit-label'
                  label='Select Unit *'
                  value={formData.unitId}
                  onChange={e => handleChange('unitId', e.target.value)}
                >
                  <MenuItem value=''>Select Unit</MenuItem>
                  {filteredUnits.map(u => (
                    <MenuItem key={u.id} value={u.id}>{u.unitNo}</MenuItem>
                  ))}
                </Select>
                {errors.unitId && (
                  <Typography variant='caption' color='error' className='mts-1'>This field is required.</Typography>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <Autocomplete
                size='small'
                fullWidth
                disabled={!formData.unitId || loadingRefs}
                options={filteredOccupants}
                getOptionLabel={o => `${o.firstName} ${o.lastName} (${o.email})`}
                value={selectedOccupantObj}
                onChange={(_, val) => handleChange('occupantId', val?.id ?? '')}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Select Tenant'
                    placeholder='Search tenant…'
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position='start'>
                              <i className='ri-search-line text-textSecondary' />
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        )
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <div className='flex items-center gap-2'>
                      <CustomAvatar skin='light' size={32}>
                        {`${option.firstName[0]}${option.lastName[0]}`.toUpperCase()}
                      </CustomAvatar>
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>{option.firstName} {option.lastName}</span>
                        <span className='text-xs text-textSecondary'>{option.email}</span>
                      </div>
                    </div>
                  </li>
                )}
              />
            </Grid>
          </Grid>

          {/* Row 2: Invoice Month, Due Date, Invoice# (read-only in edit) */}
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                size='small'
                fullWidth
                label='Invoice Month *'
                placeholder='mm/yyyy'
                value={formData.invoiceMonth}
                onChange={e => handleMonthChange(e.target.value)}
                error={Boolean(errors.invoiceMonth)}
                helperText={errors.invoiceMonth ? 'This field is required.' : ''}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <i className='ri-calendar-line text-textSecondary' />
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                size='small'
                fullWidth
                label='Due Date *'
                type='date'
                value={formData.dueDate}
                onChange={e => handleChange('dueDate', e.target.value)}
                error={Boolean(errors.dueDate)}
                helperText={errors.dueDate ? 'This field is required.' : ''}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {isEdit && editInvoice && (
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  size='small'
                  fullWidth
                  label='Invoice #'
                  value={editInvoice.invoiceNumber}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
            )}
          </Grid>

          {/* Row 3: Amount, Type, Status */}
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                size='small'
                fullWidth
                label='Amount *'
                placeholder='0.00'
                value={formData.invoiceItems.length > 0 ? calculateTotal.toFixed(2) : formData.amount}
                onChange={e => handleChange('amount', e.target.value.replace(/[^0-9.]/g, ''))}
                error={Boolean(errors.amount)}
                helperText={errors.amount ? 'Must be greater than 0.' : formData.invoiceItems.length > 0 ? 'From line items' : ''}
                InputProps={{ readOnly: formData.invoiceItems.length > 0 }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                size='small'
                fullWidth
                label='Invoice Type *'
                placeholder='e.g. Monthly Rent'
                value={formData.invoiceType}
                onChange={e => handleChange('invoiceType', e.target.value)}
                error={Boolean(errors.invoiceType)}
                helperText={errors.invoiceType ? 'This field is required.' : ''}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size='small'>
                <InputLabel id='status-label'>Status</InputLabel>
                <Select
                  labelId='status-label'
                  label='Status'
                  value={formData.status}
                  onChange={e => handleChange('status', e.target.value)}
                >
                  <MenuItem value='DRAFT'>Draft</MenuItem>
                  <MenuItem value='PENDING'>Pending</MenuItem>
                  <MenuItem value='PAID'>Paid</MenuItem>
                  <MenuItem value='OVERDUE'>Overdue</MenuItem>
                  <MenuItem value='CANCELLED'>Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                size='small'
                fullWidth
                multiline
                rows={3}
                label='Description *'
                placeholder='Write here'
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                error={Boolean(errors.description)}
                helperText={errors.description ? 'This field is required.' : ''}
              />
            </Grid>
          </Grid>

          {/* Line Items */}
          <Divider className='border-dashed' />
          <div className='flex flex-col gap-4'>
            <Button
              size='small'
              variant='outlined'
              startIcon={<i className='ri-add-line' />}
              onClick={addItem}
              sx={{ alignSelf: 'flex-start' }}
            >
              Add Line Item
            </Button>

            {formData.invoiceItems.length > 0 && (
              <div className='flex flex-col gap-4'>
                <Grid container spacing={2} className='items-center'>
                  <Grid size={{ xs: 12, md: 5 }}><Typography variant='body2' className='font-medium'>Description</Typography></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><Typography variant='body2' className='font-medium'>Qty</Typography></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><Typography variant='body2' className='font-medium'>Price</Typography></Grid>
                  <Grid size={{ xs: 12, md: 2 }}><Typography variant='body2' className='font-medium'>Total</Typography></Grid>
                  <Grid size={{ xs: 12, md: 1 }} />
                </Grid>

                {formData.invoiceItems.map(item => (
                  <Grid container spacing={2} key={item.id} className='items-start'>
                    <Grid size={{ xs: 12, md: 5 }}>
                      <TextField
                        size='small'
                        fullWidth
                        placeholder='Item description'
                        value={item.description}
                        onChange={e => updateItem(item.id, 'description', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField
                        size='small'
                        fullWidth
                        type='number'
                        value={item.quantity || ''}
                        onChange={e => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        slotProps={{ input: { inputProps: { min: 1 } } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <TextField
                        size='small'
                        fullWidth
                        type='number'
                        value={item.price || ''}
                        onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                        slotProps={{ input: { inputProps: { min: 0, step: 0.01 } } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Typography variant='body2' color='text.primary' className='flex items-center' style={{ height: 40 }}>
                        ₵{(item.quantity * item.price).toFixed(2)}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 1 }}>
                      <IconButton size='small' color='error' onClick={() => removeItem(item.id)}>
                        <i className='ri-close-line' />
                      </IconButton>
                    </Grid>
                  </Grid>
                ))}

                <Divider className='border-dashed' />
                <div className='flex justify-end'>
                  <div className='flex flex-col gap-1' style={{ minWidth: 180 }}>
                    <div className='flex justify-between'>
                      <Typography variant='body2' color='text.secondary'>Total:</Typography>
                      <Typography variant='body2' className='font-medium'>₵{calculateTotal.toFixed(2)}</Typography>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='secondary' onClick={handleReset} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={onSubmit}
          disabled={submitting || loadingRefs}
          startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : undefined}
        >
          {submitting ? 'Saving…' : isEdit ? 'Update Invoice' : 'Save Invoice'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddInvoiceDialog
