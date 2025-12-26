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
import Checkbox from '@mui/material/Checkbox'
import FormGroup from '@mui/material/FormGroup'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'

// Type Imports
import Snackbar from '@mui/material/Snackbar'

import Alert from '@mui/material/Alert'

import type { PaymentGateway, MobileMoneyProvider } from '@/types/settings/paymentTypes'

// Utils Imports
import { paymentSettingsApi } from '@/utils/settings/api'

// MUI Imports

const PaymentMethodsSettings = () => {
  // States
  const [cardEnabled, setCardEnabled] = useState(true)
  const [cardGateways, setCardGateways] = useState<PaymentGateway[]>(['paystack'])
  const [bankTransferEnabled, setBankTransferEnabled] = useState(true)
  const [bankTransferGateways, setBankTransferGateways] = useState<PaymentGateway[]>(['redde', 'paystack'])
  const [mobileMoneyEnabled, setMobileMoneyEnabled] = useState(true)
  const [mobileMoneyGateways, setMobileMoneyGateways] = useState<PaymentGateway[]>(['redde', 'hubtel'])

  const [mobileMoneyProviders, setMobileMoneyProviders] = useState<MobileMoneyProvider[]>([
    'mtn',
    'vodafone',
    'airteltigo'
  ])

  const [cashEnabled, setCashEnabled] = useState(true)
  const [loading, setLoading] = useState(false)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const handleGatewayToggle = (method: 'card' | 'bank_transfer' | 'mobile_money', gateway: PaymentGateway) => {
    if (method === 'card') {
      setCardGateways(prev => (prev.includes(gateway) ? prev.filter(g => g !== gateway) : [...prev, gateway]))
    } else if (method === 'bank_transfer') {
      setBankTransferGateways(prev => (prev.includes(gateway) ? prev.filter(g => g !== gateway) : [...prev, gateway]))
    } else if (method === 'mobile_money') {
      setMobileMoneyGateways(prev => (prev.includes(gateway) ? prev.filter(g => g !== gateway) : [...prev, gateway]))
    }
  }

  const handleMobileMoneyProviderToggle = (provider: MobileMoneyProvider) => {
    setMobileMoneyProviders(prev => (prev.includes(provider) ? prev.filter(p => p !== provider) : [...prev, provider]))
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const paymentMethods = [
        ...cardGateways.map(gateway => ({
          method: 'card' as const,
          enabled: cardEnabled,
          gateway
        })),
        ...bankTransferGateways.map(gateway => ({
          method: 'bank_transfer' as const,
          enabled: bankTransferEnabled,
          gateway
        })),
        ...mobileMoneyGateways.map(gateway => ({
          method: 'mobile_money' as const,
          enabled: mobileMoneyEnabled,
          gateway,
          mobileMoneyProviders: mobileMoneyProviders
        })),
        {
          method: 'cash' as const,
          enabled: cashEnabled,
          gateway: 'redde' as PaymentGateway
        }
      ]

      await paymentSettingsApi.update({ paymentMethods })
      setSnackbar({ open: true, message: 'Payment methods settings saved successfully', severity: 'success' })
    } catch (error) {
      console.error('Error saving payment methods settings:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save payment methods settings',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Payment Methods Settings'
        subheader='Enable and configure available payment methods for each gateway'
      />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        {/* Credit/Debit Cards */}
        <div className='flex flex-col gap-4'>
          <FormControlLabel
            control={<Switch checked={cardEnabled} onChange={e => setCardEnabled(e.target.checked)} />}
            label={
              <div className='flex flex-col'>
                <Typography className='font-medium'>Credit/Debit Cards</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Accept payments via credit and debit cards
                </Typography>
              </div>
            }
          />
          {cardEnabled && (
            <FormControl component='fieldset' className='ml-4'>
              <FormLabel component='legend'>Available Gateways</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={cardGateways.includes('paystack')}
                      onChange={() => handleGatewayToggle('card', 'paystack')}
                    />
                  }
                  label='Paystack'
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={cardGateways.includes('hubtel')}
                      onChange={() => handleGatewayToggle('card', 'hubtel')}
                    />
                  }
                  label='Hubtel'
                />
              </FormGroup>
            </FormControl>
          )}
        </div>

        {/* Bank Transfer */}
        <div className='flex flex-col gap-4'>
          <FormControlLabel
            control={<Switch checked={bankTransferEnabled} onChange={e => setBankTransferEnabled(e.target.checked)} />}
            label={
              <div className='flex flex-col'>
                <Typography className='font-medium'>Bank Transfer</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Accept payments via bank transfers
                </Typography>
              </div>
            }
          />
          {bankTransferEnabled && (
            <FormControl component='fieldset' className='ml-4'>
              <FormLabel component='legend'>Available Gateways</FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={bankTransferGateways.includes('redde')}
                      onChange={() => handleGatewayToggle('bank_transfer', 'redde')}
                    />
                  }
                  label='Redde Payment'
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={bankTransferGateways.includes('paystack')}
                      onChange={() => handleGatewayToggle('bank_transfer', 'paystack')}
                    />
                  }
                  label='Paystack'
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={bankTransferGateways.includes('hubtel')}
                      onChange={() => handleGatewayToggle('bank_transfer', 'hubtel')}
                    />
                  }
                  label='Hubtel'
                />
              </FormGroup>
            </FormControl>
          )}
        </div>

        {/* Mobile Money */}
        <div className='flex flex-col gap-4'>
          <FormControlLabel
            control={<Switch checked={mobileMoneyEnabled} onChange={e => setMobileMoneyEnabled(e.target.checked)} />}
            label={
              <div className='flex flex-col'>
                <Typography className='font-medium'>Mobile Money</Typography>
                <Typography variant='body2' color='text.secondary'>
                  Accept payments via mobile money (MTN, Vodafone, AirtelTigo)
                </Typography>
              </div>
            }
          />
          {mobileMoneyEnabled && (
            <Grid container spacing={6} className='ml-4'>
              <Grid size={{ xs: 12 }}>
                <FormControl component='fieldset'>
                  <FormLabel component='legend'>Available Gateways</FormLabel>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={mobileMoneyGateways.includes('redde')}
                          onChange={() => handleGatewayToggle('mobile_money', 'redde')}
                        />
                      }
                      label='Redde Payment'
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={mobileMoneyGateways.includes('hubtel')}
                          onChange={() => handleGatewayToggle('mobile_money', 'hubtel')}
                        />
                      }
                      label='Hubtel'
                    />
                  </FormGroup>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControl component='fieldset'>
                  <FormLabel component='legend'>Mobile Money Providers</FormLabel>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={mobileMoneyProviders.includes('mtn')}
                          onChange={() => handleMobileMoneyProviderToggle('mtn')}
                        />
                      }
                      label='MTN Mobile Money'
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={mobileMoneyProviders.includes('vodafone')}
                          onChange={() => handleMobileMoneyProviderToggle('vodafone')}
                        />
                      }
                      label='Vodafone Cash'
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={mobileMoneyProviders.includes('airteltigo')}
                          onChange={() => handleMobileMoneyProviderToggle('airteltigo')}
                        />
                      }
                      label='AirtelTigo Money'
                    />
                  </FormGroup>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </div>

        {/* Cash */}
        <FormControlLabel
          control={<Switch checked={cashEnabled} onChange={e => setCashEnabled(e.target.checked)} />}
          label={
            <div className='flex flex-col'>
              <Typography className='font-medium'>Cash Payments</Typography>
              <Typography variant='body2' color='text.secondary'>
                Allow cash payments (manual entry)
              </Typography>
            </div>
          }
        />

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

export default PaymentMethodsSettings
