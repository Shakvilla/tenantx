'use client'

import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const OTP_LENGTH = 6

export interface OtpChallengeFormProps {
  channel: 'EMAIL' | 'SMS'

  /** e.g. "j***@example.com" or "***4072" — never the full address or number. */
  maskedTarget: string

  isSubmitting: boolean

  /**
   * The message from `otpErrorMessage`. There is deliberately no attempt counter: the backend
   * returns none, and inferring one client-side would turn the UI into the oracle the backend
   * refuses to be.
   */
  error: string | null

  onSubmit: (otp: string, rememberDevice: boolean) => void

  /** Omit entirely where the path cannot resend — a "Start over" link is rendered instead. */
  onResend?: () => void

  onStartOver: () => void
}

export default function OtpChallengeForm({
  channel,
  maskedTarget,
  isSubmitting,
  error,
  onSubmit,
  onResend,
  onStartOver
}: OtpChallengeFormProps) {
  const [otp, setOtp] = useState('')
  const [rememberDevice, setRememberDevice] = useState(true)

  const canSubmit = otp.length === OTP_LENGTH && !isSubmitting

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canSubmit) onSubmit(otp, rememberDevice)
  }

  return (
    <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
      <Box>
        <Typography variant='h5'>Confirm it’s you</Typography>
        <Typography variant='body2' color='text.secondary' className='mt-1'>
          We sent a {OTP_LENGTH}-digit code by {channel === 'SMS' ? 'text message' : 'email'} to{' '}
          <strong>{maskedTarget}</strong>. We ask for this the first time you sign in from a
          browser we don’t recognise.
        </Typography>
      </Box>

      {error && <Alert severity='error'>{error}</Alert>}

      <TextField
        autoFocus
        fullWidth
        label='Verification code'
        value={otp}
        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
        inputProps={{ inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: OTP_LENGTH }}
      />

      <FormControlLabel
        control={<Checkbox checked={rememberDevice} onChange={e => setRememberDevice(e.target.checked)} />}
        label='Remember this device'
      />
      <Typography variant='caption' color='text.secondary' sx={{ mt: -2 }}>
        Leave this unchecked on a shared or public computer — we’ll ask for a code every time.
      </Typography>

      <Button fullWidth variant='contained' type='submit' disabled={!canSubmit}>
        {isSubmitting ? <CircularProgress size={22} color='inherit' /> : 'Verify'}
      </Button>

      <Box className='flex justify-center gap-4'>
        {onResend && (
          <Button size='small' onClick={onResend} disabled={isSubmitting}>
            Send a new code
          </Button>
        )}
        <Button size='small' color='secondary' onClick={onStartOver} disabled={isSubmitting}>
          Start over
        </Button>
      </Box>
    </form>
  )
}
