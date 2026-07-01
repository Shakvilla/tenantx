'use client'

import { useState, useEffect } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Skeleton from '@mui/material/Skeleton'
import TablePagination from '@mui/material/TablePagination'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import { getMyLoginHistory, type MyLoginHistoryItem } from '@/lib/api/auth-client'

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GH', { day: '2-digit', month: 'short', year: 'numeric' })
}

function deviceIcon(userAgent: string | null): string {
  if (!userAgent) return 'ri-computer-line'
  const ua = userAgent.toLowerCase()
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return 'ri-smartphone-line'
  if (ua.includes('tablet') || ua.includes('ipad')) return 'ri-tablet-line'
  return 'ri-computer-line'
}

function parseDevice(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device'
  if (userAgent.length > 80) return userAgent.slice(0, 80) + '…'
  return userAgent
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SecuritySettingsView() {
  const [history, setHistory]   = useState<MyLoginHistoryItem[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [logoutAll, setLogoutAll] = useState(false)
  const [logoutMsg, setLogoutMsg] = useState<string | null>(null)

  const load = (p: number) => {
    setLoading(true)
    setError(null)
    getMyLoginHistory({ page: p, size: 20 })
      .then(data => { setHistory(data.items); setTotal(data.totalItems); setPage(p) })
      .catch(() => setError('Could not load login history. Please try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(0) }, [])

  const handleLogoutAll = async () => {
    setLogoutAll(true)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1'}/auth/logout-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      setLogoutMsg('All other sessions have been terminated.')
    } catch {
      setLogoutMsg('Failed to terminate sessions. Please try again.')
    } finally {
      setLogoutAll(false)
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h5' fontWeight={700}>Security</Typography>
        <Typography variant='body2' color='text.secondary'>
          Monitor your account activity and manage active sessions.
        </Typography>
      </Box>

      {/* Session management */}
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardHeader
          title='Sessions'
          subheader='Manage devices that are logged into your account'
          avatar={<i className='ri-shield-keyhole-line' style={{ fontSize: '1.4rem', opacity: 0.7 }} />}
        />
        <Divider />
        <CardContent>
          {logoutMsg && (
            <Alert severity='success' onClose={() => setLogoutMsg(null)} sx={{ mb: 2 }}>
              {logoutMsg}
            </Alert>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant='body2' fontWeight={600}>Terminate all other sessions</Typography>
              <Typography variant='caption' color='text.secondary'>
                This will log out all devices except the one you are currently using.
              </Typography>
            </Box>
            <Button
              variant='outlined'
              color='error'
              size='small'
              disabled={logoutAll}
              startIcon={logoutAll ? <CircularProgress size={14} /> : <i className='ri-logout-box-r-line' />}
              onClick={handleLogoutAll}
            >
              {logoutAll ? 'Terminating…' : 'Terminate other sessions'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Login history */}
      <Card variant='outlined'>
        <CardHeader
          title='Login History'
          subheader='Recent sign-in activity on your account'
          avatar={<i className='ri-history-line' style={{ fontSize: '1.4rem', opacity: 0.7 }} />}
          action={
            <Tooltip title='Refresh'>
              <span>
                <Button size='small' variant='text' onClick={() => load(page)} disabled={loading}
                  startIcon={<i className='ri-refresh-line' />}>
                  Refresh
                </Button>
              </span>
            </Tooltip>
          }
        />
        <Divider />

        {error && <Alert severity='error' sx={{ m: 2 }}>{error}</Alert>}

        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 2, px: 3, py: 2, alignItems: 'center' }}>
              <Skeleton variant='circular' width={36} height={36} sx={{ flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant='text' width='50%' />
                <Skeleton variant='text' width='30%' />
              </Box>
              <Skeleton variant='rounded' width={60} height={22} />
            </Box>
          ))
        ) : history.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <i className='ri-history-line' style={{ fontSize: '2.5rem', color: 'var(--mui-palette-text-disabled)' }} />
            <Typography color='text.secondary' sx={{ mt: 1 }}>No login history yet</Typography>
          </Box>
        ) : (
          <>
            {history.map((h, idx) => (
              <Box key={h.id}>
                <Box sx={{ display: 'flex', gap: 2, px: 3, py: 2, alignItems: 'center' }}>
                  {/* Device icon */}
                  <Box
                    sx={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      bgcolor: h.success ? 'success.lighterOpacity' : 'error.lighterOpacity',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <i
                      className={deviceIcon(h.userAgent)}
                      style={{
                        fontSize: '1.1rem',
                        color: `var(--mui-palette-${h.success ? 'success' : 'error'}-main)`,
                      }}
                    />
                  </Box>

                  {/* Details */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      <Typography variant='body2' fontWeight={500} noWrap>
                        {h.ipAddress ?? 'Unknown IP'}
                      </Typography>
                      <Chip
                        label={h.success ? 'Success' : 'Failed'}
                        size='small'
                        color={h.success ? 'success' : 'error'}
                        variant='tonal'
                      />
                      {!h.success && h.failureReason && (
                        <Chip label={h.failureReason.replace(/_/g, ' ')} size='small' color='error' variant='outlined' />
                      )}
                    </Box>
                    <Typography variant='caption' color='text.disabled' noWrap title={h.userAgent ?? undefined}>
                      {parseDevice(h.userAgent)}
                    </Typography>
                  </Box>

                  {/* Time */}
                  <Typography variant='caption' color='text.secondary' sx={{ flexShrink: 0, textAlign: 'right' }}>
                    {relativeTime(h.createdAt)}
                  </Typography>
                </Box>
                {idx < history.length - 1 && <Divider />}
              </Box>
            ))}

            <Divider />
            <TablePagination
              component='div'
              count={total}
              page={page}
              rowsPerPage={20}
              rowsPerPageOptions={[20]}
              onPageChange={(_, p) => load(p)}
            />
          </>
        )}
      </Card>
    </Box>
  )
}
