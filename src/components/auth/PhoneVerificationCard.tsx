'use client'

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

// Must match the backend's SubmitPhoneNumberRequest validation exactly. A local mismatch would
// either reject a number the backend would accept, or — worse — let a malformed one through to
// burn one of the account's 3 hourly SMS sends for nothing.
const PHONE_PATTERN = /^\+?[0-9()\s-]{7,16}$/
const PHONE_HELP_TEXT = 'Enter 7 to 16 digits, optionally starting with +'
const OTP_LENGTH = 6

export interface PhoneVerificationCardProps {
  currentPhone: string | null
  isVerified: boolean
  onSubmitPhone: (phoneNumber: string) => Promise<{ expiresInSeconds: number }>
  onVerifyPhone: (otp: string) => Promise<void>
  onVerified: () => void
}

type Step = 'verified' | 'phone' | 'code'

function initialStep(currentPhone: string | null, isVerified: boolean): Step {
  return isVerified && currentPhone ? 'verified' : 'phone'
}

export default function PhoneVerificationCard({
  currentPhone,
  isVerified,
  onSubmitPhone,
  onVerifyPhone,
  onVerified
}: PhoneVerificationCardProps) {
  const [step, setStep] = useState<Step>(initialStep(currentPhone, isVerified))
  const [phoneNumber, setPhoneNumber] = useState(currentPhone ?? '')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [otp, setOtp] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)

  // The component owns no source of truth for verification status — `isVerified`/`currentPhone`
  // live in the parent, which updates them only after `onVerified()` fires and re-renders with
  // new props. `step` is local UI state seeded once from the initial props, so without this
  // effect a successful verify would leave the card stuck showing the code form: `onVerified()`
  // fires, the parent's state changes, but nothing here ever looks at the new props again.
  //
  // Deriving from props (rather than calling `setStep('verified')` directly inside the verify
  // handler) also means this is correct even if the parent's re-render lags a tick behind the
  // callback: we only flip to the verified view once `currentPhone` has actually arrived, so we
  // never render the verified layout with a still-null number. And because the dependency array
  // only changes when the props themselves change, an unrelated re-render with the same props
  // (e.g. while the user is mid-`Change number`) never clobbers that in-progress step.
  useEffect(() => {
    if (isVerified && currentPhone) {
      setStep('verified')
    }
  }, [isVerified, currentPhone])

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    // Validated locally, first — a typo caught here costs nothing. The same malformed number
    // sent to the server would burn one of the account's 3 hourly SMS sends.
    if (!PHONE_PATTERN.test(phoneNumber)) {
      setPhoneError(PHONE_HELP_TEXT)
      return
    }

    setPhoneError(null)
    setIsSendingCode(true)
    try {
      await onSubmitPhone(phoneNumber)
      setOtp('')
      setStep('code')
    } catch (err: any) {
      setApiError(err?.message || 'Could not send the verification code. Please try again.')
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.length !== OTP_LENGTH) return

    setApiError(null)
    setIsVerifyingCode(true)
    try {
      await onVerifyPhone(otp)
      onVerified()
    } catch (err: any) {
      setApiError(err?.message || 'Could not verify that code. Please try again.')
    } finally {
      setIsVerifyingCode(false)
    }
  }

  // Shared by "Change number" (from the verified view) and "Use a different number" (from the
  // code step) — both return to the phone step, and both must clear any stale error from the
  // step being abandoned. Previously only the former did, so a failed verify's error message
  // could linger on screen after backing out to re-enter the number.
  const resetToPhoneStep = () => {
    setApiError(null)
    setPhoneError(null)
    setOtp('')
    setStep('phone')
  }

  return (
    <Card variant='outlined'>
      <CardHeader
        title='Phone number'
        // "Verified" appears in the subheader's prose only on the phone/code steps, where the
        // "Verified" Chip below is not on screen. On the verified step, the Chip is the only
        // thing that should say "Verified" — repeating the word in the subheader too would give
        // `getByText(/verified/i)` two matches instead of one (a real DOM ambiguity, not a test
        // artifact: the Chip's label and a sentence containing "verified" are both matched, since
        // each is a distinct element's own direct text). This keeps one consistent word for the
        // concept throughout, without ever showing it twice at once.
        subheader={
          step === 'verified'
            ? 'Manage the phone number used to deliver your login codes by SMS.'
            : 'Optional. Add a phone number to receive your login codes by SMS — codes are sent by email unless you have a verified phone number on file.'
        }
        avatar={<i className='ri-smartphone-line' style={{ fontSize: '1.4rem', opacity: 0.7 }} />}
      />
      <Divider />
      <CardContent>
        {apiError && (
          <Alert severity='error' sx={{ mb: 3 }}>
            {apiError}
          </Alert>
        )}

        {step === 'verified' && currentPhone && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant='body2' fontWeight={600}>
                {currentPhone}
              </Typography>
              <Chip label='Verified' size='small' color='success' variant='tonal' />
            </Box>
            <Button variant='outlined' size='small' onClick={resetToPhoneStep}>
              Change number
            </Button>
          </Box>
        )}

        {step === 'phone' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box
              component='form'
              noValidate
              onSubmit={handleSendCode}
              sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
            >
              <TextField
                fullWidth
                label='Phone number'
                placeholder='+233241234567'
                value={phoneNumber}
                onChange={e => {
                  setPhoneNumber(e.target.value)
                  if (phoneError) setPhoneError(null)
                }}
                error={!!phoneError}
                helperText={phoneError ?? 'Used only to deliver login codes by SMS.'}
              />
              <Button
                variant='contained'
                type='submit'
                disabled={isSendingCode}
                sx={{ alignSelf: 'flex-start' }}
                startIcon={isSendingCode ? <CircularProgress size={16} color='inherit' /> : undefined}
              >
                {isSendingCode ? 'Sending…' : 'Send code'}
              </Button>
            </Box>
          </Box>
        )}

        {step === 'code' && (
          <Box
            component='form'
            noValidate
            onSubmit={handleVerify}
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            <Typography variant='body2' color='text.secondary'>
              Enter the {OTP_LENGTH}-digit code we sent to <strong>{phoneNumber}</strong>.
            </Typography>
            <TextField
              fullWidth
              autoFocus
              label='Verification code'
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
              inputProps={{ inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: OTP_LENGTH }}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant='contained'
                type='submit'
                disabled={otp.length !== OTP_LENGTH || isVerifyingCode}
              >
                {isVerifyingCode ? <CircularProgress size={22} color='inherit' /> : 'Verify'}
              </Button>
              <Button variant='text' color='secondary' onClick={resetToPhoneStep} disabled={isVerifyingCode}>
                Use a different number
              </Button>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
