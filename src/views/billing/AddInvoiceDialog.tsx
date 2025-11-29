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

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

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
  id: number
  name: string
  email: string
  roomNo: string
  propertyName: string
  avatar?: string
}

type Invoice = {
  id: number
  invoiceNumber: string
  tenantName: string
  tenantEmail: string
  tenantAvatar?: string
  propertyName: string
  unitName: string
  amount: string
  issuedDate: string
  dueDate: string
  status: 'paid' | 'pending' | 'overdue' | 'draft' | 'cancelled'
  balance: string
}

type InvoiceEditData = {
  id?: number
  invoiceNumber?: string
  tenantName?: string
  tenantEmail?: string
  propertyName?: string
  unitName?: string
  amount?: string
  issuedDate?: string
  dueDate?: string
  status?: 'paid' | 'pending' | 'overdue' | 'draft' | 'cancelled'
  balance?: string
  invoiceMonth?: string
  invoiceType?: string
  description?: string
}

type Props = {
  open: boolean
  handleClose: () => void
  properties: Property[]
  units: Unit[]
  tenants: Tenant[]
  invoicesData: Invoice[]
  setData: (data: Invoice[]) => void
  editData?: InvoiceEditData | null
  mode?: 'add' | 'edit'
}

type InvoiceItem = {
  id: number
  description: string
  quantity: number
  price: number
}

type FormDataType = {
  invoiceNumber: string
  propertyId: string
  unitId: string
  tenantId: string
  invoiceMonth: string
  endDate: string
  amount: string
  invoiceType: string
  status: 'paid' | 'pending' | 'overdue' | 'draft' | 'cancelled'
  description: string
  invoiceItems: InvoiceItem[]
}

const initialData: FormDataType = {
  invoiceNumber: '',
  propertyId: '',
  unitId: '',
  tenantId: '',
  invoiceMonth: '',
  endDate: '',
  amount: '',
  invoiceType: '',
  status: 'draft',
  description: '',
  invoiceItems: []
}

