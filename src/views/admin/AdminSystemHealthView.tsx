'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'

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
  getSystemNotifications,
  resendSystemNotification,
  type SystemHealthResponse,
  type JobStatusDto,
  type ServiceStatusDto,
  type NotifChannelStatDto,
  type SystemNotificationDto,
} from '@/lib/api/admin-auth-client'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import TablePagination from '@mui/material/TablePagination'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

// ---------------------------------------------------------------------------
// Failed Notifications Card (gap-n3)
// ---------------------------------------------------------------------------

function FailedNotificationsCard() {
  const [rows, setRows]         = useState<SystemNotificationDto[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(0)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [resending, setResending] = useState<Set<string>>(new Set())
  const [toast, setToast]       = useState<string | null>(null)

  const load = (p: number) => {
    setLoading(true)
    setError(null)
    getSystemNotifications({ status: 'FAILED', page: p, size: 25 })
      .then(data => { setRows(data.content); setTotal(data.totalElements); setPage(p) })
      .catch(() => setError('Failed to load failed notifications.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(0) }, [])

  const handleResend = async (id: string) => {
    setResending(prev => new Set(prev).add(id))
    try {
      await resendSystemNotification(id)
      setToast('Notification queued for resend.')
      load(page)
    } catch {
      setToast('Resend failed. Check server logs.')
    } finally {
      setResending(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  return (
    <Card variant='outlined' sx={{ mt: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='ri-error-warning-line' style={{ color: 'var(--mui-palette-error-main)' }} />
            Failed Notifications
            {total > 0 && <Chip label={total} size='small' color='error' />}
          </Box>
        }
        action={
          <Tooltip title='Refresh'>
            <IconButton onClick={() => load(page)} disabled={loading}>
              <i className='ri-refresh-line' />
            </IconButton>
          </Tooltip>
        }
      />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        {toast && (
          <Alert severity='info' onClose={() => setToast(null)} sx={{ m: 2 }}>{toast}</Alert>
        )}
        {error && <Alert severity='error' sx={{ m: 2 }}>{error}</Alert>}
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ px: 3, py: 1.5 }}>
              <Skeleton variant='text' width='60%' />
              <Skeleton variant='text' width='40%' />
            </Box>
          ))
        ) : rows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <i className='ri-checkbox-circle-line' style={{ fontSize: '2.5rem', color: 'var(--mui-palette-success-main)' }} />
            <Typography color='text.secondary' sx={{ mt: 1 }}>No failed notifications</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size='small'>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>Recipient</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>Retries</TableCell>
                    <TableCell sx={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary' }}>Reason</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map(n => (
                    <TableRow key={n.id} hover>
                      <TableCell>
                        <Chip label={n.type} size='small' variant='outlined' />
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{n.recipientAddress}</TableCell>
                      <TableCell sx={{ color: 'text.secondary', fontSize: 12 }}>{n.subject ?? '—'}</TableCell>
                      <TableCell>{n.retryCount}</TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant='caption' color='error' noWrap title={n.failureReason ?? undefined}>
                          {n.failureReason ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align='right'>
                        <Tooltip title='Resend'>
                          <span>
                            <IconButton
                              size='small'
                              color='primary'
                              disabled={resending.has(n.id)}
                              onClick={() => handleResend(n.id)}
                            >
                              {resending.has(n.id)
                                ? <CircularProgress size={14} />
                                : <i className='ri-send-plane-line' style={{ fontSize: '1rem' }} />
                              }
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component='div'
              count={total}
              page={page}
              rowsPerPage={25}
              rowsPerPageOptions={[25]}
              onPageChange={(_, p) => load(p)}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}

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
// Service Status Card (NEW)
// ---------------------------------------------------------------------------

const SERVICE_ICONS: Record<string, string> = {
  api:      'ri-server-line',
  database: 'ri-database-2-line',
  email:    'ri-mail-send-line',
  sms:      'ri-message-2-line',
  imagekit: 'ri-image-2-line',
  redde:    'ri-bank-card-2-line',
}

const STATUS_COLOR: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  UP:           'success',
  DOWN:         'error',
  DEGRADED:     'warning',
  UNCONFIGURED: 'default',
}

const STATUS_ICON: Record<string, string> = {
  UP:           'ri-checkbox-circle-fill',
  DOWN:         'ri-close-circle-fill',
  DEGRADED:     'ri-error-warning-fill',
  UNCONFIGURED: 'ri-question-line',
}

function ServiceStatusCard({ services }: { services: ServiceStatusDto[] }) {
  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='ri-pulse-line' style={{ fontSize: 18 }} />
            <Typography variant='h6' fontWeight={700}>Service Status</Typography>
          </Box>
        }
        subheader='Real-time connectivity and configuration check for each platform component'
      />
      <CardContent>
        <Grid container spacing={2}>
          {services.map(svc => {
            const color = STATUS_COLOR[svc.status] ?? 'default'
            const icon  = SERVICE_ICONS[svc.key] ?? 'ri-settings-3-line'
            const statusIcon = STATUS_ICON[svc.status] ?? 'ri-question-line'
            const bgKey = color === 'success' ? 'success' : color === 'error' ? 'error' : color === 'warning' ? 'warning' : 'grey'

            return (
              <Grid item xs={12} sm={6} md={4} key={svc.key}>
                <Tooltip title={svc.detail} arrow>
                  <Box
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      p: 1.5, borderRadius: 2,
                      border: '1px solid',
                      borderColor: `${color === 'default' ? 'grey' : color}.light`,
                      bgcolor: `${color === 'default' ? 'action' : color}.hover`,
                      cursor: 'default',
                    }}
                  >
                    <Box
                      sx={{
                        width: 36, height: 36, borderRadius: 1.5,
                        bgcolor: color === 'default' ? 'action.selected' : `${color}.lighter`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}
                    >
                      <i className={icon} style={{ fontSize: 18, color: `var(--mui-palette-${color === 'default' ? 'text-secondary' : color + '-main'})` }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant='body2' fontWeight={600} noWrap>{svc.name}</Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                        <i className={statusIcon} style={{ fontSize: 13, color: `var(--mui-palette-${color === 'default' ? 'text-disabled' : color + '-main'})` }} />
                        <Typography variant='caption' color={color === 'default' ? 'text.disabled' : `${color}.main`} fontWeight={600}>
                          {svc.status}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Tooltip>
              </Grid>
            )
          })}
        </Grid>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Flyway Migration Status Card (NEW)
// ---------------------------------------------------------------------------

function FlywayCard({ flyway }: { flyway: SystemHealthResponse['flyway'] }) {
  const hasPending = flyway.pendingCount > 0
  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='ri-code-box-line' style={{ fontSize: 18 }} />
            <Typography variant='h6' fontWeight={700}>Database Schema</Typography>
          </Box>
        }
        subheader='Flyway migration status'
        action={
          hasPending
            ? <Chip size='small' label={`${flyway.pendingCount} pending`} color='warning' variant='tonal' />
            : <Chip size='small' label='Schema up to date' color='success' variant='tonal' icon={<i className='ri-checkbox-circle-line' />} />
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant='caption' color='text.secondary' fontWeight={600} textTransform='uppercase'>
              Current Version
            </Typography>
            <Typography variant='h4' fontWeight={800} sx={{ mt: 0.5 }}>
              V{flyway.currentVersion}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.25 }}>
              {flyway.description}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography variant='caption' color='text.secondary' fontWeight={600} textTransform='uppercase'>
              Applied Migrations
            </Typography>
            <Typography variant='h4' fontWeight={800} color='success.main' sx={{ mt: 0.5 }}>
              {flyway.appliedCount}
            </Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography variant='caption' color='text.secondary' fontWeight={600} textTransform='uppercase'>
              Last Applied At
            </Typography>
            <Typography variant='body1' fontWeight={600} sx={{ mt: 0.5 }}>
              {flyway.installedOn ? formatDatetime(flyway.installedOn) : '—'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Notification Stats Card (NEW)
// ---------------------------------------------------------------------------

function ChannelStatMini({ label, stat }: {
  label: string
  stat: NotifChannelStatDto
}) {
  const deliveryRate = stat.total === 0 ? null
    : Math.round(((stat.sent + stat.delivered) / stat.total) * 100)

  return (
    <Box>
      <Typography variant='caption' color='text.secondary' fontWeight={600} textTransform='uppercase'>
        {label}
      </Typography>
      {stat.total === 0 ? (
        <Typography variant='body2' color='text.disabled' sx={{ mt: 0.5 }}>No messages sent</Typography>
      ) : (
        <>
          <Typography variant='h5' fontWeight={800} sx={{ mt: 0.5 }}>{stat.total.toLocaleString()}</Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 0.75, flexWrap: 'wrap' }}>
            <Chip size='small' label={`${stat.sent + stat.delivered} sent`} color='success' variant='tonal' />
            {stat.failed > 0 && <Chip size='small' label={`${stat.failed} failed`} color='error' variant='tonal' />}
            {stat.pending > 0 && <Chip size='small' label={`${stat.pending} pending`} color='warning' variant='tonal' />}
          </Box>
          {deliveryRate !== null && (
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant='determinate'
                value={deliveryRate}
                color={deliveryRate >= 90 ? 'success' : deliveryRate >= 70 ? 'warning' : 'error'}
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Typography variant='caption' color='text.secondary'>{deliveryRate}% delivery rate</Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

function NotificationStatsCard({ notifStats }: { notifStats: SystemHealthResponse['notifStats'] }) {
  const chartOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false }, stacked: false },
    plotOptions: { bar: { columnWidth: '55%', borderRadius: 4 } },
    dataLabels: { enabled: false },
    xaxis: {
      categories: notifStats.dailyTrend.map(d => {
        const dt = new Date(d.date + 'T00:00:00Z')
        return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
      }),
      labels: { style: { fontSize: '11px' } },
    },
    yaxis: { labels: { formatter: (v: number) => String(Math.round(v)) } },
    legend: { position: 'top', horizontalAlign: 'left' },
    colors: ['var(--mui-palette-primary-main)', 'var(--mui-palette-success-main)'],
    grid: { borderColor: 'var(--mui-palette-divider)', strokeDashArray: 4 },
    tooltip: { theme: 'dark' },
  }

  const chartSeries = [
    { name: 'Email', data: notifStats.dailyTrend.map(d => d.emailCount) },
    { name: 'SMS / WhatsApp', data: notifStats.dailyTrend.map(d => d.smsCount) },
  ]

  const totalAll = notifStats.email.total + notifStats.sms.total + notifStats.whatsapp.total

  return (
    <Card>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <i className='ri-notification-2-line' style={{ fontSize: 18 }} />
            <Typography variant='h6' fontWeight={700}>Notification Delivery Stats</Typography>
          </Box>
        }
        subheader='Email and SMS delivery performance — last 30 days'
        action={
          <Chip
            size='small'
            label={`${totalAll.toLocaleString()} total`}
            color='primary'
            variant='tonal'
          />
        }
      />
      <CardContent>
        <Grid container spacing={3}>
          {/* Channel summaries */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <ChannelStatMini label='Email (Resend)' stat={notifStats.email} />
              <Divider />
              <ChannelStatMini label='SMS (Frog)' stat={notifStats.sms} />
              {notifStats.whatsapp.total > 0 && (
                <>
                  <Divider />
                  <ChannelStatMini label='WhatsApp' stat={notifStats.whatsapp} />
                </>
              )}
            </Box>
          </Grid>

          {/* Daily trend chart */}
          <Grid item xs={12} md={8}>
            <Typography variant='caption' color='text.secondary' fontWeight={600} textTransform='uppercase' sx={{ mb: 1, display: 'block' }}>
              Daily Volume — Last 7 Days
            </Typography>
            <AppReactApexCharts
              type='bar'
              height={200}
              options={chartOptions}
              series={chartSeries}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
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
                  No jobs registered yet.
                </TableCell>
              </TableRow>
            ) : jobs.map(job => (
              <TableRow key={job.jobKey} hover>
                <TableCell>
                  <Typography variant='body2' fontWeight={600}>{job.displayName}</Typography>
                  <Typography variant='caption' color='text.secondary'>{job.jobKey}</Typography>
                </TableCell>
                <TableCell><Typography variant='body2'>{job.scheduleDescription}</Typography></TableCell>
                <TableCell><Typography variant='body2'>{formatDatetime(job.lastRunAt)}</Typography></TableCell>
                <TableCell><Typography variant='body2'>{formatDuration(job.lastRunDurationMs)}</Typography></TableCell>
                <TableCell><JobStatusChip job={job} /></TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                    <Typography variant='body2' color='success.main' fontWeight={600}>{job.successCount}</Typography>
                    <Typography variant='caption' color='text.disabled'>/</Typography>
                    <Typography variant='body2' color='error.main' fontWeight={600}>{job.failureCount}</Typography>
                  </Box>
                </TableCell>
                <TableCell><Typography variant='body2'>{formatDatetime(job.nextRunAt)}</Typography></TableCell>
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
  const rate  = health.successRate30d
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
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant='h2' fontWeight={800} color={`${color}.main`}>
                {health.totalAttempts30d === 0 ? '—' : `${rate.toFixed(1)}%`}
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>Success Rate</Typography>
              {health.totalAttempts30d > 0 && (
                <LinearProgress variant='determinate' value={rate} color={color}
                  sx={{ mt: 1.5, height: 8, borderRadius: 4 }} />
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
              <Box>
                <Typography variant='caption' color='text.secondary' fontWeight={600} textTransform='uppercase'>Total Attempts</Typography>
                <Typography variant='h5' fontWeight={700}>{health.totalAttempts30d}</Typography>
              </Box>
              <Divider />
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box>
                  <Typography variant='caption' color='success.main' fontWeight={600} textTransform='uppercase'>Successful</Typography>
                  <Typography variant='h5' fontWeight={700} color='success.main'>{health.successCount30d}</Typography>
                </Box>
                <Box>
                  <Typography variant='caption' color='error.main' fontWeight={600} textTransform='uppercase'>Failed</Typography>
                  <Typography variant='h5' fontWeight={700} color='error.main'>{health.failureCount30d}</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
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

const AUTO_REFRESH_SECONDS = 30

export default function AdminSystemHealthView() {
  const [data, setData]           = useState<SystemHealthResponse | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [countdown, setCountdown] = useState(AUTO_REFRESH_SECONDS)
  const countdownRef              = useRef(AUTO_REFRESH_SECONDS)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setData(await getSystemHealth())
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Failed to load system health')
    } finally {
      setLoading(false)
      countdownRef.current = AUTO_REFRESH_SECONDS
      setCountdown(AUTO_REFRESH_SECONDS)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const tick = setInterval(() => {
      countdownRef.current -= 1
      setCountdown(countdownRef.current)
      if (countdownRef.current <= 0) load()
    }, 1000)
    return () => clearInterval(tick)
  }, [load])

  if (loading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (error || !data) {
    return (
      <Alert severity='error' action={
        <IconButton size='small' onClick={load}><i className='ri-refresh-line' /></IconButton>
      }>
        {error ?? 'No data'}
      </Alert>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>System Health</Typography>
          <Typography variant='body2' color='text.secondary'>
            Platform infrastructure and notification delivery status
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {loading && <CircularProgress size={14} />}
          <Typography variant='caption' color='text.secondary'>Auto-refresh in {countdown}s</Typography>
          <Tooltip title='Refresh now'>
            <span>
              <IconButton onClick={load} disabled={loading} size='small'>
                <i className='ri-refresh-line' />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Active Sessions summary */}
      <Card variant='outlined'>
        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'info.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className='ri-user-line' style={{ fontSize: '1.4rem', color: 'var(--mui-palette-info-main)' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant='h4' fontWeight={700}>{data.activeSessionsApprox}</Typography>
            <Typography variant='body2' color='text.secondary'>Active tenant sessions (last 30 min)</Typography>
          </Box>
          <Tooltip title='Distinct tenant users with a successful login in the last 30 minutes.'>
            <i className='ri-information-line' style={{ color: 'var(--mui-palette-text-disabled)', cursor: 'help' }} />
          </Tooltip>
        </CardContent>
      </Card>

      {/* Service Status Panel */}
      {data.services && data.services.length > 0 && (
        <ServiceStatusCard services={data.services} />
      )}

      {/* Flyway Migration Status */}
      {data.flyway && (
        <FlywayCard flyway={data.flyway} />
      )}

      {/* Notification Delivery Stats */}
      {data.notifStats && (
        <NotificationStatsCard notifStats={data.notifStats} />
      )}

      {/* Failed Notifications — resend panel */}
      <FailedNotificationsCard />

      {/* Background Job Monitor */}
      <JobMonitorCard jobs={data.jobs} />

      {/* Redde Gateway Health */}
      <ReddeHealthCard health={data.reddeHealth} />
    </Box>
  )
}
