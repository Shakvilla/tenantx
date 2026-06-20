'use client'

import { useState, useEffect } from 'react'

// MUI
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
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Box from '@mui/material/Box'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'

// API
import { gatewayConfigApi } from '@/lib/api/payments'
import type { GatewayConfigResponse } from '@/types/payment'

type GatewayTab = 'REDDE' | 'PAYSTACK' | 'HUBTEL'

const TABS: { value: GatewayTab; label: string }[] = [
  { value: 'REDDE',    label: 'Redde' },
  { value: 'PAYSTACK', label: 'Paystack' },
  { value: 'HUBTEL',   label: 'Hubtel' }
]

interface GatewayFormState {
  apiKey:    string
  appId:     string
  nickname:  string
  isLive:    boolean
  isDefault: boolean
  showKey:   boolean
}

const defaultForm = (): GatewayFormState => ({
  apiKey: '', appId: '', nickname: '', isLive: false, isDefault: false, showKey: false
})

const PaymentGatewaySettings = () => {
  const [activeTab, setActiveTab] = useState<GatewayTab>('REDDE')
  const [configs, setConfigs]     = useState<Record<GatewayTab, GatewayConfigResponse | null>>({
    REDDE: null, PAYSTACK: null, HUBTEL: null
  })
  const [forms, setForms]         = useState<Record<GatewayTab, GatewayFormState>>({
    REDDE: defaultForm(), PAYSTACK: defaultForm(), HUBTEL: defaultForm()
  })
  const [loadingInit, setLoadingInit] = useState(true)
  const [saving, setSaving]           = useState(false)
  const [snackbar, setSnackbar]       = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  })

  const webhookUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1'}/payments/webhook/REDDE`

  useEffect(() => {
    gatewayConfigApi.list()
      .then(list => {
        const updatedCfg  = { REDDE: null, PAYSTACK: null, HUBTEL: null } as Record<GatewayTab, GatewayConfigResponse | null>
        const updatedForms = { REDDE: defaultForm(), PAYSTACK: defaultForm(), HUBTEL: defaultForm() }
        list.forEach(c => {
          const key = c.gatewayName as GatewayTab
          if (key in updatedCfg) {
            updatedCfg[key]  = c
            updatedForms[key] = { apiKey: '', appId: c.appId, nickname: c.nickname, isLive: c.isLive, isDefault: c.isDefault, showKey: false }
          }
        })
        setConfigs(updatedCfg)
        setForms(updatedForms)
      })
      .catch(console.error)
      .finally(() => setLoadingInit(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateForm = (tab: GatewayTab, patch: Partial<GatewayFormState>) =>
    setForms(prev => ({ ...prev, [tab]: { ...prev[tab], ...patch } }))

  const handleSave = async (tab: GatewayTab) => {
    const f   = forms[tab]
    const cfg = configs[tab]

    if (!f.appId || !f.nickname) {
      setSnackbar({ open: true, message: 'App ID and Nickname are required', severity: 'error' })
      return
    }
    if (!f.apiKey && !cfg) {
      setSnackbar({ open: true, message: 'API Key is required for a new gateway', severity: 'error' })
      return
    }

    setSaving(true)
    try {
      const saved = await gatewayConfigApi.save({
        gatewayName: tab,
        apiKey:      f.apiKey || '__unchanged__',
        appId:       f.appId,
        nickname:    f.nickname,
        isLive:      f.isLive,
        isDefault:   f.isDefault
      })
      setConfigs(prev => ({ ...prev, [tab]: saved }))
      updateForm(tab, { apiKey: '', showKey: false })
      setSnackbar({ open: true, message: `${tab} gateway saved successfully`, severity: 'success' })
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save gateway settings',
        severity: 'error'
      })
    } finally {
      setSaving(false)
    }
  }

  const renderTab = (tab: GatewayTab) => {
    const f   = forms[tab]
    const cfg = configs[tab]

    const descriptions: Record<GatewayTab, string> = {
      REDDE:    'Accept MTN MoMo, AirtelTigo Money and Telecel Cash via Redde (by Wigal).',
      PAYSTACK: 'Accept card, bank transfer and MoMo payments via Paystack.',
      HUBTEL:   'Accept MoMo and card payments via Hubtel.'
    }
    const appIdLabel: Record<GatewayTab, string> = {
      REDDE: 'App ID (given by Wigal)', PAYSTACK: 'Merchant Code', HUBTEL: 'Client ID'
    }
    const apiKeyLabel: Record<GatewayTab, string> = {
      REDDE: 'API Key', PAYSTACK: 'Secret Key', HUBTEL: 'Client Secret'
    }

    return (
      <Grid container spacing={5}>
        <Grid size={{ xs: 12 }}>
          <div className='flex items-start justify-between gap-4'>
            <Typography variant='body2' color='text.secondary'>{descriptions[tab]}</Typography>
            {cfg && (
              <Chip
                size='small'
                label={cfg.isDefault ? 'Default' : cfg.isActive ? 'Configured' : 'Inactive'}
                color={cfg.isDefault ? 'primary' : cfg.isActive ? 'success' : 'default'}
              />
            )}
          </div>
        </Grid>

        {/* API Key */}
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth size='small'
            label={cfg ? `${apiKeyLabel[tab]} (leave blank to keep existing)` : apiKeyLabel[tab]}
            type={f.showKey ? 'text' : 'password'}
            value={f.apiKey}
            onChange={e => updateForm(tab, { apiKey: e.target.value })}
            placeholder={cfg ? `Current: ${cfg.apiKeyMasked}` : 'Enter API key'}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton size='small' onClick={() => updateForm(tab, { showKey: !f.showKey })}>
                      <i className={f.showKey ? 'ri-eye-off-line' : 'ri-eye-line'} />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />
        </Grid>

        {/* App ID */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size='small' required
            label={appIdLabel[tab]}
            value={f.appId}
            onChange={e => updateForm(tab, { appId: e.target.value })}
          />
        </Grid>

        {/* Nickname */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField fullWidth size='small' required
            label='Merchant Nickname'
            value={f.nickname}
            onChange={e => updateForm(tab, { nickname: e.target.value })}
            helperText='Displayed on the customer MoMo prompt'
          />
        </Grid>

        {/* Mode */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size='small'>
            <InputLabel>Mode</InputLabel>
            <Select
              label='Mode'
              value={f.isLive ? 'live' : 'test'}
              onChange={e => updateForm(tab, { isLive: e.target.value === 'live' })}
            >
              <MenuItem value='test'>Test / Sandbox</MenuItem>
              <MenuItem value='live'>Live (Production)</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Default toggle */}
        <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControlLabel
            control={<Switch checked={f.isDefault} onChange={e => updateForm(tab, { isDefault: e.target.checked })} />}
            label={
              <div>
                <Typography variant='body2' className='font-medium'>Set as default gateway</Typography>
                <Typography variant='caption' color='text.secondary'>Used when no gateway is specified at payment time</Typography>
              </div>
            }
          />
        </Grid>

        {/* Webhook URL (Redde only) */}
        {tab === 'REDDE' && (
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth size='small'
              label='Webhook / Callback URL — configure in your Redde dashboard'
              value={webhookUrl}
              slotProps={{ input: { readOnly: true } }}
              helperText='Log in to app.reddeonline.com → Apps → Modify → set this as your Receive Callback URL'
            />
          </Grid>
        )}

        <Grid size={{ xs: 12 }}>
          <div className='flex justify-end'>
            <Button
              variant='contained'
              color='primary'
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color='inherit' /> : undefined}
              onClick={() => handleSave(tab)}
            >
              {saving ? 'Saving…' : 'Save Settings'}
            </Button>
          </div>
        </Grid>
      </Grid>
    )
  }

  if (loadingInit) {
    return (
      <Card>
        <CardContent className='flex justify-center py-10'>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader
          title='Payment Gateway Settings'
          subheader='Connect a payment gateway to accept Mobile Money (MoMo), card, and bank payments from tenants.'
        />
        <Divider />
        <CardContent className='flex flex-col gap-6'>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              {TABS.map(t => (
                <Tab
                  key={t.value}
                  value={t.value}
                  label={
                    <span className='flex items-center gap-1'>
                      {t.label}
                      {configs[t.value] && (
                        <i className='ri-check-line' style={{ color: '#4CAF50', fontSize: 14 }} />
                      )}
                    </span>
                  }
                />
              ))}
            </Tabs>
          </Box>

          {TABS.map(t => activeTab === t.value && (
            <div key={t.value}>{renderTab(t.value)}</div>
          ))}
        </CardContent>
      </Card>

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

export default PaymentGatewaySettings
