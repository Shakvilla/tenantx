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
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'

// Type Imports
import type { NotificationType } from '@/types/settings/notificationTypes'

// Utils Imports
import { notificationSettingsApi } from '@/utils/settings/api'

// MUI Imports
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

const NOTIFICATION_TYPES: { value: NotificationType; label: string; description: string }[] = [
  {
    value: 'invoice_sent',
    label: 'Invoice Sent',
    description: 'Notify when an invoice is sent to a tenant'
  },
  {
    value: 'payment_received',
    label: 'Payment Received',
    description: 'Notify when a payment is received'
  },
  {
    value: 'payment_reminder',
    label: 'Payment Reminder',
    description: 'Send reminders before payment due date'
  },
  {
    value: 'tenant_welcome',
    label: 'Tenant Welcome',
    description: 'Send welcome email to new tenants'
  },
  {
    value: 'maintenance_request',
    label: 'Maintenance Request',
    description: 'Notify about new maintenance requests'
  }
]

const EmailPreferencesSettings = () => {
  // States
  const [notifications, setNotifications] = useState<Record<NotificationType, boolean>>({
    invoice_sent: true,
    payment_received: true,
    payment_reminder: true,
    tenant_welcome: true,
    maintenance_request: true
  })
  const [frequency, setFrequency] = useState<'immediate' | 'daily' | 'weekly'>('immediate')
  const [recipients, setRecipients] = useState<string>('')
  const [bccEmails, setBccEmails] = useState<string>('')
  const [ccEmails, setCcEmails] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const handleNotificationToggle = (type: NotificationType) => {
    setNotifications(prev => ({
      ...prev,
      [type]: !prev[type]
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const emailPreferences = Object.entries(notifications).map(([type, enabled]) => ({
        type: type as NotificationType,
        enabled,
        channels: ['email' as const],
        frequency: frequency as 'immediate' | 'daily' | 'weekly'
      }))

      await notificationSettingsApi.update({
        emailPreferences
      })
      // Note: emailRecipients, emailBcc, emailCc would be stored separately or in a different structure
      // This is a placeholder - adjust based on actual API structure
      setSnackbar({ open: true, message: 'Email preferences saved successfully', severity: 'success' })
    } catch (error) {
      console.error('Error saving email preferences:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save email preferences',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Email Notification Preferences'
        subheader='Configure which email notifications to send and to whom'
      />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <div className='flex flex-col gap-4'>
          <Typography variant='body2' className='font-medium'>
            Notification Types
          </Typography>
          {NOTIFICATION_TYPES.map(notification => (
            <FormControlLabel
              key={notification.value}
              control={
                <Switch
                  checked={notifications[notification.value]}
                  onChange={() => handleNotificationToggle(notification.value)}
                />
              }
              label={
                <div className='flex flex-col'>
                  <Typography className='font-medium'>{notification.label}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {notification.description}
                  </Typography>
                </div>
              }
            />
          ))}
        </div>

        <Grid container spacing={6}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Email Frequency</InputLabel>
              <Select value={frequency} onChange={e => setFrequency(e.target.value as any)} label='Email Frequency'>
                <MenuItem value='immediate'>Immediate</MenuItem>
                <MenuItem value='daily'>Daily Digest</MenuItem>
                <MenuItem value='weekly'>Weekly Digest</MenuItem>
              </Select>
            </FormControl>
            <Typography variant='caption' color='text.secondary' className='mts-1'>
              How often to send notification emails
            </Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              size='small'
              label='Notification Recipients'
              value={recipients}
              onChange={e => setRecipients(e.target.value)}
              helperText='Comma-separated email addresses to receive notifications (admin emails)'
              placeholder='admin@example.com, manager@example.com'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='BCC Emails'
              value={bccEmails}
              onChange={e => setBccEmails(e.target.value)}
              helperText='Comma-separated BCC email addresses'
              placeholder='bcc@example.com'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='CC Emails'
              value={ccEmails}
              onChange={e => setCcEmails(e.target.value)}
              helperText='Comma-separated CC email addresses'
              placeholder='cc@example.com'
            />
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

export default EmailPreferencesSettings