const AddInvoiceDialog = ({
  open,
  handleClose,
  properties,
  units,
  tenants,
  invoicesData,
  setData,
  editData,
  mode = 'add'
}: Props) => {
  // States
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})

  // Generate invoice number
  const generateInvoiceNumber = (): string => {
    const year = new Date().getFullYear()
    const lastInvoice = invoicesData
      .filter(inv => inv.invoiceNumber.startsWith(`INV-${year}-`))
      .sort((a, b) => {
        const numA = parseInt(a.invoiceNumber.split('-')[2] || '0')
        const numB = parseInt(b.invoiceNumber.split('-')[2] || '0')
        return numB - numA
      })[0]

    let nextNumber = 1
    if (lastInvoice) {
      const lastNum = parseInt(lastInvoice.invoiceNumber.split('-')[2] || '0')
      nextNumber = lastNum + 1
    }

    return `INV-${year}-${String(nextNumber).padStart(3, '0')}`
  }

  // Filter units by property
  const filteredUnits = useMemo(() => {
    if (!formData.propertyId) return []
    return units.filter(unit => unit.propertyId === formData.propertyId)
  }, [units, formData.propertyId])

  // Filter tenants by property and unit
  const filteredTenants = useMemo(() => {
    if (!formData.propertyId && !formData.unitId) return tenants

    let filtered = tenants

    if (formData.propertyId) {
      const property = properties.find(p => p.id.toString() === formData.propertyId)
      if (property) {
        filtered = filtered.filter(t => t.propertyName === property.name)
      }
    }

    if (formData.unitId) {
      const unit = units.find(u => u.id.toString() === formData.unitId)
      if (unit) {
        filtered = filtered.filter(t => t.roomNo === unit.unitNumber)
      }
    }

    return filtered
  }, [tenants, properties, units, formData.propertyId, formData.unitId])

  // Get initial form data based on mode
  const getInitialFormData = (): FormDataType => {
    if (mode === 'edit' && editData) {
      // Find property, unit, and tenant from editData
      const property = properties.find(p => p.name === editData.propertyName)
      const unit = units.find(u => u.unitNumber === editData.unitName)
      const tenant = tenants.find(
        t => t.name === editData.tenantName && t.email === editData.tenantEmail
      )

      // Extract month from issuedDate (YYYY-MM-DD format)
      const issuedDate = editData.issuedDate || ''
      const invoiceMonth = issuedDate ? `${issuedDate.slice(5, 7)}/${issuedDate.slice(0, 4)}` : ''

      return {
        invoiceNumber: editData.invoiceNumber || '',
        propertyId: property?.id.toString() || '',
        unitId: unit?.id.toString() || '',
        tenantId: tenant?.id.toString() || '',
        invoiceMonth: editData.invoiceMonth || invoiceMonth,
        endDate: editData.dueDate || '',
        amount: editData.amount?.replace(/[₵,]/g, '') || '',
        invoiceType: editData.invoiceType || '',
        status: editData.status || 'draft',
        description: editData.description || '',
        invoiceItems: []
      }
    }
    return initialData
  }

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (mode === 'add') {
        const invoiceNumber = generateInvoiceNumber()
        const today = new Date()
        const invoiceMonth = `${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`
        setFormData({
          ...initialData,
          invoiceNumber,
          invoiceMonth,
          endDate: today.toISOString().split('T')[0] // Today's date
        })
      } else {
        const newFormData = getInitialFormData()
        setFormData(newFormData)
      }
      setErrors({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editData, mode])

  const handleInputChange = (field: keyof FormDataType, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }

    // Reset dependent fields when property changes
    if (field === 'propertyId') {
      setFormData(prev => ({ ...prev, unitId: '', tenantId: '' }))
    }
    if (field === 'unitId') {
      setFormData(prev => ({ ...prev, tenantId: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}

    if (!formData.invoiceNumber.trim()) {
      newErrors.invoiceNumber = true
    }
    if (!formData.propertyId) {
      newErrors.propertyId = true
    }
    if (!formData.unitId) {
      newErrors.unitId = true
    }
    if (!formData.tenantId) {
      newErrors.tenantId = true
    }
    if (!formData.invoiceMonth) {
      newErrors.invoiceMonth = true
    }
    if (!formData.endDate) {
      newErrors.endDate = true
    }

    // Validate amount - either from items or manual entry
    const amountValue =
      formData.invoiceItems.length > 0
        ? calculateTotalAmount
        : parseFloat(formData.amount.replace(/[₵,]/g, '')) || 0

    if (amountValue <= 0) {
      newErrors.amount = true
    }

    // Validate invoice items if any are added
    if (formData.invoiceItems.length > 0) {
      const hasInvalidItems = formData.invoiceItems.some(
        item => !item.description.trim() || item.quantity <= 0 || item.price <= 0
      )
      if (hasInvalidItems) {
        newErrors.invoiceItems = true
      }
    }

    if (!formData.invoiceType.trim()) {
      newErrors.invoiceType = true
    }
    if (!formData.description.trim()) {
      newErrors.description = true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (!validateForm()) return

    const selectedProperty = properties.find(p => p.id.toString() === formData.propertyId)
    const selectedUnit = units.find(u => u.id.toString() === formData.unitId)
    const selectedTenant = tenants.find(t => t.id.toString() === formData.tenantId)

    if (!selectedProperty || !selectedUnit || !selectedTenant) return

    // Format amount - use calculated total from items if items exist, otherwise use manual entry
    const amountValue =
      formData.invoiceItems.length > 0
        ? calculateTotalAmount
        : parseFloat(formData.amount.replace(/[₵,]/g, '')) || 0
    const formattedAmount = `₵${amountValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

    // Calculate balance based on status
    const balance = formData.status === 'paid' ? '₵0' : formattedAmount

    // Convert invoiceMonth (MM/YYYY) to issuedDate (YYYY-MM-DD)
    const [month, year] = formData.invoiceMonth.split('/')
    const issuedDate = `${year}-${month}-01`

    if (mode === 'edit' && editData?.id) {
      // Update existing invoice
      const updatedInvoice: Invoice = {
        id: editData.id,
        invoiceNumber: formData.invoiceNumber,
        tenantName: selectedTenant?.name || '',
        tenantEmail: selectedTenant?.email || '',
        tenantAvatar: selectedTenant?.avatar,
        propertyName: selectedProperty.name,
        unitName: selectedUnit.unitNumber,
        amount: formattedAmount,
        issuedDate: issuedDate,
        dueDate: formData.endDate,
        status: formData.status,
        balance
      }

      setData(invoicesData.map(invoice => (invoice.id === editData.id ? updatedInvoice : invoice)))
    } else {
      // Create new invoice
      const newInvoice: Invoice = {
        id: invoicesData.length > 0 ? Math.max(...invoicesData.map(i => i.id)) + 1 : 1,
        invoiceNumber: formData.invoiceNumber,
        tenantName: selectedTenant?.name || '',
        tenantEmail: selectedTenant?.email || '',
        tenantAvatar: selectedTenant?.avatar,
        propertyName: selectedProperty.name,
        unitName: selectedUnit.unitNumber,
        amount: formattedAmount,
        issuedDate: issuedDate,
        dueDate: formData.endDate,
        status: formData.status,
        balance
      }

      setData([...invoicesData, newInvoice])
    }

    handleReset()
  }

  // Calculate total amount from invoice items
  const calculateTotalAmount = useMemo(() => {
    const total = formData.invoiceItems.reduce((sum, item) => {
      return sum + item.quantity * item.price
    }, 0)
    return total
  }, [formData.invoiceItems])

  const handleAddInvoiceItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now(),
      description: '',
      quantity: 1,
      price: 0
    }
    setFormData(prev => ({
      ...prev,
      invoiceItems: [...prev.invoiceItems, newItem]
    }))
  }

  const handleRemoveInvoiceItem = (itemId: number) => {
    setFormData(prev => ({
      ...prev,
      invoiceItems: prev.invoiceItems.filter(item => item.id !== itemId)
    }))
  }

  const handleInvoiceItemChange = (itemId: number, field: keyof InvoiceItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      invoiceItems: prev.invoiceItems.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleReset = () => {
    setFormData(initialData)
    setErrors({})
    handleClose()
  }

  // Format date for month picker (MM/YYYY)
  const formatMonthInput = (value: string): string => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    if (digits.length === 0) return ''
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
    
    return `${digits.slice(0, 2)}/${digits.slice(2, 6)}`
  }

  const handleMonthChange = (value: string) => {
    const formatted = formatMonthInput(value)
    if (formatted.length <= 7) {
      handleInputChange('invoiceMonth', formatted)
    }
  }

  return (
    <Dialog open={open} onClose={handleReset} maxWidth='md' fullWidth>
      <DialogTitle className='flex items-center justify-between'>
        <span>{mode === 'edit' ? 'Edit Invoice' : 'Create Invoice'}</span>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div className='flex flex-col gap-4 mbs-4'>
          {/* Invoice Details Section - 3 Columns */}
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth error={Boolean(errors.propertyId)} size='small'>
                <InputLabel id='property-label'>Select Property *</InputLabel>
                <Select
                  size='small'
                  labelId='property-label'
                  label='Select Property *'
                  value={formData.propertyId}
                  onChange={e => handleInputChange('propertyId', e.target.value)}
                >
                  <MenuItem value=''>Select property</MenuItem>
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
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth error={Boolean(errors.unitId)} size='small' disabled={!formData.propertyId}>
                <InputLabel id='unit-label'>Select Unit *</InputLabel>
                <Select
                  size='small'
                  labelId='unit-label'
                  label='Select Unit *'
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
            <Grid size={{ xs: 12, sm: 4 }}>
              <Autocomplete
                size='small'
                fullWidth
                disabled={!formData.propertyId || !formData.unitId}
                options={filteredTenants}
                getOptionLabel={option => `${option.name} (${option.email})`}
                value={filteredTenants.find(t => t.id.toString() === formData.tenantId) || null}
                onChange={(_, newValue) => {
                  handleInputChange('tenantId', newValue?.id.toString() || '')
                }}
                renderInput={params => (
                  <TextField
                    {...params}
                    label='Select Tenant *'
                    placeholder='Search tenant...'
                    error={Boolean(errors.tenantId)}
                    helperText={errors.tenantId ? 'This field is required.' : ''}
                    required
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
                      {option.avatar ? (
                        <CustomAvatar src={option.avatar} skin='light' size={32} />
                      ) : (
                        <CustomAvatar skin='light' size={32}>
                          {option.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </CustomAvatar>
                      )}
                      <div className='flex flex-col'>
                        <span className='text-sm font-medium'>{option.name}</span>
                        <span className='text-xs text-textSecondary'>{option.email}</span>
                      </div>
                    </div>
                  </li>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                size='small'
                fullWidth
                label='InvoiceSL *'
                value={formData.invoiceNumber}
                onChange={e => handleInputChange('invoiceNumber', e.target.value)}
                error={Boolean(errors.invoiceNumber)}
                helperText={errors.invoiceNumber ? 'This field is required.' : ''}
                required
                InputProps={{
                  readOnly: mode === 'edit'
                }}
              />
            </Grid>
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
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <i className='ri-calendar-line text-textSecondary' />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                size='small'
                fullWidth
                label='End Date *'
                type='date'
                value={formData.endDate}
                onChange={e => handleInputChange('endDate', e.target.value)}
                error={Boolean(errors.endDate)}
                helperText={errors.endDate ? 'This field is required.' : ''}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
          </Grid>

          {/* Amount, Type, Status Section - 3 Columns */}
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                size='small'
                fullWidth
                label='Amount *'
                placeholder='Amount here'
                value={formData.invoiceItems.length > 0 ? `₵${calculateTotalAmount.toFixed(2)}` : formData.amount}
                onChange={e => {
                  const value = e.target.value.replace(/[₵,]/g, '')
                  handleInputChange('amount', value)
                }}
                error={Boolean(errors.amount)}
                helperText={
                  errors.amount
                    ? 'This field is required and must be greater than 0.'
                    : formData.invoiceItems.length > 0
                      ? 'Calculated from invoice items'
                      : ''
                }
                required
                InputProps={{
                  readOnly: formData.invoiceItems.length > 0
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                size='small'
                fullWidth
                label='Invoice Type *'
                placeholder='Invoice type'
                value={formData.invoiceType}
                onChange={e => handleInputChange('invoiceType', e.target.value)}
                error={Boolean(errors.invoiceType)}
                helperText={errors.invoiceType ? 'This field is required.' : ''}
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth error={Boolean(errors.status)} size='small'>
                <InputLabel id='status-label'>Status Update</InputLabel>
                <Select
                  size='small'
                  labelId='status-label'
                  label='Status Update'
                  value={formData.status}
                  onChange={e => handleInputChange('status', e.target.value)}
                >
                  <MenuItem value='draft'>Draft</MenuItem>
                  <MenuItem value='pending'>Pending</MenuItem>
                  <MenuItem value='paid'>Paid</MenuItem>
                  <MenuItem value='overdue'>Overdue</MenuItem>
                  <MenuItem value='cancelled'>Cancelled</MenuItem>
                </Select>
                {errors.status && (
                  <Typography variant='caption' color='error' className='mts-1'>
                    This field is required.
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                size='small'
                fullWidth
                multiline
                rows={4}
                label='Description *'
                placeholder='Write here'
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                error={Boolean(errors.description)}
                helperText={errors.description ? 'This field is required.' : ''}
                required
              />
            </Grid>
          </Grid>

          {/* Invoice Items Section */}
          <Divider className='border-dashed' />
          <div className='flex flex-col gap-4'>
            <div className='flex items-center gap-2'>
              <Button
                size='small'
                variant='contained'
                color='primary'
                startIcon={<i className='ri-add-line' />}
                onClick={handleAddInvoiceItem}
              >
                Add Items +
              </Button>
            </div>

            {formData.invoiceItems.length > 0 && (
              <div className='flex flex-col gap-4'>
                {/* Header Row */}
                <Grid container spacing={6} className='items-center'>
                  <Grid size={{ xs: 12, md: 5 }}>
                    <Typography variant='body2' className='font-medium' color='text.primary'>
                      Description
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Typography variant='body2' className='font-medium' color='text.primary'>
                      Quantity
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Typography variant='body2' className='font-medium' color='text.primary'>
                      Price
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 2 }}>
                    <Typography variant='body2' className='font-medium' color='text.primary'>
                      Total
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 1 }}>
                    <Typography variant='body2' className='font-medium' color='text.primary'>
                      Action
                    </Typography>
                  </Grid>
                </Grid>

                {/* Invoice Items */}
                {formData.invoiceItems.map((item, index) => {
                  const itemTotal = item.quantity * item.price

                  return (
                    <Grid container spacing={6} key={item.id} className='items-start'>
                      <Grid size={{ xs: 12, md: 5 }}>
                        <TextField
                          size='small'
                          fullWidth
                          placeholder='Item description'
                          value={item.description}
                          onChange={e => handleInvoiceItemChange(item.id, 'description', e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                          size='small'
                          fullWidth
                          type='number'
                          placeholder='1'
                          value={item.quantity || ''}
                          onChange={e => handleInvoiceItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                          slotProps={{
                            input: {
                              inputProps: { min: 0, step: 1 }
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <TextField
                          size='small'
                          fullWidth
                          type='number'
                          placeholder='0.00'
                          value={item.price || ''}
                          onChange={e => handleInvoiceItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                          slotProps={{
                            input: {
                              inputProps: { min: 0, step: 0.01 }
                            }
                          }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 2 }}>
                        <Typography variant='body2' color='text.primary' className='flex items-center h-full'>
                          ₵{itemTotal.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 1 }}>
                        <IconButton
                          size='small'
                          onClick={() => handleRemoveInvoiceItem(item.id)}
                          color='error'
                        >
                          <i className='ri-close-line text-xl' />
                        </IconButton>
                      </Grid>
                    </Grid>
                  )
                })}

                {/* Total Summary */}
                <Divider className='border-dashed' />
                <div className='flex justify-end'>
                  <div className='flex flex-col gap-2' style={{ minWidth: '200px' }}>
                    <div className='flex justify-between items-center'>
                      <Typography variant='body2' color='text.secondary'>
                        Subtotal:
                      </Typography>
                      <Typography variant='body2' color='text.primary' className='font-medium'>
                        ₵{calculateTotalAmount.toFixed(2)}
                      </Typography>
                    </div>
                    <div className='flex justify-between items-center'>
                      <Typography variant='body1' className='font-medium' color='text.primary'>
                        Total:
                      </Typography>
                      <Typography variant='body1' className='font-medium' color='text.primary'>
                        ₵{calculateTotalAmount.toFixed(2)}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
      <DialogActions className='gap-2 pbs-4'>
        <Button variant='outlined' color='warning' onClick={handleReset} endIcon={<i className='ri-arrow-right-line' />}>
          Cancel
        </Button>
        <Button variant='contained' color='primary' onClick={handleSubmit} endIcon={<i className='ri-arrow-right-line' />}>
          {mode === 'edit' ? 'Update Invoice' : 'Save Invoice'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddInvoiceDialog

