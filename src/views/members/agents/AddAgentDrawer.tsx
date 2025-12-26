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
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import { styled } from '@mui/material/styles'
import type { BoxProps } from '@mui/material/Box'

// Third-party Imports
import { useDropzone } from 'react-dropzone'

// Component Imports
import CustomAvatar from '@core/components/mui/Avatar'

// Styled Component Imports
import AppReactDropzone from '@/libs/styles/AppReactDropzone'

// Type Imports
import type { AgentType } from '@/types/members/agentTypes'

type Props = {
  open: boolean
  handleClose: () => void
  agentData?: AgentType[]
  setData: (data: AgentType[]) => void
}

type FormValidateType = {
  title: string
  name: string
  gender: string
  dateOfBirth: string
  ghanaCardNumber: string
  userType: string
  location: string
  ussdPhone: string
  primaryGuarantor: string
  primaryGuarantorPhone: string
  secondaryGuarantor: string
  secondaryGuarantorPhone: string
}

type FileProp = {
  name: string
  type: string
  size: number
}

// Styled Dropzone Component
const Dropzone = styled(AppReactDropzone)<BoxProps>(({ theme }) => ({
  '& .dropzone': {
    minHeight: 'unset',
    padding: theme.spacing(6),
    [theme.breakpoints.down('sm')]: {
      paddingInline: theme.spacing(5)
    },
    '&+.MuiList-root .MuiListItem-root .file-name': {
      fontWeight: theme.typography.body1.fontWeight
    }
  }
}))

// Vars
const initialData: FormValidateType = {
  title: '',
  name: '',
  gender: '',
  dateOfBirth: '',
  ghanaCardNumber: '',
  userType: 'Agent',
  location: '',
  ussdPhone: '',
  primaryGuarantor: '',
  primaryGuarantorPhone: '',
  secondaryGuarantor: '',
  secondaryGuarantorPhone: ''
}

const AddAgentDrawer = (props: Props) => {
  // Props
  const { open, handleClose, agentData, setData } = props

  // States
  const [formData, setFormData] = useState<FormValidateType>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormValidateType, boolean>>>({})
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState(false)

  // Hooks
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      setFiles(acceptedFiles.map((file: File) => Object.assign(file)))
      setFileError(false)
    }
  })

  // const [fileError, setFileError] = useState(false)

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormValidateType, boolean>> = {}

    const requiredFields: (keyof FormValidateType)[] = [
      'name',
      'gender',
      'userType',
      'ussdPhone',
      'primaryGuarantor',
      'primaryGuarantorPhone'
    ]

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        newErrors[field] = true
      }
    })

    // Validate file upload
    if (files.length === 0) {
      setFileError(true)
    } else {
      setFileError(false)
    }

    setErrors(newErrors)
    
