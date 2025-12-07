// Documentation: /docs/settings/settings-module.md

'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'
import Chip from '@mui/material/Chip'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { NotificationType } from '@/types/settings/notificationTypes'

// Utils Imports
import { smsSettingsApi } from '@/utils/settings/api'

const SMS_NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
  { value: 'invoice_sent', label: 'Invoice Sent' },
  { value: 'payment_received', label: 'Payment Received' },
  { value: 'payment_reminder', label: 'Payment Reminder' },
  { value: 'tenant_welcome', label: 'Tenant Welcome' },
  { value: 'maintenance_request', label: 'Maintenance Request' }
]

const SMSSettings = () => {
  // States
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [status, setStatus] = useState<'connected' | 'disconnected'>('disconnected')
  const [apiEndpoint, setApiEndpoint] = useState('')
  const [testPhoneNumber, setTestPhoneNumber] = useState('')
  const [smsNotifications, setSmsNotifications] = useState<Record<NotificationType, boolean>>({
    invoice_sent: false,
    payment_received: false,
    payment_reminder: false,
    tenant_welcome: false,
    maintenance_request: false
  })
  const [loading, setLoading] = useState(false)

  // Load SMS configuration from backend
  useEffect(() => {
    const loadSMSConfig = async () => {
      setLoading(true)
      try {
        const data = await smsSettingsApi.get()
        setSmsEnabled(data?.enabled ?? false)
        setStatus(data?.status ?? 'disconnected')
        setApiEndpoint(data?.apiEndpoint ?? '')
        const prefs: Record<NotificationType, boolean> = {
          invoice_sent: false,
          payment_received: false,
          payment_reminder: false,
          tenant_welcome: false,
          maintenance_request: false
        }
        // Check if notificationPreferences exists and is an array
        if (data?.notificationPreferences && Array.isArray(data.notificationPreferences)) {
          data.notificationPreferences.forEach(pref => {
            if (pref && pref.type in prefs) {
              prefs[pref.type] = pref.enabled ?? false
            }
          })
        }
        setSmsNotifications(prefs)
        setLoading(false)
      } catch (error) {
        console.error('Error loading SMS config:', error)
        setLoading(false)
      }
    }

    loadSMSConfig()
  }, [])

  const handleSMSNotificationToggle = (type: NotificationType) => {
    setSmsNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const handleTestSMS = async () => {
    if (!testPhoneNumber) {
      alert('Please enter a test phone number')
      return
    }

    setLoading(true)
    try {
      const result = await smsSettingsApi.test(testPhoneNumber)
      alert(result.message || `Test SMS sent to ${testPhoneNumber}`)
      setLoading(false)
    } catch (error) {
      console.error('Error sending test SMS:', error)
      alert('Failed to send test SMS. Please check backend configuration.')
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const notificationPreferences = Object.entries(smsNotifications).map(([type, enabled]) => ({
        type: type as NotificationType,
        enabled,
        channels: ['sms' as const]
      }))

      await smsSettingsApi.update({
        enabled: smsEnabled,
        apiEndpoint,
        notificationPreferences
      })
      alert('SMS settings saved successfully')
      setLoading(false)
    } catch (error) {
      console.error('Error saving SMS config:', error)
      alert('Failed to save SMS settings. Please try again.')
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title='SMS Settings (FROG)'
        subheader='Configure SMS notifications via FROG provider (backend integration required)'
      />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <Alert severity='info' className='mb-4'>
          SMS functionality is implemented on the backend. This interface consumes API endpoints to configure and test
          SMS settings.
        </Alert>

        {loading && (
          <div className='flex justify-center'>
            <CircularProgress size={24} />
          </div>
        )}

        <FormControlLabel
          control={<Switch checked={smsEnabled} onChange={e => setSmsEnabled(e.target.checked)} />}
          label={
            <div className='flex flex-col'>
              <Typography className='font-medium'>Enable SMS Notifications</Typography>
              <Typography variant='body2' color='text.secondary'>
                Activate SMS notifications via FROG provider
              </Typography>
            </div>
          }
        />

        <Grid container spacing={6}>
          <Grid size={{ xs: 12 }}>
            <Chip
              label={status === 'connected' ? 'Connected' : 'Disconnected'}
              color={status === 'connected' ? 'success' : 'default'}
              variant='outlined'
            />
            <Typography variant='caption' color='text.secondary' className='ml-2'>
              SMS Provider Status
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='API Endpoint (Optional)'
              value={apiEndpoint ?? ''}
              onChange={e => setApiEndpoint(e.target.value)}
              helperText='FROG SMS API endpoint (if configurable from frontend)'
              placeholder='https://api.frog.com/sms'
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <div className='flex flex-col gap-4'>
              <Typography variant='body2' className='font-medium'>
                SMS Notification Types
              </Typography>
              {SMS_NOTIFICATION_TYPES.map(notification => (
                <FormControlLabel
                  key={notification.value}
                  control={
                    <Switch
                      checked={smsNotifications[notification.value] ?? false}
                      onChange={() => handleSMSNotificationToggle(notification.value)}
                      disabled={!smsEnabled}
                    />
                  }
                  label={notification.label}
                />
              ))}
            </div>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Test Phone Number'
              value={testPhoneNumber ?? ''}
              onChange={e => setTestPhoneNumber(e.target.value)}
              helperText='Phone number to send test SMS (e.g., +233XXXXXXXXX)'
              placeholder='+233XXXXXXXXX'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Button variant='outlined' color='secondary' onClick={handleTestSMS} disabled={loading || !smsEnabled}>
              Send Test SMS
            </Button>
          </Grid>
        </Grid>

        <div className='flex justify-end'>
          <Button variant='contained' color='primary' onClick={handleSave} disabled={loading}>
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default SMSSettings
