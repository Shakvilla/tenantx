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
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'

// Type Imports
import type { LegalEntityType } from '@/types/settings/companyTypes'

// Utils Imports
import { companySettingsApi } from '@/utils/settings/api'

// MUI Imports
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

const LEGAL_ENTITY_TYPES: { value: LegalEntityType; label: string }[] = [
  { value: 'sole_proprietorship', label: 'Sole Proprietorship' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'limited_liability', label: 'Limited Liability Company' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'non_profit', label: 'Non-Profit Organization' },
  { value: 'other', label: 'Other' }
]

const FISCAL_YEAR_MONTHS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
]

const AdvancedInformationSettings = () => {
  // States
  const [taxId, setTaxId] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [registrationNumber, setRegistrationNumber] = useState('')
  const [legalEntityType, setLegalEntityType] = useState<LegalEntityType>('limited_liability')
  const [businessLicenseNumber, setBusinessLicenseNumber] = useState('')
  const [fiscalYearStart, setFiscalYearStart] = useState('01')
  const [useDifferentLegalAddress, setUseDifferentLegalAddress] = useState(false)
  const [legalStreet, setLegalStreet] = useState('')
  const [legalCity, setLegalCity] = useState('')
  const [legalState, setLegalState] = useState('')
  const [legalZipCode, setLegalZipCode] = useState('')
  const [legalCountry, setLegalCountry] = useState('GH')
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      const advancedInfo = {
        taxId,
        vatNumber: vatNumber || undefined,
        registrationNumber,
        legalEntityType,
        businessLicenseNumber: businessLicenseNumber || undefined,
        fiscalYearStart,
        legalAddress: useDifferentLegalAddress
          ? {
              street: legalStreet,
              city: legalCity,
              state: legalState,
              zipCode: legalZipCode,
              country: legalCountry
            }
          : undefined
      }

      await companySettingsApi.update({ advanced: advancedInfo })
      setSnackbar({ open: true, message: 'Company advanced information saved successfully', severity: 'success' })
    } catch (error) {
      console.error('Error saving company advanced information:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save company advanced information',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Advanced Information'
        subheader='Tax ID, registration, legal entity type, and fiscal year settings'
      />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Tax ID Number'
              value={taxId}
              onChange={e => setTaxId(e.target.value)}
              helperText='Ghana Revenue Authority (GRA) Tax ID'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='VAT Number'
              value={vatNumber}
              onChange={e => setVatNumber(e.target.value)}
              helperText='Value Added Tax registration number (optional)'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Registration Number'
              value={registrationNumber}
              onChange={e => setRegistrationNumber(e.target.value)}
              helperText='Company registration number'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Legal Entity Type</InputLabel>
              <Select
                value={legalEntityType}
                onChange={e => setLegalEntityType(e.target.value as LegalEntityType)}
                label='Legal Entity Type'
              >
                {LEGAL_ENTITY_TYPES.map(type => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Business License Number'
              value={businessLicenseNumber}
              onChange={e => setBusinessLicenseNumber(e.target.value)}
              helperText='Business license or permit number (optional)'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Fiscal Year Start</InputLabel>
              <Select
                value={fiscalYearStart}
                onChange={e => setFiscalYearStart(e.target.value)}
                label='Fiscal Year Start'
              >
                {FISCAL_YEAR_MONTHS.map(month => (
                  <MenuItem key={month.value} value={month.value}>
                    {month.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant='caption' color='text.secondary' className='mts-1'>
              Month when your fiscal year begins
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={useDifferentLegalAddress}
                  onChange={e => setUseDifferentLegalAddress(e.target.checked)}
                />
              }
              label={
                <div className='flex flex-col'>
                  <Typography className='font-medium'>Use Different Legal Address</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    If your legal/registered address differs from your business address
                  </Typography>
                </div>
              }
            />
          </Grid>
          {useDifferentLegalAddress && (
            <>
              <Grid size={{ xs: 12 }}>
                <Typography variant='body2' className='font-medium mb-2'>
                  Legal Address
                </Typography>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Street Address'
                  value={legalStreet}
                  onChange={e => setLegalStreet(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='City'
                  value={legalCity}
                  onChange={e => setLegalCity(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='State/Region'
                  value={legalState}
                  onChange={e => setLegalState(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='ZIP/Postal Code'
                  value={legalZipCode}
                  onChange={e => setLegalZipCode(e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size='small'
                  label='Country'
                  value={legalCountry}
                  onChange={e => setLegalCountry(e.target.value)}
                />
              </Grid>
            </>
          )}
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

export default AdvancedInformationSettings
