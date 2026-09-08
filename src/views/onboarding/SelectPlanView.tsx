'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// API Imports
import { apiGet, apiPost, API_BASE } from '@/lib/api/client'

// ---------------------------------------------------------------------------
// Types — mirror of GET /api/v1/public/plans (no auth)
// ---------------------------------------------------------------------------

type PublicPlan = {
  name: string
  displayName: string
  trialDays: number
  entryPrice: number | string
  maxQty: number
  annualDiscountPct: number | string | null
  features: Record<string, { enabled: boolean }>
  popular: boolean
  marketingFeatures: string[]
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

/** INVOICING → "Invoicing", TENANT_NOTICES → "Tenant Notices", etc. */
function formatFeatureKey(key: string): string {
  return key
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** GHS renders as the cedi symbol; any other currency code is shown as-is. */
function currencySymbol(currency: string): string {
  return currency === 'GHS' ? 'GH₵' : currency
}

/** The features a plan actually grants, as human-readable labels. */
function enabledFeatureLabels(plan: PublicPlan): string[] {
  return Object.entries(plan.features)
    .filter(([, info]) => info.enabled)
    .map(([key]) => formatFeatureKey(key))
}

// ---------------------------------------------------------------------------
// Plan card — visual match of the landing page's pricing card
// ---------------------------------------------------------------------------

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: PublicPlan
  selected: boolean
  onSelect: () => void
}) {
  const trialDays = plan.trialDays ?? 0
  const features = enabledFeatureLabels(plan)
  const price = Number(plan.entryPrice) || 0
  const isPopular = plan.popular

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
            {price.toLocaleString()}
          </Typography>
          <Typography sx={{ fontSize: 14, color: isPopular ? SAND(0.8) : INK(0.65) }}>/unit · mo</Typography>
        </Box>

        {/* Sub-line */}
        <Typography sx={{ mt: 1, fontSize: 14, color: isPopular ? SAND(0.8) : INK(0.65) }}>
          Up to {plan.maxQty} units
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
            <Box component='li' key={feature} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
              <i
                className='ri-check-line'
                style={{ fontSize: 16, color: isPopular ? BRAND.primary : BRAND.kente, marginTop: 1, flexShrink: 0 }}
              />
              <Typography sx={{ fontSize: 14, color: isPopular ? SAND(0.9) : INK(0.75) }}>{feature}</Typography>
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