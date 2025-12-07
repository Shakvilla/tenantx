// Documentation: /docs/settings/settings-module.md

'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// Utils Imports
import { companySettingsApi } from '@/utils/settings/api'

const COUNTRIES = [
  { code: 'GH', name: 'Ghana' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' }
]

const TIMEZONES = [
  'Africa/Accra',
  'Africa/Lagos',
  'Africa/Nairobi',
  'Africa/Johannesburg',
  'America/New_York',
  'Europe/London'
]

const BasicInformationSettings = () => {
  // States
  const [companyName, setCompanyName] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [country, setCountry] = useState('GH')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [timezone, setTimezone] = useState('Africa/Accra')
  const [logo, setLogo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogo(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const basicInfo = {
        companyName,
        address: { street, city, state, zipCode, country },
        phone,
        email,
        website,
        timezone,
        logo: logo || undefined
      }

      await companySettingsApi.update({ basic: basicInfo })
      setSnackbar({ open: true, message: 'Company basic information saved successfully', severity: 'success' })
    } catch (error) {
      console.error('Error saving company basic information:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save company basic information',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title='Basic Information' subheader='Company name, address, contact information, and logo' />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='Company Name'
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              helperText='Legal name of your company'
              required
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' className='font-medium mb-2'>
              Address
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='Street Address'
              value={street}
              onChange={e => setStreet(e.target.value)}
              helperText='Street address and building number'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth size='small' label='City' value={city} onChange={e => setCity(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='State/Region'
              value={state}
              onChange={e => setState(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='ZIP/Postal Code'
              value={zipCode}
              onChange={e => setZipCode(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Country</InputLabel>
              <Select value={country} onChange={e => setCountry(e.target.value)} label='Country'>
                {COUNTRIES.map(country => (
                  <MenuItem key={country.code} value={country.code}>
                    {country.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' className='font-medium mb-2'>
              Contact Information
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Phone Number'
              value={phone}
              onChange={e => setPhone(e.target.value)}
              helperText='Primary contact phone number'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              type='email'
              helperText='Primary contact email address'
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='Website'
              value={website}
              onChange={e => setWebsite(e.target.value)}
              helperText='Company website URL (optional)'
              placeholder='https://example.com'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Timezone</InputLabel>
              <Select value={timezone} onChange={e => setTimezone(e.target.value)} label='Timezone'>
                {TIMEZONES.map(tz => (
                  <MenuItem key={tz} value={tz}>
                    {tz}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant='body2' className='font-medium mb-2'>
              Company Logo
            </Typography>
            <div className='flex items-center gap-4'>
              <Avatar src={logo || undefined} alt='Company Logo' sx={{ width: 80, height: 80 }}>
                <i className='ri-building-line text-4xl' />
              </Avatar>
              <div>
                <input
                  accept='image/*'
                  style={{ display: 'none' }}
                  id='logo-upload'
                  type='file'
                  onChange={handleLogoUpload}
                />
                <label htmlFor='logo-upload'>
                  <Button variant='outlined' component='span' size='small'>
                    Upload Logo
                  </Button>
                </label>
                {logo && (
                  <Button variant='text' color='error' size='small' onClick={() => setLogo(null)} className='ml-2'>
                    Remove
                  </Button>
                )}
              </div>
            </div>
            <Typography variant='caption' color='text.secondary' className='mt-2 block'>
              Recommended size: 200x200px. Supported formats: PNG, JPG, SVG
            </Typography>
          </Grid>
        </Grid>

        <div className='flex justify-end'>
          <Button variant='contained' color='primary' onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  )
}

export default BasicInformationSettings
