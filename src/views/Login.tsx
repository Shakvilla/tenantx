'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import { useRouter, useSearchParams } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Checkbox from '@mui/material/Checkbox'
import Button from '@mui/material/Button'
import FormControlLabel from '@mui/material/FormControlLabel'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

// Type Imports
import type { Mode } from '@core/types'
import type { Workspace } from '@/lib/api/auth-client'

// Component Imports
import Link from '@components/Link'
import AuthShell from '@/components/auth/AuthShell'
import OtpChallengeForm from '@/components/auth/OtpChallengeForm'
import WorkspaceSelection from '@views/auth/WorkspaceSelection'

// Config Imports
import themeConfig from '@configs/themeConfig'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Only ever follow a same-origin relative path back into the app — a `redirectTo` that
 * isn't a real internal path (protocol-relative `//evil.com`, an absolute URL, or the
 * login page itself) falls back to the dashboard instead of being trusted blindly.
 */
function sanitizeRedirect(path: string | null): string {
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.startsWith('/login')) {
    return '/dashboard'
  }

  return path
}

const LoginV2 = ({ mode }: { mode: Mode }) => {
  // States
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const searchParams = useSearchParams()
  const sessionReason = searchParams.get('reason')
  const [showSessionNotice, setShowSessionNotice] = useState(!!sessionReason)
  const redirectTo = sanitizeRedirect(searchParams.get('redirectTo'))

  // Vars
  const darkImg = '/images/pages/auth-v2-mask-1-dark.png'
  const lightImg = '/images/pages/auth-v2-mask-1-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-login-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-login-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-login-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-login-light-border.png'

  // Hooks
  const router = useRouter()
  const { settings } = useSettings()
  const {
    login,
    needsWorkspaceSelection,
    pendingWorkspaces,
    selectWorkspace,
    needsOtp,
    otpChallenge,
    verifyOtp,
    resendOtp,
    cancelOtp
  } = useAuth()
  const authBackground = useImageVariant(mode, lightImg, darkImg)



  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  const handleClickShowPassword = () => setIsPasswordShown(show => !show)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    // Tenant login flow — admins must use /admin/login
    const result = await login(email, password)

    if (!result.success) {
      setError(result.error || 'Login failed. Please check your credentials.')
    }

    // If workspace selection is needed, the component will re-render with the selection UI
    // If auto-selected (single workspace), redirect to dashboard
    if (result.success && !needsWorkspaceSelection) {
      // Small delay to let the state settle (auto-select case)
      setTimeout(() => {
        router.push(redirectTo)
      }, 100)
    }

    setIsSubmitting(false)
  }

  const handleWorkspaceSelect = async (workspace: Workspace) => {
    setError(null)
    setIsSubmitting(true)

    const result = await selectWorkspace(workspace)

    if (result.success) {
      router.push(redirectTo)
    } else {
      setError(result.error || 'Failed to select workspace.')
    }

    setIsSubmitting(false)
  }

  const handleOtpSubmit = async (otp: string, rememberDevice: boolean) => {
    setError(null)
    setIsSubmitting(true)

    const result = await verifyOtp(otp, rememberDevice)

    if (result.success) {
      router.push(redirectTo)
    } else {
      setError(result.error ?? 'Verification failed.')
    }

    setIsSubmitting(false)
  }

  const handleOtpResend = async () => {
    setError(null)
    await resendOtp()
  }

  const handleOtpCancel = () => {
    setError(null)
    cancelOtp()
  }

  // ---------------------------------------------------------------------------
  // OTP Challenge View
  // ---------------------------------------------------------------------------
  if (needsOtp && otpChallenge) {
    return (
      <AuthShell
        characterIllustration={characterIllustration}
        authBackground={authBackground}
        bordered={settings.skin === 'bordered'}
      >
        <OtpChallengeForm
          channel={otpChallenge.channel}
          maskedTarget={otpChallenge.maskedTarget}
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={handleOtpSubmit}
          onResend={handleOtpResend}
          onStartOver={handleOtpCancel}
        />
      </AuthShell>
    )
  }

  // ---------------------------------------------------------------------------
  // Workspace Selection View
  // ---------------------------------------------------------------------------
  if (needsWorkspaceSelection && pendingWorkspaces && pendingWorkspaces.length > 0) {
    return (
      <AuthShell
        characterIllustration={characterIllustration}
        authBackground={authBackground}
        bordered={settings.skin === 'bordered'}
      >
        {showSessionNotice && sessionReason && (
          <Alert severity='warning' onClose={() => setShowSessionNotice(false)}>
            {sessionReason}
          </Alert>
        )}
        {error && (
          <Alert severity='error' onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <WorkspaceSelection
          workspaces={pendingWorkspaces}
          onSelect={handleWorkspaceSelect}
          isLoading={isSubmitting}
        />
      </AuthShell>
    )
  }

  // ---------------------------------------------------------------------------
  // Login Form View
  // ---------------------------------------------------------------------------
  return (
    <AuthShell
      characterIllustration={characterIllustration}
      authBackground={authBackground}
      bordered={settings.skin === 'bordered'}
    >
      <div>
        <Typography variant='h4'>{`Welcome to ${themeConfig.templateName}! 👋🏻`}</Typography>
        <Typography className='mbs-1'>Please sign-in to your account and start the adventure</Typography>
      </div>

      {showSessionNotice && sessionReason && (
        <Alert severity='warning' onClose={() => setShowSessionNotice(false)}>
          {sessionReason}
        </Alert>
      )}

      {error && (
        <Alert severity='error' onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form
        noValidate
        autoComplete='off'
        onSubmit={handleSubmit}
        className='flex flex-col gap-5'
      >
        <TextField
          autoFocus
          fullWidth
          label='Email'
          size='small'
          type='email'
          value={email}
          onChange={e => setEmail(e.target.value)}
          disabled={isSubmitting}
        />
        <TextField
          fullWidth
          label='Password'
          size='small'
          type={isPasswordShown ? 'text' : 'password'}
          value={password}
          onChange={e => setPassword(e.target.value)}
          disabled={isSubmitting}
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
        <div className='flex justify-between items-center flex-wrap gap-x-3 gap-y-1'>
          <FormControlLabel control={<Checkbox />} label='Remember me' />
          <Typography className='text-end' color='secondary.main'>
            <Link href='/forgot-password'>Forgot password?</Link>
          </Typography>
        </div>
        <Button
          fullWidth
          variant='contained'
          type='submit'
          disabled={isSubmitting || !email || !password}
        >
          {isSubmitting ? <CircularProgress size={24} color='inherit' /> : 'Log In'}
        </Button>
        <div className='flex justify-center items-center flex-wrap gap-2'>
          <Typography>New on our platform?</Typography>
          <Typography component={Link} href='/register' color='primary.main'>
            Create an account
          </Typography>
        </div>
      </form>
    </AuthShell>
  )
}

export default LoginV2
