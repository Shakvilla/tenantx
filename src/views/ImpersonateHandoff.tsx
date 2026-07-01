'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

import { setStoredTokens, setStoredTenantId, setStoredUserRole, setStoredUserType } from '@/lib/api/storage'

// ---------------------------------------------------------------------------
// Tiny JWT payload decoder — no crypto, just base64 the middle segment
// ---------------------------------------------------------------------------
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// View
// ---------------------------------------------------------------------------
export default function ImpersonateHandoff() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Hash format: #token=JWT&tenantId=acme-corp&role=ADMIN
    const hash = window.location.hash.slice(1)             // strip leading '#'
    const params = new URLSearchParams(hash)

    const token    = params.get('token')
    const tenantId = params.get('tenantId')
    const role     = params.get('role') ?? ''

    if (!token || !tenantId) {
      setError('Invalid impersonation link — missing token or tenant.')
      return
    }

    // Validate the token is at least a parseable JWT with the right claims
    const payload = decodeJwtPayload(token)

    if (!payload) {
      setError('Invalid impersonation token — could not decode payload.')
      return
    }

    if (payload['scope'] !== 'impersonation') {
      setError('This token is not an impersonation token.')
      return
    }

    // Overwrite only the tenant-specific keys — do NOT touch admin_token
    // (the admin may still have their admin tab open on the same browser).
    // setStoredTokens writes auth_token to localStorage + cookie.
    // Passing an empty string for refreshToken is intentional —
    // impersonation tokens are non-renewable by design.
    setStoredTokens(token, '')
    setStoredTenantId(tenantId)
    setStoredUserRole(role)
    setStoredUserType('LANDLORD')  // safe default; getCurrentUser() will hydrate the real profile

    // Clear the hash so the token doesn't linger in browser history
    window.history.replaceState(null, '', window.location.pathname)

    // Redirect into the tenant dashboard
    router.replace('/dashboard')
  }, [router])

  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2, p: 4 }}>
        <Alert severity='error' sx={{ maxWidth: 480 }}>
          <strong>Impersonation failed</strong>
          <br />
          {error}
        </Alert>
        <Button variant='outlined' onClick={() => window.close()}>Close this tab</Button>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
      <CircularProgress size={40} />
      <Typography variant='body1' color='text.secondary'>Starting impersonation session…</Typography>
    </Box>
  )
}
