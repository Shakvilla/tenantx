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
import Typography from '@mui/material/Typography'

import { noticesApi } from '@/lib/api/notices'
import { NOTICE_TYPE_LABELS } from '@/views/occupants/view/NoticesTab'
import type { NoticeSummary } from '@/types/notice'

function fmtDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function OccupantNoticesView() {
  const [notices, setNotices]   = useState<NoticeSummary[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [ackingId, setAckingId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  function load() {
    setLoading(true)
    setError(null)
    noticesApi.listMine()
      .then(setNotices)
      .catch(err => setError(err?.message ?? 'Failed to load notices'))
      .finally(() => setLoading(false))
  }

  async function acknowledge(id: string) {
    setAckingId(id)
    try {
      const updated = await noticesApi.acknowledge(id)
      setNotices(prev => prev.map(n => (n.id === id ? { ...n, status: updated.status, acknowledgedAt: updated.acknowledgedAt } : n)))
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? 'Failed to acknowledge notice')
    } finally {
      setAckingId(null)
    }
  }

  if (loading) return (
    <Box className='flex justify-center items-center' sx={{ minHeight: 200 }}>
      <CircularProgress />
    </Box>
  )

  return (
    <Card>
      <CardHeader title='My Notices' subheader='Notices sent to you by your property manager' />
      <CardContent>
        {error && <Alert severity='error' sx={{ mb: 3 }} onClose={() => setError(null)}>{error}</Alert>}

        {notices.length === 0 ? (
          <Box className='flex flex-col items-center justify-center gap-2 py-12' sx={{ color: 'text.disabled' }}>
            <i className='ri-mail-line' style={{ fontSize: 28 }} />
            <Typography variant='body2'>You have no notices.</Typography>
          </Box>
        ) : (
          <Box className='flex flex-col gap-4'>
            {notices.map((n, idx) => (
              <Box key={n.id}>
                {idx > 0 && <Divider sx={{ mb: 4 }} />}
                <Box className='flex items-start justify-between gap-3'>
                  <Box className='flex flex-col gap-1'>
                    <Box className='flex items-center gap-2'>
                      <Chip label={NOTICE_TYPE_LABELS[n.type] ?? n.type} size='small' variant='tonal' color='primary' />
                      <Typography fontWeight={600}>{n.title}</Typography>
                    </Box>
                    <Typography variant='caption' color='text.secondary'>{fmtDate(n.issuedAt)}</Typography>
                  </Box>
                  {n.status === 'ACKNOWLEDGED' ? (
                    <Chip label='Acknowledged' size='small' variant='tonal' color='success' />
                  ) : (
                    <Button
                      size='small' variant='outlined'
                      disabled={ackingId === n.id}
                      startIcon={ackingId === n.id ? <CircularProgress size={14} color='inherit' /> : <i className='ri-check-line' />}
                      onClick={() => acknowledge(n.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
