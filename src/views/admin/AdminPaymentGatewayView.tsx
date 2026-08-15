'use client'

import { useState, useEffect } from 'react'

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
import Box from '@mui/material/Box'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'

import { adminGatewayConfigApi } from '@/lib/api/admin-auth-client'
import type { GatewayConfigResponse } from '@/types/payment'

// ─── Types ───────────────────────────────────────────────────────────────────

type ReddePurpose = 'RENT' | 'SUBSCRIPTION'

interface FormState {
  apiKey:    string
  appId:     string
  nickname:  string
  isLive:    boolean
  isDefault: boolean
  showKey:   boolean
  baseUrl:   string
}

const DEFAULT_BASE_URL = 'https://api.reddeonline.com'

const emptyForm = (): FormState => ({
  apiKey: '', appId: '', nickname: '', isLive: false, isDefault: false, showKey: false,
  baseUrl: DEFAULT_BASE_URL,
})

// ─── Section config ───────────────────────────────────────────────────────────

const SECTIONS: { purpose: ReddePurpose; title: string; description: string }[] = [
  {
    purpose: 'RENT',
    title: 'App 1 — Rent Collection & Landlord Withdrawals',
    description:
      'All occupant rent payments flow into this Redde app. Landlord withdrawal cashouts also go through it. ' +
      'Both Redde callback slots are used.',
  },
  {
    purpose: 'SUBSCRIPTION',
    title: 'App 2 — Platform Subscription Billing',
    description:
      'Charges landlord subscription fees on behalf of the platform. Uses the Receive callback only — no cashouts from this app.',
  },
]

// ─── Component ───────────────────────────────────────────────────────────────

const PAYSTACK_DEFAULT_BASE_URL = 'https://api.paystack.co'

const emptyPaystackForm = (): FormState => ({
  apiKey: '', appId: '', nickname: '', isLive: false, isDefault: false, showKey: false,
  baseUrl: PAYSTACK_DEFAULT_BASE_URL,
})

