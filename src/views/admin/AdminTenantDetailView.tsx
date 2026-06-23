'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Divider from '@mui/material/Divider'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Skeleton from '@mui/material/Skeleton'
import MenuItem from '@mui/material/MenuItem'
import Snackbar from '@mui/material/Snackbar'
import Switch from '@mui/material/Switch'
import Collapse from '@mui/material/Collapse'

import {
  getAdminTenant,
  updateAdminTenant,
  deactivateAdminTenant,
  reactivateAdminTenant,
  getAdminTenantSubscription,
  overrideTenantSubscription,
  getSubscriptionPlans,
  getAdminTenantSnapshot,
  getTenantNotes,
  addTenantNote,
  deleteTenantNote,
  getTenantFeatureFlags,
  setTenantFeatureFlagOverride,
  removeTenantFeatureFlagOverride,
  offboardTenant,
  sendAdminDirectMessage,
  resetTenantPassword,
  getTenantPlanHistory,
  getTenantLoginHistory,
  getTenantApiKeys,
  generateTenantApiKey,
  revokeTenantApiKey,
  exportTenantData,
  getTenantInvoices,
  type AdminInvoiceDto,
  type TenantRecord,
  type UpdateTenantPayload,
  type TenantSubscriptionDto,
  type SubscriptionPlanDto,
  type AdminTenantSnapshotDto,
  type TenantNoteDto,
  type FeatureFlagStatus,
  type PlanChangeDto,
  type LoginHistoryItem,
  type ApiKeyDto,
  type ApiKeyCreatedDto,
} from '@/lib/api/admin-auth-client'
import { useAdminAuth } from '@/contexts/AdminAuthContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const FEATURE_LABELS: Record<string, string> = {
  SMS_REMINDERS:         'SMS Reminders',
  WHATSAPP_REMINDERS:    'WhatsApp Reminders',
  ADVANCED_REPORTS:      'Advanced Reports',
  MAINTENANCE_CONTRACTORS: 'Maintenance Contractors',
  RENT_COLLECTION:       'Rent Collection',
  LANDLORD_WALLET:       'Landlord Wallet',
  AUTOMATED_RECONCILIATION: 'Automated Reconciliation',
  FINANCIAL_REPORTS:     'Financial Reports',
}

function subscriptionStatusColor(status: string): 'success' | 'warning' | 'error' | 'default' {
  switch (status?.toUpperCase()) {
    case 'ACTIVE':    return 'success'
    case 'PAST_DUE':  return 'warning'
    case 'CANCELLED': return 'error'
    default:          return 'default'
  }
}

// ---------------------------------------------------------------------------
// Shared: Info row
// ---------------------------------------------------------------------------

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', py: 1.5, alignItems: 'flex-start', gap: 2 }}>
      <Typography variant='body2' color='text.secondary' sx={{ minWidth: 160, flexShrink: 0 }}>
        {label}
      </Typography>
      <Box>{children}</Box>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Snapshot stat mini-card
// ---------------------------------------------------------------------------

