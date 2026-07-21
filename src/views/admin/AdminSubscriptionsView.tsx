'use client'

import { useEffect, useState, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import Grid from '@mui/material/Grid'
import Tooltip from '@mui/material/Tooltip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Skeleton from '@mui/material/Skeleton'
import InputAdornment from '@mui/material/InputAdornment'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TablePagination from '@mui/material/TablePagination'

import { useAdminAuth } from '@/contexts/AdminAuthContext'
import {
  getSubscriptionPlans,
  updateSubscriptionPlan,
  createSubscriptionPlan,
  getAllSubscriptions,
  type SubscriptionPlanDto,
  type UpdatePlanRequestDto,
  type CreatePlanRequestDto,
  type TenantSubscriptionSummaryDto,
} from '@/lib/api/admin-auth-client'

// ---------------------------------------------------------------------------
// Edit Plan Dialog
// ---------------------------------------------------------------------------

interface EditPlanDialogProps {
  plan: SubscriptionPlanDto | null
  open: boolean
  onClose: () => void
  onSaved: (updated: SubscriptionPlanDto) => void
}

function EditPlanDialog({ plan, open, onClose, onSaved }: EditPlanDialogProps) {
  const [displayName, setDisplayName]           = useState('')
  const [pricePerUnit, setPricePerUnit]         = useState('')
  const [freeUnitCap, setFreeUnitCap]           = useState('')
  const [transactionFeePct, setTransactionFeePct] = useState('')
  const [annualDiscountPct, setAnnualDiscountPct] = useState('')
  const [active, setActive]                     = useState(true)
  const [popular, setPopular]                   = useState(false)
  const [features, setFeatures]                 = useState<Record<string, boolean>>({})
  const [marketingFeatures, setMarketingFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature]             = useState('')
  const [saving, setSaving]                     = useState(false)
  const [error, setError]                       = useState<string | null>(null)

  // Populate fields when plan changes
  useEffect(() => {
    if (!plan) return
    setDisplayName(plan.displayName)
    setPricePerUnit(String(plan.pricePerUnit))
    setFreeUnitCap(plan.freeUnitCap != null ? String(plan.freeUnitCap) : '')
    setTransactionFeePct(plan.transactionFeePct != null ? String(plan.transactionFeePct) : '')
    setAnnualDiscountPct(plan.annualDiscountPct != null ? String(plan.annualDiscountPct * 100) : '')
    setActive(plan.active)
    setPopular(plan.popular ?? false)
    setFeatures(Object.fromEntries(Object.entries(plan.features ?? {}).map(([k, v]) => [k, v.enabled])))
    setMarketingFeatures(plan.marketingFeatures ? [...plan.marketingFeatures] : [])
    setNewFeature('')
    setError(null)
  }, [plan])

  const isFree = plan?.name === 'FREE'

  async function handleSave() {
    if (!plan) return
    setSaving(true)
    setError(null)
    try {
      const payload: UpdatePlanRequestDto = {
        displayName,
        pricePerUnit: parseFloat(pricePerUnit) || 0,
        freeUnitCap:  freeUnitCap ? parseInt(freeUnitCap, 10) : null,
        transactionFeePct: transactionFeePct ? parseFloat(transactionFeePct) : null,
        annualDiscountPct: !isFree && annualDiscountPct ? parseFloat(annualDiscountPct) / 100 : null,
        featureFlags: features,
        active,
        popular,
        marketingFeatures,
      }
      const updated = await updateSubscriptionPlan(plan.id, payload)
      onSaved(updated)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to save plan. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function toggleFeature(key: string) {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function addFeature() {
    const trimmed = newFeature.trim()
    if (!trimmed) return
    setMarketingFeatures(prev => [...prev, trimmed])
    setNewFeature('')
  }

  function removeFeature(index: number) {
    setMarketingFeatures(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      {/* displayName already ends in "Plan" for every seeded tier — don't append a second one. */}
      <DialogTitle>Edit {plan?.displayName}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>

        {error && <Alert severity='error'>{error}</Alert>}

        <TextField
          label='Display Name'
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          fullWidth
          size='small'
        />

        <TextField
          label='Price per Unit / month'
          value={pricePerUnit}
          onChange={e => setPricePerUnit(e.target.value)}
          type='number'
          fullWidth
          size='small'
          slotProps={{
            input: {
              startAdornment: <InputAdornment position='start'>GH₵</InputAdornment>,
            }
          }}
          helperText='Set to 0 for free plans'
        />

        {/*
          Both fields apply to every plan, not just FREE / PRO — all three seeded plans carry a
          transaction fee, and a custom plan can carry a unit cap. Gating them on the plan name
          left those values invisible and uneditable on every other plan.
        */}
        <TextField
          label='Free Unit Cap'
          value={freeUnitCap}
          onChange={e => setFreeUnitCap(e.target.value)}
          type='number'
          fullWidth
          size='small'
          helperText={
            isFree
              ? 'Maximum units a Free tenant can have. Lowering this will grandfather existing tenants.'
              : 'Maximum units included before per-unit billing applies. Leave blank for no cap.'
          }
        />

        <TextField
          label='Transaction Fee %'
          value={transactionFeePct}
          onChange={e => setTransactionFeePct(e.target.value)}
          type='number'
          fullWidth
          size='small'
          slotProps={{
            input: {
              endAdornment: <InputAdornment position='end'>%</InputAdornment>,
            }
          }}
          helperText='Charged on rent collected via the platform. Leave blank for no fee.'
        />

        {!isFree && (
          <TextField
            label='Annual Discount %'
            value={annualDiscountPct}
            onChange={e => setAnnualDiscountPct(e.target.value)}
            type='number'
            fullWidth
            size='small'
            slotProps={{
              input: {
                endAdornment: <InputAdornment position='end'>%</InputAdornment>,
              }
            }}
            helperText='Leave blank to hide the annual billing option for this plan. e.g. 15 = 15% off a 12-month upfront payment.'
          />
        )}

        <Box>
          <Typography variant='body2' fontWeight={600} sx={{ mb: 1 }}>Feature Flags</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {Object.entries(plan?.features ?? {})
              .sort(([, a], [, b]) => a.label.localeCompare(b.label))
              .map(([key, info]) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      size='small'
                      checked={!!features[key]}
                      onChange={() => toggleFeature(key)}
                    />
                  }
                  label={<Typography variant='body2'>{info.label}</Typography>}
                />
              ))}
          </Box>
        </Box>

        <FormControlLabel
          control={<Switch checked={popular} onChange={e => setPopular(e.target.checked)} />}
          label={<Typography variant='body2'>Mark as "Most Popular" on landing page</Typography>}
        />

        <Box>
          <Typography variant='body2' fontWeight={600} sx={{ mb: 0.5 }}>Landing Page Features</Typography>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
            Bullet points shown on the public pricing page.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5, minHeight: 32 }}>
            {marketingFeatures.length === 0 ? (
              <Typography variant='caption' color='text.disabled' sx={{ alignSelf: 'center' }}>
                No features added yet.
              </Typography>
            ) : (
              marketingFeatures.map((f, i) => (
                <Chip
                  key={i}
                  label={f}
                  size='small'
                  onDelete={() => removeFeature(i)}
                />
              ))
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size='small'
              placeholder='e.g. Unlimited properties'
              value={newFeature}
              onChange={e => setNewFeature(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature() } }}
              fullWidth
            />
            <Button
              size='small'
              variant='outlined'
              onClick={addFeature}
              disabled={!newFeature.trim()}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add
            </Button>
          </Box>
        </Box>

        <FormControlLabel
          control={<Switch checked={active} onChange={e => setActive(e.target.checked)} />}
          label={<Typography variant='body2'>Plan Active</Typography>}
        />

      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleSave}
          disabled={saving || !displayName.trim()}
          startIcon={saving ? <CircularProgress size={14} /> : undefined}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Create Plan dialog
// ---------------------------------------------------------------------------

interface CreatePlanDialogProps {
  open: boolean
  featureKeys: { key: string; label: string }[]
  onClose: () => void
  onCreated: (created: SubscriptionPlanDto) => void
}

function CreatePlanDialog({ open, featureKeys, onClose, onCreated }: CreatePlanDialogProps) {
  const [name, setName]                         = useState('')
  const [displayName, setDisplayName]           = useState('')
  const [pricePerUnit, setPricePerUnit]         = useState('')
  const [freeUnitCap, setFreeUnitCap]           = useState('')
  const [transactionFeePct, setTransactionFeePct] = useState('')
  const [annualDiscountPct, setAnnualDiscountPct] = useState('')
  const [active, setActive]                     = useState(true)
  const [popular, setPopular]                   = useState(false)
  const [features, setFeatures]                 = useState<Record<string, boolean>>({})
  const [marketingFeatures, setMarketingFeatures] = useState<string[]>([])
  const [newFeature, setNewFeature]             = useState('')
  const [saving, setSaving]                     = useState(false)
  const [error, setError]                       = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(''); setDisplayName(''); setPricePerUnit(''); setFreeUnitCap('')
    setTransactionFeePct(''); setAnnualDiscountPct(''); setActive(true); setPopular(false)
    setFeatures({}); setMarketingFeatures([]); setNewFeature(''); setError(null)
  }, [open])

  async function handleCreate() {
    setSaving(true)
    setError(null)
    try {
      const payload: CreatePlanRequestDto = {
        name: name.trim().toUpperCase(),
        displayName,
        pricePerUnit: parseFloat(pricePerUnit) || 0,
        freeUnitCap: freeUnitCap ? parseInt(freeUnitCap, 10) : null,
        transactionFeePct: transactionFeePct ? parseFloat(transactionFeePct) : null,
        annualDiscountPct: annualDiscountPct ? parseFloat(annualDiscountPct) / 100 : null,
        featureFlags: features,
        active,
        popular,
        marketingFeatures,
      }
      const created = await createSubscriptionPlan(payload)
      onCreated(created)
      onClose()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Failed to create plan. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function toggleFeature(key: string) {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function addFeature() {
    const trimmed = newFeature.trim()
    if (!trimmed) return
    setMarketingFeatures(prev => [...prev, trimmed])
    setNewFeature('')
  }

  function removeFeature(index: number) {
    setMarketingFeatures(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth>
      <DialogTitle>New Subscription Plan</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>

        {error && <Alert severity='error'>{error}</Alert>}

        <TextField
          label='Internal Name'
          value={name}
          onChange={e => setName(e.target.value.toUpperCase())}
          fullWidth
          size='small'
          helperText='Short unique code, e.g. STARTER (stored uppercase).'
        />

        <TextField
          label='Display Name'
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          fullWidth
          size='small'
        />

        <TextField
          label='Price per Unit / month'
          value={pricePerUnit}
          onChange={e => setPricePerUnit(e.target.value)}
          type='number'
          fullWidth
          size='small'
          slotProps={{
            input: {
              startAdornment: <InputAdornment position='start'>GH₵</InputAdornment>,
            }
          }}
          helperText='Set to 0 for free plans'
        />

        <TextField
          label='Free Unit Cap (optional)'
          value={freeUnitCap}
          onChange={e => setFreeUnitCap(e.target.value)}
          type='number'
          fullWidth
          size='small'
          helperText='Maximum units this plan allows for free. Leave blank if not applicable.'
        />

        <TextField
          label='Transaction Fee % (optional)'
          value={transactionFeePct}
          onChange={e => setTransactionFeePct(e.target.value)}
          type='number'
          fullWidth
          size='small'
          slotProps={{
            input: {
              endAdornment: <InputAdornment position='end'>%</InputAdornment>,
            }
          }}
          helperText='Charged on rent collected via the platform, if applicable.'
        />

        <TextField
          label='Annual Discount % (optional)'
          value={annualDiscountPct}
          onChange={e => setAnnualDiscountPct(e.target.value)}
          type='number'
          fullWidth
          size='small'
          slotProps={{
            input: {
              endAdornment: <InputAdornment position='end'>%</InputAdornment>,
            }
          }}
          helperText='Leave blank to hide the annual billing option for this plan. e.g. 15 = 15% off a 12-month upfront payment.'
        />

        {featureKeys.length > 0 && (
          <Box>
            <Typography variant='body2' fontWeight={600} sx={{ mb: 1 }}>Feature Flags</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {featureKeys.map(({ key, label }) => (
                <FormControlLabel
                  key={key}
                  control={
                    <Switch
                      size='small'
                      checked={!!features[key]}
                      onChange={() => toggleFeature(key)}
                    />
                  }
                  label={<Typography variant='body2'>{label}</Typography>}
                />
              ))}
            </Box>
          </Box>
        )}

        <FormControlLabel
          control={<Switch checked={popular} onChange={e => setPopular(e.target.checked)} />}
          label={<Typography variant='body2'>Mark as "Most Popular" on landing page</Typography>}
        />

        <Box>
          <Typography variant='body2' fontWeight={600} sx={{ mb: 0.5 }}>Landing Page Features</Typography>
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 1 }}>
            Bullet points shown on the public pricing page.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5, minHeight: 32 }}>
            {marketingFeatures.length === 0 ? (
              <Typography variant='caption' color='text.disabled' sx={{ alignSelf: 'center' }}>
                No features added yet.
              </Typography>
            ) : (
              marketingFeatures.map((f, i) => (
                <Chip
                  key={i}
                  label={f}
                  size='small'
                  onDelete={() => removeFeature(i)}
                />
              ))
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size='small'
              placeholder='e.g. Unlimited properties'
              value={newFeature}
              onChange={e => setNewFeature(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature() } }}
              fullWidth
            />
            <Button
              size='small'
              variant='outlined'
              onClick={addFeature}
              disabled={!newFeature.trim()}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add
            </Button>
          </Box>
        </Box>

        <FormControlLabel
          control={<Switch checked={active} onChange={e => setActive(e.target.checked)} />}
          label={<Typography variant='body2'>Plan Active</Typography>}
        />

      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant='contained'
          onClick={handleCreate}
          disabled={saving || !name.trim() || !displayName.trim()}
          startIcon={saving ? <CircularProgress size={14} /> : undefined}
        >
          {saving ? 'Creating…' : 'Create Plan'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Plan card
// ---------------------------------------------------------------------------

interface PlanCardProps {
  plan: SubscriptionPlanDto
  canManage: boolean
  onEdit: (plan: SubscriptionPlanDto) => void
}

function PlanCard({ plan, canManage, onEdit }: PlanCardProps) {
  const isFree    = plan.name === 'FREE'
  const isHighlight = plan.popular

  // Build feature rows sorted alphabetically by label
  const featureRows = Object.entries(plan.features)
    .sort(([, a], [, b]) => a.label.localeCompare(b.label))
    .map(([key, info]) => ({ key, label: info.label, enabled: info.enabled }))

  return (
    <Card
      variant='outlined'
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderColor: isHighlight ? 'primary.main' : 'divider',
        borderWidth: isHighlight ? 2 : 1,
      }}
    >
      {isHighlight && (
        <Box sx={{ position: 'absolute', top: -1, right: 16 }}>
          <Chip
            label='Most popular'
            size='small'
            color='primary'
            sx={{ borderRadius: '0 0 6px 6px', height: 22, fontSize: '0.7rem' }}
          />
        </Box>
      )}

      <CardContent sx={{ flex: 1 }}>
        {/* Name + status */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant='subtitle1' fontWeight={700}>{plan.displayName}</Typography>
          <Chip
            size='small'
            label={plan.active ? 'Active' : 'Inactive'}
            color={plan.active ? 'success' : 'default'}
            variant='outlined'
          />
        </Box>

        {/* Price */}
        <Box sx={{ mb: 2 }}>
          {isFree ? (
            <Typography variant='h4' fontWeight={800} color='text.primary'>Free</Typography>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant='caption' color='text.secondary' sx={{ alignSelf: 'flex-start', mt: 1 }}>GH₵</Typography>
              <Typography variant='h4' fontWeight={800}>{Number(plan.pricePerUnit).toLocaleString()}</Typography>
              <Typography variant='caption' color='text.secondary'>/unit/mo</Typography>
            </Box>
          )}
        </Box>

        {/* Key limits + subscriber count */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          {isFree && plan.freeUnitCap != null && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant='body2' fontWeight={700}>{plan.freeUnitCap}</Typography>
              <Typography variant='caption' color='text.secondary'>Unit cap</Typography>
            </Box>
          )}
          {plan.transactionFeePct != null && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant='body2' fontWeight={700}>{plan.transactionFeePct}%</Typography>
              <Typography variant='caption' color='text.secondary'>Txn fee</Typography>
            </Box>
          )}
          <Chip
            size='small'
            icon={<i className='ri-group-line' style={{ fontSize: '0.85rem' }} />}
            label={`${plan.subscriberCount ?? 0} subscriber${plan.subscriberCount === 1 ? '' : 's'}`}
            variant='tonal'
            color='primary'
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Feature flags */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {featureRows.map(f => (
            <Box key={f.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i
                className={f.enabled ? 'ri-check-line' : 'ri-close-line'}
                style={{
                  fontSize: '1rem',
                  color: f.enabled
                    ? 'var(--mui-palette-success-main)'
                    : 'var(--mui-palette-text-disabled)',
                  flexShrink: 0,
                }}
              />
              <Typography variant='body2' color={f.enabled ? 'text.primary' : 'text.disabled'}>
                {f.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Marketing features (landing page bullets) */}
        {plan.marketingFeatures && plan.marketingFeatures.length > 0 && (
          <>
            <Divider sx={{ mt: 2, mb: 1.5 }} />
            <Typography variant='caption' color='text.secondary' fontWeight={600} sx={{ display: 'block', mb: 0.75 }}>
              Landing page bullets
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {plan.marketingFeatures.map((f, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <i className='ri-check-line' style={{ fontSize: '0.9rem', color: 'var(--mui-palette-success-main)', flexShrink: 0 }} />
                  <Typography variant='caption'>{f}</Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'flex-end' }}>
        {canManage && (
          <Button
            size='small'
            variant='outlined'
            onClick={() => onEdit(plan)}
            startIcon={<i className='ri-pencil-line' />}
          >
            Edit
          </Button>
        )}
      </CardActions>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Skeleton card (loading state)
// ---------------------------------------------------------------------------

function PlanCardSkeleton() {
  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton variant='text' width='60%' height={28} sx={{ mb: 1 }} />
        <Skeleton variant='text' width='40%' height={48} sx={{ mb: 2 }} />
        <Skeleton variant='rectangular' height={120} sx={{ borderRadius: 1 }} />
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Stats bar
// ---------------------------------------------------------------------------

function StatsBar({ plans }: { plans: SubscriptionPlanDto[] }) {
  const activePlans    = plans.filter(p => p.active).length
  const totalPlans     = plans.length
  const totalSubscribers = plans.reduce((sum, p) => sum + (p.subscriberCount ?? 0), 0)

  return (
    <Card variant='outlined' sx={{ mb: 3 }}>
      <CardContent sx={{ py: '12px !important' }}>
        <Grid container spacing={2} sx={{ textAlign: 'center' }}>
          {[
            { label: 'Total Plans',      value: totalPlans,       icon: 'ri-price-tag-3-line' },
            { label: 'Active Plans',     value: activePlans,      icon: 'ri-checkbox-circle-line' },
            { label: 'Total Subscribers', value: totalSubscribers, icon: 'ri-group-line' },
          ].map(stat => (
            <Grid item xs={12} sm={4} key={stat.label}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                <i className={stat.icon} style={{ fontSize: '1.5rem', opacity: 0.6 }} />
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant='h6' fontWeight={700}>{stat.value}</Typography>
                  <Typography variant='caption' color='text.secondary'>{stat.label}</Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminSubscriptionsView() {
  const { hasPermission } = useAdminAuth()
  const canManage = hasPermission('platform:plans:write')

  const [plans, setPlans]           = useState<SubscriptionPlanDto[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadError, setLoadError]   = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<SubscriptionPlanDto | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [subs, setSubs]             = useState<TenantSubscriptionSummaryDto[]>([])
  const [subsLoading, setSubsLoading] = useState(true)
  const [subsPage, setSubsPage]     = useState(0)
  const [subsPageSize, setSubsPageSize] = useState(25)
  const [subsTotal, setSubsTotal]   = useState(0)

  const fetchPlans = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await getSubscriptionPlans()
      // Sort: FREE → BASIC → PRO
      const order: Record<string, number> = { FREE: 0, BASIC: 1, PRO: 2 }
      data.sort((a, b) => (order[a.name] ?? 99) - (order[b.name] ?? 99))
      setPlans(data)
    } catch {
      setLoadError('Failed to load subscription plans. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  useEffect(() => {
    setSubsLoading(true)
    getAllSubscriptions(subsPage, subsPageSize)
      .then(result => {
        setSubs(result.content)
        setSubsTotal(result.totalElements)
      })
      .catch(() => {})
      .finally(() => setSubsLoading(false))
  }, [subsPage, subsPageSize])

  function handleSaved(updated: SubscriptionPlanDto) {
    setPlans(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSuccessMsg(`${updated.displayName} plan updated successfully.`)
  }

  function handleCreated(created: SubscriptionPlanDto) {
    setPlans(prev => [...prev, created])
    setSuccessMsg(`${created.displayName} plan created successfully.`)
  }

  // Template of available feature keys/labels, taken from any existing plan —
  // feature flags are a fixed set defined by the backend, not invented per-plan.
  const featureKeys = Object.entries(plans[0]?.features ?? {})
    .map(([key, info]) => ({ key, label: info.label }))
    .sort((a, b) => a.label.localeCompare(b.label))

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>Subscription Plans</Typography>
          <Typography variant='body2' color='text.secondary'>Manage platform pricing tiers</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {canManage && (
            <Button
              variant='contained'
              size='small'
              onClick={() => setCreateOpen(true)}
              startIcon={<i className='ri-add-line' />}
            >
              New Plan
            </Button>
          )}
          <Tooltip title='Refresh'>
            <span>
              <Button
                variant='outlined'
                size='small'
                onClick={fetchPlans}
                disabled={loading}
                startIcon={<i className='ri-refresh-line' />}
              >
                Refresh
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Load error */}
      {loadError && (
        <Alert severity='error' sx={{ mb: 3 }} action={
          <Button size='small' color='inherit' onClick={fetchPlans}>Retry</Button>
        }>
          {loadError}
        </Alert>
      )}

      {/* Stats */}
      {!loading && plans.length > 0 && <StatsBar plans={plans} />}

      {/* Plan cards */}
      <Grid container spacing={3}>
        {loading ? (
          [0, 1, 2].map(i => (
            <Grid item xs={12} md={4} key={i}>
              <PlanCardSkeleton />
            </Grid>
          ))
        ) : (
          plans.map(plan => (
            <Grid item xs={12} md={4} key={plan.id}>
              <PlanCard
                plan={plan}
                canManage={canManage}
                onEdit={setEditTarget}
              />
            </Grid>
          ))
        )}
      </Grid>

      {/* Tenant Subscriptions table */}
      <Typography variant='h6' fontWeight={700} sx={{ mt: 4, mb: 2 }}>Tenant Subscriptions</Typography>
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {subsLoading ? (
            <Box sx={{ p: 3 }}><Skeleton variant='rectangular' height={120} sx={{ borderRadius: 1 }} /></Box>
          ) : subs.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography variant='body2' color='text.secondary'>No subscriptions yet.</Typography>
            </Box>
          ) : (
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Tenant</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align='right'>Billed Units</TableCell>
                  <TableCell>Period End</TableCell>
                  <TableCell>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {subs.map(s => (
                  <TableRow key={s.tenantId} hover>
                    <TableCell>
                      <Typography variant='body2' fontWeight={600}>{s.tenantName}</Typography>
                      <Typography variant='caption' color='text.secondary'>{s.tenantId}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={s.planDisplayName}
                        size='small'
                        color={s.planName === 'PRO' ? 'success' : s.planName === 'BASIC' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={s.status}
                        size='small'
                        variant='outlined'
                        color={s.status === 'ACTIVE' ? 'success' : s.status === 'PAST_DUE' ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell align='right'>
                      <Typography variant='body2'>{s.billedUnitCount ?? '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='caption'>
                        {s.currentPeriodEnd
                          ? new Date(s.currentPeriodEnd).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' })
                          : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {s.pendingPlanName && (
                        <Typography variant='caption' color='warning.main'>
                          Downgrades to {s.pendingPlanName} at period end
                        </Typography>
                      )}
                      {s.cancelledAt && !s.pendingPlanName && (
                        <Typography variant='caption' color='error.main'>Cancelled</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!subsLoading && subsTotal > 0 && (
            <TablePagination
              component='div'
              count={subsTotal}
              page={subsPage}
              onPageChange={(_, newPage) => setSubsPage(newPage)}
              rowsPerPage={subsPageSize}
              onRowsPerPageChange={e => {
                setSubsPageSize(parseInt(e.target.value, 10))
                setSubsPage(0)
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <EditPlanDialog
        plan={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        onSaved={handleSaved}
      />

      {/* Create dialog */}
      <CreatePlanDialog
        open={createOpen}
        featureKeys={featureKeys}
        onClose={() => setCreateOpen(false)}
        onCreated={handleCreated}
      />

      {/* Success toast */}
      <Snackbar
        open={successMsg !== null}
        autoHideDuration={4000}
        onClose={() => setSuccessMsg(null)}
        message={successMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
