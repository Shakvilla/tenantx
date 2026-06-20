'use client'

// React Imports
import { useState, useEffect } from 'react'

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
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// API Imports
import { recurringInvoiceSettingsApi } from '@/lib/api/settings'

const DefaultInvoiceSettings = () => {
  // States
  const [defaultStatus, setDefaultStatus] = useState('draft')
  const [defaultInvoiceType, setDefaultInvoiceType] = useState('Rent')
  const [defaultDueDays, setDefaultDueDays] = useState('15')
  const [loading, setLoading] = useState(false)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    recurringInvoiceSettingsApi.get().then(settings => {
      const di = settings.defaultInvoice as any
      if (!di) return
      if (di.defaultStatus) setDefaultStatus(di.defaultStatus)
      if (di.defaultInvoiceType) setDefaultInvoiceType(di.defaultInvoiceType)
      if (di.defaultDueDays !== undefined) setDefaultDueDays(String(di.defaultDueDays))
    }).catch(console.error)
  }, [])

  const handleSave = async () => {
    setLoading(true)

    try {
      await recurringInvoiceSettingsApi.update({
        defaultInvoice: {
          defaultDueDays: parseInt(defaultDueDays, 10),
          defaultNotes: '',
          defaultFooter: '',
          includeLateFee: false,
          lateFeePercentage: 0,
          defaultStatus,
          defaultInvoiceType
        } as any
      })
      setSnackbar({ open: true, message: 'Default invoice settings saved successfully', severity: 'success' })
    } catch (error) {
      console.error('Error saving default invoice settings:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save default invoice settings',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Default Invoice Settings'
        subheader='Configure default values for automatically generated invoices'
      />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth size='small'>
              <InputLabel>Default Status</InputLabel>
              <Select value={defaultStatus} onChange={e => setDefaultStatus(e.target.value)} label='Default Status'>
                <MenuItem value='draft'>Draft</MenuItem>
                <MenuItem value='pending'>Pending</MenuItem>
                <MenuItem value='paid'>Paid</MenuItem>
              </Select>
            </FormControl>
            <Typography variant='caption' color='text.secondary' className='mts-1'>
              Default status for newly generated invoices
            </Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              label='Default Invoice Type'
              value={defaultInvoiceType}
              onChange={e => setDefaultInvoiceType(e.target.value)}
              helperText='Default invoice type for recurring invoices'
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              size='small'
              type='number'
              label='Default Due Days'
              value={defaultDueDays}
              onChange={e => setDefaultDueDays(e.target.value)}
              helperText='Number of days from generation date until due date'
              slotProps={{
                input: {
                  inputProps: { min: 1, max: 90 }
                }
              }}
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

export default DefaultInvoiceSettings
