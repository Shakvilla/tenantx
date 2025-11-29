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

// Type Imports
import type { ExpenseType } from '@/types/expenses/expenseTypes'

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

type Props = {
  open: boolean
  handleClose: () => void
  expenseData?: ExpenseType[]
  setData: (data: ExpenseType[]) => void
}

type FormDataType = {
  expenseName: string
  propertyId: string
  unitId: string
  date: string
  responsibility: string
  amount: string
  image: File | null
  description: string
}

// Vars
const initialData: FormDataType = {
  expenseName: '',
  propertyId: '',
  unitId: '',
  date: '',
  responsibility: '',
  amount: '',
  image: null,
  description: ''
}

// Sample properties and units data
const sampleProperties: Property[] = [
  { id: 1, name: 'A living room with mexican mansion blue' },
  { id: 2, name: 'Rendering of a modern villa' },
  { id: 3, name: 'Beautiful modern style luxury home exterior sunset' },
  { id: 4, name: 'A house with a lot of windows and a lot of plants' },
  { id: 5, name: 'Design of a modern house as mansion blue couch' },
  { id: 6, name: 'Depending on the location and design' }
]

const sampleUnits: Unit[] = [
  { id: 1, unitNumber: 'Unit no 1', propertyId: '5', propertyName: 'Design of a modern house as mansion blue couch' },
  { id: 2, unitNumber: 'Unit no 2', propertyId: '3', propertyName: 'Beautiful modern style luxury home exterior sunset' },
  { id: 3, unitNumber: 'Unit no 3', propertyId: '1', propertyName: 'A living room with mexican mansion blue' },
  { id: 4, unitNumber: 'Unit no 4', propertyId: '4', propertyName: 'A house with a lot of windows and a lot of plants' },
  { id: 5, unitNumber: 'Unit no 5', propertyId: '2', propertyName: 'Rendering of a modern villa' },
  { id: 6, unitNumber: 'Unit no 6', propertyId: '2', propertyName: 'Rendering of a modern villa' },
  { id: 7, unitNumber: 'Unit no 7', propertyId: '3', propertyName: 'Beautiful modern style luxury home exterior sunset' },
  { id: 8, unitNumber: 'Unit no 8', propertyId: '6', propertyName: 'Depending on the location and design' },
  { id: 9, unitNumber: 'Unit no 9', propertyId: '1', propertyName: 'A living room with mexican mansion blue' },
  { id: 10, unitNumber: 'Unit no 10', propertyId: '4', propertyName: 'A house with a lot of windows and a lot of plants' },
  { id: 11, unitNumber: 'Unit no 11', propertyId: '5', propertyName: 'Design of a modern house as mansion blue couch' },
  { id: 12, unitNumber: 'Unit no 12', propertyId: '6', propertyName: 'Depending on the location and design' }
]