return Object.keys(newErrors).length === 0 && files.length > 0
  }

  const handleInputChange = (field: keyof FormValidateType, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }))
    }
  }

  const renderFilePreview = (file: FileProp) => {
    if (file.type.startsWith('image')) {
      return <img width={38} height={38} alt={file.name} src={URL.createObjectURL(file as any)} />
    } else {
      return <i className='ri-file-text-line' />
    }
  }

  const handleRemoveFile = (file: FileProp) => {
    const uploadedFiles = files
    const filtered = uploadedFiles.filter((i: FileProp) => i.name !== file.name)

    setFiles([...filtered])
  }

  const fileList = files.map((file: FileProp) => (
    <ListItem key={file.name} className='pis-4 plb-3'>
      <div className='file-details'>
        <div className='file-preview'>{renderFilePreview(file)}</div>
        <div>
          <Typography className='file-name font-medium' color='text.primary'>
            {file.name}
          </Typography>
          <Typography className='file-size' variant='body2'>
            {Math.round(file.size / 100) / 10 > 1000
              ? `${(Math.round(file.size / 100) / 10000).toFixed(1)} mb`
              : `${(Math.round(file.size / 100) / 10).toFixed(1)} kb`}
          </Typography>
        </div>
      </div>
      <IconButton onClick={() => handleRemoveFile(file)} size='small'>
        <i className='ri-close-line text-xl' />
      </IconButton>
    </ListItem>
  ))

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    const data = formData

    const newAgent: AgentType = {
      id: (agentData?.length && agentData?.length + 1) || 1,
      name: data.name,
      phoneNumber: data.ussdPhone,
      customersAssigned: 0,
      status: 'active',
      userType: 'agent',
      registrationDate: new Date().toISOString().slice(0, 19).replace('T', ' ')
    }

    setData([...(agentData ?? []), newAgent])
    handleClose()
    setFormData(initialData)
    setErrors({})
    setFiles([])
  }

  const handleReset = () => {
    handleClose()
    setFormData(initialData)
    setErrors({})
    setFiles([])
    setFileError(false)
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
                  <MenuItem value='Agent'>Agent</MenuItem>
                  <MenuItem value='Customer'>Customer</MenuItem>
                </Select>
                {errors.userType && <FormHelperText error>This field is required.</FormHelperText>}
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Location'
                placeholder='Location'
                value={formData.location}
                onChange={e => handleInputChange('location', e.target.value)}
              />
            </Grid>

            {/* Right Column */}
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
                label='Primary Guarantor *'
                placeholder='Primary Guarantor'
                value={formData.primaryGuarantor}
                onChange={e => handleInputChange('primaryGuarantor', e.target.value)}
                error={Boolean(errors.primaryGuarantor)}
                helperText={errors.primaryGuarantor ? 'This field is required.' : ''}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Primary Guarantor Phone Number *'
                placeholder='Primary Guarantor Phone Number'
                value={formData.primaryGuarantorPhone}
                onChange={e => handleInputChange('primaryGuarantorPhone', e.target.value)}
                error={Boolean(errors.primaryGuarantorPhone)}
                helperText={errors.primaryGuarantorPhone ? 'This field is required.' : ''}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Secondary Guarantor'
                placeholder='Secondary Guarantor'
                value={formData.secondaryGuarantor}
                onChange={e => handleInputChange('secondaryGuarantor', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label='Secondary Guarantor Phone Number'
                placeholder='Secondary Guarantor Phone Number'
                value={formData.secondaryGuarantorPhone}
                onChange={e => handleInputChange('secondaryGuarantorPhone', e.target.value)}
              />
            </Grid>

            {/* File Upload Section */}
            <Grid size={{ xs: 12 }}>
              <div className='flex items-center justify-between mb-2'>
                <Typography variant='body2'>
                  Choose Picture * <span className='text-error'>*</span>
                </Typography>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    const input = document.createElement('input')

                    input.type = 'file'

                    input.onchange = (event: Event) => {
                      const target = event.target as HTMLInputElement

                      if (target.files && target.files.length > 0) {
                        const fileArray = Array.from(target.files)

                        setFiles(fileArray.map((file: File) => Object.assign(file)))
                        setFileError(false)
                      }
                    }

                    input.click()
                  }}
                >
                  Browse
                </Button>
              </div>
              <Dropzone>
                <div {...getRootProps({ className: 'dropzone' })}>
                  <input {...getInputProps()} />
                  <div className='flex items-center flex-col gap-2 text-center'>
                    <CustomAvatar variant='rounded' skin='light' color='secondary'>
                      <i className='ri-upload-cloud-2-line text-2xl' />
                    </CustomAvatar>
                    <Typography variant='body1' color='text.secondary'>
                      Drag and drop a file here or click
                    </Typography>
                  </div>
                </div>
                {files.length > 0 && <List>{fileList}</List>}
              </Dropzone>
              {fileError && (
                <FormHelperText error className='mt-1'>
                  This field is required.
                </FormHelperText>
              )}
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

export default AddAgentDrawer
