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

import { useAdminAuth } from '@/contexts/AdminAuthContext'
import {
  getSubscriptionPlans,
  updateSubscriptionPlan,
  type SubscriptionPlanDto,
  type UpdatePlanRequestDto,
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
    setActive(plan.active)
    setPopular(plan.popular ?? false)
    setFeatures(Object.fromEntries(Object.entries(plan.features ?? {}).map(([k, v]) => [k, v.enabled])))
    setMarketingFeatures(plan.marketingFeatures ? [...plan.marketingFeatures] : [])
    setNewFeature('')
    setError(null)
  }, [plan])

  const isFree = plan?.name === 'FREE'
  const isPro  = plan?.name === 'PRO'

  async function handleSave() {
    if (!plan) return
    setSaving(true)
    setError(null)
    try {
      const payload: UpdatePlanRequestDto = {
        displayName,
        pricePerUnit: parseFloat(pricePerUnit) || 0,
        freeUnitCap:  isFree && freeUnitCap ? parseInt(freeUnitCap, 10) : null,
        transactionFeePct: isPro && transactionFeePct ? parseFloat(transactionFeePct) : null,
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
      <DialogTitle>Edit {plan?.displayName} Plan</DialogTitle>
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

        {isFree && (
          <TextField
            label='Free Unit Cap'
            value={freeUnitCap}
            onChange={e => setFreeUnitCap(e.target.value)}
            type='number'
            fullWidth
            size='small'
            helperText='Maximum units a Free tenant can have. Lowering this will grandfather existing tenants.'
          />
        )}

        {isPro && (
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
            helperText='Charged on rent collected via the platform on Pro plan'
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
  const canManage = hasPermission('manage_tenants')

  const [plans, setPlans]           = useState<SubscriptionPlanDto[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadError, setLoadError]   = useState<string | null>(null)
  const [editTarget, setEditTarget] = useState<SubscriptionPlanDto | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

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

  function handleSaved(updated: SubscriptionPlanDto) {
    setPlans(prev => prev.map(p => p.id === updated.id ? updated : p))
    setSuccessMsg(`${updated.displayName} plan updated successfully.`)
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>Subscription Plans</Typography>
          <Typography variant='body2' color='text.secondary'>Manage platform pricing tiers</Typography>
        </Box>
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

      {/* Phase 3 info */}
      <Alert
        severity='info'
        icon={<i className='ri-information-line' />}
        sx={{ mb: 3 }}
      >
        <strong>Transaction fee collection (Pro plan) is coming soon.</strong>{' '}
        Billing cycles are live — fees on rent collected via the platform will be deducted automatically once Phase 3 is wired up.
      </Alert>

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

      {/* Edit dialog */}
      <EditPlanDialog
        plan={editTarget}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        onSaved={handleSaved}
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
