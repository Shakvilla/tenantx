'use client'

import { useState } from 'react'

import { useRouter } from 'next/navigation'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CircularProgress from '@mui/material/CircularProgress'

import Link from '@components/Link'
import AuthShell from '@/components/auth/AuthShell'

import { beginAgentSignup, completeAgentSignup } from '@/lib/api/agent-network'

import { useImageVariant } from '@core/hooks/useImageVariant'
import { useSettings } from '@core/hooks/useSettings'

import type { Mode } from '@core/types'

type Step = 'details' | 'otp' | 'profile' | 'done'

const AgentSignupView = ({ mode }: { mode: Mode }) => {
  const router = useRouter()

  const [step, setStep] = useState<Step>('details')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [publicName, setPublicName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { settings } = useSettings()
  const authBackground = useImageVariant(mode, '/images/pages/auth-v2-mask-1-light.png', '/images/pages/auth-v2-mask-1-dark.png')

  const characterIllustration = useImageVariant(
    mode,
    '/images/illustrations/auth/v2-login-light.png',
    '/images/illustrations/auth/v2-login-dark.png',
    '/images/illustrations/auth/v2-login-light-border.png',
    '/images/illustrations/auth/v2-login-dark-border.png'
  )

  const handleBegin = async () => {
    if (!identifier.trim() || password.length < 8) {
      setError('Enter your email and a password of at least 8 characters')
      
return
    }

    setLoading(true)
    setError(null)

    try {
      await beginAgentSignup({ identifier: identifier.trim(), password })
      setStep('otp')
    } catch (e: any) {
      setError(e?.message ?? 'Could not start signup')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    if (otp.trim().length !== 6) {
      setError('Enter the 6-digit code we sent you')
      
return
    }

    setStep('profile')
  }

  const handleComplete = async () => {
    if (!publicName.trim()) {
      setError('Enter your public professional name')
      
return
    }

    setLoading(true)
    setError(null)

    try {
      await completeAgentSignup(
        { otp: otp.trim(), publicName: publicName.trim(), phone: phone || undefined },
        identifier.trim()
      )
      setStep('done')
    } catch (e: any) {
      setError(e?.message ?? 'Could not complete signup')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      characterIllustration={characterIllustration}
      authBackground={authBackground}
      bordered={settings.skin === 'bordered'}
    >
      <Typography variant='h5'>Join as an agent</Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
        A portable professional profile — no landlord account needed to start.
      </Typography>
      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {step === 'details' && (
        <>
          <TextField
            label='Email'
            value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            fullWidth
            sx={{ mb: 3 }}
          />
          <TextField
            label='Password'
            type='password'
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            sx={{ mb: 3 }}
            helperText='At least 8 characters'
          />
          <Button variant='contained' fullWidth onClick={handleBegin} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Continue'}
          </Button>
        </>
      )}

      {step === 'otp' && (
        <>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            We sent a 6-digit code to {identifier}. Enter it to verify your contact.
          </Typography>
          <TextField
            label='Verification code'
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            fullWidth
            sx={{ mb: 3 }}
            inputProps={{ inputMode: 'numeric', maxLength: 6 }}
          />
          <Button variant='contained' fullWidth onClick={handleVerify}>
            Verify
          </Button>
        </>
      )}

      {step === 'profile' && (
        <>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 3 }}>
            This is the public name landlords and tenants will see. Identity verification and
            credential review happen separately — nothing here implies either.
          </Typography>
          <TextField
            label='Public professional name'
            value={publicName}
            onChange={e => setPublicName(e.target.value)}
            fullWidth
            sx={{ mb: 3 }}
          />
          <TextField
            label='Primary phone (optional)'
            value={phone}
            onChange={e => setPhone(e.target.value)}
            fullWidth
            sx={{ mb: 3 }}
          />
          <Button variant='contained' fullWidth onClick={handleComplete} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create agent profile'}
          </Button>
        </>
      )}

      {step === 'done' && (
        <>
          <Alert severity='success' sx={{ mb: 3 }}>
            Your agent profile is ready. Sign in to refer landlords, claim invitations and manage your workspaces.
          </Alert>
          <Button variant='contained' fullWidth onClick={() => router.push('/login')}>
            Sign in
          </Button>
        </>
      )}

      <Typography variant='body2' color='text.secondary' sx={{ mt: 4, textAlign: 'center' }}>
        Landlord instead? <Link href='/register'>Create a landlord account</Link>
      </Typography>
    </AuthShell>
  )
}

export default AgentSignupView
