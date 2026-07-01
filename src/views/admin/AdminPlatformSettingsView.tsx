'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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
import InputAdornment from '@mui/material/InputAdornment'
import IconButton from '@mui/material/IconButton'

import {
  getPlatformSettings,
  updatePlatformSetting,
  type PlatformSettingDto,
} from '@/lib/api/admin-auth-client'

import { useAdminBranding } from '@/contexts/AdminBrandingContext'

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

  // FROG API key visibility toggle
  const [showFrogKey, setShowFrogKey] = useState(false)

  // Local editable state for text/number fields
  const [localValues, setLocalValues] = useState<Record<string, string>>({})
  const [dirty, setDirty]             = useState<Set<string>>(new Set())

  // Fee rate shown as percentage in the UI (e.g. '1.50'), stored as decimal ('0.0150') in localValues
  const [feeRateInput, setFeeRateInput] = useState('')

  // Logo upload state
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  // Branding context — refresh sidebar/nav when branding keys are saved
  const { refresh: refreshBranding } = useAdminBranding()

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
      const rawRate = parseFloat(initial['billing.transaction_fee_rate'] ?? '0.0150')
      setFeeRateInput((rawRate * 100).toFixed(2))
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
      // Propagate branding changes to nav/sidebar immediately
      if (key.startsWith('branding.')) refreshBranding()
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

  async function handleLogoUpload(file: File) {
    setLogoUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload-logo', { method: 'POST', body: fd })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error((body as { error?: string }).error ?? 'Upload failed')
      }
      const { publicUrl } = await res.json() as { publicUrl: string }
      await save('branding.logo_url', publicUrl)
    } catch (e: unknown) {
      setToast(e instanceof Error ? e.message : 'Logo upload failed')
    } finally {
      setLogoUploading(false)
    }
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
        Global configuration for the {localValues['branding.platform_name'] || 'TenantX'} platform. Changes take effect immediately.
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

      {/* ── 3. Transaction Fee Rate ──────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader
            icon='ri-percent-line'
            title='Transaction Fee Rate'
            subtitle='Platform fee charged on every successful subscription payment. Applies to new payments only — existing invoices are not retroactively affected.'
          />
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Tooltip title='Enter the fee as a percentage. E.g. type 1.5 for 1.50%. Stored internally as a decimal fraction (0.0150).'>
              <TextField
                size='small'
                label='Fee Rate (%)'
                type='number'
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                value={feeRateInput}
                onChange={e => {
                  const raw = e.target.value
                  setFeeRateInput(raw)
                  const pct = parseFloat(raw)
                  if (!isNaN(pct) && pct >= 0 && pct <= 100) {
                    setLocal('billing.transaction_fee_rate', (pct / 100).toFixed(4))
                  }
                }}
                error={feeRateInput !== '' && (parseFloat(feeRateInput) < 0 || parseFloat(feeRateInput) > 100)}
                helperText={
                  feeRateInput !== '' && (parseFloat(feeRateInput) < 0 || parseFloat(feeRateInput) > 100)
                    ? 'Must be between 0 and 100'
                    : `Stored as ${localValues['billing.transaction_fee_rate'] ?? '—'}`
                }
                sx={{ width: 200 }}
              />
            </Tooltip>

            {dirty.has('billing.transaction_fee_rate') && (
              <Button
                variant='contained'
                size='small'
                sx={{ mt: 0.5 }}
                onClick={() => saveDirty(['billing.transaction_fee_rate'])}
                disabled={
                  saving.has('billing.transaction_fee_rate') ||
                  feeRateInput === '' ||
                  parseFloat(feeRateInput) < 0 ||
                  parseFloat(feeRateInput) > 100
                }
                startIcon={saving.has('billing.transaction_fee_rate') ? <CircularProgress size={14} color='inherit' /> : undefined}
              >
                Save
              </Button>
            )}
          </Box>

          <Box sx={{ mt: 2.5, p: 1.5, bgcolor: 'primary.lighter', borderRadius: 1 }}>
            <Typography variant='caption' color='text.secondary'>
              <strong>Example:</strong> A subscription payment of GHS 200.00 with a{' '}
              <strong>{feeRateInput || '1.50'}% fee rate</strong> generates a platform fee of{' '}
              <strong>
                GHS {((parseFloat(feeRateInput || '1.50') / 100) * 200).toFixed(2)}
              </strong>
              . Fee entries are recorded in the <strong>Fee Ledger</strong> and settled from there.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* ── 4. Notification Preferences ──────────────────────────────────────── */}
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

      {/* ── 5. Billing Retry Policy ──────────────────────────────────────────── */}
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

      {/* ── 6. API Rate Limit Configuration ─────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader
            icon='ri-speed-line'
            title='API Rate Limit Configuration'
            subtitle='Requests-per-minute limits enforced per subscription tier. Changes take effect within 60 seconds without a deployment.'
          />
          <Divider sx={{ mb: 2 }} />

          <ToggleRow
            label='Enable Rate Limiting'
            description='When disabled, all rate limit checks are bypassed globally'
            checked={localValues['rate_limit.enabled'] === 'true'}
            saving={saving.has('rate_limit.enabled')}
            onChange={v => save('rate_limit.enabled', String(v))}
          />

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            {[
              { key: 'rate_limit.global.rpm', label: 'Global Ceiling (RPM)', help: 'Hard cap applied to every tenant regardless of plan' },
              { key: 'rate_limit.free.rpm',   label: 'FREE Plan (RPM)',       help: 'Limit for tenants on the free tier' },
              { key: 'rate_limit.basic.rpm',  label: 'BASIC Plan (RPM)',      help: 'Limit for tenants on the basic tier' },
              { key: 'rate_limit.pro.rpm',    label: 'PRO Plan (RPM)',        help: 'Limit for tenants on the pro tier' },
            ].map(({ key, label, help }) => (
              <TextField
                key={key}
                size='small'
                label={label}
                type='number'
                inputProps={{ min: 1 }}
                value={localValues[key] ?? ''}
                onChange={e => setLocal(key, e.target.value)}
                helperText={help}
              />
            ))}
          </Box>

          {['rate_limit.global.rpm', 'rate_limit.free.rpm', 'rate_limit.basic.rpm', 'rate_limit.pro.rpm'].some(k => dirty.has(k)) && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant='contained'
                size='small'
                onClick={() => saveDirty(['rate_limit.global.rpm', 'rate_limit.free.rpm', 'rate_limit.basic.rpm', 'rate_limit.pro.rpm'])}
                disabled={['rate_limit.global.rpm', 'rate_limit.free.rpm', 'rate_limit.basic.rpm', 'rate_limit.pro.rpm'].some(k => saving.has(k))}
              >
                Save Rate Limits
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── 7. Communication Provider Switch ─────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader
            icon='ri-global-line'
            title='Communication Providers'
            subtitle='Select providers and enter API credentials. Changes take effect on the next send — no restart required.'
          />
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            <FormControl size='small' fullWidth>
              <InputLabel>Email Provider</InputLabel>
              <Select
                label='Email Provider'
                value={localValues['provider.email'] ?? 'RESEND'}
                onChange={e => save('provider.email', e.target.value)}
                disabled={saving.has('provider.email')}
              >
                <MenuItem value='RESEND'>Resend</MenuItem>
                <MenuItem value='SENDGRID'>SendGrid</MenuItem>
                <MenuItem value='MAILGUN'>Mailgun</MenuItem>
              </Select>
            </FormControl>

            <FormControl size='small' fullWidth>
              <InputLabel>SMS Provider</InputLabel>
              <Select
                label='SMS Provider'
                value={localValues['provider.sms'] ?? 'FROG'}
                onChange={e => save('provider.sms', e.target.value)}
                disabled={saving.has('provider.sms')}
              >
                <MenuItem value='FROG'>FROG SMS</MenuItem>
              </Select>
            </FormControl>

            <FormControl size='small' fullWidth>
              <InputLabel>WhatsApp Provider</InputLabel>
              <Select
                label='WhatsApp Provider'
                value={localValues['provider.whatsapp'] ?? 'NONE'}
                onChange={e => save('provider.whatsapp', e.target.value)}
                disabled={saving.has('provider.whatsapp')}
              >
                <MenuItem value='NONE'>None (disabled)</MenuItem>
                <MenuItem value='TWILIO'>Twilio</MenuItem>
                <MenuItem value='360DIALOG'>360dialog</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* ── FROG SMS Credentials ────────────────────────────────────────── */}
          {(localValues['provider.sms'] ?? 'FROG') === 'FROG' && (
            <>
              <Divider sx={{ my: 2.5 }} />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <i className='ri-key-2-line' style={{ fontSize: '1rem', color: 'var(--mui-palette-primary-main)' }} />
                <Typography variant='subtitle2'>FROG SMS API Credentials</Typography>
                <Typography variant='caption' color='text.secondary' sx={{ ml: 0.5 }}>
                  — from your <a href='https://frogapi.wigal.com.gh' target='_blank' rel='noreferrer' style={{ color: 'inherit' }}>FROG dashboard</a>
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                <TextField
                  size='small'
                  label='API Key'
                  type={showFrogKey ? 'text' : 'password'}
                  value={localValues['provider.frog.api_key'] ?? ''}
                  onChange={e => setLocal('provider.frog.api_key', e.target.value)}
                  helperText='API-KEY header sent to FROG'
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton size='small' onClick={() => setShowFrogKey(p => !p)} edge='end'>
                            <i className={showFrogKey ? 'ri-eye-off-line' : 'ri-eye-line'} style={{ fontSize: '1rem' }} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />
                <TextField
                  size='small'
                  label='Username'
                  value={localValues['provider.frog.username'] ?? ''}
                  onChange={e => setLocal('provider.frog.username', e.target.value)}
                  helperText='USERNAME header sent to FROG'
                />
                <TextField
                  size='small'
                  label='Sender ID'
                  value={localValues['provider.frog.sender_id'] ?? ''}
                  onChange={e => setLocal('provider.frog.sender_id', e.target.value)}
                  helperText='Displayed as the SMS from-name'
                />
              </Box>
              {(['provider.frog.api_key', 'provider.frog.username', 'provider.frog.sender_id'] as const).some(k => dirty.has(k)) && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant='contained'
                    size='small'
                    onClick={() => saveDirty(['provider.frog.api_key', 'provider.frog.username', 'provider.frog.sender_id'])}
                    disabled={['provider.frog.api_key', 'provider.frog.username', 'provider.frog.sender_id'].some(k => saving.has(k))}
                  >
                    Save FROG Credentials
                  </Button>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── 8. Data Retention Policy ─────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader
            icon='ri-archive-line'
            title='Data Retention Policy'
            subtitle='Configure how long platform data is retained. Purge jobs run nightly. Changes apply on the next scheduled run.'
          />
          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
            {[
              {
                key: 'retention.inactive_tenant_days',
                label: 'Inactive Tenant Threshold (days)',
                help: 'Days without login before a tenant is flagged for archival review',
              },
              {
                key: 'retention.audit_log_days',
                label: 'Audit Log Retention (days)',
                help: 'Admin audit log entries older than this are eligible for purge',
              },
              {
                key: 'retention.invoice_history_days',
                label: 'Invoice History Retention (days)',
                help: 'Subscription invoice records are retained for this many days (default ≈ 7 years)',
              },
            ].map(({ key, label, help }) => (
              <TextField
                key={key}
                size='small'
                label={label}
                type='number'
                inputProps={{ min: 1 }}
                value={localValues[key] ?? ''}
                onChange={e => setLocal(key, e.target.value)}
                helperText={help}
              />
            ))}
          </Box>

          {['retention.inactive_tenant_days', 'retention.audit_log_days', 'retention.invoice_history_days'].some(k => dirty.has(k)) && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant='contained'
                size='small'
                onClick={() => saveDirty(['retention.inactive_tenant_days', 'retention.audit_log_days', 'retention.invoice_history_days'])}
                disabled={['retention.inactive_tenant_days', 'retention.audit_log_days', 'retention.invoice_history_days'].some(k => saving.has(k))}
              >
                Save Retention Policy
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── 9. Platform Branding ─────────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader
            icon='ri-palette-line'
            title='Platform Branding'
            subtitle='Visual identity used in all tenant-facing transactional emails — OTP codes, invoices, and admin messages.'
          />
          <Divider sx={{ mb: 3 }} />

          {/* Platform name */}
          <Box sx={{ mb: 3 }}>
            <Typography variant='body2' fontWeight={600} sx={{ mb: 1 }}>Platform Name</Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
              <TextField
                size='small'
                label='Platform Name'
                value={localValues['branding.platform_name'] ?? ''}
                onChange={e => setLocal('branding.platform_name', e.target.value)}
                helperText='Shown in email headers and footers when no logo is set'
                sx={{ flex: 1, maxWidth: 360 }}
              />
              {dirty.has('branding.platform_name') && (
                <Button
                  variant='contained'
                  size='small'
                  sx={{ mt: 0.25 }}
                  disabled={saving.has('branding.platform_name')}
                  onClick={() => saveDirty(['branding.platform_name'])}
                >
                  {saving.has('branding.platform_name') ? <CircularProgress size={14} /> : 'Save'}
                </Button>
              )}
            </Box>
          </Box>

          {/* Logo */}
          <Box sx={{ mb: 3 }}>
            <Typography variant='body2' fontWeight={600} sx={{ mb: 1 }}>Email Logo</Typography>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
              Shown at the top of every email. Recommended: PNG or SVG, max 200 × 60 px, transparent background.
              Leave blank to display the platform name as text instead.
            </Typography>

            {/* Preview */}
            {localValues['branding.logo_url'] && (
              <Box sx={{ mb: 2, p: 1.5, bgcolor: 'grey.100', borderRadius: 1, display: 'inline-block' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={localValues['branding.logo_url']}
                  alt='Logo preview'
                  style={{ maxHeight: 48, maxWidth: 200, objectFit: 'contain', display: 'block' }}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Hidden file input */}
              <input
                ref={logoInputRef}
                type='file'
                accept='image/png,image/jpeg,image/gif,image/svg+xml,image/webp'
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleLogoUpload(file)
                  e.target.value = ''
                }}
              />
              <Button
                variant='outlined'
                size='small'
                startIcon={logoUploading ? <CircularProgress size={14} /> : <i className='ri-upload-2-line' />}
                disabled={logoUploading}
                onClick={() => logoInputRef.current?.click()}
              >
                {logoUploading ? 'Uploading…' : 'Upload Image'}
              </Button>

              <TextField
                size='small'
                label='Or paste URL'
                placeholder='https://…'
                value={localValues['branding.logo_url'] ?? ''}
                onChange={e => setLocal('branding.logo_url', e.target.value)}
                sx={{ flex: 1, minWidth: 240 }}
              />
              {dirty.has('branding.logo_url') && (
                <Button
                  variant='contained'
                  size='small'
                  sx={{ mt: 0.25 }}
                  disabled={saving.has('branding.logo_url')}
                  onClick={() => saveDirty(['branding.logo_url'])}
                >
                  {saving.has('branding.logo_url') ? <CircularProgress size={14} /> : 'Save'}
                </Button>
              )}
              {localValues['branding.logo_url'] && !dirty.has('branding.logo_url') && (
                <Tooltip title='Remove logo'>
                  <IconButton
                    size='small'
                    color='error'
                    onClick={() => save('branding.logo_url', '')}
                    disabled={saving.has('branding.logo_url')}
                  >
                    <i className='ri-delete-bin-line' style={{ fontSize: '1rem' }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>

          {/* Primary colour */}
          <Box>
            <Typography variant='body2' fontWeight={600} sx={{ mb: 1 }}>Primary Accent Colour</Typography>
            <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1.5 }}>
              Used for email header bar, OTP code background, and text accents. Include the leading #.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Native colour picker swatch */}
              <Box
                component='label'
                sx={{
                  width: 40, height: 40, borderRadius: 1.5,
                  bgcolor: localValues['branding.primary_colour'] || '#7367F0',
                  border: '2px solid', borderColor: 'divider',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}
              >
                <input
                  type='color'
                  value={localValues['branding.primary_colour'] || '#7367F0'}
                  onChange={e => setLocal('branding.primary_colour', e.target.value)}
                  style={{ opacity: 0, position: 'absolute', width: 1, height: 1 }}
                />
                <i className='ri-pencil-line' style={{ fontSize: '0.85rem', color: '#fff', mixBlendMode: 'difference' }} />
              </Box>

              <TextField
                size='small'
                label='Hex Colour'
                value={localValues['branding.primary_colour'] ?? '#7367F0'}
                onChange={e => setLocal('branding.primary_colour', e.target.value)}
                inputProps={{ maxLength: 7, style: { fontFamily: 'monospace' } }}
                sx={{ width: 140 }}
              />

              {dirty.has('branding.primary_colour') && (
                <Button
                  variant='contained'
                  size='small'
                  disabled={saving.has('branding.primary_colour')}
                  onClick={() => saveDirty(['branding.primary_colour'])}
                  sx={{ bgcolor: localValues['branding.primary_colour'] || 'primary.main' }}
                >
                  {saving.has('branding.primary_colour') ? <CircularProgress size={14} /> : 'Save Colour'}
                </Button>
              )}
            </Box>
          </Box>

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
