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

// Type Imports
import Snackbar from '@mui/material/Snackbar'

import Alert from '@mui/material/Alert'

import type { EncryptionType } from '@/types/settings/notificationTypes'

// Utils Imports
import { notificationSettingsApi } from '@/utils/settings/api'

// MUI Imports

const SMTPConfiguration = () => {
  // States
  const [smtpEnabled, setSmtpEnabled] = useState(true)
  const [host, setHost] = useState('smtp.gmail.com')
  const [port, setPort] = useState(587)
  const [encryption, setEncryption] = useState<EncryptionType>('tls')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fromEmail, setFromEmail] = useState('')
  const [fromName, setFromName] = useState('')
  const [loading, setLoading] = useState(false)
  const [testingEmail, setTestingEmail] = useState(false)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  const handleTestEmail = async () => {
    if (!fromEmail) {
      setSnackbar({ open: true, message: 'Please enter a from email address', severity: 'error' })
      
return
    }

    setTestingEmail(true)

    try {
      await notificationSettingsApi.testEmail(fromEmail)
      setSnackbar({ open: true, message: 'Test email sent successfully', severity: 'success' })
    } catch (error) {
      console.error('Error sending test email:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to send test email',
        severity: 'error'
      })
    } finally {
      setTestingEmail(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      const smtpConfig = {
        host,
        port,
        encryption,
        username,
        password,
        fromEmail,
        fromName,
        enabled: smtpEnabled
      }

      await notificationSettingsApi.update({ smtp: smtpConfig })
      setSnackbar({ open: true, message: 'SMTP configuration saved successfully', severity: 'success' })
    } catch (error) {
      console.error('Error saving SMTP configuration:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save SMTP configuration',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader title='SMTP Configuration' subheader='Configure SMTP server settings for sending emails' />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <FormControlLabel
          control={<Switch checked={smtpEnabled} onChange={e => setSmtpEnabled(e.target.checked)} />}
          label={
            <div className='flex flex-col'>
              <Typography className='font-medium'>Enable SMTP</Typography>
              <Typography variant='body2' color='text.secondary'>
                Activate SMTP server for sending emails
              </Typography>
            </div>
          }
        />

        {smtpEnabled && (
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                label='SMTP Host'
                value={host}
                onChange={e => setHost(e.target.value)}
                helperText='SMTP server hostname (e.g., smtp.gmail.com)'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                type='number'
                label='SMTP Port'
                value={port}
                onChange={e => setPort(Number(e.target.value))}
                helperText='SMTP server port (587 for TLS, 465 for SSL, 25 for None)'
                slotProps={{
                  input: {
                    inputProps: { min: 1, max: 65535 }
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Encryption</InputLabel>
                <Select
                  value={encryption}
                  onChange={e => setEncryption(e.target.value as EncryptionType)}
                  label='Encryption'
                >
                  <MenuItem value='none'>None</MenuItem>
                  <MenuItem value='tls'>TLS</MenuItem>
                  <MenuItem value='ssl'>SSL</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                label='Username'
                value={username}
                onChange={e => setUsername(e.target.value)}
                helperText='SMTP authentication username (usually your email)'
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                size='small'
                label='Password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                type='password'
                helperText='SMTP authentication password or app-specific password'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                label='From Email'
                value={fromEmail}
                onChange={e => setFromEmail(e.target.value)}
                type='email'
                helperText='Default sender email address'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                label='From Name'
                value={fromName}
                onChange={e => setFromName(e.target.value)}
                helperText='Display name for sender'
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                variant='outlined'
                color='secondary'
                onClick={handleTestEmail}
                disabled={testingEmail || !smtpEnabled}
              >
                {testingEmail ? 'Sending...' : 'Send Test Email'}
              </Button>
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

export default SMTPConfiguration
