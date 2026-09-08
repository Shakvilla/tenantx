'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// Third-party Imports
import Cookies from 'js-cookie'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// API Imports
import { apiPost, API_BASE } from '@/lib/api/client'

// ---------------------------------------------------------------------------
// Types — mirror of GET /api/v1/public/plans (no auth)
// ---------------------------------------------------------------------------

type BillingCycle = 'monthly' | 'annual'

const CYCLE_OPTIONS: { value: BillingCycle; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' }
]

type FeatureInfo = {
  label: string
  enabled: boolean
}

type PlanTier = {
  fromQty: number
  toQty: number | null
  flatPrice: number
  perUnitPrice: number
}

type PublicPlan = {
  id: string
  name: string
  displayName: string
  pricePerUnit: number
  freeUnitCap: number | null
  maxQty: number | null
  entryPrice: number
  tiers: PlanTier[]
  transactionFeePct: number | null
  storageQuotaMb: number | null
  popular: boolean
  features: Record<string, FeatureInfo>
  marketingFeatures: string[]
  annualDiscountPct: number | null
  trialDays: number
}

// ---------------------------------------------------------------------------
// Brand palette — mirrors tenantx-landing/src/index.css so these pricing cards
// match the marketing site's pricing section (pink accents on ink/sand).
// The webapp theme has no pink/kente/ink tokens, so they are fixed here.
// ---------------------------------------------------------------------------

const BRAND = {
  primary: '#EE3F94', // pink — decorative fills, badges, popular card border
  primaryDeep: '#D61C76', // pink — solid buttons, selected borders, pink text
  primaryDark: '#B81563', // pink — button hover
  ink: '#0B0D10', // near-black — popular card surface + body text
  sand: '#F7F2E9', // warm off-white — popular card text + page background
  kente: '#0C694D' // green — checks, eyebrow, trial pill
} as const

const INK = (opacity: number) => `rgba(11, 13, 16, ${opacity})`
const SAND = (opacity: number) => `rgba(247, 242, 233, ${opacity})`

/** Bricolage Grotesque — the marketing site's heading face, loaded app-wide via next/font. */
const HEADING_FONT = 'var(--font-bricolage-grotesque), sans-serif'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Storage quota the way the marketing site formats it: "1 GB", "500 MB", "Unlimited". */
function formatStorageQuota(mb: number | null): string {
  if (mb == null) return 'Unlimited'

  if (mb >= 1024) {
    const gb = mb / 1024

    return gb === Math.floor(gb) ? `${gb} GB` : `${gb.toFixed(1)} GB`
  }

  return `${mb} MB`
}

/**
 * The features a plan advertises, straight from the CMS — mirror of the marketing site's
 * `planFeatureList`: `marketingFeatures` when the admin wrote a bespoke list (the pricing
 * page's preferred source, in CMS order), otherwise the feature-flag map with its display
 * names, alphabetised. "Document Storage" picks up the plan's quota label.
 */
