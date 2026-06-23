'use client'

import { useEffect, useState, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import LinearProgress from '@mui/material/LinearProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'

import {
  getSystemHealth,
  type SystemHealthResponse,
  type JobStatusDto,
} from '@/lib/api/admin-auth-client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDatetime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function pctColor(rate: number): 'success' | 'warning' | 'error' {
  if (rate >= 90) return 'success'
  if (rate >= 70) return 'warning'
  return 'error'
}

// ---------------------------------------------------------------------------
// Job status chip
// ---------------------------------------------------------------------------

function JobStatusChip({ job }: { job: JobStatusDto }) {
  if (job.lastRunSuccess === null) {
    return <Chip size='small' label='Never run' variant='outlined' sx={{ color: 'text.disabled' }} />
  }
  return job.lastRunSuccess
    ? <Chip size='small' label='OK' color='success' variant='tonal' icon={<i className='ri-checkbox-circle-line' />} />
    : <Chip size='small' label='Failed' color='error' variant='tonal' icon={<i className='ri-error-warning-line' />} />
}

// ---------------------------------------------------------------------------
// Background Job Monitor card
// ---------------------------------------------------------------------------

function JobMonitorCard({ jobs }: { jobs: JobStatusDto[] }) {
  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='ri-timer-2-line' style={{ fontSize: 18 }} />
            <Typography variant='h6' fontWeight={700}>Background Job Monitor</Typography>
          </Box>
        }
        subheader='Scheduled task status since last server restart'
      />
      <TableContainer>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Job</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Schedule</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Last Run</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Runs (✓/✗)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Next Run</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', color: 'text.disabled', py: 4 }}>
                  No jobs registered yet. Jobs appear here after the first server restart.
                </TableCell>
              </TableRow>
            ) : jobs.map(job => (
              <TableRow key={job.jobKey} hover>
                <TableCell>
                  <Typography variant='body2' fontWeight={600}>{job.displayName}</Typography>
                  <Typography variant='caption' color='text.secondary'>{job.jobKey}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='body2'>{job.scheduleDescription}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='body2'>{formatDatetime(job.lastRunAt)}</Typography>
                </TableCell>
                <TableCell>
                  <Typography variant='body2'>{formatDuration(job.lastRunDurationMs)}</Typography>
                </TableCell>
                <TableCell>
                  <JobStatusChip job={job} />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <Typography variant='body2' color='success.main' fontWeight={600}>{job.successCount}</Typography>
                    <Typography variant='caption' color='text.disabled'>/</Typography>
                    <Typography variant='body2' color='error.main' fontWeight={600}>{job.failureCount}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant='body2'>{formatDatetime(job.nextRunAt)}</Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Redde Gateway Health card
// ---------------------------------------------------------------------------

function ReddeHealthCard({ health }: { health: SystemHealthResponse['reddeHealth'] }) {
  const rate = health.successRate30d
  const color = pctColor(rate)

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='ri-bank-card-line' style={{ fontSize: 18 }} />
            <Typography variant='h6' fontWeight={700}>Redde Gateway Health</Typography>
          </Box>
        }
        subheader='Push-to-pay subscription invoice stats — last 30 days'
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Success rate gauge */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='h2' fontWeight={800} color={`${color}.main`}>
                {health.totalAttempts30d === 0 ? '—' : `${rate.toFixed(1)}%`}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                Success Rate
              </Typography>
              {health.totalAttempts30d > 0 && (
                <LinearProgress
                  variant='determinate'
                  value={rate}
                  color={color}
                  sx={{ mt: 1.5, height: 8, borderRadius: 4 }}
                />
              )}
            </Box>
          </Grid>

          {/* Counters */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
              <Box>
                <Typography variant='caption' color='text.secondary' fontWeight={600} textTransform='uppercase'>
                  Total Attempts
                </Typography>
                <Typography variant='h5' fontWeight={700}>{health.totalAttempts30d}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant='caption' color='success.main' fontWeight={600} textTransform='uppercase'>
                    Successful
                  </Typography>
                  <Typography variant='h5' fontWeight={700} color='success.main'>{health.successCount30d}</Typography>
                </Box>
                <Box>
                  <Typography variant='caption' color='error.main' fontWeight={600} textTransform='uppercase'>
                    Failed
                  </Typography>
                  <Typography variant='h5' fontWeight={700} color='error.main'>{health.failureCount30d}</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Top failure reasons */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Box sx={{ py: 2 }}>
              <Typography variant='caption' color='text.secondary' fontWeight={600} textTransform='uppercase' sx={{ mb: 1.5, display: 'block' }}>
                Top Failure Reasons
              </Typography>
              {health.topFailureReasons.length === 0 ? (
                <Typography variant='body2' color='text.disabled'>No failures in 30 days</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {health.topFailureReasons.map((r, i) => (
                    <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body2' sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.reason}
                      </Typography>
                      <Chip size='small' label={r.count} color='error' variant='tonal' sx={{ minWidth: 36 }} />
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminSystemHealthView() {
  const [data, setData]       = useState<SystemHealthResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setData(await getSystemHealth())
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load system health')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !data) {
    return (
      <Box>
        <Alert
          severity='error'
          action={
            <IconButton size='small' onClick={load}><i className='ri-refresh-line' /></IconButton>
          }
        >
          {error ?? 'No data'}
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>System Health</Typography>
          <Typography variant='body2' color='text.secondary'>
            Background jobs and payment gateway status
          </Typography>
        </Box>
        <Tooltip title='Refresh'>
          <IconButton onClick={load} disabled={loading}>
            <i className='ri-refresh-line' />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Job Monitor */}
      <JobMonitorCard jobs={data.jobs} />

      {/* Redde Health */}
      <ReddeHealthCard health={data.reddeHealth} />
    </Box>
  )
}
