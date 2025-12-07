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
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'

// Type Imports
import type { CurrencySymbolPosition } from '@/types/settings/paymentTypes'

// Utils Imports
import { paymentSettingsApi } from '@/utils/settings/api'

// MUI Imports
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

const CURRENCIES = [
  { code: 'GHS', name: 'Ghana Cedi', symbol: '₵' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' }
]

const CurrencySettings = () => {
  // States
  const [defaultCurrency, setDefaultCurrency] = useState('GHS')
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['GHS', 'USD'])
  const [symbolPosition, setSymbolPosition] = useState<CurrencySymbolPosition>('before')
  const [decimalPlaces, setDecimalPlaces] = useState(2)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const handleCurrencyToggle = (currencyCode: string) => {
    setSupportedCurrencies(prev =>
      prev.includes(currencyCode) ? prev.filter(c => c !== currencyCode) : [...prev, currencyCode]
    )
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const currencySettings = {
        defaultCurrency,
        supportedCurrencies,
        symbolPosition,
        decimalPlaces
      }

      await paymentSettingsApi.update({ currency: currencySettings })
      setSnackbar({ open: true, message: 'Currency settings saved successfully', severity: 'success' })
    } catch (error) {
      console.error('Error saving currency settings:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save currency settings',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedCurrency = CURRENCIES.find(c => c.code === defaultCurrency)

  return (
    <Card>
      <CardHeader
        title='Currency Settings'
        subheader='Configure default currency and supported currencies for payments'
      />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Default Currency</InputLabel>
              <Select
                value={defaultCurrency}
                onChange={e => setDefaultCurrency(e.target.value)}
                label='Default Currency'
              >
                {CURRENCIES.map(currency => (
                  <MenuItem key={currency.code} value={currency.code}>
                    {currency.name} ({currency.code})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedCurrency && (
              <Typography variant='caption' color='text.secondary' className='mts-1'>
                Symbol: {selectedCurrency.symbol}
              </Typography>
            )}
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              type='number'
              label='Decimal Places'
              value={decimalPlaces}
              onChange={e => setDecimalPlaces(Number(e.target.value))}
              helperText='Number of decimal places to display (2 for GHS)'
              slotProps={{
                input: {
                  inputProps: { min: 0, max: 4 }
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Currency Symbol Position</InputLabel>
              <Select
                value={symbolPosition}
                onChange={e => setSymbolPosition(e.target.value as CurrencySymbolPosition)}
                label='Currency Symbol Position'
              >
                <MenuItem value='before'>Before amount (₵100)</MenuItem>
                <MenuItem value='after'>After amount (100₵)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <div className='flex flex-col gap-4'>
          <Typography variant='body2' className='font-medium'>
            Supported Currencies
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Select currencies that customers can use for payments
          </Typography>
          <Box className='flex flex-wrap gap-2'>
            {CURRENCIES.map(currency => (
              <Chip
                key={currency.code}
                label={`${currency.name} (${currency.code})`}
                onClick={() => handleCurrencyToggle(currency.code)}
                color={supportedCurrencies.includes(currency.code) ? 'primary' : 'default'}
                variant={supportedCurrencies.includes(currency.code) ? 'filled' : 'outlined'}
              />
            ))}
          </Box>
        </div>

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

export default CurrencySettings
