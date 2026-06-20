'use client'

// React Imports
import { useState, useEffect, useMemo } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Skeleton from '@mui/material/Skeleton'

// API Imports
import { createExpense, updateExpense, getExpenseConfigs, type Expense, type ExpenseConfig } from '@/lib/api/expenses'
import { getProperties } from '@/lib/api/properties'
import { getAllUnits } from '@/lib/api/units'
import { getStoredTenantId } from '@/lib/api/storage'

// Type Imports
import type { ExpenseType } from '@/types/expenses/expenseTypes'

type Props = {
  open: boolean
  handleClose: () => void
  editExpense?: ExpenseType | null
  onSaved: (expense: ExpenseType) => void
}

type FormDataType = {
  expenseConfigId: string   // '' means "Other / manual"
  item: string              // freehand — used when expenseConfigId is 'other'
  propertyId: string
  unitId: string
  date: string
  responsibility: string
  status: string
  amount: string
  description: string
}

const initialData: FormDataType = {
  expenseConfigId: '',
  item: '',
  propertyId: '',
  unitId: '',
  date: new Date().toISOString().split('T')[0],
  responsibility: '',
  status: 'UNPAID',
  amount: '',
  description: ''
}

function apiToForm(expense: ExpenseType): FormDataType {
  return {
    expenseConfigId: expense.expenseConfigId ?? '',
    item: expense.item,
    propertyId: expense.propertyId ?? '',
    unitId: expense.unitId ?? '',
    date: expense.date,
    responsibility: expense.responsibility ?? '',
    status: expense.status ?? 'UNPAID',
    amount: expense.amount.toString(),
    description: expense.description ?? ''
  }
}

function mapApiExpense(exp: Expense): ExpenseType {
  return {
    id: exp.id,
    item: exp.item,
    amount: exp.amount,
    date: exp.date,
    description: exp.description,
    propertyId: exp.propertyId,
    propertyName: exp.propertyName,
    unitId: exp.unitId,
    unitNo: exp.unitNo,
    expenseConfigId: exp.expenseConfigId,
    responsibility: exp.responsibility,
    status: exp.status,
    currency: exp.currency,
    imageUrl: exp.imageUrl,
    createdAt: exp.createdAt,
    updatedAt: exp.updatedAt
  }
}

// Sentinel value for "I want to type manually"
const OTHER = 'other'

