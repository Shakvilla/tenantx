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
import type { CustomerType } from '@/types/members/customerTypes'

type Props = {
  open: boolean
  handleClose: () => void
  customerData?: CustomerType[]
  setData: (data: CustomerType[]) => void
}

type FormValidateType = {
  title: string
  name: string
  gender: string
  dateOfBirth: string
  ghanaCardNumber: string
  userType: string
  nationality: string
  maritalStatus: string
  hometown: string
  frequencyType: string
  sourceOfIncome: string
  agent: string
  ussdPhone: string
  frequencyValue: string
  rate: string
  accountName: string
  registrationDate: string
  residentialAddress: string
  occupation: string
  location: string
  nextOfKin: string
  nextOfKinPhone: string
  nextOfKinRelationship: string
}

// Vars
const initialData: FormValidateType = {
  title: '',
  name: '',
  gender: '',
  dateOfBirth: '',
  ghanaCardNumber: '',
  userType: 'Customer',
  nationality: '',
  maritalStatus: '',
  hometown: '',
  frequencyType: '',
  sourceOfIncome: '',
  agent: '',
  ussdPhone: '',
  frequencyValue: '',
  rate: '',
  accountName: '',
  registrationDate: '',
  residentialAddress: '',
  occupation: '',
  location: '',
  nextOfKin: '',
  nextOfKinPhone: '',
  nextOfKinRelationship: ''
}

const AddCustomerDrawer = (props: Props) => {
  // Props
  const { open, handleClose, customerData, setData } = props

  // States
  const [formData, setFormData] = useState<FormValidateType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValidateType, boolean>>>({})

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormValidateType, boolean>> = {}
    const requiredFields: (keyof FormValidateType)[] = [
      'name',
      'gender',
      'userType',
      'frequencyType',
      'sourceOfIncome',
      'agent',
      'ussdPhone',
      'rate',
      'accountName',
      'nextOfKin',
      'nextOfKinPhone',
      'nextOfKinRelationship'
    ]

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
    const newCustomer: CustomerType = {
      id: (customerData?.length && customerData?.length + 1) || 1,
      name: data.name,
      phoneNumber: data.ussdPhone,
      ussdCode: data.ussdPhone.substring(data.ussdPhone.length - 6) || '',
      status: 'active',
      agent: data.agent,
      rate: data.rate ? parseFloat(data.rate) : undefined,
      registrationDate: data.registrationDate || new Date().toISOString().slice(0, 19).replace('T', ' ')
    }

    setData([...(customerData ?? []), newCustomer])
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
      sx={{ '& .MuiDrawer-paper': { width: { xs: '100%', sm: 600, md: 700 } } }}
    >
      <div className='flex items-center justify-between pli-5 plb-4'>
        <Typography variant='h5'>Add Members</Typography>
        <Typography variant='body2' color='text.secondary' className='hidden sm:block'>
          All fields marked * are compulsory
        </Typography>
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
                <InputLabel id='title-select'>Title</InputLabel>
                <Select
                  label='Title'
                  value={formData.title}
                  onChange={e => handleInputChange('title', e.target.value)}
                  labelId='title-select'
                >
                  <MenuItem value='Mr'>Mr</MenuItem>
                  <MenuItem value='Mrs'>Mrs</MenuItem>
                  <MenuItem value='Miss'>Miss</MenuItem>
                  <MenuItem value='Dr'>Dr</MenuItem>
                  <MenuItem value='Prof'>Prof</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Name *'
                placeholder='Enter name'
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                error={Boolean(errors.name)}
                helperText={errors.name ? 'This field is required.' : ''}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={Boolean(errors.gender)}>
                <InputLabel id='gender-select'>Gender *</InputLabel>
                <Select
                  label='Gender *'
                  value={formData.gender}
                  onChange={e => handleInputChange('gender', e.target.value)}
                  labelId='gender-select'
                >
                  <MenuItem value='Male'>Male</MenuItem>
                  <MenuItem value='Female'>Female</MenuItem>
                </Select>
                {errors.gender && <FormHelperText error>This field is required.</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='date'
                label='Date of Birth'
                value={formData.dateOfBirth}
                onChange={e => handleInputChange('dateOfBirth', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Ghana Card Number'
                placeholder='Ghana Card Number'
                value={formData.ghanaCardNumber}
                onChange={e => handleInputChange('ghanaCardNumber', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={Boolean(errors.userType)}>
                <InputLabel id='user-type-select'>User Type *</InputLabel>
                <Select
                  label='User Type *'
                  value={formData.userType}
                  onChange={e => handleInputChange('userType', e.target.value)}
                  labelId='user-type-select'
                >
                  <MenuItem value='Customer'>Customer</MenuItem>
                  <MenuItem value='Agent'>Agent</MenuItem>
                </Select>
                {errors.userType && <FormHelperText error>This field is required.</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Nationality'
                placeholder='Nationality'
                value={formData.nationality}
                onChange={e => handleInputChange('nationality', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id='marital-status-select'>Marital Status</InputLabel>
                <Select
                  label='Marital Status'
                  value={formData.maritalStatus}
                  onChange={e => handleInputChange('maritalStatus', e.target.value)}
                  labelId='marital-status-select'
                >
                  <MenuItem value='Single'>Single</MenuItem>
                  <MenuItem value='Married'>Married</MenuItem>
                  <MenuItem value='Divorced'>Divorced</MenuItem>
                  <MenuItem value='Widowed'>Widowed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Hometown'
                placeholder='Hometown'
                value={formData.hometown}
                onChange={e => handleInputChange('hometown', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={Boolean(errors.frequencyType)}>
                <InputLabel id='frequency-type-select'>Frequency Type *</InputLabel>
                <Select
                  label='Frequency Type *'
                  value={formData.frequencyType}
                  onChange={e => handleInputChange('frequencyType', e.target.value)}
                  labelId='frequency-type-select'
                >
                  <MenuItem value='Daily'>Daily</MenuItem>
                  <MenuItem value='Weekly'>Weekly</MenuItem>
                  <MenuItem value='Monthly'>Monthly</MenuItem>
                  <MenuItem value='Yearly'>Yearly</MenuItem>
                </Select>
                {errors.frequencyType && <FormHelperText error>This field is required.</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={Boolean(errors.sourceOfIncome)}>
                <InputLabel id='source-of-income-select'>Source of Income *</InputLabel>
                <Select
                  label='Source of Income *'
                  value={formData.sourceOfIncome}
                  onChange={e => handleInputChange('sourceOfIncome', e.target.value)}
                  labelId='source-of-income-select'
                >
                  <MenuItem value='Salary'>Salary</MenuItem>
                  <MenuItem value='Business'>Business</MenuItem>
                  <MenuItem value='Freelance'>Freelance</MenuItem>
                  <MenuItem value='Investment'>Investment</MenuItem>
                  <MenuItem value='Other'>Other</MenuItem>
                </Select>
                {errors.sourceOfIncome && <FormHelperText error>This field is required.</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={Boolean(errors.agent)}>
                <InputLabel id='agent-select'>Agent *</InputLabel>
                <Select
                  label='Agent *'
                  value={formData.agent}
                  onChange={e => handleInputChange('agent', e.target.value)}
                  labelId='agent-select'
                >
                  <MenuItem value='Agent Admin'>Agent Admin</MenuItem>
                  <MenuItem value='Emmanuel Ani'>Emmanuel Ani</MenuItem>
                  <MenuItem value='Nana'>Nana</MenuItem>
                </Select>
                {errors.agent && <FormHelperText error>This field is required.</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='USSD Phone *'
                placeholder='USSD Phone'
                value={formData.ussdPhone}
                onChange={e => handleInputChange('ussdPhone', e.target.value)}
                error={Boolean(errors.ussdPhone)}
                helperText={errors.ussdPhone ? 'This field is required.' : ''}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Frequency value'
                placeholder='Enter frequency value'
                value={formData.frequencyValue}
                onChange={e => handleInputChange('frequencyValue', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Rate *'
                placeholder='Contribution Rate'
                type='number'
                value={formData.rate}
                onChange={e => handleInputChange('rate', e.target.value)}
                error={Boolean(errors.rate)}
                helperText={errors.rate ? 'This field is required.' : ''}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='AccountName *'
                placeholder='Enter accountname'
                value={formData.accountName}
                onChange={e => handleInputChange('accountName', e.target.value)}
                error={Boolean(errors.accountName)}
                helperText={errors.accountName ? 'This field is required.' : ''}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type='date'
                label='Registration Date'
                value={formData.registrationDate}
                onChange={e => handleInputChange('registrationDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Residential Address'
                placeholder='Residential Address'
                value={formData.residentialAddress}
                onChange={e => handleInputChange('residentialAddress', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Occupation'
                placeholder='Occupation'
                value={formData.occupation}
                onChange={e => handleInputChange('occupation', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Location'
                placeholder='Location'
                multiline
                rows={3}
                value={formData.location}
                onChange={e => handleInputChange('location', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Next of Kin *'
                placeholder='Next of Kin'
                value={formData.nextOfKin}
                onChange={e => handleInputChange('nextOfKin', e.target.value)}
                error={Boolean(errors.nextOfKin)}
                helperText={errors.nextOfKin ? 'This field is required.' : ''}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Next of Kin Phone Number *'
                placeholder='Next of Kin Phone Number'
                value={formData.nextOfKinPhone}
                onChange={e => handleInputChange('nextOfKinPhone', e.target.value)}
                error={Boolean(errors.nextOfKinPhone)}
                helperText={errors.nextOfKinPhone ? 'This field is required.' : ''}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth error={Boolean(errors.nextOfKinRelationship)}>
                <InputLabel id='next-of-kin-relationship-select'>Next of Kin Relationship *</InputLabel>
                <Select
                  label='Next of Kin Relationship *'
                  value={formData.nextOfKinRelationship}
                  onChange={e => handleInputChange('nextOfKinRelationship', e.target.value)}
                  labelId='next-of-kin-relationship-select'
                >
                  <MenuItem value='Spouse'>Spouse</MenuItem>
                  <MenuItem value='Parent'>Parent</MenuItem>
                  <MenuItem value='Sibling'>Sibling</MenuItem>
                  <MenuItem value='Child'>Child</MenuItem>
                  <MenuItem value='Other'>Other</MenuItem>
                </Select>
                {errors.nextOfKinRelationship && <FormHelperText error>This field is required.</FormHelperText>}
              </FormControl>
            </Grid>
          </Grid>

          <div className='flex items-center gap-4 mts-4'>
            <Button variant='contained' type='submit' color='success' fullWidth>
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

export default AddCustomerDrawer
