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
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import TablePagination from '@mui/material/TablePagination'
import Menu from '@mui/material/Menu'

import { createColumnHelper, flexRender, getCoreRowModel, useReactTable, getFilteredRowModel, getPaginationRowModel, getSortedRowModel } from '@tanstack/react-table'
import tableStyles from '@core/styles/table.module.css'

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
  adminRetryInvoice,
  adminVoidInvoice,
  getTenantUsers,
  deactivateAdminUser,
  reactivateAdminUser,
  resetAdminUserPassword,
  impersonateTenant,
  getTenantSessions,
  terminateSession,
  terminateAllSessions,
  getTenantProperties,
  getTenantUnits,
  getTenantOccupants,
  getTenantTeam,
  getTenantWallet,
  freezeTenantWallet,
  unfreezeTenantWallet,
  adjustTenantWallet,
  getTenantAgreements,
  getTenantPayments,
  getTenantInspections,
  getTenantMaintenance,
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
  type TenantUserDto,
  type SessionDto,
  type AdminPropertySummary,
  type AdminUnitSummary,
  type AdminOccupantSummary,
  type AdminTeamMemberSummary,
  type AdminWalletSummary,
  type AdminAgreementSummary,
  type AdminPaymentSummary,
  type AdminInspectionSummary,
  type AdminMaintenanceSummary,
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
// Impersonate dialog
// ---------------------------------------------------------------------------

interface ImpersonateDialogProps {
  open: boolean
  tenant: TenantRecord
  onClose: () => void
}