const AddExpenseDrawer = ({ open, handleClose, editExpense, onSaved }: Props) => {
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Reference data
  const [expenseConfigs, setExpenseConfigs] = useState<ExpenseConfig[]>([])
  const [properties, setProperties] = useState<{ id: string; name: string }[]>([])
  const [allUnits, setAllUnits] = useState<{ id: string; unitNumber: string; propertyId: string }[]>([])
  const [loadingRefs, setLoadingRefs] = useState(false)

  const isEdit = Boolean(editExpense)

  // The dropdown value: config id, 'other', or ''
  const configSelectValue = formData.expenseConfigId
    ? formData.expenseConfigId
    : formData.item
      ? OTHER   // edit mode with a manual item but no config
      : ''

  const showManualItem = configSelectValue === OTHER

  // Load reference data when drawer opens
  useEffect(() => {
    if (!open) return
    const tenantId = getStoredTenantId()
    if (!tenantId) return

    setLoadingRefs(true)
    Promise.all([
      getExpenseConfigs(true),          // active configs only
      getProperties(tenantId, { size: 200 }),
      getAllUnits(tenantId, { size: 500 })
    ])
      .then(([configs, propRes, unitRes]) => {
        setExpenseConfigs(Array.isArray(configs) ? configs : [])
        setProperties((propRes.data ?? []).map((p: any) => ({ id: p.id, name: p.name })))
        setAllUnits((unitRes.data ?? []).map((u: any) => ({ id: u.id, unitNumber: u.unitNo, propertyId: u.propertyId })))
      })
      .catch(() => {})
      .finally(() => setLoadingRefs(false))
  }, [open])

  // Reset form when drawer opens
  useEffect(() => {
    if (open) {
      setFormData(editExpense ? apiToForm(editExpense) : initialData)
      setErrors({})
      setApiError(null)
    }
  }, [open, editExpense])

  // Filter units by selected property
  const filteredUnits = useMemo(
    () => (formData.propertyId ? allUnits.filter(u => u.propertyId === formData.propertyId) : []),
    [formData.propertyId, allUnits]
  )

  // Reset unit when property changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, unitId: '' }))
  }, [formData.propertyId])

  const handleConfigChange = (value: string) => {
    if (value === OTHER) {
      // Clear config link, let user type manually
      setFormData(prev => ({ ...prev, expenseConfigId: '', item: '' }))
    } else if (value === '') {
      setFormData(prev => ({ ...prev, expenseConfigId: '', item: '' }))
    } else {
      // Auto-fill item name from selected config
      const config = expenseConfigs.find(c => c.id === value)
      setFormData(prev => ({ ...prev, expenseConfigId: value, item: config?.item ?? '' }))
    }
    if (errors.expenseConfigId) setErrors(prev => ({ ...prev, expenseConfigId: false }))
    if (errors.item) setErrors(prev => ({ ...prev, item: false }))
  }

  const handleChange = (field: keyof FormDataType, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: false }))
  }

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormDataType, boolean>> = {}

    // Must have either a config selection or a manual item name
    if (!formData.expenseConfigId && !formData.item.trim()) e.expenseConfigId = true
    if (!formData.date) e.date = true
    if (!formData.amount || isNaN(parseFloat(formData.amount))) e.amount = true

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    setApiError(null)

    try {
      const payload = {
        item: formData.item.trim(),
        expenseConfigId: formData.expenseConfigId || undefined,
        propertyId: formData.propertyId || undefined,
        unitId: formData.unitId || undefined,
        date: formData.date,
        amount: parseFloat(formData.amount),
        responsibility: formData.responsibility || undefined,
        status: formData.status || 'UNPAID',
        description: formData.description || undefined
      }

      let saved: Expense
      if (isEdit && editExpense) {
        saved = await updateExpense(editExpense.id, payload)
      } else {
        saved = await createExpense(payload)
      }

      const propName = properties.find(p => p.id === saved.propertyId)?.name ?? null
      const unitNum = allUnits.find(u => u.id === saved.unitId)?.unitNumber ?? null

      onSaved({ ...mapApiExpense(saved), propertyName: propName, unitNo: unitNum })
      handleClose()
    } catch (err: any) {
      setApiError(err?.message ?? 'Failed to save expense')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
    setErrors({})
    setApiError(null)
  }

  return (
    <Dialog open={open} onClose={handleReset} maxWidth='md' fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle className='flex items-center justify-between pbe-4'>
        <Typography variant='h6' component='span' className='font-medium'>
          {isEdit ? 'Edit Expense' : 'Create New Expense'}
        </Typography>
        <IconButton size='small' onClick={handleReset} sx={{ color: 'warning.main' }}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {apiError && <Alert severity='error' className='mbe-4'>{apiError}</Alert>}

        <form onSubmit={onSubmit} className='flex flex-col gap-5'>
          <Grid container spacing={4} className='mbs-1'>

            {/* Expense Item (config dropdown) */}
            <Grid size={{ xs: 12 }}>
              {loadingRefs ? (
                <Skeleton variant='rectangular' height={40} />
              ) : (
                <FormControl fullWidth size='small' error={Boolean(errors.expenseConfigId)}>
                  <InputLabel id='config-label'>Expense Item *</InputLabel>
                  <Select
                    labelId='config-label'
                    label='Expense Item *'
                    value={configSelectValue}
                    onChange={e => handleConfigChange(e.target.value)}
                  >
                    <MenuItem value=''>Select an item</MenuItem>
                    {expenseConfigs.map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        <div className='flex flex-col'>
                          <span>{c.item}</span>
                          {c.category && (
                            <Typography variant='caption' color='text.secondary'>
                              {c.category.charAt(0) + c.category.slice(1).toLowerCase()}
                            </Typography>
                          )}
                        </div>
                      </MenuItem>
                    ))}
                    <MenuItem value={OTHER}>
                      <em>Other (type manually)</em>
                    </MenuItem>
                  </Select>
                  {errors.expenseConfigId && (
                    <Typography variant='caption' color='error' className='mts-1 mli-3'>
                      Please select an expense item.
                    </Typography>
                  )}
                </FormControl>
              )}
            </Grid>

            {/* Manual item name — only shown when "Other" is selected */}
            {showManualItem && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Expense Name *'
                  placeholder='e.g. Security Deposit'
                  value={formData.item}
                  onChange={e => handleChange('item', e.target.value)}
                  error={Boolean(errors.item)}
                  helperText={errors.item ? 'This field is required.' : ''}
                  autoFocus
                />
              </Grid>
            )}

            {/* Property */}
            <Grid size={{ xs: 12, sm: 6 }}>
              {loadingRefs ? (
                <Skeleton variant='rectangular' height={40} />
              ) : (
                <FormControl fullWidth size='small'>
                  <InputLabel id='property-label'>Property</InputLabel>
                  <Select
                    labelId='property-label'
                    label='Property'
                    value={formData.propertyId}
                    onChange={e => handleChange('propertyId', e.target.value)}
                  >
                    <MenuItem value=''>All Properties</MenuItem>
                    {properties.map(p => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>

            {/* Unit */}
            <Grid size={{ xs: 12, sm: 6 }}>
              {loadingRefs ? (
                <Skeleton variant='rectangular' height={40} />
              ) : (
                <FormControl fullWidth size='small' disabled={!formData.propertyId}>
                  <InputLabel id='unit-label'>Unit</InputLabel>
                  <Select
                    labelId='unit-label'
                    label='Unit'
                    value={formData.unitId}
                    onChange={e => handleChange('unitId', e.target.value)}
                  >
                    <MenuItem value=''>All Units</MenuItem>
                    {filteredUnits.map(u => (
                      <MenuItem key={u.id} value={u.id}>{u.unitNumber}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Grid>

            {/* Date */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                type='date'
                label='Date *'
                value={formData.date}
                onChange={e => handleChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.date)}
                helperText={errors.date ? 'This field is required.' : ''}
              />
            </Grid>

            {/* Responsibility */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size='small'>
                <InputLabel id='responsibility-label'>Responsibility</InputLabel>
                <Select
                  labelId='responsibility-label'
                  label='Responsibility'
                  value={formData.responsibility}
                  onChange={e => handleChange('responsibility', e.target.value)}
                >
                  <MenuItem value=''>None</MenuItem>
                  <MenuItem value='OWNER'>Owner</MenuItem>
                  <MenuItem value='TENANT'>Tenant</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Status */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size='small'>
                <InputLabel id='status-label'>Status</InputLabel>
                <Select
                  labelId='status-label'
                  label='Status'
                  value={formData.status}
                  onChange={e => handleChange('status', e.target.value)}
                >
                  <MenuItem value='UNPAID'>Unpaid</MenuItem>
                  <MenuItem value='PAID'>Paid</MenuItem>
                  <MenuItem value='PENDING'>Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Amount */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                label='Amount *'
                placeholder='0.00'
                value={formData.amount}
                onChange={e => handleChange('amount', e.target.value)}
                type='number'
                error={Boolean(errors.amount)}
                helperText={errors.amount ? 'Enter a valid amount.' : ''}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position='start'>₵</InputAdornment>
                  }
                }}
              />
            </Grid>

            {/* Description */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size='small'
                label='Description'
                placeholder='Write here'
                value={formData.description}
                onChange={e => handleChange('description', e.target.value)}
                multiline
                rows={4}
              />
            </Grid>

          </Grid>
        </form>
      </DialogContent>

      <DialogActions className='p-5'>
        <Button variant='outlined' onClick={handleReset} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='primary'
          onClick={onSubmit}
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <i className='ri-save-line' />}
        >
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddExpenseDrawer
