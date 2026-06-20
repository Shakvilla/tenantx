'use client'

// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// API Imports
import { recurringInvoiceSettingsApi } from '@/lib/api/settings'

const FrequencySettings = () => {
  // States
  const [frequency, setFrequency] = useState('monthly')
  const [loading, setLoading] = useState(false)

  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  })

  useEffect(() => {
    recurringInvoiceSettingsApi.get().then(settings => {
      const f = settings.frequency
      if (!f?.defaultFrequency) return
      setFrequency(f.defaultFrequency)
    }).catch(console.error)
  }, [])

  const handleSave = async () => {
    setLoading(true)

    try {
      await recurringInvoiceSettingsApi.update({
        frequency: { defaultFrequency: frequency as any, allowCustom: false }
      })
      setSnackbar({ open: true, message: 'Frequency settings saved successfully', severity: 'success' })
    } catch (error) {
      console.error('Error saving frequency settings:', error)
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save frequency settings',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader
        title='Recurring Frequency'
        subheader='Set the default frequency for recurring invoices'
      />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <FormControl>
          <FormLabel>Default Recurring Frequency</FormLabel>
          <RadioGroup value={frequency} onChange={e => setFrequency(e.target.value)}>
            <FormControlLabel value='weekly' control={<Radio />} label='Weekly' />
            <FormControlLabel value='bi-weekly' control={<Radio />} label='Bi-Weekly' />
            <FormControlLabel value='monthly' control={<Radio />} label='Monthly' />
            <FormControlLabel value='quarterly' control={<Radio />} label='Quarterly' />
            <FormControlLabel value='semi-annually' control={<Radio />} label='Semi-Annually' />
            <FormControlLabel value='annually' control={<Radio />} label='Annually' />
          </RadioGroup>
        </FormControl>

        <Typography variant='body2' color='text.secondary'>
          This frequency will be used as the default when creating new recurring invoices. You can override this for
          individual invoices.
        </Typography>

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

export default FrequencySettings
