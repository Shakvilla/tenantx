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
import type { ExpenseConfigType } from '@/types/expenses/expenseConfigTypes'

type Props = {
  open: boolean
  handleClose: () => void
  expenseConfigData?: ExpenseConfigType[]
  setData: (data: ExpenseConfigType[]) => void
}

type FormValidateType = {
  item: string
  category: string
}

// Vars
const initialData: FormValidateType = {
  item: '',
  category: ''
}

// Sample categories for dropdown
const expenseCategories = ['Administrative', 'Occupancy']

const AddExpenseConfigDrawer = (props: Props) => {
  // Props
  const { open, handleClose, expenseConfigData, setData } = props

  // States
  const [formData, setFormData] = useState<FormValidateType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValidateType, boolean>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormValidateType, boolean>> = {}
    const requiredFields: (keyof FormValidateType)[] = ['item']

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = true
      }
    })

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
    const newExpenseConfig: ExpenseConfigType = {
      id: (expenseConfigData?.length && expenseConfigData?.length + 1) || 1,
      item: data.item,
      category: data.category || ''
    }

    setData([...(expenseConfigData ?? []), newExpenseConfig])
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
        <Typography variant='h5'>Add Expense Item</Typography>
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
              <TextField
                fullWidth
                label='Expense Item'
                placeholder='Expense Item'
                value={formData.item}
                onChange={e => handleInputChange('item', e.target.value)}
                error={Boolean(errors.item)}
                helperText={errors.item ? 'This field is required.' : ''}
              />
            </Grid>

            {/* Right Column */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id='category-select'>Select Category</InputLabel>
                <Select
                  label='Select Category'
                  value={formData.category}
                  onChange={e => handleInputChange('category', e.target.value)}
                  labelId='category-select'
                  displayEmpty
                >
                  <MenuItem value=''>
                    <em>Select Category</em>
                  </MenuItem>
                  {expenseCategories.map(category => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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

export default AddExpenseConfigDrawer