function planFeatureList(plan: PublicPlan): FeatureInfo[] {
  const storageQuota = formatStorageQuota(plan.storageQuotaMb ?? null)

  const injectStorage = (label: string): string =>
    /document\s*storage/i.test(label) ? `Document Storage: ${storageQuota}` : label

  const marketingFeatures = plan.marketingFeatures ?? []

  if (marketingFeatures.length > 0) {
    return marketingFeatures.map(label => ({ label: injectStorage(label), enabled: true }))
  }

  return Object.values(plan.features ?? {})
    .map(f => ({ label: injectStorage(f.label), enabled: f.enabled }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

// ---------------------------------------------------------------------------
// Billing cycle toggle — visual match of the landing page's Monthly/Annual pill
// ---------------------------------------------------------------------------

function BillingToggle({
  cycle,
  onChange
}: {
  cycle: BillingCycle
  onChange: (cycle: BillingCycle) => void
}) {
  return (
    <Box
      role='group'
      aria-label='Billing cycle'
      sx={{
        display: 'flex',
        width: 'fit-content',
        mx: 'auto',
        mb: 5,
        alignItems: 'center',
        gap: 0.5,
        p: 0.5,
        borderRadius: '999px',
        border: `1px solid ${INK(0.1)}`,
        bgcolor: 'rgba(255, 255, 255, 0.72)'
      }}
    >
      {CYCLE_OPTIONS.map(option => {
        const selected = cycle === option.value

        return (
          <Box
            key={option.value}
            component='button'
            type='button'
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            sx={{
              border: 0,
              cursor: 'pointer',
              fontFamily: 'inherit',
              borderRadius: '999px',
              px: 2.5,
              py: 1,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              transition: 'background-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease',
              ...(selected
                ? {
                    bgcolor: BRAND.ink,
                    color: BRAND.sand,
                    boxShadow: '0 8px 24px -10px rgba(11, 13, 16, 0.55)'
                  }
                : {
                    bgcolor: 'transparent',
                    color: INK(0.55),
                    '&:hover': { color: BRAND.ink }
                  }),
              '&:focus-visible': {
                outline: '2px solid',
                outlineColor: BRAND.primary,
                outlineOffset: 2
              }
            }}
          >
            {option.label}
          </Box>
        )
      })}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Plan card — visual match of the landing page's pricing card
// ---------------------------------------------------------------------------

function PlanCard({
  plan,
  selected,
  billingCycle,
  onSelect
}: {
  plan: PublicPlan
  selected: boolean
  billingCycle: BillingCycle
  onSelect: () => void
}) {
  const trialDays = plan.trialDays ?? 0
  const features = planFeatureList(plan)
  const price = Number(plan.entryPrice) || 0
  const isPopular = plan.popular
  const isFree = (Number(plan.pricePerUnit) || 0) === 0 && price === 0
  const annualDiscountPct = Number(plan.annualDiscountPct) || 0
  const isAnnual = billingCycle === 'annual' && !isFree
  const annualPrice = isAnnual ? Math.round(price * 12 * (1 - annualDiscountPct)) : 0
  const showDiscountBadge = isAnnual && annualDiscountPct > 0
  const savePct = Math.round(annualDiscountPct * 100)
  const momoFee = `${((Number(plan.transactionFeePct) || 0) * 100).toFixed(1)}% MoMo fee`

  const unitLabel =
    plan.freeUnitCap !== null && plan.freeUnitCap !== undefined
      ? `Up to ${plan.freeUnitCap} units`
      : plan.maxQty != null
        ? `Up to ${plan.maxQty} units`
        : 'Unlimited units'

  return (
    <Card
      variant='outlined'
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      role='radio'
      aria-checked={selected}
      tabIndex={0}
      sx={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        userSelect: 'none',
        overflow: 'visible',
        borderRadius: '16px',
        border: isPopular
          ? `2px solid ${BRAND.primary}`
          : selected
            ? `2px solid ${BRAND.primaryDeep}`
            : `1px solid ${INK(0.1)}`,
        bgcolor: isPopular ? BRAND.ink : 'rgba(255, 255, 255, 0.72)',
        color: isPopular ? BRAND.sand : BRAND.ink,
        boxShadow: isPopular
          ? '0 30px 80px -30px rgba(238, 63, 148, 0.45)'
          : selected
            ? '0 14px 36px -14px rgba(214, 28, 118, 0.3)'
            : 'none',
        transition:
          'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
        '&:hover': {
          transform: 'translateY(-6px)',
          borderColor: isPopular ? BRAND.primary : selected ? BRAND.primaryDeep : INK(0.2),
          boxShadow: isPopular
            ? '0 30px 80px -28px rgba(238, 63, 148, 0.6)'
            : '0 18px 44px -18px rgba(11, 13, 16, 0.25)'
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: BRAND.primary,
          outlineOffset: 2
        }
      }}
    >
      {isPopular && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            borderRadius: '999px',
            bgcolor: BRAND.primary,
            color: BRAND.ink,
            px: 2,
            py: 0.5,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          Most Popular
        </Box>
      )}

      {selected && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 14,
            insetInlineEnd: 14,
            display: 'inline-flex',
            lineHeight: 0,
            color: isPopular ? BRAND.primary : BRAND.primaryDeep
          }}
        >
          <i className='ri-checkbox-circle-fill' style={{ fontSize: 20 }} />
        </Box>
      )}

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 3.5,
          ...(isPopular && { pt: { md: 5 }, pb: { md: 5 } })
        }}
      >
        {/* Plan name + trial pill */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            mb: 1,
            pr: selected ? 3.5 : 0
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: isPopular ? BRAND.primary : INK(0.65)
            }}
          >
            {plan.displayName}
          </Typography>
          {trialDays > 0 && (
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                whiteSpace: 'nowrap',
                borderRadius: '999px',
                bgcolor: BRAND.kente,
                color: BRAND.sand,
                px: 1.25,
                py: 0.5,
                fontSize: 11,
                fontWeight: 700
              }}
            >
              {trialDays}-day free trial
            </Box>
          )}
        </Box>

        {/* Price */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 0.75, rowGap: 0.5 }}>
          {isFree ? (
            <Typography
              sx={{
                fontFamily: HEADING_FONT,
                fontSize: 44,
                fontWeight: 600,
                lineHeight: 1,
                letterSpacing: '-0.04em'
              }}
            >
              Free
            </Typography>
          ) : (
            <>
              <Typography sx={{ fontSize: 14, fontWeight: 500, color: isPopular ? SAND(0.8) : INK(0.65) }}>
                GH₵
              </Typography>
              <Typography
                sx={{
                  fontFamily: HEADING_FONT,
                  fontSize: 44,
                  fontWeight: 600,
                  lineHeight: 1,
                  letterSpacing: '-0.04em'
                }}
              >
                {(isAnnual ? annualPrice : price).toLocaleString()}
              </Typography>
              <Typography sx={{ fontSize: 14, color: isPopular ? SAND(0.8) : INK(0.65) }}>
                {isAnnual ? '/year' : '/month'}
              </Typography>
              {showDiscountBadge && (
                <Typography
                  component='span'
                  sx={{
                    ml: 0.75,
                    borderRadius: '999px',
                    bgcolor: BRAND.kente,
                    color: BRAND.sand,
                    px: 1.25,
                    py: 0.5,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  Save {savePct}%
                </Typography>
              )}
            </>
          )}
        </Box>

        {/* Sub-line */}
        <Typography sx={{ mt: 1, fontSize: 14, color: isPopular ? SAND(0.8) : INK(0.65) }}>
          {unitLabel} · {momoFee}
        </Typography>

        {/* Features */}
        <Box
          component='ul'
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            mt: 2.5,
            mb: 3.5,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25
          }}
        >
          {features.map(feature => (
            <Box component='li' key={feature.label} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
              {feature.enabled ? (
                <i
                  className='ri-check-line'
                  style={{ fontSize: 16, color: isPopular ? BRAND.primary : BRAND.kente, marginTop: 1, flexShrink: 0 }}
                />
              ) : (
                <i
                  className='ri-close-line'
                  style={{ fontSize: 16, color: isPopular ? SAND(0.4) : INK(0.4), marginTop: 1, flexShrink: 0 }}
                />
              )}
              <Typography
                sx={{
                  fontSize: 14,
                  color: feature.enabled
                    ? isPopular
                      ? SAND(0.9)
                      : INK(0.75)
                    : isPopular
                      ? SAND(0.45)
                      : INK(0.45)
                }}
              >
                {feature.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Get Started */}
        <Button
          fullWidth
          onClick={e => {
            e.stopPropagation()
            onSelect()
          }}
          sx={{
            borderRadius: '999px',
            py: 1.5,
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            textTransform: 'none',
            ...(isPopular
              ? {
                  bgcolor: BRAND.primaryDeep,
                  color: '#fff',
                  boxShadow: '0 8px 30px -8px rgba(214, 28, 118, 0.55)',
                  '&:hover': { bgcolor: BRAND.primaryDark }
                }
              : selected
                ? {
                    bgcolor: BRAND.primaryDeep,
                    color: '#fff',
                    boxShadow: '0 8px 24px -10px rgba(214, 28, 118, 0.45)',
                    '&:hover': { bgcolor: BRAND.primaryDark }
                  }
                : {
                    bgcolor: 'transparent',
                    border: `1px solid ${BRAND.primaryDeep}`,
                    color: BRAND.primaryDeep,
                    '&:hover': { bgcolor: BRAND.primaryDeep, color: '#fff' }
                  })
          }}
        >
          Get Started
        </Button>
      </Box>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

const SelectPlanView = () => {
  const router = useRouter()

  const [plans, setPlans] = useState<PublicPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')

  const hasAnnualPlans = plans.some(p => (Number(p.annualDiscountPct) || 0) > 0)

  const loadPlans = () => {
    setPlansLoading(true)
    setFetchError(null)

    // Public endpoint — use fetch() directly to avoid the authenticated apiClient
    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1').replace(/\/api\/v1$/, '')

    fetch(`${baseUrl}/api/v1/public/plans`)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error('Failed to load plans'))))
      .then(data => setPlans(Array.isArray(data) ? data : []))
      .catch(err => setFetchError(err instanceof Error ? err.message : 'Failed to load plans. Please try again.'))
      .finally(() => setPlansLoading(false))
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const handleContinue = async () => {
    if (!selectedPlan || submitting) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      await apiPost(`${API_BASE}/subscription/select-plan`, { planName: selectedPlan })

      // Plan selection is complete — clear the guard cookie so the middleware stops confining
      // the tenant to this page and lets them reach the rest of the app.
      Cookies.remove('plan_selection_required', { path: '/' })

      router.push('/dashboard')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to set your plan. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: BRAND.sand,
        px: { xs: 3, sm: 6 },
        py: { xs: 6, md: 10 },
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'none' }
        },
        animation: 'fadeUp 0.5s ease'
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 900 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 8 }, px: { xs: 1, sm: 2 } }}>
          <Typography sx={{ mb: 2, fontSize: 18, fontWeight: 500, color: BRAND.kente }}>Pricing</Typography>
          <Typography
            component='h1'
            sx={{
              fontFamily: HEADING_FONT,
              fontSize: { xs: 36, sm: 48 },
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: '-0.04em',
              color: BRAND.ink
            }}
          >
            Choose your plan
          </Typography>
          <Typography sx={{ mt: 2, fontSize: 16, color: INK(0.65) }}>
            All plans include a 14-day free trial. You can change this later from Settings.
          </Typography>
        </Box>

        {plansLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress size={36} />
          </Box>
        ) : fetchError ? (
          <Alert
            severity='error'
            sx={{ maxWidth: 480, mx: 'auto' }}
            action={
              <Button size='small' onClick={loadPlans}>
                Retry
              </Button>
            }
          >
            {fetchError}
          </Alert>
        ) : plans.length === 0 ? (
          <Alert severity='warning' sx={{ maxWidth: 480, mx: 'auto' }}>
            No plans are available right now. Please check back shortly.
          </Alert>
        ) : (
          <>
            {hasAnnualPlans && <BillingToggle cycle={billingCycle} onChange={setBillingCycle} />}
            <Grid container spacing={2}>
              {plans.map((plan, index) => (
                <Grid
                  key={plan.name}
                  size={{ xs: 12, sm: 4 }}
                  sx={{
                    ...(plan.popular && { md: { marginTop: -1.5, marginBottom: -1.5 } }),
                    '@keyframes cardIn': {
                      from: { opacity: 0, transform: 'translateY(12px)' },
                      to: { opacity: 1, transform: 'none' }
                    },
                    animation: `cardIn 0.5s ease ${index * 0.1}s both`
                  }}
                >
                  <PlanCard
                    plan={plan}
                    selected={selectedPlan === plan.name}
                    billingCycle={billingCycle}
                    onSelect={() => setSelectedPlan(plan.name)}
                  />
                </Grid>
              ))}
            </Grid>

            {submitError && (
              <Alert severity='error' sx={{ mt: 4, maxWidth: 480, mx: 'auto' }} onClose={() => setSubmitError(null)}>
                {submitError}
              </Alert>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
              <Button
                variant='contained'
                size='large'
                disabled={!selectedPlan || submitting}
                onClick={handleContinue}
                startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <i className='ri-arrow-right-line' />}
                sx={{
                  borderRadius: '999px',
                  px: 8,
                  py: 2,
                  fontSize: 16,
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  textTransform: 'none',
                  bgcolor: BRAND.primaryDeep,
                  boxShadow: '0 8px 30px -8px rgba(214, 28, 118, 0.55)',
                  '&:hover': { bgcolor: BRAND.primaryDark },
                  '&.Mui-disabled': { bgcolor: 'rgba(214, 28, 118, 0.35)', color: 'rgba(255, 255, 255, 0.9)' }
                }}
              >
                {submitting ? 'Setting up…' : 'Continue'}
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  )
}

export default SelectPlanView