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
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'

// Type Imports
import Snackbar from '@mui/material/Snackbar'

import Alert from '@mui/material/Alert'

import type { TaxDisplayOption } from '@/types/settings/paymentTypes'

// Utils Imports
import { paymentSettingsApi } from '@/utils/settings/api'

// MUI Imports

const TaxSettings = () => {
  // States
  const [taxEnabled, setTaxEnabled] = useState(true)
  const [defaultTaxRate, setDefaultTaxRate] = useState('12.5')
  const [taxIdNumber, setTaxIdNumber] = useState('')
  const [displayOption, setDisplayOption] = useState<TaxDisplayOption>('inclusive')
  const [vatEnabled, setVatEnabled] = useState(true)
  const [gstEnabled, setGstEnabled] = useState(false)
  const [loading, setLoading] = useState(false)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const handleSave = async () => {
    setLoading(true)

    try {
      const taxSettings = {
        enabled: taxEnabled,
        defaultTaxRate: parseFloat(defaultTaxRate),
        taxIdNumber,
        displayOption,
        vatEnabled,
        gstEnabled
      }

      await paymentSettingsApi.update({ tax: taxSettings })
      setSnackbar({ open: true, message: 'Tax settings saved successfully', severity: 'success' })
    } catch (error) {
      console.error('Error saving tax settings:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save tax settings',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title='Tax Settings' subheader='Configure tax calculation and display options for invoices' />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <FormControlLabel
          control={<Switch checked={taxEnabled} onChange={e => setTaxEnabled(e.target.checked)} />}
          label={
            <div className='flex flex-col'>
              <Typography className='font-medium'>Enable Tax Calculation</Typography>
              <Typography variant='body2' color='text.secondary'>
                Automatically calculate tax on invoices and payments
              </Typography>
            </div>
          }
        />

        {taxEnabled && (
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                type='number'
                label='Default Tax Rate (%)'
                value={defaultTaxRate}
                onChange={e => setDefaultTaxRate(e.target.value)}
                helperText='Default tax rate to apply (e.g., 12.5 for 12.5%)'
                slotProps={{
                  input: {
                    inputProps: { min: 0, max: 100, step: 0.1 }
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                label='Tax ID Number'
                value={taxIdNumber}
                onChange={e => setTaxIdNumber(e.target.value)}
                helperText='Ghana Revenue Authority (GRA) Tax ID'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Tax Display Option</InputLabel>
                <Select
                  value={displayOption}
                  onChange={e => setDisplayOption(e.target.value as TaxDisplayOption)}
                  label='Tax Display Option'
                >
                  <MenuItem value='inclusive'>Tax Inclusive (Price includes tax)</MenuItem>
                  <MenuItem value='exclusive'>Tax Exclusive (Tax added separately)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={<Switch checked={vatEnabled} onChange={e => setVatEnabled(e.target.checked)} />}
                label={
                  <div className='flex flex-col'>
                    <Typography className='font-medium'>Enable VAT</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Apply Value Added Tax (VAT) to transactions
                    </Typography>
                  </div>
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={<Switch checked={gstEnabled} onChange={e => setGstEnabled(e.target.checked)} />}
                label={
                  <div className='flex flex-col'>
                    <Typography className='font-medium'>Enable GST</Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Apply Goods and Services Tax (GST) to transactions
                    </Typography>
                  </div>
                }
              />
            </Grid>
          </Grid>
        )}

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

export default TaxSettings