const AddExpenseDrawer = (props: Props) => {
  // Props
  const { open, handleClose, expenseData, setData } = props

  // States
  const [formData, setFormData] = useState<FormDataType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataType, boolean>>>({})
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData(initialData)
      setErrors({})
      setImagePreview(null)
      // Set default date to today
      const today = new Date()
      const formattedDate = `${today.getDate()} ${today.toLocaleString('en-US', { month: 'long' })} ${today.getFullYear()}`
      setFormData(prev => ({ ...prev, date: formattedDate }))
    }
  }, [open])

  // Filter units based on selected property
  const filteredUnits = useMemo(() => {
    if (!formData.propertyId) return []
    return sampleUnits.filter(unit => unit.propertyId === formData.propertyId)
  }, [formData.propertyId])

  // Reset unit when property changes
  useEffect(() => {
    if (formData.propertyId) {
      setFormData(prev => ({ ...prev, unitId: '' }))
    }
  }, [formData.propertyId])

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataType, boolean>> = {}
    const requiredFields: (keyof FormDataType)[] = [
      'expenseName',
      'propertyId',
      'unitId',
      'date',
      'responsibility',
      'amount',
      'description'
    ]

    requiredFields.forEach(field => {
      if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim() === '')) {
        newErrors[field] = true
      }
    })

    // Validate amount is a valid number
    if (formData.amount && isNaN(parseFloat(formData.amount))) {
      newErrors.amount = true
    }

    // Validate image is selected
    if (!formData.image) {
      newErrors.image = true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormDataType, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      if (errors.image) {
        setErrors(prev => ({ ...prev, image: false }))
      }
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    if (dateValue) {
      const date = new Date(dateValue)
      const formattedDate = `${date.getDate()} ${date.toLocaleString('en-US', { month: 'long' })} ${date.getFullYear()}`
      handleInputChange('date', formattedDate)
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    // Get selected property and unit names
    const selectedProperty = sampleProperties.find(p => p.id.toString() === formData.propertyId)
    const selectedUnit = filteredUnits.find(u => u.id.toString() === formData.unitId)

    const newExpense: ExpenseType = {
      id: (expenseData?.length && expenseData?.length + 1) || 1,
      item: formData.expenseName,
      amount: parseFloat(formData.amount),
      date: formData.date,
      comment: formData.description,
      propertyName: selectedProperty?.name || '',
      propertyImage: imagePreview || '',
      unitNo: selectedUnit?.unitNumber || '',
      responsibility: formData.responsibility as 'Owner' | 'Tenant'
    }

    setData([...(expenseData ?? []), newExpense])
    handleClose()
    setFormData(initialData)
    setErrors({})
    setImagePreview(null)
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
    setErrors({})
    setImagePreview(null)
  }

  // Convert formatted date back to input format for date picker
  const getDateInputValue = () => {
    if (!formData.date) return ''
    try {
      const parts = formData.date.split(' ')
      const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ]
      const month = monthNames.indexOf(parts[1])
      const day = parseInt(parts[0])
      const year = parseInt(parts[2])
      if (month !== -1 && day && year) {
        const date = new Date(year, month, day)
        return date.toISOString().split('T')[0]
      }
    } catch {
      // If parsing fails, return empty
    }
    return ''
  }

  return (
    <Dialog
      open={open}
      onClose={handleReset}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        }
      }}
    >
      <DialogTitle className='flex items-center justify-between pbe-4'>
        <span className='font-medium'>Create New Expense</span>
        <IconButton size='small' onClick={handleReset} sx={{ color: 'warning.main' }}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <form onSubmit={onSubmit} className='flex flex-col gap-5'>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size='small'
                label='Expense Name *'
                placeholder='Name here'
                value={formData.expenseName}
                onChange={e => handleInputChange('expenseName', e.target.value)}
                error={Boolean(errors.expenseName)}
                helperText={errors.expenseName ? 'This field is required.' : ''}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={Boolean(errors.propertyId)} size='small'>
                <InputLabel id='property-label'>Property Name *</InputLabel>
                <Select
                  labelId='property-label'
                  label='Property Name *'
                  value={formData.propertyId}
                  onChange={e => handleInputChange('propertyId', e.target.value)}
                  placeholder='Name here'
                >
                  <MenuItem value=''>Select Property</MenuItem>
                  {sampleProperties.map(property => (
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
                <InputLabel id='unit-label'>Select Unit *</InputLabel>
                <Select
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

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                type='date'
                label='Date *'
                value={getDateInputValue()}
                onChange={handleDateChange}
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.date)}
                helperText={errors.date ? 'This field is required.' : ''}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position='end'>
                      <i className='ri-calendar-line' />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={Boolean(errors.responsibility)} size='small'>
                <InputLabel id='responsibility-label'>Responsibility *</InputLabel>
                <Select
                  labelId='responsibility-label'
                  label='Responsibility *'
                  value={formData.responsibility}
                  onChange={e => handleInputChange('responsibility', e.target.value)}
                >
                  <MenuItem value=''>Select Responsibility</MenuItem>
                  <MenuItem value='Owner'>Owner</MenuItem>
                  <MenuItem value='Tenant'>Tenant</MenuItem>
                </Select>
                {errors.responsibility && (
                  <Typography variant='caption' color='error' className='mts-1'>
                    This field is required.
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size='small'
                label='Amount *'
                placeholder='₵00.00'
                value={formData.amount}
                onChange={e => handleInputChange('amount', e.target.value)}
                type='number'
                error={Boolean(errors.amount)}
                helperText={errors.amount ? 'This field is required and must be a valid number.' : ''}
                slotProps={{
                  input: {
                    startAdornment: <InputAdornment position='start'>₵</InputAdornment>
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <div className='flex flex-col gap-2'>
                <Typography variant='body2' className='font-medium'>
                  Image *
                </Typography>
                <div className='flex items-center gap-3'>
                  <Button variant='outlined' component='label' size='small'>
                    Choose File
                    <input type='file' hidden accept='image/*' onChange={handleFileChange} />
                  </Button>
                  <Typography variant='body2' color='text.secondary'>
                    {formData.image ? formData.image.name : 'No file'}
                  </Typography>
                </div>
                {imagePreview && (
                  <img src={imagePreview} alt='Preview' className='max-w-[200px] max-h-[200px] object-cover rounded' />
                )}
                {errors.image && (
                  <Typography variant='caption' color='error'>
                    This field is required.
                  </Typography>
                )}
              </div>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size='small'
                label='Description *'
                placeholder='Write here'
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                multiline
                rows={4}
                error={Boolean(errors.description)}
                helperText={errors.description ? 'This field is required.' : ''}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions className='p-5'>
        <Button variant='contained' color='primary' onClick={onSubmit} endIcon={<i className='ri-arrow-right-line' />}>
          Save Now
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default AddExpenseDrawer
