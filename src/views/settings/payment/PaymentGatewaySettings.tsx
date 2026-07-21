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

// ─── Types ───────────────────────────────────────────────────────────────────

type GatewayTab = 'REDDE' | 'PAYSTACK' | 'HUBTEL'
type ReddePurpose = 'RENT' | 'SUBSCRIPTION'

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
  baseUrl:   string
}

const DEFAULT_REDDE_URL = 'https://api.reddeonline.com'

const defaultForm = (): GatewayFormState => ({
  apiKey: '', appId: '', nickname: '', isLive: false, isDefault: false, showKey: false,
  baseUrl: DEFAULT_REDDE_URL
})

// ─── Component ───────────────────────────────────────────────────────────────

const PaymentGatewaySettings = () => {
  const [activeTab, setActiveTab] = useState<GatewayTab>('REDDE')

  // Redde has two separate apps — one per purpose
  const [reddeConfigs, setReddeConfigs] = useState<Record<ReddePurpose, GatewayConfigResponse | null>>({
    RENT: null, SUBSCRIPTION: null
  })
  const [reddeForms, setReddeForms] = useState<Record<ReddePurpose, GatewayFormState>>({
    RENT: defaultForm(), SUBSCRIPTION: defaultForm()
  })

  // Other gateways (single config each)
  const [configs, setConfigs]   = useState<Record<'PAYSTACK' | 'HUBTEL', GatewayConfigResponse | null>>({
    PAYSTACK: null, HUBTEL: null
  })
  const [forms, setForms]       = useState<Record<'PAYSTACK' | 'HUBTEL', GatewayFormState>>({
    PAYSTACK: defaultForm(), HUBTEL: defaultForm()
  })

  const [loadingInit, setLoadingInit] = useState(true)
  const [saving, setSaving]           = useState<string | null>(null) // e.g. 'REDDE_RENT', 'PAYSTACK'
  const [snackbar, setSnackbar]       = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success'
  })

  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1')
    .replace(/\/api\/v1$/, '') // strip /api/v1 to get just the host for webhook URLs

  // Webhook URLs — must be registered in the Redde merchant portal for each app
  const webhookUrls = {
    RENT_RECEIVE:           `${baseUrl}/api/v1/payments/webhook/redde/rent`,
    RENT_CASHOUT:           `${baseUrl}/api/v1/payments/webhook/redde/cashout`,
    SUBSCRIPTION_RECEIVE:   `${baseUrl}/api/v1/payments/webhook/redde/subscription`,
  }

  // ── Load existing configs ──────────────────────────────────────────────────

  useEffect(() => {
    gatewayConfigApi.list()
      .then(list => {
        const updCfg  = { PAYSTACK: null, HUBTEL: null } as Record<'PAYSTACK' | 'HUBTEL', GatewayConfigResponse | null>
        const updForm = { PAYSTACK: defaultForm(), HUBTEL: defaultForm() }
        const updRedde  = { RENT: null, SUBSCRIPTION: null } as Record<ReddePurpose, GatewayConfigResponse | null>
        const updReddeF = { RENT: defaultForm(), SUBSCRIPTION: defaultForm() }

        list.forEach(c => {
          if (c.gatewayName === 'REDDE') {
            const purpose = (c.purpose ?? 'RENT') as ReddePurpose
            if (purpose === 'RENT' || purpose === 'SUBSCRIPTION') {
              updRedde[purpose]  = c
              updReddeF[purpose] = { apiKey: '', appId: c.appId, nickname: c.nickname, isLive: c.isLive, isDefault: c.isDefault, showKey: false, baseUrl: c.baseUrl ?? DEFAULT_REDDE_URL }
            }
          } else {
            const key = c.gatewayName as 'PAYSTACK' | 'HUBTEL'
            if (key === 'PAYSTACK' || key === 'HUBTEL') {
              updCfg[key]  = c
              updForm[key] = { apiKey: '', appId: c.appId, nickname: c.nickname, isLive: c.isLive, isDefault: c.isDefault, showKey: false, baseUrl: '' }
            }
          }
        })

        setReddeConfigs(updRedde)
        setReddeForms(updReddeF)
        setConfigs(updCfg)
        setForms(updForm)
      })
      .catch(console.error)
      .finally(() => setLoadingInit(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Form updaters ──────────────────────────────────────────────────────────

  const updateReddeForm = (purpose: ReddePurpose, patch: Partial<GatewayFormState>) =>
    setReddeForms(prev => ({ ...prev, [purpose]: { ...prev[purpose], ...patch } }))

  const updateForm = (tab: 'PAYSTACK' | 'HUBTEL', patch: Partial<GatewayFormState>) =>
    setForms(prev => ({ ...prev, [tab]: { ...prev[tab], ...patch } }))

  // ── Save handlers ──────────────────────────────────────────────────────────

  const handleSaveRedde = async (purpose: ReddePurpose) => {
    const f   = reddeForms[purpose]
    const cfg = reddeConfigs[purpose]

    if (!f.appId || !f.nickname) {
      setSnackbar({ open: true, message: 'App ID and Nickname are required', severity: 'error' })
      return
    }
    if (!f.apiKey && !cfg) {
      setSnackbar({ open: true, message: 'API Key is required for a new gateway', severity: 'error' })
      return
    }

    const savingKey = `REDDE_${purpose}`
    setSaving(savingKey)
    try {
      const saved = await gatewayConfigApi.save({
        gatewayName: 'REDDE',
        apiKey:      f.apiKey || '__unchanged__',
        appId:       f.appId,
        nickname:    f.nickname,
        isLive:      f.isLive,
        isDefault:   f.isDefault,
        purpose,
        baseUrl:     f.baseUrl || DEFAULT_REDDE_URL,
      })
      setReddeConfigs(prev => ({ ...prev, [purpose]: saved }))
      updateReddeForm(purpose, { apiKey: '', showKey: false })
      const label = purpose === 'RENT' ? 'Rent & Withdrawals' : 'Subscription Billing'
      setSnackbar({ open: true, message: `Redde ${label} gateway saved`, severity: 'success' })
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save gateway settings',
        severity: 'error'
      })
    } finally {
      setSaving(null)
    }
  }

  const handleSave = async (tab: 'PAYSTACK' | 'HUBTEL') => {
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

    setSaving(tab)
    try {
      const saved = await gatewayConfigApi.save({
        gatewayName: tab,
        apiKey:      f.apiKey || '__unchanged__',
        appId:       f.appId,
        nickname:    f.nickname,
        isLive:      f.isLive,
        isDefault:   f.isDefault,
        purpose:     'RENT',   // non-Redde gateways use RENT purpose
      })
      setConfigs(prev => ({ ...prev, [tab]: saved }))
      updateForm(tab, { apiKey: '', showKey: false })
      setSnackbar({ open: true, message: `${tab} gateway saved`, severity: 'success' })
    } catch (error) {
      setSnackbar({
        open: true,
        message: error instanceof Error ? error.message : 'Failed to save gateway settings',
        severity: 'error'
      })
    } finally {
      setSaving(null)
    }
  }

  // ── Renderers ──────────────────────────────────────────────────────────────

  /** Shared form fields (API Key, App ID, Nickname, Mode, Default) */
  const renderFormFields = (
    f: GatewayFormState,
    cfg: GatewayConfigResponse | null,
    apiKeyLabel: string,
    appIdLabel: string,
    onUpdate: (patch: Partial<GatewayFormState>) => void
  ) => (
    <Grid container spacing={4}>
      {/* API Key */}
      <Grid size={{ xs: 12 }}>
        <TextField
          fullWidth size='small'
          label={cfg ? `${apiKeyLabel} (leave blank to keep existing)` : apiKeyLabel}
          type={f.showKey ? 'text' : 'password'}
          value={f.apiKey}
          onChange={e => onUpdate({ apiKey: e.target.value })}
          placeholder={cfg ? `Current: ${cfg.apiKeyMasked}` : 'Enter API key'}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position='end'>
                  <IconButton size='small' onClick={() => onUpdate({ showKey: !f.showKey })}>
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
          label={appIdLabel}
          value={f.appId}
          onChange={e => onUpdate({ appId: e.target.value })}
        />
      </Grid>

      {/* Nickname */}
      <Grid size={{ xs: 12, sm: 6 }}>
        <TextField fullWidth size='small' required
          label='Merchant Nickname'
          value={f.nickname}
          onChange={e => onUpdate({ nickname: e.target.value })}
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
            onChange={e => onUpdate({ isLive: e.target.value === 'live' })}
          >
            <MenuItem value='test'>Test / Sandbox</MenuItem>
            <MenuItem value='live'>Live (Production)</MenuItem>
          </Select>
        </FormControl>
      </Grid>

      {/* Default toggle */}
      <Grid size={{ xs: 12, sm: 6 }} sx={{ display: 'flex', alignItems: 'center' }}>
        <FormControlLabel
          control={<Switch checked={f.isDefault} onChange={e => onUpdate({ isDefault: e.target.checked })} />}
          label={
            <div>
              <Typography variant='body2' className='font-medium'>Set as default gateway</Typography>
              <Typography variant='caption' color='text.secondary'>Used when no gateway is specified at payment time</Typography>
            </div>
          }
        />
      </Grid>
    </Grid>
  )

  /** Callback URL read-only field */
  const renderWebhookField = (label: string, url: string, helperText: string) => (
    <TextField
      fullWidth size='small'
      label={label}
      value={url}
      slotProps={{ input: { readOnly: true } }}
      helperText={helperText}
      sx={{ mt: 2 }}
    />
  )

  /** Redde tab — two sub-sections */
  const renderReddeTab = () => {
    const reddeSections: { purpose: ReddePurpose; title: string; description: string }[] = [
      {
        purpose: 'RENT',
        title: 'App 1 — Rent & Withdrawals',
        description: 'Collects rent from occupants (receive) and processes landlord withdrawals (cash out). Both Redde callback slots are used by this app.',
      },
      {
        purpose: 'SUBSCRIPTION',
        title: 'App 2 — Subscription Billing',
        description: 'Charges TenantApp subscription fees from landlords. Uses the Receive callback only — no cash out from this app.',
      },
    ]

    return (
      <div className='flex flex-col gap-8'>
        <Typography variant='body2' color='text.secondary'>
          Accept MTN MoMo, AirtelTigo Money and Telecel Cash via Redde (by Wigal).
          Two separate Redde apps are required — one for rent collection, one for subscription billing —
          each with its own App ID, API key, and callback URLs.
        </Typography>

        {reddeSections.map(({ purpose, title, description }) => {
          const f   = reddeForms[purpose]
          const cfg = reddeConfigs[purpose]
          const isSaving = saving === `REDDE_${purpose}`

          return (
            <Box key={purpose}>
              {/* Section header */}
              <div className='flex items-center justify-between mb-3'>
                <div>
                  <Typography variant='subtitle2' className='font-semibold'>{title}</Typography>
                  <Typography variant='caption' color='text.secondary'>{description}</Typography>
                </div>
                {cfg && (
                  <Chip
                    size='small'
                    label={cfg.isActive ? 'Configured' : 'Inactive'}
                    color={cfg.isActive ? 'success' : 'default'}
                  />
                )}
              </div>

              {/* Form fields */}
              {renderFormFields(f, cfg, 'API Key', 'App ID (given by Wigal)', patch => updateReddeForm(purpose, patch))}

              {/* Base API URL — Redde-specific */}
              <Box sx={{ mt: 2 }}>
                <TextField fullWidth size='small'
                  label='Base API URL'
                  value={f.baseUrl}
                  onChange={e => updateReddeForm(purpose, { baseUrl: e.target.value })}
                  placeholder={DEFAULT_REDDE_URL}
                  helperText='Only change if Redde provides a custom endpoint'
                />
              </Box>

              {/* Callback URLs */}
              <Box sx={{ mt: 3 }}>
                <Typography variant='caption' color='text.secondary' sx={{ fontWeight: 600 }}>
                  Callback URLs — register these in app.reddeonline.com → Apps → Modify
                </Typography>

                {purpose === 'RENT' ? (
                  <>
                    {renderWebhookField(
                      'Receive Callback URL',
                      webhookUrls.RENT_RECEIVE,
                      'Triggered when a tenant completes a MoMo rent payment'
                    )}
                    {renderWebhookField(
                      'Cash Out Callback URL',
                      webhookUrls.RENT_CASHOUT,
                      'Triggered when a landlord withdrawal is confirmed'
                    )}
                  </>
                ) : (
                  renderWebhookField(
                    'Receive Callback URL',
                    webhookUrls.SUBSCRIPTION_RECEIVE,
                    'Triggered when a subscription payment is confirmed'
                  )
                )}
              </Box>

              {/* Save button */}
              <div className='flex justify-end mt-4'>
                <Button
                  variant='contained'
                  color='primary'
                  disabled={isSaving}
                  startIcon={isSaving ? <CircularProgress size={16} color='inherit' /> : undefined}
                  onClick={() => handleSaveRedde(purpose)}
                >
                  {isSaving ? 'Saving…' : `Save ${purpose === 'RENT' ? 'Rent & Withdrawals' : 'Subscription'} App`}
                </Button>
              </div>

              {purpose === 'RENT' && <Divider sx={{ mt: 4 }} />}
            </Box>
          )
        })}
      </div>
    )
  }

  /** Other gateways tab */
  const renderTab = (tab: 'PAYSTACK' | 'HUBTEL') => {
    const f   = forms[tab]
    const cfg = configs[tab]
    const isSaving = saving === tab

    const descriptions: Record<'PAYSTACK' | 'HUBTEL', string> = {
      PAYSTACK: 'Accept card, bank transfer and MoMo payments via Paystack.',
      HUBTEL:   'Accept MoMo and card payments via Hubtel.'
    }
    const appIdLabel: Record<'PAYSTACK' | 'HUBTEL', string> = {
      PAYSTACK: 'Merchant Code', HUBTEL: 'Client ID'
    }
    const apiKeyLabel: Record<'PAYSTACK' | 'HUBTEL', string> = {
      PAYSTACK: 'Secret Key', HUBTEL: 'Client Secret'
    }

    return (
      <div className='flex flex-col gap-4'>
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

        {renderFormFields(f, cfg, apiKeyLabel[tab], appIdLabel[tab], patch => updateForm(tab, patch))}

        <div className='flex justify-end'>
          <Button
            variant='contained'
            color='primary'
            disabled={isSaving}
            startIcon={isSaving ? <CircularProgress size={16} color='inherit' /> : undefined}
            onClick={() => handleSave(tab)}
          >
            {isSaving ? 'Saving…' : 'Save Settings'}
          </Button>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loadingInit) {
    return (
      <Card>
        <CardContent className='flex justify-center py-10'>
          <CircularProgress />
        </CardContent>
      </Card>
    )
  }

  const reddeConfigured = reddeConfigs.RENT !== null || reddeConfigs.SUBSCRIPTION !== null

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
                      {(t.value === 'REDDE' ? reddeConfigured : configs[t.value as 'PAYSTACK' | 'HUBTEL'] !== null) && (
                        <i className='ri-check-line' style={{ color: '#4CAF50', fontSize: 14 }} />
                      )}
                    </span>
                  }
                />
              ))}
            </Tabs>
          </Box>

          {activeTab === 'REDDE'    && renderReddeTab()}
          {activeTab === 'PAYSTACK' && renderTab('PAYSTACK')}
          {activeTab === 'HUBTEL'   && renderTab('HUBTEL')}
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
