'use client'

// React Imports
import { useEffect, useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid2'
import Chip from '@mui/material/Chip'
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
  monthlyPrice: number
  annualPrice: number
  currency: string
  unitLimit: number
  features: Record<string, { enabled: boolean }>
}

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
// Plan card
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
  const symbol = currencySymbol(plan.currency)
  const trialDays = plan.trialDays ?? 0
  const features = enabledFeatureLabels(plan)

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
        borderWidth: 2,
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'primary.lighter' : 'background.paper',
        transition: 'border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          borderColor: selected ? 'primary.main' : 'primary.light',
          bgcolor: selected ? 'primary.lighter' : 'action.hover'
        },
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
          outlineOffset: 2
        }
      }}
    >
      {selected && (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            top: 12,
            insetInlineEnd: 12,
            display: 'inline-flex',
            color: 'primary.main',
            lineHeight: 0
          }}
        >
          <i className='ri-checkbox-circle-fill' style={{ fontSize: 18 }} />
        </Box>
      )}

      <CardContent sx={{ flex: 1, p: 3, '&:last-child': { pb: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 1 }}>
          <Typography variant='h6' fontWeight={700}>
            {plan.displayName}
          </Typography>
          {trialDays > 0 && (
            <Chip
              label={`${trialDays}-day free trial`}
              size='small'
              color='primary'
              variant='tonal'
              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, pointerEvents: 'none' }}
            />
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
          <Typography variant='h4' fontWeight={800} sx={{ fontSize: '2rem', lineHeight: 1.1 }}>
            {symbol} {plan.monthlyPrice.toLocaleString()}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            /mo
          </Typography>
        </Box>

        {plan.annualPrice > 0 && (
          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.25 }}>
            or {symbol} {plan.annualPrice.toLocaleString()}/yr
          </Typography>
        )}

        <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}>
          Up to {plan.unitLimit} units
        </Typography>

        <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, mt: 2, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {features.map(feature => (
            <Box component='li' key={feature} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <i
                className='ri-check-line'
                style={{ fontSize: 14, color: 'var(--mui-palette-primary-main)', flexShrink: 0 }}
              />
              <Typography variant='body2' color='text.primary'>
                {feature}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant={selected ? 'contained' : 'outlined'}
          onClick={e => {
            e.stopPropagation()
            onSelect()
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
    const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1')
      .replace(/\/api\/v1$/, '')
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
        px: { xs: 3, sm: 6 },
        py: 6,
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'none' }
        },
        animation: 'fadeUp 0.5s ease'
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 900 }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant='h4' fontWeight={800} sx={{ mb: 1 }}>
            Choose your plan
          </Typography>
          <Typography color='text.secondary'>
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
            <Grid container spacing={3}>
              {plans.map((plan, index) => (
                <Grid
                  key={plan.name}
                  size={{ xs: 12, md: 4 }}
                  sx={{
                    '@keyframes cardIn': {
                      from: { opacity: 0, transform: 'translateY(12px)' },
                      to: { opacity: 1, transform: 'none' }
                    },
                    animation: `cardIn 0.45s ease ${index * 0.08}s both`
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

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <Button
                variant='contained'
                size='large'
                disabled={!selectedPlan || submitting}
                onClick={handleContinue}
                startIcon={submitting ? <CircularProgress size={16} color='inherit' /> : <i className='ri-arrow-right-line' />}
                sx={{ minWidth: 220 }}
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