function ImpersonateDialog({ open, tenant, onClose }: ImpersonateDialogProps) {
  const [users, setUsers]           = useState<TenantUserDto[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [selectedUser, setSelectedUser] = useState('')
  const [reason, setReason]         = useState('')
  const [impersonating, setImpersonating] = useState(false)
  const [error, setError]           = useState<string | null>(null)

  useEffect(() => {
    if (!open) { setError(null); setSelectedUser(''); setReason(''); return }
    setLoadingUsers(true)
    getTenantUsers(tenant.tenant_id)
      .then(setUsers)
      .catch(() => setError('Failed to load tenant users'))
      .finally(() => setLoadingUsers(false))
  }, [open, tenant.tenant_id])

  async function handleImpersonate() {
    if (!selectedUser) return
    setImpersonating(true); setError(null)
    try {
      const res = await impersonateTenant(tenant.tenant_id, selectedUser, reason || undefined)
      // Extract the first role from JWT (roles claim is an array)
      const role = (res as any).role ?? selectedUserObj?.role ?? ''
      const url = `/auth/impersonate#token=${encodeURIComponent(res.accessToken)}&tenantId=${encodeURIComponent(res.targetTenantId)}&role=${encodeURIComponent(role)}`
      window.open(url, '_blank', 'noopener,noreferrer')
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Impersonation failed')
    } finally {
      setImpersonating(false)
    }
  }

  const selectedUserObj = users.find(u => u.id === selectedUser)

  return (
    <Dialog open={open} onClose={impersonating ? undefined : onClose} maxWidth='sm' fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <i className='ri-spy-line' />
        {`Impersonate user — ${tenant.name}`}
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity='error'>{error}</Alert>}
        <Alert severity='info' icon={<i className='ri-information-line' />}>
          Opens the tenant portal in a new tab logged in as the selected user. This action is fully logged.
        </Alert>
        <FormControl size='small' fullWidth disabled={loadingUsers || impersonating}>
          <InputLabel>Select user to impersonate</InputLabel>
          <Select
            label='Select user to impersonate'
            value={selectedUser}
            onChange={e => setSelectedUser(e.target.value)}
          >
            {loadingUsers ? (
              <MenuItem disabled value=''>Loading…</MenuItem>
            ) : users.length === 0 ? (
              <MenuItem disabled value=''>No users found</MenuItem>
            ) : (
              users.map(u => (
                <MenuItem key={u.id} value={u.id}>
                  <Box>
                    <Typography variant='body2'>{u.email}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {u.fullName} · {u.role}
                      {!u.active && ' · Inactive'}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>
        <TextField
          label='Reason (optional but recommended)'
          size='small'
          fullWidth
          multiline
          rows={2}
          value={reason}
          onChange={e => setReason(e.target.value)}
          disabled={impersonating}
          placeholder='e.g. Investigating support ticket #1234'
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={impersonating}>Cancel</Button>
        <Button
          variant='contained'
          color='warning'
          onClick={handleImpersonate}
          disabled={impersonating || !selectedUser}
          startIcon={impersonating
            ? <CircularProgress size={14} color='inherit' />
            : <i className='ri-open-arm-line' />
          }
        >
          {impersonating ? 'Opening…' : `Open as${selectedUserObj ? ` ${selectedUserObj.email.split('@')[0]}` : '…'}`}
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
  const [loginHistoryPageSize, setLoginHistoryPageSize] = useState(10)

  // ── Invoice history ────────────────────────────────────────────────────────
  const [invoices, setInvoices]                 = useState<AdminInvoiceDto[]>([])
  const [invoicesLoading, setInvoicesLoading]   = useState(true)
  const [invoicesPage, setInvoicesPage]         = useState(0)
  const [invoicesTotal, setInvoicesTotal]       = useState(0)
  const [invoicesTotalPages, setInvoicesTotalPages] = useState(0)
  const [invoicesPageSize, setInvoicesPageSize] = useState(10)
  const [retryingId, setRetryingId]             = useState<string | null>(null)
  const [voidConfirmInv, setVoidConfirmInv]     = useState<AdminInvoiceDto | null>(null)
  const [voidReason, setVoidReason]             = useState('')
  const [voidingId, setVoidingId]               = useState<string | null>(null)

  // ── API keys ───────────────────────────────────────────────────────────────
  const [apiKeys, setApiKeys]                   = useState<ApiKeyDto[]>([])
  const [apiKeysLoading, setApiKeysLoading]     = useState(true)
  const [newKeyName, setNewKeyName]             = useState('')
  const [generatedKey, setGeneratedKey]         = useState<ApiKeyCreatedDto | null>(null)
  const [generatingKey, setGeneratingKey]       = useState(false)
  const [exportingData, setExportingData]       = useState(false)

  // ── Impersonation ─────────────────────────────────────────────────────────
  const [impersonateOpen, setImpersonateOpen] = useState(false)

  // ── Sessions ──────────────────────────────────────────────────────────────
  const [sessions, setSessions]             = useState<SessionDto[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [terminatingSession, setTerminatingSession] = useState<string | null>(null)
  const [terminatingAll, setTerminatingAll] = useState(false)

  // ── Properties ────────────────────────────────────────────────────────────
  const [properties, setProperties]         = useState<AdminPropertySummary[]>([])
  const [propertiesLoading, setPropertiesLoading] = useState(false)
  const [propertiesTotal, setPropertiesTotal]     = useState(0)
  const [propertiesPage, setPropertiesPage]       = useState(0)
  const [propertiesPageSize, setPropertiesPageSize] = useState(10)

  // ── Units ─────────────────────────────────────────────────────────────────
  const [units, setUnits]                   = useState<AdminUnitSummary[]>([])
  const [unitsLoading, setUnitsLoading]     = useState(false)
  const [unitsTotal, setUnitsTotal]         = useState(0)
  const [unitsPage, setUnitsPage]           = useState(0)
  const [unitsPageSize, setUnitsPageSize]   = useState(10)

  // ── Occupants ─────────────────────────────────────────────────────────────
  const [occupants, setOccupants]           = useState<AdminOccupantSummary[]>([])
  const [occupantsLoading, setOccupantsLoading] = useState(false)
  const [occupantsTotal, setOccupantsTotal] = useState(0)
  const [occupantsPage, setOccupantsPage]   = useState(0)
  const [occupantsPageSize, setOccupantsPageSize] = useState(10)

  // ── Team ──────────────────────────────────────────────────────────────────
  const [team, setTeam]                     = useState<AdminTeamMemberSummary[]>([])
  const [teamLoading, setTeamLoading]       = useState(false)
  const [teamTotal, setTeamTotal]           = useState(0)
  const [teamPage, setTeamPage]             = useState(0)
  const [teamPageSize, setTeamPageSize]     = useState(10)

  // Team user management actions
  const [teamActionAnchor, setTeamActionAnchor]   = useState<HTMLElement | null>(null)
  const [teamActionTarget, setTeamActionTarget]   = useState<AdminTeamMemberSummary | null>(null)
  const [teamActionDialog, setTeamActionDialog]   = useState<'deactivate' | 'reactivate' | 'reset' | null>(null)
  const [teamActionLoading, setTeamActionLoading] = useState(false)
  const [teamSnack, setTeamSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  })

  // ── Wallet ────────────────────────────────────────────────────────────────
  const [wallet, setWallet]                 = useState<AdminWalletSummary | null>(null)
  const [walletLoading, setWalletLoading]   = useState(false)
  const [walletActing, setWalletActing]     = useState(false)
  const [walletError, setWalletError]       = useState('')
  const [adjustOpen, setAdjustOpen]         = useState(false)
  const [adjustType, setAdjustType]         = useState<'CREDIT' | 'DEBIT'>('CREDIT')
  const [adjustAmount, setAdjustAmount]     = useState('')
  const [adjustReason, setAdjustReason]     = useState('')
  const [adjustError, setAdjustError]       = useState('')

  // ── Agreements ────────────────────────────────────────────────────────────
  const [agreements, setAgreements]               = useState<AdminAgreementSummary[]>([])
  const [agreementsLoading, setAgreementsLoading] = useState(false)
  const [agreementsTotal, setAgreementsTotal]     = useState(0)
  const [agreementsPage, setAgreementsPage]       = useState(0)
  const [agreementsPageSize, setAgreementsPageSize] = useState(10)

  // ── Payments / Transactions ───────────────────────────────────────────────
  const [payments, setPayments]               = useState<AdminPaymentSummary[]>([])
  const [paymentsLoading, setPaymentsLoading] = useState(false)
  const [paymentsTotal, setPaymentsTotal]     = useState(0)
  const [paymentsPage, setPaymentsPage]       = useState(0)
  const [paymentsPageSize, setPaymentsPageSize] = useState(10)

  // ── Inspections ───────────────────────────────────────────────────────────
  const [inspections, setInspections]               = useState<AdminInspectionSummary[]>([])
  const [inspectionsLoading, setInspectionsLoading] = useState(false)
  const [inspectionsTotal, setInspectionsTotal]     = useState(0)
  const [inspectionsPage, setInspectionsPage]       = useState(0)
  const [inspectionsPageSize, setInspectionsPageSize] = useState(10)

  // ── Maintenance Requests ──────────────────────────────────────────────────
  const [maintenance, setMaintenance]               = useState<AdminMaintenanceSummary[]>([])
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [maintenanceTotal, setMaintenanceTotal]     = useState(0)
  const [maintenancePage, setMaintenancePage]       = useState(0)
  const [maintenancePageSize, setMaintenancePageSize] = useState(10)

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
        loadSessions(data.tenant_id)
        loadProperties(tenantId)
        loadUnits(tenantId)
        loadOccupants(tenantId)
        loadTeam(tenantId)
        loadWallet(tenantId)
        loadAgreements(tenantId)
        loadPayments(tenantId)
        loadInspections(tenantId)
        loadMaintenance(tenantId)
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

  async function loadLoginHistory(tenantSlug: string, page = 0, filter: 'all' | 'success' | 'failure' = 'all', size = loginHistoryPageSize) {
    setLoginHistoryLoading(true)
    try {
      const successParam = filter === 'all' ? undefined : filter === 'success'
      const data = await getTenantLoginHistory(tenantSlug, { success: successParam, page, size })
      setLoginHistory(data.items)
      setLoginHistoryTotal(data.totalItems)
      setLoginHistoryPage(page)
    } catch { setLoginHistory([]) }
    finally { setLoginHistoryLoading(false) }
  }

  async function loadInvoices(tenantSlug: string, page = 0, size = invoicesPageSize) {
    setInvoicesLoading(true)
    try {
      const data = await getTenantInvoices(tenantSlug, page, size)
      setInvoices(data.data)
      setInvoicesTotal(data.totalElements)
      setInvoicesTotalPages(data.totalPages)
      setInvoicesPage(page)
    } catch { setInvoices([]) }
    finally { setInvoicesLoading(false) }
  }

  async function handleRetryInvoice(inv: AdminInvoiceDto) {
    setRetryingId(inv.id)
    try {
      await adminRetryInvoice(inv.id)
      setToast('Payment retry triggered — check back shortly for status update')
      if (tenant) loadInvoices(tenant.tenant_id, invoicesPage)
    } catch (e: any) {
      setToast(e?.response?.data?.message ?? 'Retry failed')
    } finally {
      setRetryingId(null)
    }
  }

  async function handleVoidConfirm() {
    if (!voidConfirmInv) return
    const inv = voidConfirmInv
    setVoidConfirmInv(null)
    setVoidingId(inv.id)
    try {
      const updated = await adminVoidInvoice(inv.id, voidReason || undefined)
      setInvoices(prev => prev.map(i => i.id === updated.id ? updated : i))
      setToast('Invoice voided successfully')
    } catch (e: any) {
      setToast(e?.response?.data?.message ?? 'Void failed')
    } finally {
      setVoidingId(null)
      setVoidReason('')
    }
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

  async function loadSessions(tenantSlug: string) {
    setSessionsLoading(true)
    try { setSessions(await getTenantSessions(tenantSlug)) }
    catch { setSessions([]) }
    finally { setSessionsLoading(false) }
  }

  async function handleTerminateSession(familyId: string) {
    if (!tenant) return
    setTerminatingSession(familyId)
    try {
      await terminateSession(tenant.tenant_id, familyId)
      setSessions(prev => prev.filter(s => s.familyId !== familyId))
      setToast('Session terminated')
    } catch { setToast('Failed to terminate session') }
    finally { setTerminatingSession(null) }
  }

  async function handleTerminateAllSessions() {
    if (!tenant) return
    setTerminatingAll(true)
    try {
      const res = await terminateAllSessions(tenant.tenant_id)
      setSessions([])
      setToast(`${res.terminated} session${res.terminated !== 1 ? 's' : ''} terminated`)
    } catch { setToast('Failed to terminate sessions') }
    finally { setTerminatingAll(false) }
  }

  async function loadProperties(tenantSlug: string, page = 0, size = propertiesPageSize) {
    setPropertiesLoading(true)
    try {
      const data = await getTenantProperties(tenantSlug, page, size)
      setProperties(data.items); setPropertiesTotal(data.total); setPropertiesPage(page)
    } catch { setProperties([]) }
    finally { setPropertiesLoading(false) }
  }

  async function loadUnits(tenantSlug: string, page = 0, size = unitsPageSize) {
    setUnitsLoading(true)
    try {
      const data = await getTenantUnits(tenantSlug, page, size)
      setUnits(data.items); setUnitsTotal(data.total); setUnitsPage(page)
    } catch { setUnits([]) }
    finally { setUnitsLoading(false) }
  }

  async function loadOccupants(tenantSlug: string, page = 0, size = occupantsPageSize) {
    setOccupantsLoading(true)
    try {
      const data = await getTenantOccupants(tenantSlug, page, size)
      setOccupants(data.items); setOccupantsTotal(data.total); setOccupantsPage(page)
    } catch { setOccupants([]) }
    finally { setOccupantsLoading(false) }
  }

  async function loadTeam(tenantSlug: string, page = 0, size = teamPageSize) {
    setTeamLoading(true)
    try {
      const data = await getTenantTeam(tenantSlug, page, size)
      setTeam(data.items); setTeamTotal(data.total); setTeamPage(page)
    } catch { setTeam([]) }
    finally { setTeamLoading(false) }
  }

  async function handleTeamAction() {
    if (!teamActionTarget || !teamActionDialog) return
    setTeamActionLoading(true)
    try {
      if (teamActionDialog === 'deactivate') {
        const updated = await deactivateAdminUser(teamActionTarget.id)
        setTeam(prev => prev.map(u => u.id === updated.id ? { ...u, active: updated.active } : u))
        setTeamSnack({ open: true, message: `${updated.fullName} deactivated.`, severity: 'success' })
      } else if (teamActionDialog === 'reactivate') {
        const updated = await reactivateAdminUser(teamActionTarget.id)
        setTeam(prev => prev.map(u => u.id === updated.id ? { ...u, active: updated.active } : u))
        setTeamSnack({ open: true, message: `${updated.fullName} reactivated.`, severity: 'success' })
      } else if (teamActionDialog === 'reset') {
        const result = await resetAdminUserPassword(teamActionTarget.id)
        setTeamSnack({ open: true, message: `Password reset sent to ${result.recipientEmail}.`, severity: 'success' })
      }
      setTeamActionDialog(null)
      setTeamActionTarget(null)
    } catch (e: any) {
      setTeamSnack({ open: true, message: e?.response?.data?.message ?? 'Action failed', severity: 'error' })
    } finally {
      setTeamActionLoading(false)
    }
  }

  async function loadWallet(tenantSlug: string) {
    setWalletLoading(true)
    try { setWallet(await getTenantWallet(tenantSlug)) }
    catch { setWallet(null) }
    finally { setWalletLoading(false) }
  }

  async function handleWalletFreeze() {
    if (!wallet) return
    setWalletError('')
    setWalletActing(true)
    try {
      const isFrozen = wallet.status === 'FROZEN'
      const updated = isFrozen
        ? await unfreezeTenantWallet(tenantId)
        : await freezeTenantWallet(tenantId)
      setWallet(updated)
    } catch (e: any) {
      setWalletError(e?.response?.data?.message ?? e?.message ?? 'Failed to update wallet status.')
    } finally { setWalletActing(false) }
  }

  async function handleWalletAdjust() {
    const amt = parseFloat(adjustAmount)
    if (isNaN(amt) || amt <= 0) {
      setAdjustError('Enter a valid positive amount.')
      return
    }
    setAdjustError('')
    setWalletActing(true)
    try {
      const updated = await adjustTenantWallet(tenantId, {
        type: adjustType,
        amount: amt,
        reason: adjustReason.trim() || undefined
      })
      setWallet(updated)
      setAdjustOpen(false)
      setAdjustAmount(''); setAdjustReason('')
    } catch (e: any) {
      setAdjustError(e?.response?.data?.message ?? e?.message ?? 'Failed to adjust wallet.')
    } finally { setWalletActing(false) }
  }

  async function loadAgreements(tenantSlug: string, page = 0, size = agreementsPageSize) {
    setAgreementsLoading(true)
    try {
      const data = await getTenantAgreements(tenantSlug, page, size)
      setAgreements(data.items); setAgreementsTotal(data.total); setAgreementsPage(page)
    } catch { setAgreements([]) }
    finally { setAgreementsLoading(false) }
  }

  async function loadPayments(tenantSlug: string, page = 0, size = paymentsPageSize) {
    setPaymentsLoading(true)
    try {
      const data = await getTenantPayments(tenantSlug, page, size)
      setPayments(data.items); setPaymentsTotal(data.total); setPaymentsPage(page)
    } catch { setPayments([]) }
    finally { setPaymentsLoading(false) }
  }

  async function loadInspections(tenantSlug: string, page = 0, size = inspectionsPageSize) {
    setInspectionsLoading(true)
    try {
      const data = await getTenantInspections(tenantSlug, page, size)
      setInspections(data.items); setInspectionsTotal(data.total); setInspectionsPage(page)
    } catch { setInspections([]) }
    finally { setInspectionsLoading(false) }
  }

  async function loadMaintenance(tenantSlug: string, page = 0, size = maintenancePageSize) {
    setMaintenanceLoading(true)
    try {
      const data = await getTenantMaintenance(tenantSlug, page, size)
      setMaintenance(data.items); setMaintenanceTotal(data.total); setMaintenancePage(page)
    } catch { setMaintenance([]) }
    finally { setMaintenanceLoading(false) }
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

  // ── TanStack table column definitions ────────────────────────────────────

  // Login History table
  const loginColHelper = createColumnHelper<LoginHistoryItem>()
  const loginCols = [
    loginColHelper.accessor('email', { header: 'Email', cell: info => <Typography variant='body2' noWrap>{info.getValue()}</Typography> }),
    loginColHelper.accessor('ipAddress', { header: 'IP Address', cell: info => <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{info.getValue() ?? '—'}</Typography> }),
    loginColHelper.accessor('userAgent', { header: 'User Agent', cell: info => <Typography variant='body2' noWrap color='text.secondary' sx={{ fontSize: '0.75rem', maxWidth: 220 }} title={info.getValue() ?? ''}>{info.getValue() ?? '—'}</Typography> }),
    loginColHelper.accessor('success', { header: 'Result', cell: info => <Chip label={info.getValue() ? 'OK' : info.row.original.failureReason ?? 'FAIL'} size='small' color={info.getValue() ? 'success' : 'error'} sx={{ fontSize: '0.7rem' }} /> }),
    loginColHelper.accessor('createdAt', { header: 'Time', cell: info => <Typography variant='body2' sx={{ fontSize: '0.75rem' }} color='text.secondary'>{new Date(info.getValue()).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</Typography> }),
  ]
  const loginTable = useReactTable({
    data: loginHistory,
    columns: loginCols,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(loginHistoryTotal / loginHistoryPageSize),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // API Keys table
  const apiKeyColHelper = createColumnHelper<ApiKeyDto>()
  const apiKeyCols = [
    apiKeyColHelper.accessor('name', {
      header: 'Name',
      cell: info => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='body2'>{info.getValue()}</Typography>
          {!info.row.original.active && <Chip label='Revoked' size='small' color='default' sx={{ fontSize: '0.65rem' }} />}
        </Box>
      )
    }),
    apiKeyColHelper.accessor('keyPrefix', { header: 'Prefix', cell: info => <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{info.getValue()}…</Typography> }),
    apiKeyColHelper.accessor('createdAt', { header: 'Created', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{formatDate(info.getValue())}</Typography> }),
    apiKeyColHelper.accessor('lastUsedAt', { header: 'Last Used', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{info.getValue() ? formatDate(info.getValue()) : '—'}</Typography> }),
    apiKeyColHelper.display({
      id: 'actions',
      header: () => null,
      cell: info => (
        <Box sx={{ textAlign: 'right' }}>
          {info.row.original.active && (
            <Tooltip title='Revoke key'>
              <IconButton size='small' color='error' onClick={() => handleRevokeKey(info.row.original.id)}>
                <i className='ri-delete-bin-line' style={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )
    }),
  ]
  const apiKeyTable = useReactTable({
    data: apiKeys,
    columns: apiKeyCols,
    getCoreRowModel: getCoreRowModel(),
  })

  // Invoice History table
  const invColHelper = createColumnHelper<AdminInvoiceDto>()
  const invCols = [
    invColHelper.display({
      id: 'period',
      header: 'Period',
      cell: info => <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>{formatDate(info.row.original.periodStart)} – {formatDate(info.row.original.periodEnd)}</Typography>
    }),
    invColHelper.accessor('invoiceType', { header: 'Type', cell: info => <Typography variant='body2' sx={{ fontSize: '0.8rem' }}>{info.getValue() === 'RENEWAL' ? 'Renewal' : 'Upgrade'}</Typography> }),
    invColHelper.accessor('totalAmount', { header: 'Amount', cell: info => <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>GHS {info.getValue().toFixed(2)}</Typography> }),
    invColHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const c: 'success' | 'error' | 'warning' | 'default' = info.getValue() === 'PAID' ? 'success' : info.getValue() === 'FAILED' ? 'error' : info.getValue() === 'PENDING' ? 'warning' : 'default'
        return <Chip label={info.getValue()} size='small' color={c} sx={{ fontSize: '0.65rem', height: 20 }} />
      }
    }),
    invColHelper.accessor('createdAt', { header: 'Date', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{formatDate(info.getValue())}</Typography> }),
    invColHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: info => {
        const inv = info.row.original
        return (
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {inv.status === 'FAILED' && (
              <Tooltip title='Retry payment now'>
                <span>
                  <IconButton size='small' color='warning' onClick={() => handleRetryInvoice(inv)} disabled={retryingId === inv.id || voidingId === inv.id}>
                    {retryingId === inv.id ? <CircularProgress size={14} color='inherit' /> : <i className='ri-refresh-line' style={{ fontSize: '0.9rem' }} />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {(inv.status === 'FAILED' || inv.status === 'PENDING') && (
              <Tooltip title='Void / write-off'>
                <span>
                  <IconButton size='small' color='error' onClick={() => { setVoidConfirmInv(inv); setVoidReason('') }} disabled={retryingId === inv.id || voidingId === inv.id}>
                    {voidingId === inv.id ? <CircularProgress size={14} color='inherit' /> : <i className='ri-delete-bin-line' style={{ fontSize: '0.9rem' }} />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {inv.status === 'VOID' && inv.voidReason && (
              <Tooltip title={`Voided: ${inv.voidReason}`}>
                <i className='ri-information-line' style={{ fontSize: '0.85rem', color: 'var(--mui-palette-text-disabled)' }} />
              </Tooltip>
            )}
          </Box>
        )
      }
    }),
  ]
  const invTable = useReactTable({
    data: invoices,
    columns: invCols,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(invoicesTotal / invoicesPageSize),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Active Sessions table
  const sessColHelper = createColumnHelper<SessionDto>()
  const sessCols = [
    sessColHelper.accessor('familyId', { header: 'Session ID', cell: info => <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.72rem' }}>{info.getValue().split('-')[0]}…</Typography> }),
    sessColHelper.accessor('ipAddress', { header: 'IP Address', cell: info => <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{info.getValue() ?? '—'}</Typography> }),
    sessColHelper.accessor('userAgent', {
      header: 'Device',
      cell: info => (
        <Tooltip title={info.getValue() ?? ''}>
          <Typography variant='body2' noWrap color='text.secondary' sx={{ fontSize: '0.75rem', maxWidth: 200 }}>
            {info.getValue() ? info.getValue()!.slice(0, 40) + (info.getValue()!.length > 40 ? '…' : '') : '—'}
          </Typography>
        </Tooltip>
      )
    }),
    sessColHelper.accessor('issuedAt', { header: 'Issued', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{new Date(info.getValue()).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</Typography> }),
    sessColHelper.accessor('expiresAt', { header: 'Expires', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{new Date(info.getValue()).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}</Typography> }),
    sessColHelper.display({
      id: 'actions',
      header: () => null,
      cell: info => canManage ? (
        <Box sx={{ textAlign: 'right' }}>
          <Tooltip title='Terminate this session'>
            <span>
              <IconButton size='small' color='error' onClick={() => handleTerminateSession(info.row.original.familyId)} disabled={terminatingSession === info.row.original.familyId || terminatingAll}>
                {terminatingSession === info.row.original.familyId ? <CircularProgress size={14} color='inherit' /> : <i className='ri-logout-box-r-line' style={{ fontSize: '0.9rem' }} />}
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ) : null
    }),
  ]
  const sessTable = useReactTable({
    data: sessions,
    columns: sessCols,
    getCoreRowModel: getCoreRowModel(),
  })

  // Properties table
  const propColHelper = createColumnHelper<AdminPropertySummary>()
  const propCols = [
    propColHelper.accessor('name', { header: 'Name', cell: info => <Typography variant='body2' fontWeight={500} noWrap>{info.getValue()}</Typography> }),
    propColHelper.accessor('type', { header: 'Type', cell: info => <Chip label={info.getValue()} size='small' variant='outlined' sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }} /> }),
    propColHelper.accessor('status', { header: 'Status', cell: info => <Chip label={info.getValue()} size='small' color={info.getValue() === 'active' ? 'success' : 'default'} sx={{ fontSize: '0.65rem', height: 20 }} /> }),
    propColHelper.accessor('city', { header: 'City', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.78rem' }} noWrap>{info.getValue() ?? '—'}</Typography> }),
    propColHelper.accessor('region', { header: 'Region', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.78rem' }} noWrap>{info.getValue() ?? '—'}</Typography> }),
    propColHelper.accessor('totalUnits', { header: 'Units', cell: info => <Typography variant='body2' sx={{ fontSize: '0.78rem', textAlign: 'right', display: 'block' }}>{info.getValue()}</Typography> }),
    propColHelper.accessor('occupiedUnits', { header: 'Occ.', cell: info => <Typography variant='body2' sx={{ fontSize: '0.78rem', textAlign: 'right', display: 'block' }}>{info.getValue()}</Typography> }),
  ]
  const propTable = useReactTable({
    data: properties,
    columns: propCols,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(propertiesTotal / propertiesPageSize),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Units table
  const unitColHelper = createColumnHelper<AdminUnitSummary>()
  const unitCols = [
    unitColHelper.accessor('unitNo', { header: 'Unit No', cell: info => <Typography variant='body2' fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{info.getValue()}</Typography> }),
    unitColHelper.accessor('propertyName', { header: 'Property', cell: info => <Typography variant='body2' noWrap color='text.secondary' sx={{ fontSize: '0.78rem' }}>{info.getValue() ?? '—'}</Typography> }),
    unitColHelper.accessor('type', { header: 'Type', cell: info => <Chip label={info.getValue()} size='small' variant='outlined' sx={{ fontSize: '0.65rem', height: 20, textTransform: 'capitalize' }} /> }),
    unitColHelper.accessor('status', { header: 'Status', cell: info => <Chip label={info.getValue()} size='small' color={info.getValue() === 'available' ? 'success' : 'default'} sx={{ fontSize: '0.65rem', height: 20 }} /> }),
    unitColHelper.display({
      id: 'rent',
      header: 'Rent',
      cell: info => <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{info.row.original.currency} {info.row.original.rent.toFixed(2)}</Typography>
    }),
  ]
  const unitTable = useReactTable({
    data: units,
    columns: unitCols,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(unitsTotal / unitsPageSize),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Occupants table
  const occColHelper = createColumnHelper<AdminOccupantSummary>()
  const occCols = [
    occColHelper.display({
      id: 'name',
      header: 'Name',
      cell: info => <Typography variant='body2' fontWeight={500} noWrap>{info.row.original.firstName} {info.row.original.lastName}</Typography>
    }),
    occColHelper.accessor('email', { header: 'Email', cell: info => <Typography variant='body2' color='text.secondary' noWrap sx={{ fontSize: '0.78rem' }}>{info.getValue()}</Typography> }),
    occColHelper.accessor('status', { header: 'Status', cell: info => <Chip label={info.getValue()} size='small' color={info.getValue() === 'active' ? 'success' : info.getValue() === 'pending' ? 'warning' : 'default'} sx={{ fontSize: '0.65rem', height: 20 }} /> }),
    occColHelper.accessor('unitNo', { header: 'Unit', cell: info => <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{info.getValue() ?? '—'}</Typography> }),
    occColHelper.accessor('moveInDate', { header: 'Move-in', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{info.getValue() ? new Date(info.getValue()!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Typography> }),
  ]
  const occTable = useReactTable({
    data: occupants,
    columns: occCols,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(occupantsTotal / occupantsPageSize),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Team Members table
  const teamColHelper = createColumnHelper<AdminTeamMemberSummary>()
  const teamCols = [
    teamColHelper.accessor('fullName', { header: 'Name', cell: info => <Typography variant='body2' fontWeight={500} noWrap>{info.getValue()}</Typography> }),
    teamColHelper.accessor('email', { header: 'Email', cell: info => <Typography variant='body2' color='text.secondary' noWrap sx={{ fontSize: '0.78rem' }}>{info.getValue()}</Typography> }),
    teamColHelper.accessor('role', { header: 'Role', cell: info => <Chip label={info.getValue()} size='small' color={info.getValue() === 'ADMIN' ? 'primary' : 'default'} variant='tonal' sx={{ fontSize: '0.65rem', height: 20 }} /> }),
    teamColHelper.accessor('active', { header: 'Status', cell: info => <Chip label={info.getValue() ? 'Active' : 'Inactive'} size='small' color={info.getValue() ? 'success' : 'error'} variant='tonal' sx={{ fontSize: '0.65rem', height: 20 }} /> }),
    teamColHelper.accessor('createdAt', { header: 'Joined', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{info.getValue() ? new Date(info.getValue()!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Typography> }),
    teamColHelper.display({
      id: 'team-actions',
      header: '',
      cell: info => (
        <Tooltip title='Actions'>
          <IconButton
            size='small'
            onClick={e => { setTeamActionAnchor(e.currentTarget); setTeamActionTarget(info.row.original) }}
          >
            <i className='ri-more-2-line' style={{ fontSize: '1rem' }} />
          </IconButton>
        </Tooltip>
      ),
    }),
  ]
  const teamTable = useReactTable({
    data: team,
    columns: teamCols,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(teamTotal / teamPageSize),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Agreements table
  const agreeColHelper = createColumnHelper<AdminAgreementSummary>()
  const agreeCols = [
    agreeColHelper.accessor('agreementNumber', { header: 'Number', cell: info => <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{info.getValue() ?? '—'}</Typography> }),
    agreeColHelper.accessor('type', { header: 'Type', cell: info => <Chip label={info.getValue() ?? '—'} size='small' variant='tonal' color='info' sx={{ fontSize: '0.65rem' }} /> }),
    agreeColHelper.accessor('status', { header: 'Status', cell: info => <Chip label={info.getValue() ?? '—'} size='small' color={info.getValue() === 'ACTIVE' ? 'success' : info.getValue() === 'EXPIRED' ? 'default' : info.getValue() === 'TERMINATED' ? 'error' : 'warning'} sx={{ fontSize: '0.65rem' }} /> }),
    agreeColHelper.accessor('occupantName', { header: 'Occupant', cell: info => <Typography variant='body2'>{info.getValue() ?? '—'}</Typography> }),
    agreeColHelper.accessor('unitNo', { header: 'Unit', cell: info => <Typography variant='body2' sx={{ fontSize: '0.75rem' }}>{info.getValue() ?? '—'}</Typography> }),
    agreeColHelper.accessor('rent', { header: 'Rent', cell: info => <Typography variant='body2' sx={{ fontSize: '0.75rem' }}>{info.getValue() != null ? `${info.row.original.currency ?? ''} ${Number(info.getValue()).toFixed(2)}` : '—'}</Typography> }),
    agreeColHelper.accessor('startDate', { header: 'Start', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{info.getValue() ? new Date(info.getValue()!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Typography> }),
    agreeColHelper.accessor('endDate', { header: 'End', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{info.getValue() ? new Date(info.getValue()!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Typography> }),
  ]
  const agreeTable = useReactTable({
    data: agreements,
    columns: agreeCols,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(agreementsTotal / agreementsPageSize),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Payments table
  const payColHelper = createColumnHelper<AdminPaymentSummary>()
  const payCols = [
    payColHelper.accessor('invoiceNumber', { header: 'Invoice #', cell: info => <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{info.getValue() ?? '—'}</Typography> }),
    payColHelper.accessor('occupantName', { header: 'Occupant', cell: info => <Typography variant='body2'>{info.getValue() ?? '—'}</Typography> }),
    payColHelper.accessor('amount', { header: 'Amount', cell: info => <Typography variant='body2' fontWeight={600}>{info.row.original.currency ?? ''} {Number(info.getValue()).toFixed(2)}</Typography> }),
    payColHelper.accessor('paymentMethod', { header: 'Method', cell: info => <Chip label={info.getValue() ?? '—'} size='small' variant='outlined' sx={{ fontSize: '0.65rem' }} /> }),
    payColHelper.accessor('status', { header: 'Status', cell: info => <Chip label={info.getValue() ?? '—'} size='small' color={info.getValue() === 'COMPLETED' || info.getValue() === 'SUCCESS' ? 'success' : info.getValue() === 'PENDING' ? 'warning' : 'error'} sx={{ fontSize: '0.65rem' }} /> }),
    payColHelper.accessor('paymentDate', { header: 'Date', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{info.getValue() ? new Date(info.getValue()!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Typography> }),
  ]
  const payTable = useReactTable({
    data: payments,
    columns: payCols,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(paymentsTotal / paymentsPageSize),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Inspections table
  const inspColHelper = createColumnHelper<AdminInspectionSummary>()
  const inspCols = [
    inspColHelper.accessor('type', { header: 'Type', cell: info => <Chip label={info.getValue() ?? '—'} size='small' variant='tonal' color='info' sx={{ fontSize: '0.65rem' }} /> }),
    inspColHelper.accessor('status', { header: 'Status', cell: info => <Chip label={info.getValue() ?? '—'} size='small' color={info.getValue() === 'COMPLETED' ? 'success' : 'warning'} sx={{ fontSize: '0.65rem' }} /> }),
    inspColHelper.accessor('unitNo', { header: 'Unit', cell: info => <Typography variant='body2' sx={{ fontSize: '0.75rem' }}>{info.getValue() ?? '—'}</Typography> }),
    inspColHelper.accessor('propertyName', { header: 'Property', cell: info => <Typography variant='body2' noWrap sx={{ maxWidth: 180 }}>{info.getValue() ?? '—'}</Typography> }),
    inspColHelper.accessor('inspectorName', { header: 'Inspector', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{info.getValue() ?? '—'}</Typography> }),
    inspColHelper.accessor('inspectionDate', { header: 'Inspection Date', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{info.getValue() ? new Date(info.getValue()!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Typography> }),
    inspColHelper.accessor('signedOffDate', { header: 'Signed Off', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{info.getValue() ? new Date(info.getValue()!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Typography> }),
  ]
  const inspTable = useReactTable({
    data: inspections,
    columns: inspCols,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(inspectionsTotal / inspectionsPageSize),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  // Maintenance table
  const maintColHelper = createColumnHelper<AdminMaintenanceSummary>()
  const maintCols = [
    maintColHelper.accessor('requestNumber', { header: 'Ref #', cell: info => <Typography variant='body2' sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{info.getValue() ?? '—'}</Typography> }),
    maintColHelper.accessor('title', { header: 'Title', cell: info => <Typography variant='body2' noWrap sx={{ maxWidth: 200 }}>{info.getValue() ?? '—'}</Typography> }),
    maintColHelper.accessor('priority', { header: 'Priority', cell: info => <Chip label={info.getValue() ?? '—'} size='small' color={info.getValue() === 'urgent' ? 'error' : info.getValue() === 'high' ? 'warning' : info.getValue() === 'medium' ? 'info' : 'default'} sx={{ fontSize: '0.65rem' }} /> }),
    maintColHelper.accessor('status', { header: 'Status', cell: info => <Chip label={info.getValue() ?? '—'} size='small' variant='tonal' sx={{ fontSize: '0.65rem' }} /> }),
    maintColHelper.accessor('isSlaBreached', { header: 'SLA', cell: info => info.getValue() ? <Chip label='Breached' size='small' color='error' sx={{ fontSize: '0.65rem' }} /> : <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>OK</Typography> }),
    maintColHelper.accessor('estimatedCost', { header: 'Est. Cost', cell: info => <Typography variant='body2' sx={{ fontSize: '0.75rem' }}>{info.getValue() != null ? `${info.row.original.currency ?? ''} ${Number(info.getValue()).toFixed(2)}` : '—'}</Typography> }),
    maintColHelper.accessor('scheduledDate', { header: 'Scheduled', cell: info => <Typography variant='body2' color='text.secondary' sx={{ fontSize: '0.75rem' }}>{info.getValue() ? new Date(info.getValue()!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</Typography> }),
  ]
  const maintTable = useReactTable({
    data: maintenance,
    columns: maintCols,
    manualFiltering: true,
    manualPagination: true,
    pageCount: Math.ceil(maintenanceTotal / maintenancePageSize),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

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
            <Button variant='outlined' color='secondary' startIcon={<i className='ri-spy-line' />} onClick={() => setImpersonateOpen(true)}>Impersonate</Button>
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
              <InfoRow label='Owner'>
                <Typography variant='body2' fontWeight={600}>{tenant.ownerName ?? '—'}</Typography>
              </InfoRow>
              <Divider />
              <InfoRow label='Owner Email'>
                {tenant.ownerEmail
                  ? <Typography variant='body2' component='a' href={`mailto:${tenant.ownerEmail}`} sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>{tenant.ownerEmail}</Typography>
                  : <Typography variant='body2' color='text.disabled'>—</Typography>
                }
              </InfoRow>
              <Divider />
              <InfoRow label='Status'>
                <Chip size='small' label={tenant.active ? 'Active' : 'Inactive'} color={tenant.active ? 'success' : 'default'} variant='outlined' />
              </InfoRow>
              <Divider />
              <InfoRow label='Registered'>
                <Typography variant='body2'>{formatDate(tenant.createdAt)}</Typography>
              </InfoRow>
              <Divider />
              <InfoRow label='Properties'>
                {snapLoading
                  ? <Skeleton variant='text' width={60} />
                  : <Typography variant='body2'>{snap ? `${snap.propertyCount} propert${snap.propertyCount === 1 ? 'y' : 'ies'}` : '—'}</Typography>
                }
              </InfoRow>
              <Divider />
              <InfoRow label='Occupancy'>
                {snapLoading
                  ? <Skeleton variant='text' width={80} />
                  : <Typography variant='body2'>
                      {snap ? `${snap.occupiedUnits} / ${snap.totalUnits} units occupied` : '—'}
                    </Typography>
                }
              </InfoRow>
              <Divider />
              <InfoRow label='Wallet'>
                {walletLoading
                  ? <Skeleton variant='text' width={100} />
                  : wallet
                    ? <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant='body2' fontWeight={600}>
                          {new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(wallet.balance)}
                        </Typography>
                        <Chip size='small' label={wallet.status} variant='tonal'
                          color={wallet.status === 'ACTIVE' ? 'success' : wallet.status === 'FROZEN' ? 'error' : 'warning'} />
                      </Box>
                    : <Typography variant='body2' color='text.disabled'>—</Typography>
                }
              </InfoRow>
              <Divider />
              <InfoRow label='MoMo Number'>
                {walletLoading
                  ? <Skeleton variant='text' width={120} />
                  : wallet?.linkedMomoNumber
                    ? <Typography variant='body2'>{wallet.linkedMomoNumber}{wallet.linkedMomoNetwork ? ` (${wallet.linkedMomoNetwork})` : ''}</Typography>
                    : <Typography variant='body2' color='text.disabled'>Not linked</Typography>
                }
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
          ) : (
            <>
              <table className={tableStyles.table}>
                <thead>
                  {loginTable.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {loginTable.getRowModel().rows.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No login attempts found.</td></tr>
                    : loginTable.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={loginHistoryTotal}
                rowsPerPage={loginHistoryPageSize}
                page={loginHistoryPage}
                onPageChange={(_, p) => tenant && loadLoginHistory(tenant.tenant_id, p, loginHistoryFilter, loginHistoryPageSize)}
                onRowsPerPageChange={e => { const s = Number(e.target.value); setLoginHistoryPageSize(s); if (tenant) loadLoginHistory(tenant.tenant_id, 0, loginHistoryFilter, s) }}
              />
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
          ) : (
            <Box sx={{ opacity: 1 }}>
              <table className={tableStyles.table}>
                <thead>
                  {apiKeyTable.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {apiKeyTable.getRowModel().rows.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No API keys yet.</td></tr>
                    : apiKeyTable.getRowModel().rows.map(row => (
                      <tr key={row.id} style={{ opacity: row.original.active ? 1 : 0.5 }}>
                        {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
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
          ) : (
            <>
              <table className={tableStyles.table}>
                <thead>
                  {invTable.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {invTable.getRowModel().rows.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No invoices found for this tenant.</td></tr>
                    : invTable.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={invoicesTotal}
                rowsPerPage={invoicesPageSize}
                page={invoicesPage}
                onPageChange={(_, p) => tenant && loadInvoices(tenant.tenant_id, p, invoicesPageSize)}
                onRowsPerPageChange={e => { const s = Number(e.target.value); setInvoicesPageSize(s); if (tenant) loadInvoices(tenant.tenant_id, 0, s) }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Active Sessions ───────────────────────────────────────────────────── */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-shield-user-line' style={{ fontSize: '1.15rem', opacity: 0.7 }} />
            <Typography variant='h6'>Active Sessions</Typography>
            {sessions.length > 0 && (
              <Chip size='small' label={sessions.length} color='primary' variant='tonal' />
            )}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
              <Tooltip title='Refresh sessions'>
                <span>
                  <IconButton
                    size='small'
                    onClick={() => tenant && loadSessions(tenant.tenant_id)}
                    disabled={sessionsLoading}
                  >
                    {sessionsLoading
                      ? <CircularProgress size={16} />
                      : <i className='ri-refresh-line' style={{ fontSize: '1rem' }} />
                    }
                  </IconButton>
                </span>
              </Tooltip>
              {sessions.length > 0 && canManage && (
                <Button
                  size='small'
                  variant='outlined'
                  color='error'
                  startIcon={terminatingAll ? <CircularProgress size={14} color='inherit' /> : <i className='ri-shut-down-line' />}
                  onClick={handleTerminateAllSessions}
                  disabled={terminatingAll}
                >
                  Terminate All
                </Button>
              )}
            </Box>
          </Box>

          {sessionsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1, 2].map(i => <Skeleton key={i} variant='rectangular' height={44} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : sessions.length === 0 ? (
            <Box sx={{ py: 3, textAlign: 'center' }}>
              <i className='ri-shield-check-line' style={{ fontSize: '2rem', opacity: 0.3 }} />
              <Typography variant='body2' color='text.disabled' sx={{ mt: 1 }}>No active sessions</Typography>
            </Box>
          ) : (
            <table className={tableStyles.table}>
              <thead>
                {sessTable.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(h => <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                  </tr>
                ))}
              </thead>
              <tbody>
                {sessTable.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <Typography variant='caption' color='text.secondary' sx={{ mt: 1.5, display: 'block' }}>
            Sessions use short-lived access tokens (15 min). After termination, users are logged out within 15 minutes.
          </Typography>
        </CardContent>
      </Card>

      {/* ── Properties ───────────────────────────────────────────────────────── */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-building-2-line' style={{ fontSize: '1.15rem', opacity: 0.7 }} />
            <Typography variant='h6'>Properties</Typography>
            <Chip size='small' label={propertiesTotal} variant='tonal' color='primary' />
          </Box>
          {propertiesLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1,2,3].map(i => <Skeleton key={i} variant='rectangular' height={40} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : (
            <>
              <table className={tableStyles.table}>
                <thead>
                  {propTable.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {propTable.getRowModel().rows.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No properties found.</td></tr>
                    : propTable.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={propertiesTotal}
                rowsPerPage={propertiesPageSize}
                page={propertiesPage}
                onPageChange={(_, p) => loadProperties(tenantId, p, propertiesPageSize)}
                onRowsPerPageChange={e => { const s = Number(e.target.value); setPropertiesPageSize(s); loadProperties(tenantId, 0, s) }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Units ────────────────────────────────────────────────────────────── */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-door-line' style={{ fontSize: '1.15rem', opacity: 0.7 }} />
            <Typography variant='h6'>Units</Typography>
            <Chip size='small' label={unitsTotal} variant='tonal' color='info' />
          </Box>
          {unitsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1,2,3].map(i => <Skeleton key={i} variant='rectangular' height={40} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : (
            <>
              <table className={tableStyles.table}>
                <thead>
                  {unitTable.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {unitTable.getRowModel().rows.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No units found.</td></tr>
                    : unitTable.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={unitsTotal}
                rowsPerPage={unitsPageSize}
                page={unitsPage}
                onPageChange={(_, p) => loadUnits(tenantId, p, unitsPageSize)}
                onRowsPerPageChange={e => { const s = Number(e.target.value); setUnitsPageSize(s); loadUnits(tenantId, 0, s) }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Occupants ────────────────────────────────────────────────────────── */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-user-home-line' style={{ fontSize: '1.15rem', opacity: 0.7 }} />
            <Typography variant='h6'>Occupants</Typography>
            <Chip size='small' label={occupantsTotal} variant='tonal' color='warning' />
          </Box>
          {occupantsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1,2,3].map(i => <Skeleton key={i} variant='rectangular' height={40} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : (
            <>
              <table className={tableStyles.table}>
                <thead>
                  {occTable.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {occTable.getRowModel().rows.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No occupants found.</td></tr>
                    : occTable.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={occupantsTotal}
                rowsPerPage={occupantsPageSize}
                page={occupantsPage}
                onPageChange={(_, p) => loadOccupants(tenantId, p, occupantsPageSize)}
                onRowsPerPageChange={e => { const s = Number(e.target.value); setOccupantsPageSize(s); loadOccupants(tenantId, 0, s) }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Team ─────────────────────────────────────────────────────────────── */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-group-line' style={{ fontSize: '1.15rem', opacity: 0.7 }} />
            <Typography variant='h6'>Team Members</Typography>
            <Chip size='small' label={teamTotal} variant='tonal' color='secondary' />
          </Box>
          {teamLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1,2].map(i => <Skeleton key={i} variant='rectangular' height={40} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : (
            <>
              <table className={tableStyles.table}>
                <thead>
                  {teamTable.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {teamTable.getRowModel().rows.length === 0
                    ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No team members found.</td></tr>
                    : teamTable.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={teamTotal}
                rowsPerPage={teamPageSize}
                page={teamPage}
                onPageChange={(_, p) => loadTeam(tenantId, p, teamPageSize)}
                onRowsPerPageChange={e => { const s = Number(e.target.value); setTeamPageSize(s); loadTeam(tenantId, 0, s) }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Team member action menu ──────────────────────────────────────────── */}
      <Menu
        anchorEl={teamActionAnchor}
        open={Boolean(teamActionAnchor)}
        onClose={() => { setTeamActionAnchor(null) }}
      >
        {teamActionTarget?.active ? (
          <MenuItem onClick={() => { setTeamActionAnchor(null); setTeamActionDialog('deactivate') }}>
            <i className='ri-user-forbid-line' style={{ marginRight: 8 }} />
            Deactivate
          </MenuItem>
        ) : (
          <MenuItem onClick={() => { setTeamActionAnchor(null); setTeamActionDialog('reactivate') }}>
            <i className='ri-user-follow-line' style={{ marginRight: 8 }} />
            Reactivate
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={() => { setTeamActionAnchor(null); setTeamActionDialog('reset') }}>
          <i className='ri-lock-password-line' style={{ marginRight: 8 }} />
          Send Password Reset
        </MenuItem>
      </Menu>

      {/* Team action confirm dialog */}
      <Dialog
        open={Boolean(teamActionDialog && teamActionTarget)}
        onClose={() => { if (!teamActionLoading) { setTeamActionDialog(null); setTeamActionTarget(null) } }}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>
          {teamActionDialog === 'deactivate' && 'Deactivate User'}
          {teamActionDialog === 'reactivate' && 'Reactivate User'}
          {teamActionDialog === 'reset'      && 'Send Password Reset'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {teamActionDialog === 'deactivate' && `Deactivate ${teamActionTarget?.fullName ?? ''}? They will not be able to log in until reactivated.`}
            {teamActionDialog === 'reactivate' && `Reactivate ${teamActionTarget?.fullName ?? ''}?`}
            {teamActionDialog === 'reset'      && `Send a password reset OTP email to ${teamActionTarget?.fullName ?? ''} (${teamActionTarget?.email ?? ''})?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setTeamActionDialog(null); setTeamActionTarget(null) }} disabled={teamActionLoading}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color={teamActionDialog === 'deactivate' ? 'error' : 'primary'}
            onClick={handleTeamAction}
            disabled={teamActionLoading}
          >
            {teamActionLoading
              ? <CircularProgress size={18} color='inherit' />
              : teamActionDialog === 'deactivate' ? 'Deactivate'
              : teamActionDialog === 'reactivate' ? 'Reactivate'
              : 'Send Reset Email'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Team action snackbar */}
      <Snackbar
        open={teamSnack.open}
        autoHideDuration={4000}
        onClose={() => setTeamSnack(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={teamSnack.severity} onClose={() => setTeamSnack(s => ({ ...s, open: false }))}>
          {teamSnack.message}
        </Alert>
      </Snackbar>

      {/* ── Wallet ───────────────────────────────────────────────────────────── */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-wallet-3-line' style={{ fontSize: '1.15rem', opacity: 0.7 }} />
            <Typography variant='h6'>Wallet</Typography>
            {wallet && (
              <Chip size='small' label={wallet.status} color={wallet.status === 'ACTIVE' ? 'success' : wallet.status === 'SUSPENDED' ? 'warning' : 'error'} variant='tonal' />
            )}
            {wallet && (
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <Button
                  size='small'
                  variant='outlined'
                  color={wallet.status === 'FROZEN' ? 'success' : 'warning'}
                  disabled={walletActing || wallet.status === 'SUSPENDED'}
                  startIcon={walletActing ? <CircularProgress size={12} color='inherit' /> : <i className={wallet.status === 'FROZEN' ? 'ri-lock-unlock-line' : 'ri-lock-line'} />}
                  onClick={handleWalletFreeze}
                >
                  {wallet.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}
                </Button>
                <Button
                  size='small'
                  variant='outlined'
                  color='primary'
                  disabled={walletActing}
                  startIcon={<i className='ri-exchange-dollar-line' />}
                  onClick={() => { setAdjustError(''); setAdjustOpen(true) }}
                >
                  Adjust Balance
                </Button>
              </Box>
            )}
          </Box>
          {walletError && (
            <Alert severity='error' onClose={() => setWalletError('')} sx={{ mb: 2 }}>{walletError}</Alert>
          )}
          {walletLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1,2].map(i => <Skeleton key={i} variant='rectangular' height={32} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : !wallet ? (
            <Typography variant='body2' color='text.secondary' sx={{ py: 2, textAlign: 'center' }}>No wallet found — tenant may not have enabled rent collection.</Typography>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant='caption' color='text.secondary'>Balance</Typography>
                  <Typography variant='h6' fontWeight={700}>{wallet.currency} {wallet.balance.toFixed(2)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant='caption' color='text.secondary'>Pending</Typography>
                  <Typography variant='h6' fontWeight={700}>{wallet.currency} {wallet.pendingBalance.toFixed(2)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant='caption' color='text.secondary'>Total Earned</Typography>
                  <Typography variant='h6' fontWeight={700}>{wallet.currency} {wallet.totalEarned.toFixed(2)}</Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Typography variant='caption' color='text.secondary'>Total Withdrawn</Typography>
                  <Typography variant='h6' fontWeight={700}>{wallet.currency} {wallet.totalWithdrawn.toFixed(2)}</Typography>
                </Box>
              </Grid>
              {(wallet.linkedMomoNumber || wallet.linkedMomoNetwork) && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                    <Typography variant='body2' color='text.secondary'>MoMo:</Typography>
                    <Typography variant='body2' sx={{ fontFamily: 'monospace' }}>{wallet.linkedMomoNumber ?? '—'}</Typography>
                    {wallet.linkedMomoNetwork && <Chip label={wallet.linkedMomoNetwork} size='small' variant='outlined' sx={{ fontSize: '0.65rem', height: 20 }} />}
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* ── Wallet Adjust Dialog ─────────────────────────────────────────────── */}
      <Dialog open={adjustOpen} onClose={() => setAdjustOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Adjust Wallet Balance</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
          <FormControl fullWidth size='small'>
            <InputLabel>Type</InputLabel>
            <Select
              value={adjustType}
              label='Type'
              onChange={e => setAdjustType(e.target.value as 'CREDIT' | 'DEBIT')}
            >
              <MenuItem value='CREDIT'>Credit (add funds)</MenuItem>
              <MenuItem value='DEBIT'>Debit (remove funds)</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label='Amount (GHS)'
            size='small'
            type='number'
            inputProps={{ min: 0.01, step: 0.01 }}
            value={adjustAmount}
            onChange={e => setAdjustAmount(e.target.value)}
            fullWidth
          />
          <TextField
            label='Reason (optional)'
            size='small'
            value={adjustReason}
            onChange={e => setAdjustReason(e.target.value)}
            placeholder='e.g. Dispute resolution, goodwill credit'
            fullWidth
            multiline
            rows={2}
          />
          {adjustError && (
            <Typography variant='caption' color='error'>{adjustError}</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAdjustOpen(false)} disabled={walletActing}>Cancel</Button>
          <Button
            variant='contained'
            color={adjustType === 'CREDIT' ? 'success' : 'warning'}
            onClick={handleWalletAdjust}
            disabled={walletActing || !adjustAmount}
            startIcon={walletActing ? <CircularProgress size={14} color='inherit' /> : undefined}
          >
            Apply {adjustType === 'CREDIT' ? 'Credit' : 'Debit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Agreements / Leases ──────────────────────────────────────────────── */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-file-text-line' style={{ fontSize: '1.15rem', opacity: 0.7 }} />
            <Typography variant='h6'>Agreements / Leases</Typography>
            <Chip size='small' label={agreementsTotal} variant='tonal' color='primary' />
          </Box>
          {agreementsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1,2,3].map(i => <Skeleton key={i} variant='rectangular' height={40} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : (
            <>
              <table className={tableStyles.table}>
                <thead>
                  {agreeTable.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {agreeTable.getRowModel().rows.length === 0
                    ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No agreements found.</td></tr>
                    : agreeTable.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={agreementsTotal}
                rowsPerPage={agreementsPageSize}
                page={agreementsPage}
                onPageChange={(_, p) => loadAgreements(tenantId, p, agreementsPageSize)}
                onRowsPerPageChange={e => { const s = Number(e.target.value); setAgreementsPageSize(s); loadAgreements(tenantId, 0, s) }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Payments / Transactions ───────────────────────────────────────────── */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-bank-card-line' style={{ fontSize: '1.15rem', opacity: 0.7 }} />
            <Typography variant='h6'>Payments / Transactions</Typography>
            <Chip size='small' label={paymentsTotal} variant='tonal' color='success' />
          </Box>
          {paymentsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1,2,3].map(i => <Skeleton key={i} variant='rectangular' height={40} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : (
            <>
              <table className={tableStyles.table}>
                <thead>
                  {payTable.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {payTable.getRowModel().rows.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No payment transactions found.</td></tr>
                    : payTable.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={paymentsTotal}
                rowsPerPage={paymentsPageSize}
                page={paymentsPage}
                onPageChange={(_, p) => loadPayments(tenantId, p, paymentsPageSize)}
                onRowsPerPageChange={e => { const s = Number(e.target.value); setPaymentsPageSize(s); loadPayments(tenantId, 0, s) }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Inspections ───────────────────────────────────────────────────────── */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-survey-line' style={{ fontSize: '1.15rem', opacity: 0.7 }} />
            <Typography variant='h6'>Inspections</Typography>
            <Chip size='small' label={inspectionsTotal} variant='tonal' color='warning' />
          </Box>
          {inspectionsLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1,2,3].map(i => <Skeleton key={i} variant='rectangular' height={40} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : (
            <>
              <table className={tableStyles.table}>
                <thead>
                  {inspTable.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {inspTable.getRowModel().rows.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No inspections found.</td></tr>
                    : inspTable.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={inspectionsTotal}
                rowsPerPage={inspectionsPageSize}
                page={inspectionsPage}
                onPageChange={(_, p) => loadInspections(tenantId, p, inspectionsPageSize)}
                onRowsPerPageChange={e => { const s = Number(e.target.value); setInspectionsPageSize(s); loadInspections(tenantId, 0, s) }}
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Maintenance Requests ──────────────────────────────────────────────── */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <i className='ri-tools-line' style={{ fontSize: '1.15rem', opacity: 0.7 }} />
            <Typography variant='h6'>Maintenance Requests</Typography>
            <Chip size='small' label={maintenanceTotal} variant='tonal' color='error' />
          </Box>
          {maintenanceLoading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[1,2,3].map(i => <Skeleton key={i} variant='rectangular' height={40} sx={{ borderRadius: 1 }} />)}
            </Box>
          ) : (
            <>
              <table className={tableStyles.table}>
                <thead>
                  {maintTable.getHeaderGroups().map(hg => (
                    <tr key={hg.id}>
                      {hg.headers.map(h => <th key={h.id}>{h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}</th>)}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {maintTable.getRowModel().rows.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mui-palette-text-secondary)' }}>No maintenance requests found.</td></tr>
                    : maintTable.getRowModel().rows.map(row => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component='div'
                count={maintenanceTotal}
                rowsPerPage={maintenancePageSize}
                page={maintenancePage}
                onPageChange={(_, p) => loadMaintenance(tenantId, p, maintenancePageSize)}
                onRowsPerPageChange={e => { const s = Number(e.target.value); setMaintenancePageSize(s); loadMaintenance(tenantId, 0, s) }}
              />
            </>
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

      {impersonateOpen && (
        <ImpersonateDialog
          open={impersonateOpen}
          tenant={tenant}
          onClose={() => setImpersonateOpen(false)}
        />
      )}

      {/* ── Void invoice confirm dialog ───────────────────────────────────── */}
      <Dialog
        open={!!voidConfirmInv}
        onClose={() => setVoidConfirmInv(null)}
        maxWidth='xs'
        fullWidth
      >
        <DialogTitle>Void Invoice?</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            This will write off invoice{' '}
            <strong>{voidConfirmInv?.id.slice(0, 8)}…</strong> for{' '}
            <strong>GHS {voidConfirmInv?.totalAmount.toFixed(2)}</strong>
            . The tenant's plan is not changed. This cannot be undone.
          </DialogContentText>
          <TextField
            label='Reason (optional)'
            size='small'
            fullWidth
            value={voidReason}
            onChange={e => setVoidReason(e.target.value)}
            placeholder='e.g. Goodwill waiver, disputed charge…'
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoidConfirmInv(null)}>Cancel</Button>
          <Button variant='contained' color='error' onClick={handleVoidConfirm}>
            Confirm Void
          </Button>
        </DialogActions>
      </Dialog>

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