function StatCard({
  label, value, icon, color, loading,
}: {
  label: string
  value: string | number
  icon: string
  color: 'primary' | 'success' | 'warning' | 'info'
  loading?: boolean
}) {
  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent sx={{ py: '12px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant='caption' color='text.secondary' fontWeight={600}>
            {label}
          </Typography>
          <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: `${color}.main`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className={icon} style={{ fontSize: '0.9rem', color: '#fff' }} />
          </Box>
        </Box>
        {loading ? (
          <Skeleton variant='text' width='50%' height={32} />
        ) : (
          <Typography variant='h5' fontWeight={800}>{value}</Typography>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Edit dialog
// ---------------------------------------------------------------------------

interface EditDialogProps {
  open: boolean
  tenant: TenantRecord
  onClose: () => void
  onSaved: (t: TenantRecord) => void
}

function EditDialog({ open, tenant, onClose, onSaved }: EditDialogProps) {
  const [name, setName]               = useState(tenant.name)
  const [description, setDescription] = useState(tenant.description ?? '')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    setName(tenant.name)
    setDescription(tenant.description ?? '')
    setError(null)
  }, [tenant])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true); setError(null)
    try {
      const payload: UpdateTenantPayload = { name: name.trim(), description: description.trim() || undefined }
      const updated = await updateAdminTenant(tenant.id, payload)
      onSaved(updated)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to update tenant')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Edit Tenant</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <TextField label='Tenant ID' size='small' fullWidth value={tenant.tenant_id} disabled helperText='Immutable' slotProps={{ input: { sx: { fontFamily: 'monospace' } } }} />
        <TextField label='Company Name' size='small' fullWidth value={name} onChange={e => setName(e.target.value)} disabled={saving} required autoFocus />
        <TextField label='Description' size='small' fullWidth multiline rows={2} value={description} onChange={e => setDescription(e.target.value)} disabled={saving} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant='contained' onClick={handleSave} disabled={saving || !name.trim()} startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}>Save</Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Confirm dialog (deactivate / reactivate)
// ---------------------------------------------------------------------------

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: React.ReactNode
  confirmLabel: string
  confirmColor: 'error' | 'success'
  onClose: () => void
  onConfirm: () => Promise<void>
}

function ConfirmDialog({ open, title, message, confirmLabel, confirmColor, onClose, onConfirm }: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)
  async function handle() { setLoading(true); await onConfirm(); setLoading(false) }
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent><DialogContentText>{message}</DialogContentText></DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button color={confirmColor} variant='contained' onClick={handle} disabled={loading} startIcon={loading ? <CircularProgress size={14} color='inherit' /> : undefined}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Override subscription dialog
// ---------------------------------------------------------------------------

interface OverrideDialogProps {
  open: boolean
  tenantRecord: TenantRecord
  currentPlan: string
  onClose: () => void
  onOverridden: (sub: TenantSubscriptionDto) => void
}

function OverrideDialog({ open, tenantRecord, currentPlan, onClose, onOverridden }: OverrideDialogProps) {
  const [plans, setPlans]       = useState<SubscriptionPlanDto[]>([])
  const [selected, setSelected] = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    getSubscriptionPlans().then(setPlans).catch(() => {})
    setSelected(currentPlan)
    setError(null)
  }, [open, currentPlan])

  async function handleSave() {
    if (!selected || selected === currentPlan) return
    setSaving(true); setError(null)
    try {
      const result = await overrideTenantSubscription(tenantRecord.tenant_id, selected)
      onOverridden(result)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Override failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle>Override Subscription Plan</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <Typography variant='body2' color='text.secondary'>
          Changing the plan takes effect immediately with no proration. Use with caution.
        </Typography>
        <TextField
          select
          label='New Plan'
          size='small'
          fullWidth
          value={selected}
          onChange={e => setSelected(e.target.value)}
          disabled={saving || plans.length === 0}
        >
          {plans.map(p => (
            <MenuItem key={p.id} value={p.name}>
              {p.displayName}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained'
          color='warning'
          onClick={handleSave}
          disabled={saving || !selected || selected === currentPlan}
          startIcon={saving ? <CircularProgress size={14} color='inherit' /> : undefined}
        >
          Override
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Offboard dialog — two-step: warning → type slug to confirm
// ---------------------------------------------------------------------------

interface OffboardDialogProps {
  open: boolean
  tenant: TenantRecord
  onClose: () => void
  onOffboarded: () => void
}

function OffboardDialog({ open, tenant, onClose, onOffboarded }: OffboardDialogProps) {
  const [step, setStep]           = useState<1 | 2>(1)
  const [confirmInput, setConfirmInput] = useState('')
  const [deleting, setDeleting]   = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // Reset when re-opened
  useEffect(() => {
    if (open) { setStep(1); setConfirmInput(''); setError(null) }
  }, [open])

  async function handleDelete() {
    if (confirmInput !== tenant.tenant_id) return
    setDeleting(true); setError(null)
    try {
      await offboardTenant(tenant.id, tenant.tenant_id)
      onOffboarded()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Offboard failed')
      setDeleting(false)
    }
  }

  return (
    <Dialog open={open} onClose={deleting ? undefined : onClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
        <i className='ri-delete-bin-line' />
        {step === 1 ? 'Offboard Tenant' : 'Confirm Permanent Deletion'}
      </DialogTitle>

      <DialogContent>
        {step === 1 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity='error' icon={<i className='ri-error-warning-line' />}>
              <strong>This action is permanent and cannot be undone.</strong>
            </Alert>
            <Typography variant='body2'>
              Offboarding <strong>{tenant.name}</strong> ({tenant.tenant_id}) will permanently delete:
            </Typography>
            <Box component='ul' sx={{ pl: 2, m: 0, '& li': { mb: 0.5 } }}>
              {[
                'All properties, units, agreements and occupants',
                'All invoices, payments, wallet and financial data',
                'All maintenance requests, inspections and utilities',
                'All users and their access credentials',
                'Subscription, support notes and feature flag overrides',
                'All communications, documents and notifications',
              ].map(item => (
                <li key={item}>
                  <Typography variant='body2'>{item}</Typography>
                </li>
              ))}
            </Box>
            <Typography variant='body2' color='text.secondary'>
              This cannot be reversed. Proceed only if you are certain.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity='error'>{error}</Alert>}
            <Typography variant='body2'>
              Type the tenant ID <strong style={{ fontFamily: 'monospace' }}>{tenant.tenant_id}</strong> to confirm deletion:
            </Typography>
            <TextField
              fullWidth
              size='small'
              autoFocus
              placeholder={tenant.tenant_id}
              value={confirmInput}
              onChange={e => setConfirmInput(e.target.value)}
              disabled={deleting}
              slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
              error={confirmInput.length > 0 && confirmInput !== tenant.tenant_id}
              helperText={confirmInput.length > 0 && confirmInput !== tenant.tenant_id ? 'Does not match' : ' '}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>Cancel</Button>
        {step === 1 ? (
          <Button variant='contained' color='error' onClick={() => setStep(2)}>
            I understand, continue
          </Button>
        ) : (
          <Button
            variant='contained'
            color='error'
            onClick={handleDelete}
            disabled={deleting || confirmInput !== tenant.tenant_id}
            startIcon={deleting ? <CircularProgress size={14} color='inherit' /> : <i className='ri-delete-bin-line' />}
          >
            {deleting ? 'Deleting…' : 'Delete permanently'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Compose message dialog
// ---------------------------------------------------------------------------

interface ComposeMessageDialogProps {
  open: boolean
  tenant: TenantRecord
  onClose: () => void
  onSent: (recipientEmail: string) => void
}

function ComposeMessageDialog({ open, tenant, onClose, onSent }: ComposeMessageDialogProps) {
  const [subject, setSubject] = useState('')
  const [body, setBody]       = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (open) { setSubject(''); setBody(''); setError(null) }
  }, [open])

  async function handleSend() {
    if (!subject.trim() || !body.trim()) return
    setSending(true); setError(null)
    try {
      const result = await sendAdminDirectMessage(tenant.id, subject.trim(), body.trim())
      onSent(result.recipientEmail)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onClose={sending ? undefined : onClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <i className='ri-mail-send-line' />
        Message {tenant.name}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <Typography variant='caption' color='text.secondary'>
          Sends an email to the primary admin contact of <strong>{tenant.name}</strong>.
        </Typography>
        <TextField
          label='Subject'
          size='small'
          fullWidth
          value={subject}
          onChange={e => setSubject(e.target.value)}
          disabled={sending}
          autoFocus
        />
        <TextField
          label='Message'
          size='small'
          fullWidth
          multiline
          rows={6}
          value={body}
          onChange={e => setBody(e.target.value)}
          disabled={sending}
          placeholder='Write your message here…'
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSend}
          disabled={sending || !subject.trim() || !body.trim()}
          startIcon={sending ? <CircularProgress size={14} color='inherit' /> : <i className='ri-send-plane-line' />}
        >
          {sending ? 'Sending…' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Reset password dialog
// ---------------------------------------------------------------------------

interface ResetPasswordDialogProps {
  open: boolean
  tenant: TenantRecord
  onClose: () => void
  onSent: (recipientEmail: string) => void
}

function ResetPasswordDialog({ open, tenant, onClose, onSent }: ResetPasswordDialogProps) {
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (open) setError(null)
  }, [open])

  async function handleSend() {
    setSending(true); setError(null)
    try {
      const result = await resetTenantPassword(tenant.id)
      onSent(result.recipientEmail)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to send reset email')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onClose={sending ? undefined : onClose} maxWidth='xs' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <i className='ri-lock-password-line' />
        Reset Tenant Password
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <Typography variant='body2'>
          This will send a <strong>password reset OTP email</strong> to the primary admin contact of{' '}
          <strong>{tenant.name}</strong>.
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          The recipient completes the reset themselves using the emailed code. No passwords are
          changed on your behalf.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={sending}>Cancel</Button>
        <Button
          variant='contained'
          color='warning'
          onClick={handleSend}
          disabled={sending}
          startIcon={sending ? <CircularProgress size={14} color='inherit' /> : <i className='ri-mail-lock-line' />}
        >
          {sending ? 'Sending…' : 'Send Reset Email'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminTenantDetailView({ tenantId }: { tenantId: string }) {
  const router = useRouter()
  const { hasPermission } = useAdminAuth()
  const canManage = hasPermission('manage_tenants')

  // ── Core tenant ───────────────────────────────────────────────────────────
  const [tenant, setTenant]               = useState<TenantRecord | null>(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)

  // ── Subscription ─────────────────────────────────────────────────────────
  const [sub, setSub]                     = useState<TenantSubscriptionDto | null>(null)
  const [subLoading, setSubLoading]       = useState(true)
  const [planHistory, setPlanHistory]     = useState<PlanChangeDto[]>([])
  const [historyExpanded, setHistoryExpanded] = useState(false)

  // ── Snapshot counts ───────────────────────────────────────────────────────
  const [snap, setSnap]                   = useState<AdminTenantSnapshotDto | null>(null)
  const [snapLoading, setSnapLoading]     = useState(true)

  // ── Support notes ─────────────────────────────────────────────────────────
  const [notes, setNotes]                 = useState<TenantNoteDto[]>([])
  const [notesLoading, setNotesLoading]   = useState(true)
  const [newNote, setNewNote]             = useState('')
  const [addingNote, setAddingNote]       = useState(false)

  // ── Feature flags ─────────────────────────────────────────────────────────
  const [flags, setFlags]                 = useState<FeatureFlagStatus[]>([])
  const [flagsLoading, setFlagsLoading]   = useState(true)
  const [flagsSaving, setFlagsSaving]     = useState<string | null>(null) // featureKey being saved

  // ── Dialog state ──────────────────────────────────────────────────────────
  // ── Login history ──────────────────────────────────────────────────────────
  const [loginHistory, setLoginHistory]         = useState<LoginHistoryItem[]>([])
  const [loginHistoryLoading, setLoginHistoryLoading] = useState(true)
  const [loginHistoryFilter, setLoginHistoryFilter]   = useState<'all' | 'success' | 'failure'>('all')
  const [loginHistoryPage, setLoginHistoryPage] = useState(0)
  const [loginHistoryTotal, setLoginHistoryTotal] = useState(0)

  // ── Invoice history ────────────────────────────────────────────────────────
  const [invoices, setInvoices]                 = useState<AdminInvoiceDto[]>([])
  const [invoicesLoading, setInvoicesLoading]   = useState(true)
  const [invoicesPage, setInvoicesPage]         = useState(0)
  const [invoicesTotal, setInvoicesTotal]       = useState(0)
  const [invoicesTotalPages, setInvoicesTotalPages] = useState(0)

  // ── API keys ───────────────────────────────────────────────────────────────
  const [apiKeys, setApiKeys]                   = useState<ApiKeyDto[]>([])
  const [apiKeysLoading, setApiKeysLoading]     = useState(true)
  const [newKeyName, setNewKeyName]             = useState('')
  const [generatedKey, setGeneratedKey]         = useState<ApiKeyCreatedDto | null>(null)
  const [generatingKey, setGeneratingKey]       = useState(false)
  const [exportingData, setExportingData]       = useState(false)

  const [editOpen, setEditOpen]           = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [reactivateOpen, setReactivateOpen] = useState(false)
  const [overrideOpen, setOverrideOpen]   = useState(false)
  const [offboardOpen, setOffboardOpen]         = useState(false)
  const [messageOpen, setMessageOpen]           = useState(false)
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false)
  const [toast, setToast]                       = useState<string | null>(null)

  // ── Load tenant ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      setLoading(true); setError(null)
      try {
        const data = await getAdminTenant(tenantId)
        setTenant(data)
        // Kick off secondary loads in parallel once we have tenant_id
        loadSub(data.tenant_id)
        loadSnap(tenantId)
        loadNotes(data.tenant_id)
        loadFlags(data.tenant_id)
        loadLoginHistory(data.tenant_id)
        loadApiKeys(data.tenant_id)
        loadInvoices(data.tenant_id)
      } catch (e: any) {
        setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load tenant')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [tenantId])

  async function loadSub(tenantSlug: string) {
    setSubLoading(true)
    try {
      const [subData, history] = await Promise.all([
        getAdminTenantSubscription(tenantSlug),
        getTenantPlanHistory(tenantSlug).catch(() => []),
      ])
      setSub(subData)
      setPlanHistory(history)
    } catch {
      setSub(null)
    } finally {
      setSubLoading(false)
    }
  }

  async function loadSnap(uuid: string) {
    setSnapLoading(true)
    try { setSnap(await getAdminTenantSnapshot(uuid)) }
    catch { setSnap(null) }
    finally { setSnapLoading(false) }
  }

  async function loadNotes(tenantSlug: string) {
    setNotesLoading(true)
    try { setNotes(await getTenantNotes(tenantSlug)) }
    catch { setNotes([]) }
    finally { setNotesLoading(false) }
  }

  async function loadFlags(tenantSlug: string) {
    setFlagsLoading(true)
    try { setFlags(await getTenantFeatureFlags(tenantSlug)) }
    catch { setFlags([]) }
    finally { setFlagsLoading(false) }
  }

  async function loadLoginHistory(tenantSlug: string, page = 0, filter: 'all' | 'success' | 'failure' = 'all') {
    setLoginHistoryLoading(true)
    try {
      const successParam = filter === 'all' ? undefined : filter === 'success'
      const data = await getTenantLoginHistory(tenantSlug, { success: successParam, page, size: 10 })
      setLoginHistory(data.items)
      setLoginHistoryTotal(data.totalItems)
      setLoginHistoryPage(page)
    } catch { setLoginHistory([]) }
    finally { setLoginHistoryLoading(false) }
  }

  async function loadInvoices(tenantSlug: string, page = 0) {
    setInvoicesLoading(true)
    try {
      const data = await getTenantInvoices(tenantSlug, page, 10)
      setInvoices(data.data)
      setInvoicesTotal(data.totalElements)
      setInvoicesTotalPages(data.totalPages)
      setInvoicesPage(page)
    } catch { setInvoices([]) }
    finally { setInvoicesLoading(false) }
  }

  async function loadApiKeys(tenantSlug: string) {
    setApiKeysLoading(true)
    try { setApiKeys(await getTenantApiKeys(tenantSlug)) }
    catch { setApiKeys([]) }
    finally { setApiKeysLoading(false) }
  }

  async function handleGenerateKey() {
    if (!tenant || !newKeyName.trim()) return
    setGeneratingKey(true)
    try {
      const created = await generateTenantApiKey(tenant.tenant_id, { name: newKeyName.trim() })
      setGeneratedKey(created)
      setNewKeyName('')
      loadApiKeys(tenant.tenant_id)
    } catch { setToast('Failed to generate API key') }
    finally { setGeneratingKey(false) }
  }

  async function handleRevokeKey(keyId: string) {
    if (!tenant) return
    try {
      await revokeTenantApiKey(tenant.tenant_id, keyId)
      setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, active: false } : k))
      setToast('API key revoked')
    } catch { setToast('Failed to revoke API key') }
  }

  async function handleExportData() {
    if (!tenant) return
    setExportingData(true)
    try {
      await exportTenantData(tenant.tenant_id)
      setToast('Data export downloaded')
    } catch { setToast('Export failed') }
    finally { setExportingData(false) }
  }

  async function handleToggleFlag(featureKey: string, currentEffective: boolean) {
    if (!tenant || !canManage) return
    const newEnabled = !currentEffective
    setFlagsSaving(featureKey)
    try {
      const updated = await setTenantFeatureFlagOverride(tenant.tenant_id, featureKey, newEnabled)
      setFlags(prev => prev.map(f => f.featureKey === featureKey ? updated : f))
    } catch {
      setToast('Failed to update feature flag')
    } finally {
      setFlagsSaving(null)
    }
  }

  async function handleClearFlagOverride(featureKey: string) {
    if (!tenant || !canManage) return
    setFlagsSaving(featureKey)
    try {
      await removeTenantFeatureFlagOverride(tenant.tenant_id, featureKey)
      // Reload to get fresh planDefault-based values
      await loadFlags(tenant.tenant_id)
    } catch {
      setToast('Failed to clear override')
    } finally {
      setFlagsSaving(null)
    }
  }

  async function handleAddNote() {
    if (!newNote.trim() || !tenant) return
    setAddingNote(true)
    try {
      const note = await addTenantNote(tenant.tenant_id, newNote.trim())
      setNotes(prev => [note, ...prev])
      setNewNote('')
    } catch {
      setToast('Failed to add note')
    } finally {
      setAddingNote(false)
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!tenant) return
    try {
      await deleteTenantNote(tenant.tenant_id, noteId)
      setNotes(prev => prev.filter(n => n.id !== noteId))
    } catch {
      setToast('Failed to delete note')
    }
  }

  // ── Offboard ──────────────────────────────────────────────────────────────
  function handleOffboarded() {
    router.push('/admin/tenants')
  }

  // ── Actions ───────────────────────────────────────────────────────────────
  async function handleDeactivate() {
    if (!tenant) return
    await deactivateAdminTenant(tenant.id)
    setTenant(prev => prev ? { ...prev, active: false } : prev)
    setDeactivateOpen(false)
    setToast('Tenant deactivated')
  }

  async function handleReactivate() {
    if (!tenant) return
    const updated = await reactivateAdminTenant(tenant.id)
    setTenant(updated)
    setReactivateOpen(false)
    setToast('Tenant reactivated')
  }

  // ── Loading / error ───────────────────────────────────────────────────────
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
  }

  if (error || !tenant) {
    return (
      <Box>
        <Button startIcon={<i className='ri-arrow-left-line' />} onClick={() => router.back()} sx={{ mb: 2 }}>Back</Button>
        <Alert severity='error'>{error ?? 'Tenant not found'}</Alert>
      </Box>
    )
  }

  const occupancyPct = snap && snap.totalUnits > 0
    ? Math.round((snap.occupiedUnits / snap.totalUnits) * 100)
    : null

  return (
    <Box>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <Tooltip title='Back to Tenants'>
          <IconButton onClick={() => router.push('/admin/tenants')}>
            <i className='ri-arrow-left-line' />
          </IconButton>
        </Tooltip>
        <Box sx={{ flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant='h5' fontWeight={700}>{tenant.name}</Typography>
            <Chip size='small' label={tenant.active ? 'Active' : 'Inactive'} color={tenant.active ? 'success' : 'default'} variant='outlined' />
          </Box>
          <Typography variant='body2' color='text.secondary' sx={{ fontFamily: 'monospace', mt: 0.25 }}>
            {tenant.tenant_id}
          </Typography>
        </Box>

        {canManage && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant='outlined' startIcon={<i className='ri-pencil-line' />} onClick={() => setEditOpen(true)}>Edit</Button>
            <Button variant='outlined' startIcon={<i className='ri-mail-send-line' />} onClick={() => setMessageOpen(true)}>Message</Button>
            <Button variant='outlined' color='warning' startIcon={<i className='ri-lock-password-line' />} onClick={() => setResetPasswordOpen(true)}>Reset Password</Button>
            {tenant.active ? (
              <Button variant='outlined' color='error' startIcon={<i className='ri-forbid-line' />} onClick={() => setDeactivateOpen(true)}>Deactivate</Button>
            ) : (
              <Button variant='outlined' color='success' startIcon={<i className='ri-checkbox-circle-line' />} onClick={() => setReactivateOpen(true)}>Reactivate</Button>
            )}
            <Tooltip title='Permanently delete this tenant and all data'>
              <Button
                variant='contained'
                color='error'
                startIcon={<i className='ri-delete-bin-line' />}
                onClick={() => setOffboardOpen(true)}
                sx={{ ml: 1 }}
              >
                Offboard
              </Button>
            </Tooltip>
          </Box>
        )}
      </Box>

      {/* ── Snapshot mini-cards ──────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard label='Properties' value={snap?.propertyCount ?? '—'} icon='ri-building-2-line' color='primary' loading={snapLoading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label='Total Units' value={snap?.totalUnits ?? '—'} icon='ri-door-line' color='info' loading={snapLoading} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            label='Occupancy'
            value={snapLoading ? '—' : (occupancyPct !== null ? `${occupancyPct}%` : '—')}
            icon='ri-home-heart-line'
            color='success'
            loading={snapLoading}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label='Team Members' value={snap?.teamMemberCount ?? '—'} icon='ri-group-line' color='warning' loading={snapLoading} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ── Tenant info ─────────────────────────────────────────────────────── */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='subtitle2' fontWeight={600} gutterBottom>Tenant Information</Typography>
              <Divider sx={{ mb: 1 }} />

              <InfoRow label='Tenant ID'>
                <Typography variant='body2' sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 0.75, py: 0.25, borderRadius: 0.5, display: 'inline' }}>
                  {tenant.tenant_id}
                </Typography>
              </InfoRow>
              <Divider />
              <InfoRow label='Company Name'>
                <Typography variant='body2' fontWeight={600}>{tenant.name}</Typography>
              </InfoRow>
              <Divider />
              <InfoRow label='Description'>
                <Typography variant='body2' color={tenant.description ? 'text.primary' : 'text.disabled'}>
                  {tenant.description ?? '—'}
                </Typography>
              </InfoRow>
              <Divider />
              <InfoRow label='Status'>
                <Chip size='small' label={tenant.active ? 'Active' : 'Inactive'} color={tenant.active ? 'success' : 'default'} variant='outlined' />
              </InfoRow>
              <Divider />
              <InfoRow label='Registered'>
                <Typography variant='body2'>{formatDate(tenant.createdAt)}</Typography>
              </InfoRow>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Subscription ────────────────────────────────────────────────────── */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant='subtitle2' fontWeight={600}>Subscription</Typography>
                {canManage && sub && (
                  <Tooltip title='Override plan'>
                    <Button
                      size='small'
                      variant='outlined'
                      color='warning'
                      startIcon={<i className='ri-exchange-line' />}
                      onClick={() => setOverrideOpen(true)}
                    >
                      Override
                    </Button>
                  </Tooltip>
                )}
              </Box>
              <Divider sx={{ mb: 1 }} />

              {subLoading ? (
                <>
                  <Skeleton variant='text' width='60%' />
                  <Skeleton variant='text' width='40%' />
                  <Skeleton variant='text' width='50%' />
                </>
              ) : sub ? (
                <>
                  <InfoRow label='Plan'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body2' fontWeight={600}>{sub.displayName}</Typography>
                      <Chip size='small' label={sub.plan} variant='tonal' color='primary' />
                    </Box>
                  </InfoRow>
                  <Divider />
                  <InfoRow label='Status'>
                    <Chip size='small' label={sub.status} color={subscriptionStatusColor(sub.status)} variant='tonal' />
                  </InfoRow>
                  <Divider />
                  <InfoRow label='Unit Cap'>
                    <Typography variant='body2'>{sub.unitCap ?? 'Unlimited'}</Typography>
                  </InfoRow>
                  <Divider />
                  <InfoRow label='Current Period'>
                    <Typography variant='body2'>
                      {sub.currentPeriodStart && sub.currentPeriodEnd
                        ? `${formatDate(sub.currentPeriodStart)} → ${formatDate(sub.currentPeriodEnd)}`
                        : '—'}
                    </Typography>
                  </InfoRow>
                  {sub.pendingDowngradePlan && (
                    <>
                      <Divider />
                      <InfoRow label='Pending Downgrade'>
                        <Chip size='small' label={sub.pendingDowngradePlan} color='warning' variant='outlined' />
                      </InfoRow>
                    </>
                  )}
                  {sub.cancelledAt && (
                    <>
                      <Divider />
                      <InfoRow label='Cancelled'>
                        <Typography variant='body2' color='error.main'>{formatDate(sub.cancelledAt)}</Typography>
                      </InfoRow>
                    </>
                  )}
                </>
              ) : (
                <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
                  No subscription found for this tenant.
                </Typography>
              )}

              {/* ── Plan Change History ─────────────────────────────────────── */}
              {!subLoading && (
                <>
                  <Divider sx={{ mt: 1 }} />
                  <Box
                    sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', pt: 1.5, pb: historyExpanded ? 0 : 0.5 }}
                    onClick={() => setHistoryExpanded(v => !v)}
                  >
                    <i
                      className={historyExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'}
                      style={{ fontSize: '1rem', marginRight: 6, opacity: 0.6 }}
                    />
                    <Typography variant='caption' color='text.secondary' fontWeight={600}>
                      Plan Change History {planHistory.length > 0 && `(${planHistory.length})`}
                    </Typography>
                  </Box>
                  <Collapse in={historyExpanded}>
                    {planHistory.length === 0 ? (
                      <Typography variant='caption' color='text.disabled' sx={{ display: 'block', py: 1, pl: 0.5 }}>
                        No plan changes recorded yet.
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, pt: 0.5, pb: 1 }}>
                        {planHistory.map(change => (
                          <Box
                            key={change.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              px: 1,
                              py: 0.75,
                              borderRadius: 1,
                              bgcolor: 'action.hover',
                              flexWrap: 'wrap',
                            }}
                          >
                            <i className='ri-exchange-line' style={{ fontSize: '0.8rem', opacity: 0.5, flexShrink: 0 }} />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {change.fromPlan ? (
                                <Chip size='small' label={change.fromPlan} variant='outlined' sx={{ height: 18, fontSize: '0.65rem' }} />
                              ) : (
                                <Typography variant='caption' color='text.disabled'>—</Typography>
                              )}
                              <i className='ri-arrow-right-line' style={{ fontSize: '0.7rem', opacity: 0.4 }} />
                              <Chip size='small' label={change.toPlan} color='primary' variant='tonal' sx={{ height: 18, fontSize: '0.65rem' }} />
                            </Box>
                            <Typography variant='caption' color='text.secondary' sx={{ ml: 'auto' }}>
                              {new Date(change.changedAt).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Collapse>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Feature Flag Overrides ──────────────────────────────────────────── */}
      <Card variant='outlined' sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-flag-line' style={{ fontSize: '1.15rem', opacity: 0.7 }} />
            <Typography variant='subtitle1' fontWeight={700}>Feature Flag Overrides</Typography>
            {flags.some(f => f.overrideEnabled !== null) && (
              <Chip
                size='small'
                label={`${flags.filter(f => f.overrideEnabled !== null).length} overridden`}
                color='warning'
                variant='tonal'
                sx={{ ml: 'auto' }}
              />
            )}
          </Box>

          {flagsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1, 2, 3, 4].map(i => <Skeleton key={i} variant='rectangular' height={44} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : (
            <Box>
              {flags.map((flag, idx) => {
                const isSaving = flagsSaving === flag.featureKey
                const isOverridden = flag.overrideEnabled !== null
                return (
                  <Box key={flag.featureKey}>
                    {idx > 0 && <Divider />}
                    <Box sx={{ display: 'flex', alignItems: 'center', py: 1, gap: 2 }}>
                      {/* Feature name */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant='body2' fontWeight={isOverridden ? 600 : 400}>
                          {FEATURE_LABELS[flag.featureKey] ?? flag.featureKey}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                          <Typography variant='caption' color='text.secondary'>Plan default:</Typography>
                          <Chip
                            size='small'
                            label={flag.planDefault ? 'On' : 'Off'}
                            color={flag.planDefault ? 'success' : 'default'}
                            variant='outlined'
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                          {isOverridden && (
                            <Chip
                              size='small'
                              label='Overridden'
                              color='warning'
                              variant='tonal'
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* Clear override button */}
                      {canManage && isOverridden && (
                        <Tooltip title='Clear override (revert to plan default)'>
                          <IconButton
                            size='small'
                            onClick={() => handleClearFlagOverride(flag.featureKey)}
                            disabled={!!flagsSaving}
                            sx={{ color: 'text.secondary' }}
                          >
                            <i className='ri-refresh-line' style={{ fontSize: '0.9rem' }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* Toggle switch */}
                      {isSaving ? (
                        <CircularProgress size={20} sx={{ mx: 0.5 }} />
                      ) : (
                        <Switch
                          size='small'
                          checked={flag.effectiveEnabled}
                          onChange={() => handleToggleFlag(flag.featureKey, flag.effectiveEnabled)}
                          disabled={!canManage || !!flagsSaving}
                          color={isOverridden ? 'warning' : 'success'}
                        />
                      )}
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )}

          {!flagsLoading && !canManage && (
            <Typography variant='caption' color='text.secondary' sx={{ mt: 1, display: 'block' }}>
              Read-only — requires manage_tenants permission to toggle overrides.
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* ── Support Notes ───────────────────────────────────────────────────── */}
      <Card variant='outlined' sx={{ mt: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-sticky-note-line' style={{ fontSize: '1.15rem', opacity: 0.7 }} />
            <Typography variant='subtitle1' fontWeight={700}>Support Notes</Typography>
            <Chip size='small' label={notes.length} variant='outlined' sx={{ ml: 'auto' }} />
          </Box>

          {/* Add note input */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              maxRows={6}
              size='small'
              placeholder='Add an internal note about this tenant…'
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddNote() }}
            />
            <Button
              variant='contained'
              size='small'
              disabled={!newNote.trim() || addingNote}
              onClick={handleAddNote}
              sx={{ alignSelf: 'flex-end', minWidth: 72 }}
            >
              {addingNote ? 'Adding…' : 'Add'}
            </Button>
          </Box>

          {/* Notes list */}
          {notesLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1, 2].map(i => <Skeleton key={i} variant='rectangular' height={60} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : notes.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <Typography variant='body2' color='text.disabled'>No notes yet</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {notes.map(note => (
                <Box
                  key={note.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                    position: 'relative',
                    '&:hover .note-delete': { opacity: 1 },
                  }}
                >
                  <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap', mb: 0.75 }}>
                    {note.body}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <i className='ri-user-line' style={{ fontSize: '0.75rem', opacity: 0.5 }} />
                    <Typography variant='caption' color='text.secondary'>{note.authorName}</Typography>
                    <Typography variant='caption' color='text.disabled' sx={{ ml: 0.5 }}>
                      · {new Date(note.createdAt).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' })}
                    </Typography>
                    {canManage && (
                      <Tooltip title='Delete note'>
                        <IconButton
                          size='small'
                          className='note-delete'
                          onClick={() => handleDeleteNote(note.id)}
                          sx={{ ml: 'auto', opacity: 0, transition: 'opacity 0.15s', color: 'error.main' }}
                        >
                          <i className='ri-delete-bin-line' style={{ fontSize: '0.9rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Login History ────────────────────────────────────────────────────── */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant='h6'>Login History</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {(['all', 'success', 'failure'] as const).map(f => (
                <Chip
                  key={f}
                  label={f.charAt(0).toUpperCase() + f.slice(1)}
                  size='small'
                  variant={loginHistoryFilter === f ? 'filled' : 'outlined'}
                  color={f === 'success' ? 'success' : f === 'failure' ? 'error' : 'default'}
                  onClick={() => {
                    setLoginHistoryFilter(f)
                    if (tenant) loadLoginHistory(tenant.tenant_id, 0, f)
                  }}
                />
              ))}
            </Box>
          </Box>

          {loginHistoryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} />
            </Box>
          ) : loginHistory.length === 0 ? (
            <Typography variant='body2' color='text.secondary' sx={{ py: 2, textAlign: 'center' }}>
              No login attempts found.
            </Typography>
          ) : (
            <>
              {/* Table header */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 2fr 80px 160px', gap: 1, px: 1, mb: 0.5 }}>
                {['Email', 'IP Address', 'User Agent', 'Result', 'Time'].map(h => (
                  <Typography key={h} variant='caption' color='text.secondary' fontWeight={600}>{h}</Typography>
                ))}
              </Box>
              <Divider sx={{ mb: 1 }} />
              {loginHistory.map((item, idx) => (
                <Box
                  key={item.id ?? idx}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.2fr 2fr 80px 160px',
                    gap: 1,
                    px: 1,
                    py: 0.75,
                    borderRadius: 1,
                    '&:hover': { bgcolor: 'action.hover' },
                    alignItems: 'center',
                  }}
                >
                  <Typography variant='body2' noWrap title={item.email}>{item.email}</Typography>
                  <Typography variant='body2' noWrap sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                    {item.ipAddress ?? '—'}
                  </Typography>
                  <Typography variant='body2' noWrap title={item.userAgent ?? ''} color='text.secondary' sx={{ fontSize: '0.75rem' }}>
                    {item.userAgent ?? '—'}
                  </Typography>
                  <Chip
                    label={item.success ? 'OK' : item.failureReason ?? 'FAIL'}
                    size='small'
                    color={item.success ? 'success' : 'error'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                  <Typography variant='body2' sx={{ fontSize: '0.75rem' }} color='text.secondary'>
                    {new Date(item.createdAt).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                  </Typography>
                </Box>
              ))}

              {/* Pagination */}
              {loginHistoryTotal > 10 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: 2, gap: 1 }}>
                  <Typography variant='body2' color='text.secondary'>
                    Page {loginHistoryPage + 1} of {Math.ceil(loginHistoryTotal / 10)}
                  </Typography>
                  <Button
                    size='small'
                    disabled={loginHistoryPage === 0}
                    onClick={() => tenant && loadLoginHistory(tenant.tenant_id, loginHistoryPage - 1, loginHistoryFilter)}
                  >
                    Prev
                  </Button>
                  <Button
                    size='small'
                    disabled={(loginHistoryPage + 1) * 10 >= loginHistoryTotal}
                    onClick={() => tenant && loadLoginHistory(tenant.tenant_id, loginHistoryPage + 1, loginHistoryFilter)}
                  >
                    Next
                  </Button>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── API Keys ─────────────────────────────────────────────────────────── */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 2 }}>API Keys</Typography>

          {/* Generate new key */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <TextField
              size='small'
              label='Key name'
              placeholder='e.g. Zapier integration'
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              sx={{ flex: 1 }}
              onKeyDown={e => { if (e.key === 'Enter') handleGenerateKey() }}
            />
            <Button
              variant='contained'
              size='small'
              onClick={handleGenerateKey}
              disabled={!newKeyName.trim() || generatingKey}
              startIcon={generatingKey ? <CircularProgress size={14} color='inherit' /> : <i className='ri-key-line' />}
            >
              Generate
            </Button>
          </Box>

          {apiKeysLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : apiKeys.length === 0 ? (
            <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center', py: 2 }}>
              No API keys yet.
            </Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {/* Header */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 140px 80px', gap: 1, px: 1 }}>
                {['Name', 'Prefix', 'Created', 'Last Used', ''].map(h => (
                  <Typography key={h} variant='caption' color='text.secondary' fontWeight={600}>{h}</Typography>
                ))}
              </Box>
              <Divider />
              {apiKeys.map(k => (
                <Box
                  key={k.id}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 140px 140px 80px',
                    gap: 1,
                    px: 1,
                    py: 0.75,
                    alignItems: 'center',
                    borderRadius: 1,
                    opacity: k.active ? 1 : 0.5,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant='body2'>{k.name}</Typography>
                    {!k.active && <Chip label='Revoked' size='small' color='default' sx={{ fontSize: '0.65rem' }} />}
                  </Box>
                  <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{k.keyPrefix}…</Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>
                    {formatDate(k.createdAt)}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>
                    {k.lastUsedAt ? formatDate(k.lastUsedAt) : '—'}
                  </Typography>
                  <Box>
                    {k.active && (
                      <Tooltip title='Revoke key'>
                        <IconButton size='small' color='error' onClick={() => handleRevokeKey(k.id)}>
                          <i className='ri-delete-bin-line' style={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Invoice History ───────────────────────────────────────────────────── */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant='h6'>Invoice History</Typography>
            {tenant && (
              <Button
                size='small'
                variant='outlined'
                href={`/admin/invoices?tenantId=${tenant.tenant_id}`}
                target='_blank'
                startIcon={<i className='ri-external-link-line' />}
              >
                View All
              </Button>
            )}
          </Box>

          {invoicesLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[...Array(3)].map((_, i) => <Skeleton key={i} variant='rectangular' height={40} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : invoices.length === 0 ? (
            <Typography variant='body2' color='text.secondary'>No invoices found for this tenant.</Typography>
          ) : (
            <Box>
              {/* Header row */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 100px 80px 110px',
                  gap: 1,
                  px: 1,
                  pb: 0.5,
                }}
              >
                {['Period', 'Type', 'Amount', 'Status', 'Date'].map(h => (
                  <Typography key={h} variant='caption' color='text.secondary' fontWeight={600}>{h}</Typography>
                ))}
              </Box>
              <Divider />
              {invoices.map(inv => {
                const statusColor: 'success' | 'error' | 'warning' | 'default' =
                  inv.status === 'PAID'    ? 'success' :
                  inv.status === 'FAILED'  ? 'error' :
                  inv.status === 'PENDING' ? 'warning' : 'default'
                return (
                  <Box
                    key={inv.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 100px 100px 80px 110px',
                      gap: 1,
                      px: 1,
                      py: 0.75,
                      alignItems: 'center',
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>
                      {formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}
                    </Typography>
                    <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>
                      {inv.invoiceType === 'RENEWAL' ? 'Renewal' : 'Upgrade'}
                    </Typography>
                    <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      GHS {inv.totalAmount.toFixed(2)}
                    </Typography>
                    <Chip label={inv.status} size='small' color={statusColor} sx={{ fontSize: '0.65rem', height: 20 }} />
                    <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>
                      {formatDate(inv.createdAt)}
                    </Typography>
                  </Box>
                )
              })}

              {/* Pagination */}
              {invoicesTotalPages > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mt: 1 }}>
                  <Typography variant='caption' color='text.secondary'>
                    {invoicesPage * 10 + 1}–{Math.min((invoicesPage + 1) * 10, invoicesTotal)} of {invoicesTotal}
                  </Typography>
                  <IconButton
                    size='small'
                    disabled={invoicesPage === 0 || invoicesLoading}
                    onClick={() => tenant && loadInvoices(tenant.tenant_id, invoicesPage - 1)}
                  >
                    <i className='ri-arrow-left-s-line' style={{ fontSize: '1rem' }} />
                  </IconButton>
                  <IconButton
                    size='small'
                    disabled={invoicesPage >= invoicesTotalPages - 1 || invoicesLoading}
                    onClick={() => tenant && loadInvoices(tenant.tenant_id, invoicesPage + 1)}
                  >
                    <i className='ri-arrow-right-s-line' style={{ fontSize: '1rem' }} />
                  </IconButton>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Data Export (GDPR) ────────────────────────────────────────────────── */}
      <Card sx={{ mt: 4, mb: 4 }}>
        <CardContent>
          <Typography variant='h6' sx={{ mb: 1 }}>Data Export</Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Download a full JSON export of all tenant data — users, properties, units, occupants, invoices, and login
            history. Use for GDPR data-subject access requests or off-boarding.
          </Typography>
          <Button
            variant='outlined'
            onClick={handleExportData}
            disabled={exportingData}
            startIcon={exportingData
              ? <CircularProgress size={16} color='inherit' />
              : <i className='ri-download-2-line' />}
          >
            {exportingData ? 'Exporting…' : 'Export Data'}
          </Button>
        </CardContent>
      </Card>

      {/* ── Generated Key Dialog ─────────────────────────────────────────────── */}
      <Dialog open={!!generatedKey} onClose={() => setGeneratedKey(null)} maxWidth='sm' fullWidth>
        <DialogTitle>API Key Created</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Copy this key now — it will <strong>not</strong> be shown again.
          </DialogContentText>
          <Box
            sx={{
              bgcolor: 'action.selected',
              borderRadius: 1,
              p: 1.5,
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              wordBreak: 'break-all',
              userSelect: 'all',
              cursor: 'text',
            }}
          >
            {generatedKey?.key}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              navigator.clipboard.writeText(generatedKey?.key ?? '')
              setToast('Copied to clipboard')
            }}
            startIcon={<i className='ri-clipboard-line' />}
          >
            Copy
          </Button>
          <Button onClick={() => setGeneratedKey(null)} variant='contained'>Done</Button>
        </DialogActions>
      </Dialog>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}
      {editOpen && (
        <EditDialog
          open={editOpen}
          tenant={tenant}
          onClose={() => setEditOpen(false)}
          onSaved={updated => { setTenant(updated); setToast('Tenant updated') }}
        />
      )}

      <ConfirmDialog
        open={deactivateOpen}
        title='Deactivate Tenant'
        message={<>Deactivate <strong>{tenant.name}</strong>? Their users will lose access immediately.</>}
        confirmLabel='Deactivate'
        confirmColor='error'
        onClose={() => setDeactivateOpen(false)}
        onConfirm={handleDeactivate}
      />

      <ConfirmDialog
        open={reactivateOpen}
        title='Reactivate Tenant'
        message={<>Reactivate <strong>{tenant.name}</strong>? Their users will regain platform access immediately.</>}
        confirmLabel='Reactivate'
        confirmColor='success'
        onClose={() => setReactivateOpen(false)}
        onConfirm={handleReactivate}
      />

      {overrideOpen && sub && (
        <OverrideDialog
          open={overrideOpen}
          tenantRecord={tenant}
          currentPlan={sub.plan}
          onClose={() => setOverrideOpen(false)}
          onOverridden={updated => {
            setSub(updated)
            setToast(`Plan changed to ${updated.plan}`)
            getTenantPlanHistory(tenant.tenant_id).then(setPlanHistory).catch(() => {})
          }}
        />
      )}

      {offboardOpen && (
        <OffboardDialog
          open={offboardOpen}
          tenant={tenant}
          onClose={() => setOffboardOpen(false)}
          onOffboarded={handleOffboarded}
        />
      )}

      {messageOpen && (
        <ComposeMessageDialog
          open={messageOpen}
          tenant={tenant}
          onClose={() => setMessageOpen(false)}
          onSent={email => setToast(`Message sent to ${email}`)}
        />
      )}

      {resetPasswordOpen && (
        <ResetPasswordDialog
          open={resetPasswordOpen}
          tenant={tenant}
          onClose={() => setResetPasswordOpen(false)}
          onSent={email => setToast(`Password reset email sent to ${email}`)}
        />
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity='success' onClose={() => setToast(null)} sx={{ width: '100%' }}>{toast}</Alert>
      </Snackbar>
    </Box>
  )
}
