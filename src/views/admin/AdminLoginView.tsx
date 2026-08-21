'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import Logo from '@components/layout/shared/Logo'
import Link from '@components/Link'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import OtpChallengeForm from '@/components/auth/OtpChallengeForm'

export default function AdminLoginView() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { adminLogin, needsOtp, otpChallenge, verifyOtp, resendOtp, cancelOtp } = useAdminAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await adminLogin(email, password)

    if (result.otpRequired) {
      // Not an error: the password was correct and the component re-renders into the
      // challenge below. Falling through would show "Invalid credentials" for a SUCCESSFUL
      // password check.
      setIsSubmitting(false)

      return
    }

    if (result.success) {
      router.push('/admin')
    } else {
      // Deliberately vague — don't reveal whether the email exists
      setError('Invalid credentials. This portal is for platform administrators only.')
    }

    setIsSubmitting(false)
  }

  const handleOtpSubmit = async (otp: string, rememberDevice: boolean) => {
    setError(null)
    setIsSubmitting(true)

    const result = await verifyOtp(otp, rememberDevice)

    if (result.success) {
      router.push('/admin')
    } else {
      setError(result.error ?? 'Verification failed.')
      // startOver means no code can help — the form below is what the user needs next.
      if (result.startOver) setPassword('')
    }

    setIsSubmitting(false)
  }

  const handleOtpCancel = () => {
    setError(null)
    setPassword('')
    cancelOtp()
  }

  const handleOtpResend = async () => {
    setError(null)

    const result = await resendOtp()

    if (!result.success) {
      setError(result.error ?? 'Failed to resend the code.')
    }
  }

  // A switch is just a resend that names the other channel — the pendingToken alone identifies
  // the challenge. resendOtp refreshes otpChallenge from the server's response (new channel, new
  // maskedTarget, and a possibly-flipped alternateChannel), so nothing here needs to track the
  // target channel itself.
  const handleOtpSwitch = async (targetChannel: 'EMAIL' | 'SMS') => {
    setError(null)

    const result = await resendOtp(targetChannel)

    if (!result.success) {
      setError(result.error ?? 'Failed to switch channel.')
    }
  }

  if (needsOtp && otpChallenge) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-backgroundDefault p-6'>
        <div className='w-full max-w-[400px] flex flex-col gap-6'>
          <div className='flex flex-col items-center gap-3'>
            <Link href='/'><Logo /></Link>
            <Chip label='Platform Administration' size='small' color='warning' variant='outlined' />
          </div>
          <OtpChallengeForm
            channel={otpChallenge.channel}
            maskedTarget={otpChallenge.maskedTarget}
            isSubmitting={isSubmitting}
            error={error}
            onSubmit={handleOtpSubmit}
            onResend={handleOtpResend}
            onStartOver={handleOtpCancel}
            alternateChannel={
              otpChallenge.alternateChannel
                ? {
                    channel: otpChallenge.alternateChannel.channel,
                    maskedTarget: otpChallenge.alternateChannel.maskedTarget,
                    onSwitch: () => handleOtpSwitch(otpChallenge.alternateChannel!.channel)
                  }
                : undefined
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-backgroundDefault p-6'>
      <div className='w-full max-w-[400px] flex flex-col gap-6'>

        {/* Header */}
        <div className='flex flex-col items-center gap-3'>
          <Link href='/'>
            <Logo />
          </Link>
          <Chip label='Platform Administration' size='small' color='warning' variant='outlined' />
          <div className='text-center'>
            <Typography variant='h5'>Admin Sign In</Typography>
            <Typography variant='body2' color='text.secondary' className='mt-1'>
              This portal is restricted to platform administrators
            </Typography>
          </div>
        </div>

        {/* Form */}
        <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-4'>
          {error && (
            <Alert severity='error' onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            autoFocus
            fullWidth
            label='Admin Email'
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
                      onClick={() => setIsPasswordShown(s => !s)}
                      onMouseDown={e => e.preventDefault()}
                    >
                      <i className={isPasswordShown ? 'ri-eye-off-line' : 'ri-eye-line'} />
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />

          <Button
            fullWidth
            variant='contained'
            color='warning'
            type='submit'
            disabled={isSubmitting || !email || !password}
          >
            {isSubmitting ? <CircularProgress size={24} color='inherit' /> : 'Sign In to Admin Panel'}
          </Button>
        </form>

        {/* Footer */}
        <Typography variant='caption' color='text.disabled' align='center'>
          Not an administrator?{' '}
          <Link href='/login' style={{ color: 'inherit' }}>
            Go to tenant login
          </Link>
        </Typography>

      </div>
    </div>
  )
}
