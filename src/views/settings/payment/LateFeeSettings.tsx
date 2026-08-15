'use client'

import { useState, useEffect } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid2'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Snackbar from '@mui/material/Snackbar'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import { lateFeeSettingsApi, type LateFeeSettings as LateFeeSettingsType } from '@/lib/api/settings'

const DEFAULT: LateFeeSettingsType = {
  enabled: false,
  feeType: 'percentage',
  feeValue: 5,
  feeFrequency: 'weekly',
  gracePeriodDays: 7,
  maxFeeAmount: null
}

const LateFeeSettings = () => {
  const [settings, setSettings] = useState<LateFeeSettingsType>(DEFAULT)
  const [loading, setLoading]   = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  })

  useEffect(() => {
    lateFeeSettingsApi.get()
      .then(s => setSettings({ ...DEFAULT, ...s }))
      .catch(() => { /* use defaults on any error; auth errors are handled by the interceptor */ })
  }, [])

  const set = <K extends keyof LateFeeSettingsType>(key: K, value: LateFeeSettingsType[K]) =>
    setSettings(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    setLoading(true)
    try {
      await lateFeeSettingsApi.update(settings)
      setSnackbar({ open: true, message: 'Late fee settings saved', severity: 'success' })
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to save settings',
        severity: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const feeLabel = settings.feeType === 'percentage' ? '%' : 'GHS'

  return (
    <Card>
      <CardHeader
        title='Late Payment Fee Automation'
        subheader='Automatically charge overdue invoices a late fee on a recurring schedule'
        action={
          settings.enabled
            ? <Chip label='Active' color='success' size='small' variant='tonal' />
            : <Chip label='Inactive' color='default' size='small' variant='tonal' />
        }
      />
      <Divider />
      <CardContent className='flex flex-col gap-6'>

        {/* Enable toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={settings.enabled}
              onChange={e => set('enabled', e.target.checked)}
            />
          }
          label={
            <div className='flex flex-col'>
              <Typography className='font-medium'>Enable Late Fee Automation</Typography>
              <Typography variant='body2' color='text.secondary'>
                Automatically apply late fees to overdue invoices daily at 07:00
              </Typography>
            </div>
          }
        />

        {settings.enabled && (
          <>
            <Divider />
            <Grid container spacing={5}>

              {/* Fee Type */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='fee-type-label'>Fee Type</InputLabel>
                  <Select
                    labelId='fee-type-label'
                    label='Fee Type'
                    value={settings.feeType}
                    onChange={e => set('feeType', e.target.value as LateFeeSettingsType['feeType'])}
                  >
                    <MenuItem value='percentage'>Percentage of outstanding balance</MenuItem>
                    <MenuItem value='fixed'>Fixed amount</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Fee Value */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size='small'
                  type='number'
                  label={settings.feeType === 'percentage' ? 'Fee Rate (%)' : 'Fee Amount'}
                  value={settings.feeValue}
                  onChange={e => set('feeValue', Number(e.target.value))}
                  helperText={
                    settings.feeType === 'percentage'
                      ? 'e.g. 5 means 5% of the outstanding balance'
                      : 'Fixed fee charged in the invoice currency'
                  }
                  slotProps={{
                    input: {
                      endAdornment: <InputAdornment position='end'>{feeLabel}</InputAdornment>,
                      inputProps: { min: 0.01, step: 0.01 }
                    }
                  }}
                />
              </Grid>

              {/* Frequency */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth size='small'>
                  <InputLabel id='freq-label'>Charge Frequency</InputLabel>
                  <Select
                    labelId='freq-label'
                    label='Charge Frequency'
                    value={settings.feeFrequency}
                    onChange={e => set('feeFrequency', e.target.value as LateFeeSettingsType['feeFrequency'])}
                  >
                    <MenuItem value='one_time'>One-time (charge once per invoice)</MenuItem>
                    <MenuItem value='weekly'>Weekly (charge every 7 days)</MenuItem>
                    <MenuItem value='daily'>Daily (charge every day overdue)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Grace Period */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size='small'
                  type='number'
                  label='Grace Period (days)'
                  value={settings.gracePeriodDays}
                  onChange={e => set('gracePeriodDays', Number(e.target.value))}
                  helperText='Days after due date before the first fee is charged (0 = charge immediately)'
                  slotProps={{ input: { inputProps: { min: 0, step: 1 } } }}
                />
              </Grid>

              {/* Max Cap */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size='small'
                  type='number'
                  label='Maximum Fee Cap (optional)'
                  value={settings.maxFeeAmount ?? ''}
                  onChange={e => {
                    const v = e.target.value
                    set('maxFeeAmount', v === '' ? null : Number(v))
                  }}
                  helperText='Total late fee cap per invoice. Leave blank for no cap.'
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position='start'>GHS</InputAdornment>,
                      inputProps: { min: 0.01, step: 0.01 }
                    }
                  }}
                />
              </Grid>
            </Grid>

            {/* Summary chip */}
            <Box>
              <Alert severity='info' variant='outlined' icon={<i className='ri-time-line' />}>
                <Typography variant='body2'>
                  <strong>Summary:</strong> A{' '}
                  {settings.feeType === 'percentage'
                    ? `${settings.feeValue}% fee`
                    : `GHS ${settings.feeValue} fee`}{' '}
                  will be charged{' '}
                  {settings.feeFrequency === 'one_time'
                    ? 'once'
                    : settings.feeFrequency === 'weekly'
                    ? 'every week'
                    : 'every day'}{' '}
                  on each overdue invoice, starting{' '}
                  {settings.gracePeriodDays === 0
                    ? 'immediately after the due date'
                    : `${settings.gracePeriodDays} day(s) after the due date`}
                  {settings.maxFeeAmount ? `, capped at GHS ${settings.maxFeeAmount} total` : ''}.
                </Typography>
              </Alert>
            </Box>
          </>
        )}

        <div className='flex justify-end'>
          <Button
            variant='contained'
            color='primary'
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  )
}

export default LateFeeSettings
