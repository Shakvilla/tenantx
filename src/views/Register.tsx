'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
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
      ...(trimmedPhone ? { phoneNumber: trimmedPhone } : {})
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
