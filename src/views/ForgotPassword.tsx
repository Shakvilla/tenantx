/* eslint-disable import/no-unresolved */
'use client'

import { useState } from 'react'

// Next Imports
import { useRouter } from 'next/navigation'

// MUI Imports
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Mode } from '@core/types'
import type { ForgotPasswordChannel } from '@/lib/api/auth-client'

// Component Imports
import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'
import DirectionalIcon from '@components/DirectionalIcon'

// Hook Imports
import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

// Service Imports
import {
  forgotPasswordInitiate,
  forgotPasswordSendOtp,
  forgotPasswordVerifyOtp,
  forgotPasswordReset
} from '@/lib/api/auth-client'

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------
type ForgotPasswordStep = 'EMAIL' | 'CHANNEL' | 'OTP' | 'RESET' | 'SUCCESS'

const ForgotPassword = ({ mode }: { mode: Mode }) => {
  // Step state
  const [step, setStep] = useState<ForgotPasswordStep>('EMAIL')
  const [email, setEmail] = useState('')
  const [channels, setChannels] = useState<ForgotPasswordChannel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<'EMAIL' | 'SMS'>('EMAIL')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isPasswordShown, setIsPasswordShown] = useState(false)

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Vars
  const darkImg = '/images/pages/auth-v2-mask-4-dark.png'
  const lightImg = '/images/pages/auth-v2-mask-4-light.png'
  const darkIllustration = '/images/illustrations/auth/v2-forgot-password-dark.png'
  const lightIllustration = '/images/illustrations/auth/v2-forgot-password-light.png'
  const borderedDarkIllustration = '/images/illustrations/auth/v2-forgot-password-dark-border.png'
  const borderedLightIllustration = '/images/illustrations/auth/v2-forgot-password-light-border.png'

  // Hooks
  const router = useRouter()
  const { settings } = useSettings()
  const authBackground = useImageVariant(mode, lightImg, darkImg)

  const characterIllustration = useImageVariant(
    mode,
    lightIllustration,
    darkIllustration,
    borderedLightIllustration,
    borderedDarkIllustration
  )

  // ---- Step 1: Email Submission ----
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError('Please enter your email address')

      return
    }

    setIsLoading(true)

    const result = await forgotPasswordInitiate(email)

    setIsLoading(false)

    if (result.success && result.data) {
      setChannels(result.data.channels)

      if (result.data.channels.length > 0) {
        setSelectedChannel(result.data.channels[0].channel)
      }

      setStep('CHANNEL')
    } else {
      setError(result.error?.message || 'Failed to initiate password reset')
    }
  }

  // ---- Step 2: Channel Selection ----
  const handleChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const result = await forgotPasswordSendOtp(email, selectedChannel)

    setIsLoading(false)

    if (result.success) {
      setStep('OTP')
    } else {
      setError(result.error?.message || 'Failed to send verification code')
    }
  }

  // ---- Step 3: OTP Verification ----
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP code')

      return
    }

    setIsLoading(true)

    const result = await forgotPasswordVerifyOtp(email, otp)

    setIsLoading(false)

    if (result.success && result.data) {
      setResetToken(result.data.otpVerificationToken)
      setStep('RESET')
    } else {
      setError(result.error?.message || 'OTP verification failed')
    }
  }

  // ---- Step 4: Password Reset ----
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')

      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')

      return
    }

    setIsLoading(true)

    const result = await forgotPasswordReset(resetToken, newPassword, confirmPassword)

    setIsLoading(false)

    if (result.success) {
      setStep('SUCCESS')
    } else {
      setError(result.error?.message || 'Password reset failed')
    }
  }

  // ---- Step Content Renderer ----
  const renderStepContent = () => {
    switch (step) {
      case 'EMAIL':
        return (
          <>
            <div>
              <Typography variant='h4'>Forgot Password 🔒</Typography>
              <Typography className='mbs-1'>
                Enter your email and we&#39;ll send you a verification code to reset your password
              </Typography>
            </div>
            {renderError()}
            <form noValidate autoComplete='off' onSubmit={handleEmailSubmit} className='flex flex-col gap-5'>
              <TextField
                autoFocus
                fullWidth
                label='Email'
                type='email'
                size='small'
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <Button fullWidth variant='contained' type='submit' disabled={isLoading || !email}>
                {isLoading ? <CircularProgress size={24} color='inherit' /> : 'Continue'}
              </Button>
              {renderBackToLogin()}
            </form>
          </>
        )

      case 'CHANNEL':
        return (
          <>
            <div>
              <Typography variant='h4'>Choose Verification Method 📬</Typography>
              <Typography className='mbs-1'>Select how you would like to receive your verification code</Typography>
            </div>
            {renderError()}
            <form noValidate autoComplete='off' onSubmit={handleChannelSubmit} className='flex flex-col gap-5'>
              <FormControl>
                <FormLabel id='channel-select-label'>Verification Channel</FormLabel>
                <RadioGroup
                  aria-labelledby='channel-select-label'
                  value={selectedChannel}
                  onChange={e => setSelectedChannel(e.target.value as 'EMAIL' | 'SMS')}
                >
                  {channels.map(ch => (
                    <FormControlLabel
                      key={ch.channel}
                      value={ch.channel}
                      control={<Radio />}
                      label={
                        <div>
                          <Typography variant='body1' fontWeight={500}>
                            {ch.channel === 'EMAIL' ? 'Email' : 'Phone'}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {ch.maskedAddress}
                          </Typography>
                        </div>
                      }
                      disabled={isLoading}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
              <Button fullWidth variant='contained' type='submit' disabled={isLoading}>
                {isLoading ? <CircularProgress size={24} color='inherit' /> : 'Send Code'}
              </Button>
              <Button fullWidth variant='outlined' onClick={() => setStep('EMAIL')} disabled={isLoading}>
                Back
              </Button>
            </form>
          </>
        )

      case 'OTP':
        return (
          <>
            <div>
              <Typography variant='h4'>Enter Verification Code ✉️</Typography>
              <Typography className='mbs-1'>
                We sent a code to your {selectedChannel === 'EMAIL' ? 'email' : 'phone'}. Enter it below.
              </Typography>
            </div>
            {renderError()}
            <form noValidate autoComplete='off' onSubmit={handleOtpSubmit} className='flex flex-col gap-5'>
              <TextField
                autoFocus
                fullWidth
                label='Verification Code'
                size='small'
                value={otp}
                onChange={e => setOtp(e.target.value)}
                disabled={isLoading}
                placeholder='Enter 6-digit code'
                slotProps={{
                  htmlInput: {
                    maxLength: 8,
                    inputMode: 'numeric',
                    style: { letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.25rem' }
                  }
                }}
              />
              <Button fullWidth variant='contained' type='submit' disabled={isLoading || otp.length < 4}>
                {isLoading ? <CircularProgress size={24} color='inherit' /> : 'Verify Code'}
              </Button>
              <Button
                fullWidth
                variant='text'
                onClick={async () => {
                  setError(null)
                  setIsLoading(true)
                  await forgotPasswordSendOtp(email, selectedChannel)
                  setIsLoading(false)
                }}
                disabled={isLoading}
              >
                Resend Code
              </Button>
              <Button fullWidth variant='outlined' onClick={() => setStep('CHANNEL')} disabled={isLoading}>
                Back
              </Button>
            </form>
          </>
        )

      case 'RESET':
        return (
          <>
            <div>
              <Typography variant='h4'>Set New Password 🔑</Typography>
              <Typography className='mbs-1'>Create a strong password for your account</Typography>
            </div>
            {renderError()}
            <form noValidate autoComplete='off' onSubmit={handleResetSubmit} className='flex flex-col gap-5'>
              <TextField
                autoFocus
                fullWidth
                label='New Password'
                size='small'
                type={isPasswordShown ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={isLoading}
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
              <TextField
                fullWidth
                label='Confirm Password'
                size='small'
                type={isPasswordShown ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              <Typography variant='caption' color='text.secondary'>
                Password must be at least 8 characters, include uppercase, lowercase, and a number.
              </Typography>
              <Button
                fullWidth
                variant='contained'
                type='submit'
                disabled={isLoading || !newPassword || !confirmPassword}
              >
                {isLoading ? <CircularProgress size={24} color='inherit' /> : 'Reset Password'}
              </Button>
            </form>
          </>
        )

      case 'SUCCESS':
        return (
          <>
            <div className='flex flex-col items-center gap-4 text-center'>
              <Typography variant='h4'>Password Reset Successfully! 🎉</Typography>
              <Typography color='text.secondary'>
                Your password has been updated. You can now log in with your new password.
              </Typography>
              <Button fullWidth variant='contained' onClick={() => router.push('/login')} sx={{ mt: 2 }}>
                Back to Login
              </Button>
            </div>
          </>
        )

      default:
        return null
    }
  }

  // ---- Shared UI helpers ----
  const renderError = () =>
    error ? (
      <Alert severity='error' onClose={() => setError(null)}>
        {error}
      </Alert>
    ) : null

  const renderBackToLogin = () => (
    <Typography className='flex justify-center items-center' color='primary.main'>
      <Link href='/login' className='flex items-center gap-1.5'>
        <DirectionalIcon ltrIconClass='ri-arrow-left-s-line' rtlIconClass='ri-arrow-right-s-line' className='text-xl' />
        <span>Back to Login</span>
      </Link>
    </Typography>
  )

  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex items-center justify-center bs-full flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          {
            'border-ie': settings.skin === 'bordered'
          }
        )}
      >
        <div className='pli-6 max-lg:mbs-40 lg:mbe-24'>
          <img
            src={characterIllustration}
            alt='character-illustration'
            className='max-bs-[677px] max-is-full bs-auto'
          />
        </div>
        <img src={authBackground} className='absolute bottom-[4%] z-[-1] is-full max-md:hidden' />
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link href='/' className='absolute block-start-5 sm:block-start-[38px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </Link>
        <div className='flex flex-col gap-5 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          {renderStepContent()}
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
