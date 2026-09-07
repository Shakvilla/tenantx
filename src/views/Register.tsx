'use client'

// React Imports
import { useEffect, useMemo, useState } from 'react'

// Next Imports
import { useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Mode } from '@core/types'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import OtpChallengeForm from '@/components/auth/OtpChallengeForm'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Validation Imports
import { RegisterSchema } from '@/lib/validation/schemas/auth.schema'

// API Imports
import { signupStart, type OtpChallenge } from '@/lib/api/auth-client'
import { otpErrorMessage } from '@/lib/api/otp-errors'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Validates an optional phone number before it is ever sent to the API. Matches the backend's
 * own constraint on `phoneNumber` — a typo caught here costs nothing, while one sent to
 * /auth/signup/start burns one of the account's three-per-hour code sends for nothing.
 */
const PHONE_PATTERN = /^\+?[0-9()\s-]{7,16}$/

/**
 * A plan as returned by the public `/plans` endpoint (no auth). The shape is kept loose — the
 * badge and the picker only read the fields they render, so a missing price or feature list
 * degrades to a readable card rather than a crash.
 */
interface PublicPlan {
  name: string
  displayName: string
  trialDays?: number
  monthlyPrice?: number
  annualPrice?: number
  currency?: string
  unitLimit?: number
  features?: Record<string, unknown> | string[]
}

/** GHS renders as the cedi symbol; any other currency code is shown as-is. */
const currencySymbol = (currency?: string) => (currency === 'GHS' ? 'GH₵' : (currency ?? ''))

/**
 * A selectable plan card for the picker step. Keyboard-activatable and announces itself as a
 * radio so screen readers treat the three cards as one "pick one" group.
 */
