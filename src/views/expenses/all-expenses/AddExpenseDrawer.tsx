'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Button from '@mui/material/Button'
import Drawer from '@mui/material/Drawer'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import FormHelperText from '@mui/material/FormHelperText'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'

// Type Imports
import type { ExpenseType } from '@/types/expenses/expenseTypes'

type Props = {
  open: boolean
  handleClose: () => void
  expenseData?: ExpenseType[]
  setData: (data: ExpenseType[]) => void
}

type FormValidateType = {
  item: string
  amount: string
  date: string
  comment: string
}

// Vars
const initialData: FormValidateType = {
  item: '',
  amount: '',
  date: '',
  comment: ''
}

// Sample items for dropdown
const expenseItems = [
  'Booklets',
  'Repairs',
  'Key Card',
  'Booklet',
  'cheque books',
  'rent',
  'Nummo',
  'dispenser water',
  'test'
]

const AddExpenseDrawer = (props: Props) => {
  // Props
  const { open, handleClose, expenseData, setData } = props

  // States
  const [formData, setFormData] = useState<FormValidateType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValidateType, boolean>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormValidateType, boolean>> = {}
    const requiredFields: (keyof FormValidateType)[] = ['amount', 'date', 'comment']

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = true
      }
    })

    // Validate amount is a valid number
    if (formData.amount && isNaN(parseFloat(formData.amount))) {
      newErrors.amount = true
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormValidateType, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    const data = formData
    const newExpense: ExpenseType = {
      id: (expenseData?.length && expenseData?.length + 1) || 1,
      item: data.item,
      amount: parseFloat(data.amount),
      date: data.date,
      comment: data.comment
    }

    setData([...(expenseData ?? []), newExpense])
    handleClose()
    setFormData(initialData)
    setErrors({})
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
    setErrors({})
  }

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 500, md: 600 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Add Expenses</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='overflow-y-auto p-5' style={{ maxHeight: 'calc(100vh - 80px)' }}>
        <form onSubmit={onSubmit} className='flex flex-col gap-5'>
          <Grid container spacing={4}>
            {/* Left Column */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id='item-select'>Item</InputLabel>
                <Select
                  label='Item'
                  value={formData.item}
                  onChange={e => handleInputChange('item', e.target.value)}
                  labelId='item-select'
                  displayEmpty
                >
                  <MenuItem value=''>
                    <em>Select item</em>
                  </MenuItem>
                  {expenseItems.map(item => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='amount'
                placeholder='amount'
                value={formData.amount}
                onChange={e => handleInputChange('amount', e.target.value)}
                type='number'
                error={Boolean(errors.amount)}
                helperText={errors.amount ? 'This field is required and must be a valid number.' : ''}
              />
            </Grid>

            {/* Right Column */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='date'
                label='Date'
                value={formData.date}
                onChange={e => handleInputChange('date', e.target.value)}
                InputLabelProps={{ shrink: true }}
                error={Boolean(errors.date)}
                helperText={errors.date ? 'This field is required.' : ''}
                placeholder='dd/mm/yyyy'
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='comment'
                placeholder='comment'
                value={formData.comment}
                onChange={e => handleInputChange('comment', e.target.value)}
                error={Boolean(errors.comment)}
                helperText={errors.comment ? 'This field is required.' : ''}
              />
            </Grid>
          </Grid>

          <div className='flex items-center gap-4 mts-4'>
            <Button variant='contained' type='submit' color='primary' fullWidth>
              Submit
            </Button>
            <Button variant='outlined' color='error' type='reset' onClick={handleReset} fullWidth>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddExpenseDrawer
