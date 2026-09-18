'use client'

import { useCallback, useEffect, useState } from 'react'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

import {
  listProviders,
  getStorageSettings,
  updateStorageSettings,
  testProviderConnection,
  type ProviderConfigField,
  type ProviderInfo,
  type TestResult
} from '@/lib/api/platform-storage'

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

interface SnackbarState {
  open: boolean
  message: string
  severity: 'success' | 'error'
}

function getErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: string } } } | null)?.response?.data

  return data?.message || fallback
}

const defaultConfig = (fields: ProviderConfigField[]): Record<string, string> => {
  const values: Record<string, string> = {}

  fields.forEach(field => {
    values[field.key] = field.defaultValue ?? ''
  })

  return values
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StorageSettings() {
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [configs, setConfigs] = useState<Record<string, Record<string, string>>>({})
  const [activeProvider, setActiveProvider] = useState('')
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' })

  const currentProvider = providers.find(p => p.id === activeProvider) ?? null
  const currentConfig = (currentProvider && configs[currentProvider.id]) || {}

  // ── Load ────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setLoadFailed(false)

    try {
      const [provs, settings] = await Promise.all([listProviders(), getStorageSettings()])
      const seeded: Record<string, Record<string, string>> = {}

      provs.forEach(provider => {
        seeded[provider.id] = defaultConfig(provider.configFields)
      })
      setProviders(provs)
      setConfigs(seeded)
      setActiveProvider(provs.some(p => p.id === settings.activeProvider) ? settings.activeProvider : '')
    } catch {
      setLoadFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Handlers ────────────────────────────────────────────────────────────

  const handleSelectProvider = (providerId: string) => {
    if (providerId === activeProvider) return
    setActiveProvider(providerId)
    setTestResult(null)
    setRevealedKeys({})
    setConfigs(prev =>
      prev[providerId]
        ? prev
        : { ...prev, [providerId]: defaultConfig(providers.find(p => p.id === providerId)?.configFields ?? []) }
    )
  }

  const handleFieldChange = (field: ProviderConfigField, value: string) => {
    if (!currentProvider) return
    setConfigs(prev => ({
      ...prev,
      [currentProvider.id]: { ...(prev[currentProvider.id] || {}), [field.key]: value }
    }))
  }

  const toggleReveal = (fieldKey: string) => setRevealedKeys(prev => ({ ...prev, [fieldKey]: !prev[fieldKey] }))

  const handleTestConnection = async () => {
    if (!activeProvider) return
    setTestResult(null)
    setTesting(true)

    try {
      const result = await testProviderConnection(activeProvider)

      setTestResult(result)
    } catch (error) {
      setTestResult({
        success: false,
        message: getErrorMessage(error, 'Connection test failed. Check the saved credentials and try again.')
      })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!activeProvider || !currentProvider) return
    setSaving(true)

    try {
      await updateStorageSettings(activeProvider, currentConfig)
      setTestResult(null)
      setSnackbar({
        open: true,
        message: `${currentProvider.displayName} settings saved`,
        severity: 'success'
      })

      // Refresh so the "Configured" status chips stay accurate
      try {
        setProviders(await listProviders())
      } catch {
        // Non-critical — keep current provider list
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: getErrorMessage(error, 'Failed to save storage settings'),
        severity: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  // ── Field renderers ─────────────────────────────────────────────────────

  const renderConfigField = (field: ProviderConfigField) => {
    const value = currentConfig[field.key] ?? field.defaultValue ?? ''

    if (field.type === 'select') {
      return (
        <Grid key={field.key} size={12}>
          <TextField
            select
            fullWidth
            size='small'
            required={field.required}
            label={field.label}
            value={value}
            onChange={e => handleFieldChange(field, e.target.value)}
          >
            {field.options?.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
      )
    }

    const isPassword = field.type === 'password'
    const isRevealed = !!revealedKeys[field.key]

    return (
      <Grid key={field.key} size={12}>
        <TextField
          fullWidth
          size='small'
          required={field.required}
          label={field.label}
          placeholder={field.placeholder || ''}
          value={value}
          onChange={e => handleFieldChange(field, e.target.value)}
          slotProps={{
            htmlInput: isPassword ? { autoComplete: 'new-password' } : undefined,
            input: isPassword
              ? {
                  endAdornment: (
                    <InputAdornment position='end'>
                      <IconButton
                        size='small'
                        edge='end'
                        aria-label={isRevealed ? 'Hide secret' : 'Show secret'}
                        onClick={() => toggleReveal(field.key)}
                      >
                        <i className={isRevealed ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </IconButton>
                    </InputAdornment>
                  )
                }
              : undefined
          }}
        />
      </Grid>
    )
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      <Typography variant='h4' fontWeight={700} sx={{ mb: 0.5 }}>
        Storage Provider
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 4, maxWidth: 640 }}>
        Configure document storage backend for all tenants
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : loadFailed ? (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ py: 6, textAlign: 'center' }}>
            <i
              className='ri-error-warning-fill'
              style={{ fontSize: '2.5rem', color: 'var(--mui-palette-error-main)' }}
            />
            <Typography variant='h6' sx={{ mt: 2 }}>
              Couldn&apos;t load storage settings
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5, mb: 3 }}>
              Check your connection and try again.
            </Typography>
            <Button variant='outlined' startIcon={<i className='ri-refresh-line' />} onClick={loadData}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : providers.length === 0 ? (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Alert severity='info'>No storage providers are available on this platform yet.</Alert>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Provider selection ─────────────────────────────────────────── */}
          <Card sx={{ mb: 3 }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant='h6'>Select Storage Provider</Typography>
                </Box>
              }
              subheader='Documents for every tenant are stored by the provider you choose. Select one to edit its configuration.'
            />
            <Divider />
            <CardContent>
              <Grid container spacing={2}>
                {providers.map(provider => {
                  const selected = provider.id === activeProvider

                  return (
                    <Grid key={provider.id} size={{ xs: 12, sm: 6, md: 6 }}>
                      <Box
                        role='radio'
                        aria-checked={selected}
                        tabIndex={0}
                        onClick={() => handleSelectProvider(provider.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            handleSelectProvider(provider.id)
                          }
                        }}
                        sx={{
                          cursor: 'pointer',
                          userSelect: 'none',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                          p: 2.5,
                          borderRadius: 2.5,
                          border: '1px solid',
                          borderColor: selected ? 'primary.main' : 'divider',
                          bgcolor: selected ? 'primary.lighter' : 'background.paper',
                          transition: 'border-color 0.2s ease, background-color 0.2s ease',
                          '&:hover': {
                            borderColor: selected ? 'primary.main' : 'primary.light',
                            bgcolor: selected ? 'primary.lighter' : 'action.hover'
                          },
                          '&:focus-visible': {
                            outline: '2px solid',
                            outlineColor: 'primary.main',
                            outlineOffset: 2
                          }
                        }}
                      >
                        {/* Provider icon */}
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 2,
                            bgcolor: selected ? 'primary.main' : 'primary.lighter',
                            color: selected ? 'primary.contrastText' : 'primary.main',
                            transition: 'background-color 0.2s ease, color 0.2s ease'
                          }}
                        >
                          <i className='ri-database-2-line' style={{ fontSize: '1.25rem' }} />
                        </Box>

                        {/* Name + status */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant='subtitle1' fontWeight={600} noWrap sx={{ lineHeight: 1.3 }}>
                            {provider.displayName}
                          </Typography>
                          <Chip
                            size='small'
                            label={provider.configured ? 'Configured' : 'Not configured'}
                            color={provider.configured ? 'success' : 'default'}
                            sx={{
                              mt: 1,
                              height: 22,
                              '& .MuiChip-label': { px: 1.25, fontWeight: 500, fontSize: '0.7rem' }
                            }}
                          />
                        </Box>

                        {/* Selection indicator */}
                        <Box
                          aria-hidden
                          sx={{
                            mt: 0.25,
                            width: 22,
                            height: 22,
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            border: '2px solid',
                            borderColor: selected ? 'primary.main' : 'divider',
                            bgcolor: selected ? 'primary.main' : 'transparent',
                            color: 'primary.contrastText',
                            transition: 'background-color 0.2s ease, border-color 0.2s ease'
                          }}
                        >
                          {selected && <i className='ri-check-line' style={{ fontSize: '0.7rem' }} />}
                        </Box>
                      </Box>
                    </Grid>
                  )
                })}
              </Grid>
            </CardContent>
          </Card>

          {/* ── Configuration ───────────────────────────────────────────────── */}
          {currentProvider && (
            <Card sx={{ mb: 3 }}>
              <CardHeader
                title={<Typography variant='h6'>{currentProvider.displayName} Configuration</Typography>}
                subheader='Credentials are stored securely and used platform-wide for tenant document operations.'
              />
              <Divider />
              <CardContent>
                {currentProvider.configFields.length > 0 ? (
                  <Grid container spacing={3}>
                    {currentProvider.configFields.map(renderConfigField)}
                  </Grid>
                ) : (
                  <Alert severity='info' icon={<i className='ri-information-line' />}>
                    This provider requires no additional configuration. Save to activate it for all tenants.
                  </Alert>
                )}

                {/* Test result */}
                {testResult && (
                  <Alert severity={testResult.success ? 'success' : 'error'} sx={{ mt: 3 }}>
                    {testResult.message}
                  </Alert>
                )}

                {/* Actions */}
                <Box
                  sx={{
                    mt: testResult ? 2 : 4,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 1.5
                  }}
                >
                  <Button
                    variant='outlined'
                    onClick={handleTestConnection}
                    disabled={testing || saving}
                    startIcon={
                      testing ? (
                        <CircularProgress size={16} color='inherit' />
                      ) : (
                        <i className='ri-database-2-line' style={{ fontSize: '1.05rem' }} />
                      )
                    }
                  >
                    {testing ? 'Testing…' : 'Test Connection'}
                  </Button>
                  <Button
                    variant='contained'
                    onClick={handleSave}
                    disabled={saving || testing}
                    startIcon={
                      saving ? (
                        <CircularProgress size={16} color='inherit' />
                      ) : (
                        <i className='ri-save-line' style={{ fontSize: '1.05rem' }} />
                      )
                    }
                  >
                    {saving ? 'Saving…' : 'Save Settings'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}
