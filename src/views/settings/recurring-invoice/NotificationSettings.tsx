'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// API Imports
import { recurringInvoiceSettingsApi } from '@/lib/api/settings'

const NotificationSettings = () => {
  // States
  const [autoSend, setAutoSend] = useState(false)
  const [sendReminder, setSendReminder] = useState(true)
  const [reminderDays, setReminderDays] = useState('3')
  const [sendOnGeneration, setSendOnGeneration] = useState(false)
  const [loading, setLoading] = useState(false)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    recurringInvoiceSettingsApi.get().then(settings => {
      const n = settings.notifications as any
      if (!n) return
      if (n.autoSend !== undefined) setAutoSend(n.autoSend)
      if (n.sendReminder !== undefined) setSendReminder(n.sendReminder)
      if (n.reminderDays !== undefined) setReminderDays(String(n.reminderDays))
      if (n.sendOnGeneration !== undefined) setSendOnGeneration(n.sendOnGeneration)
    }).catch(console.error)
  }, [])

  const handleSave = async () => {
    setLoading(true)

    try {
      await recurringInvoiceSettingsApi.update({
        notifications: {
          autoSend,
          sendReminder,
          reminderDays: parseInt(reminderDays, 10),
          sendOnGeneration,
          sendReminderBefore: parseInt(reminderDays, 10),
          sendOverdueNotice: false,
          overdueDays: 0
        } as any
      })
      setSnackbar({ open: true, message: 'Notification settings saved successfully', severity: 'success' })
    } catch (error) {
      console.error('Error saving notification settings:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save notification settings',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Notification Settings'
        subheader='Configure email notifications for recurring invoices'
      />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <FormControlLabel
          control={<Switch checked={autoSend} onChange={e => setAutoSend(e.target.checked)} />}
          label={
            <div className='flex flex-col'>
              <Typography className='font-medium'>Auto Send Invoices</Typography>
              <Typography variant='body2' color='text.secondary'>
                Automatically send invoices to tenants when generated
              </Typography>
            </div>
          }
        />

        <FormControlLabel
          control={<Switch checked={sendOnGeneration} onChange={e => setSendOnGeneration(e.target.checked)} />}
          label={
            <div className='flex flex-col'>
              <Typography className='font-medium'>Send on Generation</Typography>
              <Typography variant='body2' color='text.secondary'>
                Send invoice immediately when it&apos;s generated
              </Typography>
            </div>
          }
        />

        <FormControlLabel
          control={<Switch checked={sendReminder} onChange={e => setSendReminder(e.target.checked)} />}
          label={
            <div className='flex flex-col'>
              <Typography className='font-medium'>Send Payment Reminders</Typography>
              <Typography variant='body2' color='text.secondary'>
                Automatically send reminder emails before due date
              </Typography>
            </div>
          }
        />

        {sendReminder && (
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                type='number'
                label='Reminder Days Before Due'
                value={reminderDays}
                onChange={e => setReminderDays(e.target.value)}
                helperText='Number of days before due date to send reminder'
                slotProps={{
                  input: {
                    inputProps: { min: 1, max: 30 }
                  }
                }}
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

export default NotificationSettings

