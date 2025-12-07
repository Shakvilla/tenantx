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
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'

// Type Imports
import type { PaymentGateway } from '@/types/settings/paymentTypes'

// Utils Imports
import { paymentSettingsApi } from '@/utils/settings/api'

// MUI Imports
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

const PaymentGatewaySettings = () => {
  // States
  const [activeTab, setActiveTab] = useState<PaymentGateway>('redde')
  const [reddeEnabled, setReddeEnabled] = useState(false)
  const [reddeMode, setReddeMode] = useState<'test' | 'live'>('test')
  const [reddeApiKey, setReddeApiKey] = useState('')
  const [reddeMerchantId, setReddeMerchantId] = useState('')
  const [reddeMerchantToken, setReddeMerchantToken] = useState('')
  const [reddeWebhookUrl, setReddeWebhookUrl] = useState('')
  const [reddePriority, setReddePriority] = useState(1)

  const [paystackEnabled, setPaystackEnabled] = useState(false)
  const [paystackMode, setPaystackMode] = useState<'test' | 'live'>('test')
  const [paystackPublicKey, setPaystackPublicKey] = useState('')
  const [paystackSecretKey, setPaystackSecretKey] = useState('')
  const [paystackMerchantCode, setPaystackMerchantCode] = useState('')
  const [paystackWebhookUrl, setPaystackWebhookUrl] = useState('')
  const [paystackPriority, setPaystackPriority] = useState(2)

  const [hubtelEnabled, setHubtelEnabled] = useState(false)
  const [hubtelMode, setHubtelMode] = useState<'test' | 'live'>('test')
  const [hubtelClientId, setHubtelClientId] = useState('')
  const [hubtelClientSecret, setHubtelClientSecret] = useState('')
  const [hubtelMerchantAccount, setHubtelMerchantAccount] = useState('')
  const [hubtelWebhookUrl, setHubtelWebhookUrl] = useState('')
  const [hubtelPriority, setHubtelPriority] = useState(3)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const handleTabChange = (_event: React.SyntheticEvent, newValue: PaymentGateway) => {
    setActiveTab(newValue)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const gatewaySettings = {
        redde: {
          enabled: reddeEnabled,
          mode: reddeMode,
          apiKey: reddeApiKey,
          merchantId: reddeMerchantId,
          merchantToken: reddeMerchantToken,
          webhookUrl: reddeWebhookUrl,
          priority: reddePriority
        },
        paystack: {
          enabled: paystackEnabled,
          mode: paystackMode,
          publicKey: paystackPublicKey,
          secretKey: paystackSecretKey,
          merchantCode: paystackMerchantCode,
          webhookUrl: paystackWebhookUrl,
          priority: paystackPriority
        },
        hubtel: {
          enabled: hubtelEnabled,
          mode: hubtelMode,
          clientId: hubtelClientId,
          clientSecret: hubtelClientSecret,
          merchantAccountNumber: hubtelMerchantAccount,
          webhookUrl: hubtelWebhookUrl,
          priority: hubtelPriority
        }
      }

      await paymentSettingsApi.update({ gateways: gatewaySettings })
      setSnackbar({ open: true, message: 'Payment gateway settings saved successfully', severity: 'success' })
    } catch (error) {
      console.error('Error saving payment gateway settings:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save payment gateway settings',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const renderReddeSettings = () => (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <FormControlLabel
          control={<Switch checked={reddeEnabled} onChange={e => setReddeEnabled(e.target.checked)} />}
          label={
            <div className='flex flex-col'>
              <Typography className='font-medium'>Enable Redde Payment</Typography>
              <Typography variant='body2' color='text.secondary'>
                Activate Redde Payment gateway for processing payments
              </Typography>
            </div>
          }
        />
      </Grid>
      {reddeEnabled && (
        <>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Mode</InputLabel>
              <Select value={reddeMode} onChange={e => setReddeMode(e.target.value as 'test' | 'live')} label='Mode'>
                <MenuItem value='test'>Test</MenuItem>
                <MenuItem value='live'>Live</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              type='number'
              label='Priority'
              value={reddePriority}
              onChange={e => setReddePriority(Number(e.target.value))}
              helperText='Lower number = higher priority'
              slotProps={{
                input: {
                  inputProps: { min: 1, max: 10 }
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='API Key'
              value={reddeApiKey}
              onChange={e => setReddeApiKey(e.target.value)}
              type='password'
              helperText='Your Redde Payment API key'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Merchant ID'
              value={reddeMerchantId}
              onChange={e => setReddeMerchantId(e.target.value)}
              helperText='Your Redde Payment merchant ID'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Merchant Token'
              value={reddeMerchantToken}
              onChange={e => setReddeMerchantToken(e.target.value)}
              type='password'
              helperText='Your Redde Payment merchant token'
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='Webhook URL'
              value={reddeWebhookUrl}
              onChange={e => setReddeWebhookUrl(e.target.value)}
              helperText='URL to receive payment webhooks from Redde'
            />
          </Grid>
        </>
      )}
    </Grid>
  )

  const renderPaystackSettings = () => (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <FormControlLabel
          control={<Switch checked={paystackEnabled} onChange={e => setPaystackEnabled(e.target.checked)} />}
          label={
            <div className='flex flex-col'>
              <Typography className='font-medium'>Enable Paystack</Typography>
              <Typography variant='body2' color='text.secondary'>
                Activate Paystack gateway for processing payments
              </Typography>
            </div>
          }
        />
      </Grid>
      {paystackEnabled && (
        <>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Mode</InputLabel>
              <Select
                value={paystackMode}
                onChange={e => setPaystackMode(e.target.value as 'test' | 'live')}
                label='Mode'
              >
                <MenuItem value='test'>Test</MenuItem>
                <MenuItem value='live'>Live</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              type='number'
              label='Priority'
              value={paystackPriority}
              onChange={e => setPaystackPriority(Number(e.target.value))}
              helperText='Lower number = higher priority'
              slotProps={{
                input: {
                  inputProps: { min: 1, max: 10 }
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='Public Key'
              value={paystackPublicKey}
              onChange={e => setPaystackPublicKey(e.target.value)}
              helperText='Your Paystack public key'
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='Secret Key'
              value={paystackSecretKey}
              onChange={e => setPaystackSecretKey(e.target.value)}
              type='password'
              helperText='Your Paystack secret key'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Merchant Code'
              value={paystackMerchantCode}
              onChange={e => setPaystackMerchantCode(e.target.value)}
              helperText='Your Paystack merchant code'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Webhook URL'
              value={paystackWebhookUrl}
              onChange={e => setPaystackWebhookUrl(e.target.value)}
              helperText='URL to receive payment webhooks from Paystack'
            />
          </Grid>
        </>
      )}
    </Grid>
  )

  const renderHubtelSettings = () => (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <FormControlLabel
          control={<Switch checked={hubtelEnabled} onChange={e => setHubtelEnabled(e.target.checked)} />}
          label={
            <div className='flex flex-col'>
              <Typography className='font-medium'>Enable Hubtel</Typography>
              <Typography variant='body2' color='text.secondary'>
                Activate Hubtel gateway for processing payments
              </Typography>
            </div>
          }
        />
      </Grid>
      {hubtelEnabled && (
        <>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Mode</InputLabel>
              <Select value={hubtelMode} onChange={e => setHubtelMode(e.target.value as 'test' | 'live')} label='Mode'>
                <MenuItem value='test'>Test</MenuItem>
                <MenuItem value='live'>Live</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              type='number'
              label='Priority'
              value={hubtelPriority}
              onChange={e => setHubtelPriority(Number(e.target.value))}
              helperText='Lower number = higher priority'
              slotProps={{
                input: {
                  inputProps: { min: 1, max: 10 }
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='Client ID'
              value={hubtelClientId}
              onChange={e => setHubtelClientId(e.target.value)}
              helperText='Your Hubtel client ID'
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='Client Secret'
              value={hubtelClientSecret}
              onChange={e => setHubtelClientSecret(e.target.value)}
              type='password'
              helperText='Your Hubtel client secret'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Merchant Account Number'
              value={hubtelMerchantAccount}
              onChange={e => setHubtelMerchantAccount(e.target.value)}
              helperText='Your Hubtel merchant account number'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Webhook URL'
              value={hubtelWebhookUrl}
              onChange={e => setHubtelWebhookUrl(e.target.value)}
              helperText='URL to receive payment webhooks from Hubtel'
            />
          </Grid>
        </>
      )}
    </Grid>
  )

  return (
    <Card>
      <CardHeader
        title='Payment Gateway Settings'
        subheader='Configure payment gateway providers (Redde Payment, Paystack, Hubtel)'
      />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label='Redde Payment' value='redde' />
            <Tab label='Paystack' value='paystack' />
            <Tab label='Hubtel' value='hubtel' />
          </Tabs>
        </Box>

        {activeTab === 'redde' && renderReddeSettings()}
        {activeTab === 'paystack' && renderPaystackSettings()}
        {activeTab === 'hubtel' && renderHubtelSettings()}

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

export default PaymentGatewaySettings