const PlanCard = ({ plan, selected, onSelect }: { plan: PublicPlan; selected: boolean; onSelect: () => void }) => {
  const trialDays = plan.trialDays ?? 0
  const monthly = plan.monthlyPrice
  const symbol = currencySymbol(plan.currency)
  const featureEntries = Array.isArray(plan.features)
    ? plan.features
    : Object.keys(plan.features ?? {})
  const features = featureEntries.slice(0, 3)

  return (
    <Card
      variant='outlined'
      role='radio'
      aria-checked={selected}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      sx={{
        position: 'relative',
        height: '100%',
        cursor: 'pointer',
        userSelect: 'none',
        borderWidth: 2,
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? 'primary.lighter' : 'background.paper',
        transition: 'border-color 0.2s ease, background-color 0.2s ease',
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
            top: 10,
            right: 10,
            display: 'inline-flex',
            color: 'primary.main',
            lineHeight: 0
          }}
        >
          <i className='ri-checkbox-circle-fill' style={{ fontSize: 18 }} />
        </Box>
      )}

      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Typography variant='subtitle2' sx={{ fontWeight: 600, pr: selected ? 3 : 0 }}>
          {plan.displayName}
        </Typography>

        <Box className='flex items-baseline gap-1 mbs-1'>
          <Typography variant='h6' sx={{ fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.2 }}>
            {symbol ? `${symbol} ` : ''}
            {monthly != null ? monthly.toLocaleString() : '—'}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            /mo
          </Typography>
        </Box>

        {plan.annualPrice != null && plan.annualPrice > 0 && (
          <Typography variant='caption' color='text.secondary' className='block mbs-0.5'>
            or {symbol ? `${symbol} ` : ''}
            {plan.annualPrice.toLocaleString()}/yr
          </Typography>
        )}

        {trialDays > 0 && (
          <Box
            className='mbs-1.5'
            sx={{
              display: 'inline-block',
              px: 1,
              py: 0.25,
              borderRadius: 999,
              bgcolor: 'primary.lighter',
              color: 'primary.main',
              fontSize: '0.6875rem',
              fontWeight: 600,
              lineHeight: 1.4
            }}
          >
            {trialDays}-day free trial
          </Box>
        )}

        {features.length > 0 && (
          <Box
            component='ul'
            className='mbs-1.5'
            sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}
          >
            {features.map(f => (
              <Box component='li' key={f} className='flex gap-1 items-start'>
                <Box component='i' className='ri-check-line' sx={{ fontSize: 13, mt: '2px', color: 'primary.main' }} />
                <Typography variant='caption' color='text.secondary' sx={{ lineHeight: 1.45 }}>
                  {f}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

const Register = ({ mode }: { mode: Mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phoneNumber: ''
  })

  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // The subscription plan the user picked on the pricing page, carried here via the `?plan=`
  // query param (e.g. `?plan=basic`). Uppercased to match the backend's plan names (FREE/BASIC/PRO).
  const searchParams = useSearchParams()
  const planParam = searchParams.get('plan')?.toUpperCase() ?? null

  // Active plans from the public endpoint (no auth). Used to resolve the selected plan's display
  // name and trial days for the badge, and to render the plan picker when no `?plan=` was given.
  // Fails silently — the badge falls back to the raw plan name, the picker shows a retry.
  const [plans, setPlans] = useState<PublicPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)

  const loadPlans = () => {
    setPlansLoading(true)

    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL?.replace('/api/v1', '')}/api/v1/public/plans`)
      .then(r => (r.ok ? r.json() : []))
      .then(data => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false))
  }

  useEffect(() => {
    loadPlans()
  }, [])

  // The plan the user is signing up for: from the URL when one was given, otherwise the plan they
  // highlight in the picker and confirm with Continue. `pickerSelection` is just the highlighted
  // card; `confirmedPlan` is what actually flows into signupStart.
  const [pickerSelection, setPickerSelection] = useState<string | null>(null)
  const [confirmedPlan, setConfirmedPlan] = useState<string | null>(null)
  const effectivePlanName = planParam ?? confirmedPlan

  const planBadge = useMemo(() => {
    if (!effectivePlanName) return null
    const matched = plans.find(p => p.name.toUpperCase() === effectivePlanName)

    return matched ?? { name: effectivePlanName, displayName: effectivePlanName, trialDays: 0 }
  }, [effectivePlanName, plans])

  // Rendered above both the registration form and the OTP view so the user remembers which plan
  // they're signing up for.
  const planBadgeAlert = planBadge ? (
    <Alert severity='info' icon={<i className='ri-medal-line' />}>
      Signing up for <strong>{planBadge.displayName}</strong>
      {(planBadge.trialDays ?? 0) > 0 && ` — ${planBadge.trialDays}-day free trial`}
    </Alert>
  ) : null

  // The email-verification challenge from /auth/signup/start. Non-null means the code step is
  // showing instead of the registration form — same otpRequired-gated shape every other login-OTP
  // flow in this app uses.
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null)

  // Vars
  // const darkImg = '/images/pages/auth-v2-mask-1-dark.png'
  // const lightImg = '/images/pages/auth-v2-mask-1-light.png'
  // const darkIllustration = '/images/illustrations/auth/v2-register-dark.png'
  // const lightIllustration = '/images/illustrations/auth/v2-register-light.png'
  // const borderedDarkIllustration = '/images/illustrations/auth/v2-register-dark-border.png'
  // const borderedLightIllustration = '/images/illustrations/auth/v2-register-light-border.png'
  const darkImg = '/images/pages/auth-v2-mask-1-dark.png'
  const lightImg = '/images/pages/auth-v2-mask-1-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-login-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-login-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-login-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-login-light-border.png'

  // Hooks
  const router = useRouter()
  const { completeSignup } = useAuth()
  const { settings } = useSettings()
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validate with centralized Zod schema
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')

      return
    }

    const validation = RegisterSchema.safeParse({
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      companyName: formData.companyName
    })

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message ?? 'Invalid input'

      setError(firstError)

      return
    }

    const trimmedPhone = formData.phoneNumber.trim()

    // Caught here, before the API is ever called: the backend allows only three code sends per
    // hour, so a typo caught locally costs nothing while one sent to the server burns one of
    // three.
    if (trimmedPhone && !PHONE_PATTERN.test(trimmedPhone)) {
      setError('Enter 7 to 16 digits, optionally starting with +')

      return
    }

    setIsSubmitting(true)

    const result = await signupStart({
      email: validation.data.email,
      password: validation.data.password,
      fullName: validation.data.fullName,
      companyName: validation.data.companyName,
      ...(trimmedPhone ? { phoneNumber: trimmedPhone } : {}),
      ...(effectivePlanName ? { selectedPlanName: effectivePlanName } : {})
    })

    if (result.success && result.data) {
      setChallenge(result.data)
      setIsSubmitting(false)
    } else {
      setError(otpErrorMessage(result.rawError).message || 'Registration failed. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleOtpSubmit = async (otp: string, rememberDevice: boolean) => {
    if (!challenge) return

    setError(null)
    setIsSubmitting(true)

    // Routed through AuthContext (not signupComplete directly) so the same user/tenant/
    // isAuthenticated/role/userType state writes every other auth path relies on happen here too
    // — see completeSignup's own comment for the broken-dashboard bug this fixes.
    const result = await completeSignup({
      pendingToken: challenge.pendingToken,
      otp,
      rememberDevice,
      fullName: formData.fullName
    })

    if (result.success) {
      setSuccess('Account created! Taking you to your dashboard...')

      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)
    } else {
      setError(result.error || 'Verification failed. Please try again.')
      setIsSubmitting(false)

      // No code can help — back to the registration form so the user can start over.
      if (result.startOver) setChallenge(null)
    }
  }

  const handleOtpStartOver = () => {
    setError(null)
    setChallenge(null)
  }

  const isFormValid =
    formData.fullName && formData.email && formData.password && formData.confirmPassword && formData.companyName

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <div className='pli-6 max-lg:mbs-40 lg:mbe-24'>
          <img
            src={characterIllustration}
            alt='character-illustration'
            className='max-bs-[673px] max-is-full bs-auto'
          />
        </div>
        <img src={authBackground} className='absolute bottom-[4%] z-[-1] is-full max-md:hidden' />
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[520px]'>
        <Link className='absolute block-start-5 sm:block-start-[38px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </Link>
        <div className='flex flex-col gap-5 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          {challenge ? (
            <>
              {planBadgeAlert}
              {success && <Alert severity='success'>{success}</Alert>}
              <OtpChallengeForm
                channel={challenge.channel}
                maskedTarget={challenge.maskedTarget}
                isSubmitting={isSubmitting}
                error={error}
                onSubmit={handleOtpSubmit}
                onStartOver={handleOtpStartOver}
                hideRememberDevice
              />
            </>
          ) : !planParam && !confirmedPlan ? (
            <>
              <div>
                <Typography variant='h4'>Choose your plan</Typography>
                <Typography className='mbs-1'>Select a plan to get started. You can change this later.</Typography>
              </div>

              {plansLoading ? (
                <Box className='flex justify-center py-8'>
                  <CircularProgress size={28} />
                </Box>
              ) : plans.length === 0 ? (
                <Alert
                  severity='error'
                  action={
                    <Button size='small' onClick={loadPlans}>
                      Retry
                    </Button>
                  }
                >
                  Couldn&apos;t load plans. Please try again.
                </Alert>
              ) : (
                <>
                  <Grid container spacing={2}>
                    {plans.map(plan => (
                      <Grid key={plan.name} size={{ xs: 12, md: 4 }}>
                        <PlanCard
                          plan={plan}
                          selected={pickerSelection === plan.name.toUpperCase()}
                          onSelect={() => setPickerSelection(plan.name.toUpperCase())}
                        />
                      </Grid>
                    ))}
                  </Grid>

                  {pickerSelection && (
                    <Button
                      fullWidth
                      variant='contained'
                      onClick={() => setConfirmedPlan(pickerSelection)}
                      className='mt-2'
                      sx={{
                        animation: 'register-plan-fade-in 0.25s ease',
                        '@keyframes register-plan-fade-in': {
                          from: { opacity: 0, transform: 'translateY(4px)' },
                          to: { opacity: 1, transform: 'none' }
                        }
                      }}
                    >
                      Continue
                    </Button>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              <div>
                <Typography variant='h4'>{`Join ${themeConfig.templateName}! 🚀`}</Typography>
                <Typography className='mbs-1'>Create your account and start managing your properties</Typography>
              </div>

              {error && (
                <Alert severity='error' onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {planBadgeAlert}

              {success && <Alert severity='success'>{success}</Alert>}

              <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-4'>
                <TextField
                  autoFocus
                  fullWidth
                  label='Full Name'
                  size='small'
                  value={formData.fullName}
                  onChange={handleChange('fullName')}
                  disabled={isSubmitting}
                  required
                />
                <TextField
                  fullWidth
                  label='Email'
                  size='small'
                  type='email'
                  value={formData.email}
                  onChange={handleChange('email')}
                  disabled={isSubmitting}
                  required
                />
                <TextField
                  fullWidth
                  label='Company / Organization Name'
                  size='small'
                  value={formData.companyName}
                  onChange={handleChange('companyName')}
                  disabled={isSubmitting}
                  required
                  helperText='This will be your workspace name'
                />
                <TextField
                  fullWidth
                  label='Phone Number'
                  size='small'
                  value={formData.phoneNumber}
                  onChange={handleChange('phoneNumber')}
                  disabled={isSubmitting}
                  helperText='Optional — used to send login codes by SMS'
                />
                <TextField
                  fullWidth
                  label='Password'
                  size='small'
                  type={isPasswordShown ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange('password')}
                  disabled={isSubmitting}
                  required
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position='end'>
                          <IconButton
                            size='small'
                            edge='end'
                            onClick={handleClickShowPassword}
                            onMouseDown={e => e.preventDefault()}
                          >
                            <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />
                <TextField
                  fullWidth
                  label='Confirm Password'
                  size='small'
                  type={isPasswordShown ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange('confirmPassword')}
                  disabled={isSubmitting}
                  required
                />
                <Button
                  fullWidth
                  variant='contained'
                  type='submit'
                  disabled={isSubmitting || !isFormValid}
                  className='mt-2'
                >
                  {isSubmitting ? <CircularProgress size={24} color='inherit' /> : 'Create Account'}
                </Button>
                <div className='flex justify-center items-center flex-wrap gap-2'>
                  <Typography>Already have an account?</Typography>
                  <Typography component={Link} href='/login' color='primary.main'>
                    Sign in instead
                  </Typography>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Register
