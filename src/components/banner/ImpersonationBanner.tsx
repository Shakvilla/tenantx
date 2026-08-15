'use client'

import { useState, useEffect } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import { clearStoredTokens } from '@/lib/api/storage'

// Decode JWT payload without crypto — just base64 the middle segment
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

function getImpersonationMeta(): { tenantName: string; expiresAt: number } | null {
  if (typeof window === 'undefined') return null
  try {
    const token = localStorage.getItem('auth_token')
    if (!token) return null
    const payload = decodeJwtPayload(token)
    if (!payload || payload['scope'] !== 'impersonation') return null
    return {
      // tenantName is the human-readable company name embedded in the JWT by the backend.
      // Fall back to the tenant slug (payload['tenant']) if the claim is absent on older tokens.
      tenantName: String(payload['tenantName'] ?? payload['tenant'] ?? 'unknown'),
      expiresAt: Number(payload['exp'] ?? 0) * 1000,
    }
  } catch {
    return null
  }
}

function formatMinutesLeft(expiresAt: number): string {
  const diffMs = expiresAt - Date.now()
  if (diffMs <= 0) return 'expired'
  const mins = Math.ceil(diffMs / 60000)
  return `${mins} min${mins !== 1 ? 's' : ''}`
}

/**
 * Shown only when the current auth_token has scope=impersonation.
 * Displays the target tenant ID, remaining time, and an Exit button.
 * When the session expires, clears tokens and refreshes.
 */
export default function ImpersonationBanner() {
  const [meta, setMeta] = useState<{ tenantName: string; expiresAt: number } | null>(null)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const m = getImpersonationMeta()
    if (!m) return
    setMeta(m)
    setTimeLeft(formatMinutesLeft(m.expiresAt))

    // Update countdown every 30 seconds
    const tick = setInterval(() => {
      const left = formatMinutesLeft(m.expiresAt)
      setTimeLeft(left)

      // Auto-expire: clear session and redirect
      if (Date.now() >= m.expiresAt) {
        clearInterval(tick)
        clearStoredTokens()
        window.location.href = '/login?reason=impersonation-expired'
      }
    }, 30_000)

    return () => clearInterval(tick)
  }, [])

  if (!meta) return null

  function handleExit() {
    clearStoredTokens()
    // Close the tab if it was opened by the admin portal; otherwise go to login
    if (window.opener) {
      window.close()
    } else {
      window.location.href = '/login'
    }
  }

  return (
    <Alert
      severity='error'
      icon={<i className='ri-eye-line' />}
      sx={{
        borderRadius: 0,
        borderBottom: '1px solid',
        borderColor: 'error.dark',
        '& .MuiAlert-message': { display: 'flex', alignItems: 'center', gap: 1, width: '100%' },
      }}
      action={
        <Button
          size='small'
          color='error'
          variant='outlined'
          onClick={handleExit}
          startIcon={<i className='ri-logout-box-line' />}
        >
          Exit impersonation
        </Button>
      }
    >
      <strong>Admin view —</strong>&nbsp;You are viewing as tenant&nbsp;
      <code style={{ background: 'rgba(0,0,0,0.08)', borderRadius: 4, padding: '1px 5px', color: 'inherit', fontFamily: 'inherit' }}>
        {meta.tenantName}
      </code>
      . Session expires in&nbsp;<strong>{timeLeft}</strong>.
    </Alert>
  )
}
