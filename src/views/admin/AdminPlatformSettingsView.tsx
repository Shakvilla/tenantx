'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Snackbar from '@mui/material/Snackbar'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Tooltip from '@mui/material/Tooltip'

import {
  getPlatformSettings,
  updatePlatformSetting,
  type PlatformSettingDto,
} from '@/lib/api/admin-auth-client'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SettingsMap = Record<string, PlatformSettingDto[]>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function val(settings: SettingsMap, category: string, key: string): string {
  return settings[category]?.find(s => s.settingKey === key)?.settingValue ?? ''
}

function boolVal(settings: SettingsMap, category: string, key: string): boolean {
  return val(settings, category, key).toLowerCase() === 'true'
}

// Section header
function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
      <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 0.25, flexShrink: 0 }}>
        <i className={icon} style={{ fontSize: '1.1rem', color: 'var(--mui-palette-primary-main)' }} />
      </Box>
      <Box>
        <Typography variant='h6' sx={{ lineHeight: 1.3 }}>{title}</Typography>
        {subtitle && <Typography variant='body2' color='text.secondary'>{subtitle}</Typography>}
      </Box>
    </Box>
  )
}

// A single toggle row
function ToggleRow({
  label,
  description,
  checked,
  onChange,
  saving,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
  saving?: boolean
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1 }}>
      <Box>
        <Typography variant='body2' fontWeight={500}>{label}</Typography>
        {description && <Typography variant='caption' color='text.secondary'>{description}</Typography>}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {saving && <CircularProgress size={14} />}
        <Switch checked={checked} onChange={e => onChange(e.target.checked)} size='small' disabled={saving} />
      </Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminPlatformSettingsView() {
  const [settings, setSettings] = useState<SettingsMap>({})
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [toast, setToast]       = useState<string | null>(null)

  // Track which individual keys are currently saving
  const [saving, setSaving] = useState<Set<string>>(new Set())

  // Local editable state for text/number fields
  const [localValues, setLocalValues] = useState<Record<string, string>>({})
  const [dirty, setDirty]             = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPlatformSettings()
      setSettings(data)
      // Seed local values from fetched data
      const initial: Record<string, string> = {}
      Object.values(data).flat().forEach(s => { initial[s.settingKey] = s.settingValue })
      setLocalValues(initial)
      setDirty(new Set())
    } catch {
      setError('Failed to load platform settings.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Save a single key immediately (used by toggles and selects)
  async function save(key: string, value: string) {
    setSaving(prev => new Set(prev).add(key))
    try {
      const updated = await updatePlatformSetting(key, value)
      setSettings(prev => {
        const next = { ...prev }
        const cat  = updated.category
        if (next[cat]) {
          next[cat] = next[cat].map(s => s.settingKey === key ? updated : s)
        }
        return next
      })
      setLocalValues(prev => ({ ...prev, [key]: value }))
      setDirty(prev => { const n = new Set(prev); n.delete(key); return n })
      setToast('Setting saved')
    } catch {
      setToast('Failed to save setting')
    } finally {
      setSaving(prev => { const n = new Set(prev); n.delete(key); return n })
    }
  }

  // Save a batch of dirty text fields
  async function saveDirty(keys: string[]) {
    for (const key of keys) {
      if (dirty.has(key)) await save(key, localValues[key] ?? '')
    }
  }

  function setLocal(key: string, value: string) {
    setLocalValues(prev => ({ ...prev, [key]: value }))
    setDirty(prev => new Set(prev).add(key))
  }

  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return <Alert severity='error' sx={{ m: 4 }}>{error}</Alert>
  }

  // ── Feature-flag labels ───────────────────────────────────────────────────
  const FLAG_LABELS: Record<string, { label: string; desc: string }> = {
    'feature.sms_reminders.enabled':            { label: 'SMS Reminders',             desc: 'Allow tenants to send SMS payment reminders to occupants' },
    'feature.whatsapp_reminders.enabled':       { label: 'WhatsApp Reminders',        desc: 'Allow tenants to send WhatsApp payment reminders' },
    'feature.advanced_reports.enabled':         { label: 'Advanced Reports',           desc: 'Unlock advanced analytics and reporting features' },
    'feature.maintenance_contractors.enabled':  { label: 'Maintenance Contractors',   desc: 'Enable the contractor management module' },
    'feature.rent_collection.enabled':          { label: 'Rent Collection',            desc: 'Enable the rent collection and payment module' },
    'feature.landlord_wallet.enabled':          { label: 'Landlord Wallet',            desc: 'Enable the landlord wallet and balance features' },
    'feature.automated_reconciliation.enabled': { label: 'Automated Reconciliation',  desc: 'Enable automated bank reconciliation' },
    'feature.financial_reports.enabled':        { label: 'Financial Reports',          desc: 'Enable the financial reports module' },
  }

  const EMAIL_LABELS: Record<string, { label: string; desc: string }> = {
    'notification.email.invoice_issued':     { label: 'Invoice Issued',          desc: 'Notify tenant when a new invoice is generated' },
    'notification.email.payment_failed':     { label: 'Payment Failed',          desc: 'Notify tenant when a payment attempt fails' },
    'notification.email.payment_success':    { label: 'Payment Success',         desc: 'Notify tenant when a payment succeeds' },
    'notification.email.subscription_renewed': { label: 'Subscription Renewed', desc: 'Notify tenant when their subscription renews' },
    'notification.email.trial_expiring':     { label: 'Trial Expiring Soon',     desc: 'Warn tenant 3 days before trial period ends' },
  }

  const PUSH_LABELS: Record<string, { label: string; desc: string }> = {
    'notification.sms.payment_reminder':      { label: 'SMS Payment Reminders',      desc: 'Send SMS reminders for upcoming payments (requires SMS provider)' },
    'notification.whatsapp.payment_reminder': { label: 'WhatsApp Payment Reminders', desc: 'Send WhatsApp reminders for upcoming payments' },
  }

  const billingKeys = ['billing.retry.max_count', 'billing.retry.interval_seconds', 'billing.grace_period_days']

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 900, mx: 'auto' }}>
      <Typography variant='h4' fontWeight={700} sx={{ mb: 0.5 }}>Platform Settings</Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
        Global configuration for the TenantX platform. Changes take effect immediately.
      </Typography>

      {/* ── 0. Maintenance Mode ──────────────────────────────────────────────── */}
      <Card sx={{ mb: 3, border: localValues['platform.maintenance.enabled'] === 'true' ? '1px solid' : undefined, borderColor: 'error.main' }}>
        <CardContent>
          <SectionHeader
            icon='ri-tools-line'
            title='Maintenance Mode'
            subtitle='When enabled, all tenant-facing API requests return 503. Admin endpoints remain accessible. The cache refreshes within 30 seconds of toggling.'
          />
          <Divider sx={{ mb: 2 }} />

          <ToggleRow
            label='Enable Maintenance Mode'
            description='Immediately blocks all tenant access with the message below'
            checked={localValues['platform.maintenance.enabled'] === 'true'}
            saving={saving.has('platform.maintenance.enabled')}
            onChange={v => save('platform.maintenance.enabled', String(v))}
          />

          {localValues['platform.maintenance.enabled'] === 'true' && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'error.lighter', borderRadius: 1, mb: 2 }}>
              <Typography variant='body2' color='error.dark' fontWeight={600}>
                ⚠ Maintenance mode is ON — tenants cannot access the platform right now.
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                size='small'
                label='Maintenance Message'
                multiline
                minRows={2}
                value={localValues['platform.maintenance.message'] ?? ''}
                onChange={e => setLocal('platform.maintenance.message', e.target.value)}
                sx={{ flex: 1 }}
                helperText='Shown in the 503 response body to all tenant clients'
              />
            </Box>
            <TextField
              size='small'
              label='Estimated End Time (optional)'
              placeholder='e.g. 14:00 UTC, or 2026-06-22T14:00:00Z'
              value={localValues['platform.maintenance.estimated_end'] ?? ''}
              onChange={e => setLocal('platform.maintenance.estimated_end', e.target.value)}
              helperText='Included in the maintenance message if provided'
            />
            {['platform.maintenance.message', 'platform.maintenance.estimated_end'].some(k => dirty.has(k)) && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant='contained'
                  size='small'
                  color='error'
                  onClick={() => saveDirty(['platform.maintenance.message', 'platform.maintenance.estimated_end'])}
                  disabled={['platform.maintenance.message', 'platform.maintenance.estimated_end'].some(k => saving.has(k))}
                >
                  Save Message
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* ── 1. Global Feature Flags ──────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader
            icon='ri-toggle-line'
            title='Global Feature Flags'
            subtitle='Enable or disable platform features for all tenants. Turning off a flag here overrides any per-tenant or plan-level setting.'
          />
          <Divider sx={{ mb: 2 }} />
          {Object.entries(FLAG_LABELS).map(([key, { label, desc }], idx, arr) => (
            <Box key={key}>
              <ToggleRow
                label={label}
                description={desc}
                checked={localValues[key] === 'true'}
                saving={saving.has(key)}
                onChange={v => save(key, String(v))}
              />
              {idx < arr.length - 1 && <Divider />}
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* ── 2. Payment Gateway ───────────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader
            icon='ri-bank-card-line'
            title='Payment Gateway'
            subtitle='Configure the active payment gateway and operating environment.'
          />
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl size='small' fullWidth>
              <InputLabel>Active Gateway</InputLabel>
              <Select
                label='Active Gateway'
                value={localValues['gateway.active'] ?? 'REDDE'}
                onChange={e => save('gateway.active', e.target.value)}
                disabled={saving.has('gateway.active')}
              >
                <MenuItem value='REDDE'>Redde</MenuItem>
                <MenuItem value='PAYSTACK'>Paystack</MenuItem>
                <MenuItem value='FLUTTERWAVE'>Flutterwave</MenuItem>
              </Select>
            </FormControl>

            <FormControl size='small' fullWidth>
              <InputLabel>Environment</InputLabel>
              <Select
                label='Environment'
                value={localValues['gateway.environment'] ?? 'PRODUCTION'}
                onChange={e => save('gateway.environment', e.target.value)}
                disabled={saving.has('gateway.environment')}
              >
                <MenuItem value='PRODUCTION'>Production</MenuItem>
                <MenuItem value='SANDBOX'>Sandbox</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size='small'
              label='Platform Merchant ID (optional)'
              placeholder='Leave blank to use per-tenant config'
              value={localValues['gateway.redde.merchant_id'] ?? ''}
              onChange={e => setLocal('gateway.redde.merchant_id', e.target.value)}
              helperText='Overrides per-tenant merchant ID when set'
            />

            <TextField
              size='small'
              label='Platform API Key (optional)'
              placeholder='Leave blank to use per-tenant config'
              value={localValues['gateway.redde.api_key'] ?? ''}
              onChange={e => setLocal('gateway.redde.api_key', e.target.value)}
              type='password'
            />
          </Box>

          {['gateway.redde.merchant_id', 'gateway.redde.api_key'].some(k => dirty.has(k)) && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant='contained'
                size='small'
                onClick={() => saveDirty(['gateway.redde.merchant_id', 'gateway.redde.api_key'])}
                disabled={['gateway.redde.merchant_id', 'gateway.redde.api_key'].some(k => saving.has(k))}
              >
                Save Gateway Settings
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── 3. Notification Preferences ──────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader
            icon='ri-notification-3-line'
            title='Notification Preferences'
            subtitle='Control which platform emails and messages are sent, and the sender address.'
          />
          <Divider sx={{ mb: 2 }} />

          {/* From address */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 3 }}>
            <TextField
              size='small'
              label='Sender Email Address'
              value={localValues['notification.from_address'] ?? ''}
              onChange={e => setLocal('notification.from_address', e.target.value)}
              sx={{ flex: 1 }}
              helperText='Used as the From: address for all platform emails'
            />
            {dirty.has('notification.from_address') && (
              <Button
                variant='contained'
                size='small'
                sx={{ mt: 0.5 }}
                onClick={() => saveDirty(['notification.from_address'])}
                disabled={saving.has('notification.from_address')}
              >
                Save
              </Button>
            )}
          </Box>

          <Typography variant='overline' color='text.secondary'>Email Notifications</Typography>
          {Object.entries(EMAIL_LABELS).map(([key, { label, desc }], idx, arr) => (
            <Box key={key}>
              <ToggleRow
                label={label}
                description={desc}
                checked={localValues[key] === 'true'}
                saving={saving.has(key)}
                onChange={v => save(key, String(v))}
              />
              {idx < arr.length - 1 && <Divider />}
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />
          <Typography variant='overline' color='text.secondary'>Push / SMS / WhatsApp</Typography>
          {Object.entries(PUSH_LABELS).map(([key, { label, desc }], idx, arr) => (
            <Box key={key}>
              <ToggleRow
                label={label}
                description={desc}
                checked={localValues[key] === 'true'}
                saving={saving.has(key)}
                onChange={v => save(key, String(v))}
              />
              {idx < arr.length - 1 && <Divider />}
            </Box>
          ))}
        </CardContent>
      </Card>

      {/* ── 4. Billing Retry Policy ──────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader
            icon='ri-repeat-line'
            title='Billing Retry Policy'
            subtitle='Configure how the platform handles failed subscription payments.'
          />
          <Divider sx={{ mb: 2 }} />

          <ToggleRow
            label='Enable Automatic Retries'
            description='When disabled, failed invoices must be retried manually by an admin'
            checked={localValues['billing.retry.enabled'] === 'true'}
            saving={saving.has('billing.retry.enabled')}
            onChange={v => save('billing.retry.enabled', String(v))}
          />

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            <Tooltip title='Maximum times the system will automatically retry a failed payment before downgrading the tenant to the FREE plan.'>
              <TextField
                size='small'
                label='Max Retry Attempts'
                type='number'
                inputProps={{ min: 1, max: 10 }}
                value={localValues['billing.retry.max_count'] ?? '3'}
                onChange={e => setLocal('billing.retry.max_count', e.target.value)}
                helperText='Attempts before downgrade (1–10)'
              />
            </Tooltip>

            <Tooltip title='Base interval in seconds between automatic retry attempts. Each subsequent retry multiplies by the attempt number (e.g. 3600 → 1h, 7200 → 2h, ...).'>
              <TextField
                size='small'
                label='Retry Interval (seconds)'
                type='number'
                inputProps={{ min: 300 }}
                value={localValues['billing.retry.interval_seconds'] ?? '3600'}
                onChange={e => setLocal('billing.retry.interval_seconds', e.target.value)}
                helperText='Base seconds between retries'
              />
            </Tooltip>

            <Tooltip title='Grace period in days after all retries are exhausted, before the tenant is automatically downgraded.'>
              <TextField
                size='small'
                label='Grace Period (days)'
                type='number'
                inputProps={{ min: 0, max: 30 }}
                value={localValues['billing.grace_period_days'] ?? '3'}
                onChange={e => setLocal('billing.grace_period_days', e.target.value)}
                helperText='Days before downgrade after final retry'
              />
            </Tooltip>
          </Box>

          {billingKeys.some(k => dirty.has(k)) && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant='contained'
                size='small'
                onClick={() => saveDirty(billingKeys)}
                disabled={billingKeys.some(k => saving.has(k))}
                startIcon={billingKeys.some(k => saving.has(k)) ? <CircularProgress size={14} color='inherit' /> : undefined}
              >
                Save Retry Policy
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Toast */}
      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
