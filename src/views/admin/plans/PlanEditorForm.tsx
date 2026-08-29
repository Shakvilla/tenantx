'use client'

// React Imports
import { useCallback, useEffect, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Checkbox from '@mui/material/Checkbox'
import Divider from '@mui/material/Divider'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid2'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// Component Imports
import CycleEditor from './CycleEditor'
import FeatureMatrix from './FeatureMatrix'
import ImpactDialog from './ImpactDialog'
import PriceCurve from './PriceCurve'
import TierTableEditor from './TierTableEditor'

// API Imports
import {
  getPlanDetail,
  savePlan,
  PlanImpactRequired,
  type PlanDetail,
  type PlanImpact,
  type PlanWriteBody
} from '@/lib/api/subscription-plans-admin'

/**
 * The plan editor.
 *
 * Owns the save handshake, which is the only part of this screen where a mistake lets an admin
 * approve a change they were not shown:
 *
 *   save            -> POST/PUT with NO acknowledgement
 *   409             -> show the server's impact; do not save
 *   confirm         -> replay the identical body with the hash the server returned
 *   409 again       -> the plan moved underneath; offer reload, never another confirm
 *   422             -> a hard block; render as an error, never as a dialog
 *
 * The 422 branch matters as much as the 409 one. A gapped tier table or an unknown feature key is
 * a refusal no acknowledgement can clear, so rendering it as confirmable would put a button in
 * front of the admin that cannot possibly work.
 */

/** The feature keys the write API accepts — ANNOTATION-mode only; anything else is a 422. */
const WRITABLE_FEATURE_KEYS = [
  'EXPENSES',
  'ADVANCE_RENT',
  'AGENT_MANAGEMENT',
  'COMMUNICATION',
  'UTILITIES_MANAGEMENT',
  'FINANCIAL_REPORTS',
  'LATE_FEES',
  'RENT_COLLECTION',
  'DOCUMENT_MANAGEMENT',
  'MAINTENANCE_TRACKING'
]

const BLANK: PlanWriteBody = {
  code: '',
  name: '',
  displayName: '',
  description: null,
  status: 'DRAFT',
  billingMetric: 'UNITS',
  pricingMode: 'GRADUATED',
  currency: 'GHS',
  maxQty: null,
  selfServeMaxQty: null,
  isPublic: true,
  sortOrder: 0,
  tiers: [{ fromQty: 1, toQty: null, flatPrice: '0.00', perUnitPrice: '0.00' }],
  cycles: [{ cycle: 'MONTHLY', discountPct: '0.0000', enabled: true }],
  featureKeys: [],
  popular: false,
  marketingFeatures: []
}

function toWriteBody(detail: PlanDetail): PlanWriteBody {
  const { id, subscriberCount, ...body } = detail

  return body
}

interface PlanEditorFormProps {
  /** Null in create mode. */
  planId: string | null
}

const PlanEditorForm = ({ planId }: PlanEditorFormProps) => {
  const router = useRouter()

  const [form, setForm] = useState<PlanWriteBody>(BLANK)
  const [loading, setLoading] = useState(Boolean(planId))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [impact, setImpact] = useState<PlanImpact | null>(null)
  const [stale, setStale] = useState(false)

  useEffect(() => {
    if (!planId) return

    getPlanDetail(planId)
      .then(detail => setForm(toWriteBody(detail)))
      .catch(() => setError('Could not load this plan.'))
      .finally(() => setLoading(false))
  }, [planId])

  const set = <K extends keyof PlanWriteBody>(key: K, value: PlanWriteBody[K]) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const submit = useCallback(
    async (acknowledgement?: PlanImpact) => {
      setSaving(true)
      setError(null)

      const body: PlanWriteBody = acknowledgement
        ? {
            ...form,
            acknowledgement: {
              impactHash: acknowledgement.impactHash,
              affectedSubscribers: acknowledgement.affectedSubscribers
            }
          }
        : form

      try {
        await savePlan(planId, body)
        setImpact(null)
        router.push('/admin/subscriptions')
      } catch (err: any) {
        if (err instanceof PlanImpactRequired) {
          // A refusal on a REPLAY means the plan changed underneath: the hash the admin was
          // shown no longer describes reality, so confirming again cannot succeed.
          setStale(Boolean(acknowledgement))
          setImpact(err.impact)
        } else {
          // Everything else — 422 hard blocks included — is an error, not a question.
          setImpact(null)
          setError(err?.response?.data?.message ?? 'Could not save this plan.')
        }
      } finally {
        setSaving(false)
      }
    },
    [form, planId, router]
  )

  if (loading) return <Typography>Loading…</Typography>

  return (
    <Box className='flex flex-col gap-6'>
      {error && <Alert severity='error'>{error}</Alert>}

      <Card>
        <CardHeader title='Plan details' />
        <CardContent>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label='Code'
                value={form.code}
                // Immutable once created — the server refuses a change with a 422.
                disabled={Boolean(planId)}
                onChange={e => set('code', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label='Name' value={form.name} onChange={e => set('name', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                label='Display name'
                value={form.displayName}
                onChange={e => set('displayName', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label='Description'
                value={form.description ?? ''}
                onChange={e => set('description', e.target.value || null)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField select fullWidth label='Status' value={form.status} onChange={e => set('status', e.target.value as any)}>
                {['DRAFT', 'ACTIVE', 'ARCHIVED'].map(s => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                select
                fullWidth
                label='Billing metric'
                value={form.billingMetric}
                onChange={e => set('billingMetric', e.target.value as any)}
              >
                {['UNITS', 'OCCUPANTS', 'PROPERTIES'].map(m => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField
                select
                fullWidth
                label='Pricing mode'
                value={form.pricingMode}
                onChange={e => set('pricingMode', e.target.value as any)}
              >
                {['FLAT', 'GRADUATED', 'VOLUME'].map(m => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 3 }}>
              <TextField fullWidth label='Currency' value={form.currency} onChange={e => set('currency', e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type='number'
                label='Max units (entitlement ceiling)'
                value={form.maxQty ?? ''}
                onChange={e => set('maxQty', e.target.value ? Number(e.target.value) : null)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type='number'
                label='Self-serve limit'
                helperText='Above this, pricing is sales-led'
                value={form.selfServeMaxQty ?? ''}
                onChange={e => set('selfServeMaxQty', e.target.value ? Number(e.target.value) : null)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type='number'
                label='Sort order'
                value={form.sortOrder}
                onChange={e => set('sortOrder', Number(e.target.value))}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title='Pricing bands' subheader='Each band starts one above the last' />
            <CardContent>
              <TierTableEditor value={form.tiers} onChange={tiers => set('tiers', tiers)} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ height: '100%' }}>
            <CardHeader title='Price curve' />
            <CardContent>
              <PriceCurve planId={planId} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardHeader title='Billing cycles' />
        <CardContent>
          <CycleEditor value={form.cycles} onChange={cycles => set('cycles', cycles)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Features' />
        <CardContent>
          <FeatureMatrix
            value={form.featureKeys}
            available={WRITABLE_FEATURE_KEYS}
            onChange={keys => set('featureKeys', keys)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader title='Pricing page' subheader='How this plan is presented to prospective customers' />
        <CardContent className='flex flex-col gap-4'>
          <FormControlLabel
            control={
              <Checkbox
                checked={form.popular}
                inputProps={{ 'aria-label': 'Most popular' }}
                onChange={e => set('popular', e.target.checked)}
              />
            }
            label='Show the "Most Popular" badge on this plan'
          />

          <Divider />

          <Typography variant='body2' color='text.secondary'>
            Bullet points on the plan card.
          </Typography>

          {form.marketingFeatures.map((feature, index) => (
            <Box key={index} className='flex items-center gap-2'>
              <TextField
                fullWidth
                size='small'
                value={feature}
                inputProps={{ 'aria-label': `Marketing feature ${index + 1}` }}
                onChange={e =>
                  set(
                    'marketingFeatures',
                    form.marketingFeatures.map((f, i) => (i === index ? e.target.value : f))
                  )
                }
              />
              <IconButton
                size='small'
                aria-label={`Remove marketing feature ${index + 1}`}
                onClick={() =>
                  set(
                    'marketingFeatures',
                    form.marketingFeatures.filter((_, i) => i !== index)
                  )
                }
              >
                <i className='ri-delete-bin-line text-[20px]' />
              </IconButton>
            </Box>
          ))}

          <Button
            size='small'
            startIcon={<i className='ri-add-line' />}
            sx={{ alignSelf: 'flex-start' }}
            onClick={() => set('marketingFeatures', [...form.marketingFeatures, ''])}
          >
            Add bullet point
          </Button>
        </CardContent>
      </Card>

      <Box className='flex justify-end gap-3'>
        <Button color='secondary' onClick={() => router.push('/admin/subscriptions')}>
          Cancel
        </Button>
        <Button variant='contained' disabled={saving} onClick={() => submit()}>
          Save plan
        </Button>
      </Box>

      <ImpactDialog
        impact={impact}
        stale={stale}
        onConfirm={() => impact && submit(impact)}
        onClose={() => {
          setImpact(null)
          setStale(false)
        }}
      />
    </Box>
  )
}

export default PlanEditorForm
