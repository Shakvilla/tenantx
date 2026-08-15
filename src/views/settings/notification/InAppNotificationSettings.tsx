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
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// API Imports
import { notificationSettingsApi } from '@/lib/api/settings'

/**
 * Master toggle for in-app (bell) notifications. When off, the landlord-facing business-event
 * notifications (payment received, occupant added, rent review sent, agreement expiring) stop
 * appearing in the bell — the backend gates them on this `inAppEnabled` flag.
 */
const InAppNotificationSettings = () => {
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    notificationSettingsApi
      .get()
      .then(settings => {
        // Default to enabled when the flag is unset.
        setEnabled(settings.inAppEnabled !== false)
      })
      .catch(console.error)
  }, [])

  const handleSave = async () => {
    setLoading(true)
    try {
      await notificationSettingsApi.update({ inAppEnabled: enabled })
      setSnackbar({ open: true, message: 'In-app notification settings saved', severity: 'success' })
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save settings',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title='In-App Notifications' subheader='Alerts that appear in the notification bell' />
      <Divider />
      <CardContent className='flex flex-col gap-4'>
        <FormControlLabel
          control={<Switch checked={enabled} onChange={e => setEnabled(e.target.checked)} />}
          label={
            <div className='flex flex-col'>
              <Typography className='font-medium'>Enable in-app notifications</Typography>
              <Typography variant='body2' color='text.secondary'>
                Get bell alerts for payments received, new occupants, rent reviews, and agreements nearing expiry.
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

export default InAppNotificationSettings
