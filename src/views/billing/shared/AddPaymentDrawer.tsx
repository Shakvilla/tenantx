'use client'

// React Imports
import { useState } from 'react'
import type { FormEvent } from 'react'

// MUI Imports
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import InputAdornment from '@mui/material/InputAdornment'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'

type Props = {
  open: boolean
  handleClose: () => void
  invoiceData?: {
    balance: string
    amount: string
    invoiceNumber: string
  }
}

type FormDataType = {
  paymentDate: string
  paymentMethod: string
  paymentAmount: string
  paymentNote: string
}

// Vars
const getInitialData = (invoiceData?: Props['invoiceData']): FormDataType => {
  const balance = invoiceData?.balance?.replace(/[₵,]/g, '') || invoiceData?.amount?.replace(/[₵,]/g, '') || '0'
  
  return {
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    paymentAmount: balance,
    paymentNote: ''
  }
}

const AddPaymentDrawer = ({ open, handleClose, invoiceData }: Props) => {
  // States
  const [formData, setFormData] = useState<FormDataType>(getInitialData(invoiceData))

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // TODO: Implement add payment functionality
    console.log('Adding payment:', formData)
    handleClose()
    setFormData(getInitialData(invoiceData))
  }

  const handleReset = () => {
    handleClose()
    setFormData(getInitialData(invoiceData))
  }

  const balance = invoiceData?.balance || invoiceData?.amount || '₵0'

  return (
    <Drawer
      open={open}
      anchor='right'
      variant='temporary'
      onClose={handleReset}
      ModalProps={{ keepMounted: true }}
      sx={{ '& .MuiDrawer-paper': { width: { xs: 300, sm: 400 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Add Payment</Typography>
        <IconButton size='small' onClick={handleReset}>
          <i className='ri-close-line text-2xl' />
        </IconButton>
      </div>
      <Divider />
      <div className='p-5'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <TextField
            fullWidth
            size='small'
            id='invoice-balance'
            label='Invoice Balance'
            value={balance}
            slotProps={{
              input: {
                disabled: true
              }
            }}
          />
          <TextField
            fullWidth
            size='small'
            id='payment-amount'
            label='Payment Amount'
            type='number'
            value={formData.paymentAmount}
            onChange={e => setFormData({ ...formData, paymentAmount: e.target.value })}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position='start'>₵</InputAdornment>
              }
            }}
            required
          />
          <TextField
            fullWidth
            size='small'
            id='payment-date'
            label='Payment Date'
            type='date'
            value={formData.paymentDate}
            onChange={e => setFormData({ ...formData, paymentDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
          />
          <FormControl fullWidth size='small'>
            <InputLabel htmlFor='payment-method'>Payment Method</InputLabel>
            <Select
              label='Payment Method'
              labelId='payment-method'
              id='payment-method-select'
              value={formData.paymentMethod}
              onChange={e => setFormData({ ...formData, paymentMethod: e.target.value })}
              required
            >
              <MenuItem value=''>Select Payment Method</MenuItem>
              <MenuItem value='cash'>Cash</MenuItem>
              <MenuItem value='bank-transfer'>Bank Transfer</MenuItem>
              <MenuItem value='mobile-money'>Mobile Money</MenuItem>
              <MenuItem value='credit-card'>Credit Card</MenuItem>
              <MenuItem value='debit-card'>Debit Card</MenuItem>
              <MenuItem value='check'>Check</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            size='small'
            rows={4}
            multiline
            label='Payment Note'
            value={formData.paymentNote}
            onChange={e => setFormData({ ...formData, paymentNote: e.target.value })}
            placeholder='Add any additional notes about this payment...'
          />
          <div className='flex items-center gap-4'>
            <Button variant='contained' color='primary' type='submit' fullWidth>
              Add Payment
            </Button>
            <Button variant='outlined' color='secondary' type='reset' onClick={handleReset} fullWidth>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Drawer>
  )
}

export default AddPaymentDrawer

