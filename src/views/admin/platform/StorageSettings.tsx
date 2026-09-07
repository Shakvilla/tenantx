'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Alert,
  CircularProgress,
  Box,
  Divider,
  MenuItem,
} from '@mui/material'
import {
  listProviders,
  getStorageSettings,
  updateStorageSettings,
  testProviderConnection,
  type ProviderInfo,
  type ProviderConfigField,
} from '../../../lib/api/platform-storage'

export default function StorageSettings() {
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [activeProvider, setActiveProvider] = useState('')
  const [config, setConfig] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    try {
      const [provs, settings] = await Promise.all([listProviders(), getStorageSettings()])
      setProviders(provs)
      setActiveProvider(settings.activeProvider)

      // Load config for active provider
      const activeProv = provs.find(p => p.id === settings.activeProvider)
      if (activeProv) {
        const defaults: Record<string, string> = {}
        activeProv.configFields.forEach(f => {
          defaults[f.key] = f.defaultValue || ''
        })
        setConfig(defaults)
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to load settings' })
    } finally {
      setLoading(false)
    }
  }

  const handleProviderChange = (providerId: string) => {
    setActiveProvider(providerId)
    setConfig({})
    setTestResult(null)
  }

  const handleTest = async () => {
    setTestResult(null)
    try {
      const result = await testProviderConnection(activeProvider)
      setTestResult({ ok: result.success, msg: result.message })
    } catch (e) {
      setTestResult({ ok: false, msg: 'Test failed' })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateStorageSettings(activeProvider, config)
      setMessage({ type: 'success', text: 'Settings saved' })
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to save' })
    } finally {
      setSaving(false)
    }
  }

  const renderConfigField = (field: ProviderConfigField) => {
    if (field.type === 'select') {
      return (
        <TextField
          key={field.key}
          fullWidth
          select
          label={field.label}
          value={config[field.key] || field.defaultValue || ''}
          onChange={e => setConfig({ ...config, [field.key]: e.target.value })}
          required={field.required}
          sx={{ mb: 2 }}
        >
          {field.options?.map(opt => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </TextField>
      )
    }

    return (
      <TextField
        key={field.key}
        fullWidth
        type={field.type}
        label={field.label}
        value={config[field.key] || ''}
        onChange={e => setConfig({ ...config, [field.key]: e.target.value })}
        placeholder={field.placeholder || ''}
        required={field.required}
        sx={{ mb: 2 }}
      />
    )
  }

  if (loading) return <CircularProgress />

  const currentProvider = providers.find(p => p.id === activeProvider)

  return (
    <Card>
      <CardContent>
        <Typography variant='h6' gutterBottom>
          Document Storage Provider
        </Typography>

        <FormControl component='fieldset' sx={{ mb: 3 }}>
          <RadioGroup value={activeProvider} onChange={e => handleProviderChange(e.target.value)}>
            {providers.map(p => (
              <FormControlLabel
                key={p.id}
                value={p.id}
                control={<Radio />}
                label={
                  <Box component='span' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {p.displayName}
                    {p.configured ? (
                      <i
                        className='ri-checkbox-circle-fill'
                        style={{ color: 'var(--mui-palette-success-main)', fontSize: '1rem' }}
                      />
                    ) : (
                      <i
                        className='ri-error-warning-fill'
                        style={{ color: 'var(--mui-palette-text-disabled)', fontSize: '1rem' }}
                      />
                    )}
                  </Box>
                }
              />
            ))}
          </RadioGroup>
        </FormControl>

        {currentProvider && (
          <Box sx={{ mb: 3 }}>
            <Typography variant='subtitle1' gutterBottom>
              {currentProvider.displayName} Configuration
            </Typography>
            {currentProvider.configFields.map(renderConfigField)}
            <Button variant='outlined' onClick={handleTest} sx={{ mt: 1 }}>
              Test Connection
            </Button>
            {testResult && (
              <Alert severity={testResult.ok ? 'success' : 'error'} sx={{ mt: 2 }}>
                {testResult.msg}
              </Alert>
            )}
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        {message && (
          <Alert severity={message.type} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}

        <Button
          variant='contained'
          startIcon={<i className='ri-save-line' />}
          onClick={handleSave}
          disabled={saving}
        >
          Save Settings
        </Button>
      </CardContent>
    </Card>
  )
}