export default function AdminPaymentGatewayView() {
  const [configs, setConfigs] = useState<Record<ReddePurpose, GatewayConfigResponse | null>>({
    RENT: null, SUBSCRIPTION: null,
  })
  const [forms, setForms] = useState<Record<ReddePurpose, FormState>>({
    RENT: emptyForm(), SUBSCRIPTION: emptyForm(),
  })
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState<ReddePurpose | null>(null)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })

  // Paystack — card payments fallback, subscription billing only (no rent/cashout support yet)
  const [paystackConfig, setPaystackConfig] = useState<GatewayConfigResponse | null>(null)
  const [paystackForm, setPaystackForm]     = useState<FormState>(emptyPaystackForm())
  const [paystackSaving, setPaystackSaving] = useState(false)

  const baseAppUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1')
    .replace(/\/api\/v1$/, '')

  const callbackUrls = {
    RENT_RECEIVE:         `${baseAppUrl}/api/v1/payments/webhook/redde/rent`,
    RENT_CASHOUT:         `${baseAppUrl}/api/v1/payments/webhook/redde/cashout`,
    SUBSCRIPTION_RECEIVE: `${baseAppUrl}/api/v1/payments/webhook/redde/subscription`,
    PAYSTACK_SUBSCRIPTION: `${baseAppUrl}/api/v1/payments/webhook/paystack-subscription`,
  }

  // ── Load ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    adminGatewayConfigApi.list()
      .then(list => {
        const updConfigs = { RENT: null, SUBSCRIPTION: null } as Record<ReddePurpose, GatewayConfigResponse | null>
        const updForms   = { RENT: emptyForm(), SUBSCRIPTION: emptyForm() }

        list.forEach(c => {
          const p = (c.purpose ?? 'RENT') as ReddePurpose
          if (c.gatewayName === 'PAYSTACK') {
            setPaystackConfig(c)
            setPaystackForm({
              apiKey: '', appId: c.appId, nickname: c.nickname,
              isLive: c.isLive, isDefault: c.isDefault, showKey: false,
              baseUrl: c.baseUrl ?? PAYSTACK_DEFAULT_BASE_URL,
            })
          } else if (p === 'RENT' || p === 'SUBSCRIPTION') {
            updConfigs[p] = c
            updForms[p]   = {
              apiKey: '', appId: c.appId, nickname: c.nickname,
              isLive: c.isLive, isDefault: c.isDefault, showKey: false,
              baseUrl: c.baseUrl ?? DEFAULT_BASE_URL,
            }
          }
        })

        setConfigs(updConfigs)
        setForms(updForms)
      })
      .catch(() => setSnackbar({ open: true, message: 'Failed to load gateway configs', severity: 'error' }))
      .finally(() => setLoading(false))
  }, [])

  const handleSavePaystack = async () => {
    if (!paystackForm.apiKey && !paystackConfig) {
      setSnackbar({ open: true, message: 'Secret Key is required for a new Paystack config', severity: 'error' })
      return
    }
    setPaystackSaving(true)
    try {
      const saved = await adminGatewayConfigApi.save({
        gatewayName: 'PAYSTACK',
        apiKey:      paystackForm.apiKey || '__unchanged__',
        appId:       paystackForm.appId,
        nickname:    paystackForm.nickname || 'Paystack',
        isLive:      paystackForm.isLive,
        isDefault:   paystackForm.isDefault,
        purpose:     'SUBSCRIPTION',
        baseUrl:     paystackForm.baseUrl || PAYSTACK_DEFAULT_BASE_URL,
      })
      setPaystackConfig(saved)
      setPaystackForm(p => ({ ...p, apiKey: '', showKey: false }))
      setSnackbar({ open: true, message: 'Paystack gateway saved', severity: 'success' })
    } catch {
      setSnackbar({ open: true, message: 'Failed to save Paystack config', severity: 'error' })
    } finally {
      setPaystackSaving(false)
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  const patch = (purpose: ReddePurpose, p: Partial<FormState>) =>
    setForms(prev => ({ ...prev, [purpose]: { ...prev[purpose], ...p } }))

  const handleSave = async (purpose: ReddePurpose) => {
    const f   = forms[purpose]
    const cfg = configs[purpose]

    if (!f.appId.trim() || !f.nickname.trim()) {
      setSnackbar({ open: true, message: 'App ID and Nickname are required', severity: 'error' })
      return
    }
    if (!f.apiKey && !cfg) {
      setSnackbar({ open: true, message: 'API Key is required for a new config', severity: 'error' })
      return
    }

    setSaving(purpose)
    try {
      const saved = await adminGatewayConfigApi.save({
        gatewayName: 'REDDE',
        apiKey:      f.apiKey || '__unchanged__',
        appId:       f.appId,
        nickname:    f.nickname,
        isLive:      f.isLive,
        isDefault:   f.isDefault,
        purpose,
        baseUrl:     f.baseUrl || DEFAULT_BASE_URL,
      })
      setConfigs(prev => ({ ...prev, [purpose]: saved }))
      patch(purpose, { apiKey: '', showKey: false })
      setSnackbar({
        open: true,
        message: `${purpose === 'RENT' ? 'Rent & Withdrawals' : 'Subscription'} gateway saved`,
        severity: 'success',
      })
    } catch {
      setSnackbar({ open: true, message: 'Failed to save gateway config', severity: 'error' })
    } finally {
      setSaving(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <>
      <Typography variant='h4' fontWeight={700} sx={{ mb: 0.5 }}>Payment Gateway</Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
        Platform-level Redde configuration. All rent collection and subscription billing uses these credentials.
        Landlords do not configure their own gateways — money flows into this account, and wallets are credited accordingly.
      </Typography>

      {SECTIONS.map(({ purpose, title, description }, idx) => {
        const f         = forms[purpose]
        const cfg       = configs[purpose]
        const isSaving  = saving === purpose

        return (
          <Card key={purpose} sx={{ mb: 3 }}>
            <CardHeader
              title={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant='h6'>{title}</Typography>
                  {cfg && (
                    <Chip
                      size='small'
                      label={cfg.isActive ? 'Configured' : 'Inactive'}
                      color={cfg.isActive ? 'success' : 'default'}
                    />
                  )}
                </Box>
              }
              subheader={description}
            />
            <Divider />
            <CardContent>
              <Grid container spacing={3}>

                {/* API Key */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth size='small'
                    label={cfg ? 'API Key (leave blank to keep existing)' : 'API Key'}
                    type={f.showKey ? 'text' : 'password'}
                    value={f.apiKey}
                    onChange={e => patch(purpose, { apiKey: e.target.value })}
                    placeholder={cfg ? `Current: ${cfg.apiKeyMasked}` : 'Enter API key from Redde portal'}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position='end'>
                            <IconButton size='small' onClick={() => patch(purpose, { showKey: !f.showKey })}>
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
                    label='App ID (from Wigal/Redde portal)'
                    value={f.appId}
                    onChange={e => patch(purpose, { appId: e.target.value })}
                  />
                </Grid>

                {/* Nickname */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size='small' required
                    label='Merchant Nickname'
                    value={f.nickname}
                    onChange={e => patch(purpose, { nickname: e.target.value })}
                    helperText='Shown on the customer MoMo prompt'
                  />
                </Grid>

                {/* Base API URL */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth size='small'
                    label='Base API URL'
                    value={f.baseUrl}
                    onChange={e => patch(purpose, { baseUrl: e.target.value })}
                    placeholder={DEFAULT_BASE_URL}
                    helperText='Only change if Redde provides a custom endpoint'
                  />
                </Grid>

                {/* Mode */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size='small'>
                    <InputLabel>Mode</InputLabel>
                    <Select
                      label='Mode'
                      value={f.isLive ? 'live' : 'test'}
                      onChange={e => patch(purpose, { isLive: e.target.value === 'live' })}
                    >
                      <MenuItem value='test'>Test / Sandbox</MenuItem>
                      <MenuItem value='live'>Live (Production)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Callback URLs */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant='caption' color='text.secondary' fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                    Callback URLs — register in app.reddeonline.com → Apps → Modify
                  </Typography>

                  {purpose === 'RENT' ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <TextField fullWidth size='small' label='Receive Callback URL'
                        value={callbackUrls.RENT_RECEIVE} slotProps={{ input: { readOnly: true } }}
                        helperText='Fires when an occupant completes a MoMo rent payment'
                      />
                      <TextField fullWidth size='small' label='Cash Out Callback URL'
                        value={callbackUrls.RENT_CASHOUT} slotProps={{ input: { readOnly: true } }}
                        helperText='Fires when a landlord withdrawal is confirmed'
                      />
                    </Box>
                  ) : (
                    <TextField fullWidth size='small' label='Receive Callback URL'
                      value={callbackUrls.SUBSCRIPTION_RECEIVE} slotProps={{ input: { readOnly: true } }}
                      helperText='Fires when a subscription payment is confirmed'
                    />
                  )}
                </Grid>

                {/* Save */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant='contained'
                      disabled={isSaving}
                      startIcon={isSaving ? <CircularProgress size={16} color='inherit' /> : undefined}
                      onClick={() => handleSave(purpose)}
                    >
                      {isSaving ? 'Saving…' : `Save ${purpose === 'RENT' ? 'Rent & Withdrawals' : 'Subscription'} App`}
                    </Button>
                  </Box>
                </Grid>

              </Grid>
            </CardContent>
          </Card>
        )
      })}

      {/* Paystack — card payments fallback for subscription billing */}
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant='h6'>Paystack — Card Payments (Subscription Fallback)</Typography>
              {paystackConfig && (
                <Chip
                  size='small'
                  label={paystackConfig.isActive ? 'Configured' : 'Inactive'}
                  color={paystackConfig.isActive ? 'success' : 'default'}
                />
              )}
            </Box>
          }
          subheader='Lets landlords pay by card, and lets subscription renewals fall back to a saved card if Redde MoMo is unavailable on renewal day.'
        />
        <Divider />
        <CardContent>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth size='small'
                label={paystackConfig ? 'Secret Key (leave blank to keep existing)' : 'Secret Key'}
                type={paystackForm.showKey ? 'text' : 'password'}
                value={paystackForm.apiKey}
                onChange={e => setPaystackForm(p => ({ ...p, apiKey: e.target.value }))}
                placeholder={paystackConfig ? `Current: ${paystackConfig.apiKeyMasked}` : 'sk_live_… or sk_test_…'}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position='end'>
                        <IconButton size='small' onClick={() => setPaystackForm(p => ({ ...p, showKey: !p.showKey }))}>
                          <i className={paystackForm.showKey ? 'ri-eye-off-line' : 'ri-eye-line'} />
                        </IconButton>
                      </InputAdornment>
                    )
                  }
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth size='small'
                label='Public Key (optional, for reference)'
                value={paystackForm.appId}
                onChange={e => setPaystackForm(p => ({ ...p, appId: e.target.value }))}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Mode</InputLabel>
                <Select
                  label='Mode'
                  value={paystackForm.isLive ? 'live' : 'test'}
                  onChange={e => setPaystackForm(p => ({ ...p, isLive: e.target.value === 'live' }))}
                >
                  <MenuItem value='test'>Test / Sandbox</MenuItem>
                  <MenuItem value='live'>Live (Production)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant='caption' color='text.secondary' fontWeight={600} sx={{ display: 'block', mb: 1 }}>
                Webhook URL — register in Paystack Dashboard → Settings → API Keys & Webhooks
              </Typography>
              <TextField fullWidth size='small' label='Subscription Webhook URL'
                value={callbackUrls.PAYSTACK_SUBSCRIPTION} slotProps={{ input: { readOnly: true } }}
                helperText='Fires on charge.success — confirms upgrade/renewal payments and saves the card for future renewals'
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant='contained'
                  disabled={paystackSaving}
                  startIcon={paystackSaving ? <CircularProgress size={16} color='inherit' /> : undefined}
                  onClick={handleSavePaystack}
                >
                  {paystackSaving ? 'Saving…' : 'Save Paystack Config'}
                </Button>
              </Box>
            </Grid>
          </Grid>
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
