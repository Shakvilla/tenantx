'use client'

import { useState, useEffect, useCallback } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Skeleton from '@mui/material/Skeleton'
import Tab from '@mui/material/Tab'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tabs from '@mui/material/Tabs'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

import {
  getFunnelReport,
  getPlanChangesReport,
  getSummaryReport,
  buildSummaryExportUrl,
  getRevenueByPlan,
  getRentalRevenue,
  getOccupancyStats,
  getTopTenants,
  type FunnelReportDto,
  type PlanChangesReportDto,
  type SummaryReportDto,
  type RevenueByPlanDto,
  type AdminRentalRevenueDto,
  type AdminOccupancyDto,
  type AdminTopTenantsDto,
} from '@/lib/api/admin-auth-client'
import { getStoredAdminToken } from '@/lib/api/admin-storage'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0]
}

function defaultRange(): { start: string; end: string } {
  const end   = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 29)
  return { start: toIsoDate(start), end: toIsoDate(end) }
}

function fmtNum(n: number): string {
  return n.toLocaleString()
}

function fmtCurrency(n: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency', currency: 'GHS', minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(n)
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STAGE_COLORS = ['#7367f0', '#28c76f', '#00cfe8'] as const

const DIRECTION_CHIP: Record<string, { label: string; color: 'success' | 'error' | 'default' | 'warning' }> = {
  UPGRADE:   { label: 'Upgrade',   color: 'success' },
  DOWNGRADE: { label: 'Downgrade', color: 'error'   },
  LATERAL:   { label: 'Lateral',   color: 'warning' },
  UNKNOWN:   { label: 'Unknown',   color: 'default' },
}

// ---------------------------------------------------------------------------
// Shared: KPI Stat Card — matches dashboard design
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string
  value: string
  icon: string
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary'
  sub?: string
  loading?: boolean
}

function StatCard({ label, value, icon, color, sub, loading }: StatCardProps) {
  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant='body2' color='text.secondary' fontWeight={500}>{label}</Typography>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2,
            bgcolor: `${color}.main`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <i className={icon} style={{ fontSize: '1.3rem', color: '#fff' }} />
          </Box>
        </Box>
        {loading ? (
          <>
            <Skeleton variant='text' width='60%' height={44} />
            <Skeleton variant='text' width='40%' height={20} />
          </>
        ) : (
          <>
            <Typography variant='h4' fontWeight={800} lineHeight={1.1} mb={0.5}>{value}</Typography>
            {sub && <Typography variant='caption' color='text.secondary'>{sub}</Typography>}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Shared: Date range toolbar
// ---------------------------------------------------------------------------

interface DateRangeToolbarProps {
  start: string
  end: string
  loading: boolean
  onStartChange: (v: string) => void
  onEndChange: (v: string) => void
  onApply: () => void
  extra?: React.ReactNode
}

function DateRangeToolbar({ start, end, loading, onStartChange, onEndChange, onApply, extra }: DateRangeToolbarProps) {
  return (
    <Card variant='outlined' sx={{ mb: 3 }}>
      <CardContent sx={{ py: '12px !important' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label='Start date' type='date' size='small' value={start}
            onChange={e => onStartChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ max: end }}
          />
          <TextField
            label='End date' type='date' size='small' value={end}
            onChange={e => onEndChange(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: start, max: toIsoDate(new Date()) }}
          />
          <Button
            variant='contained' size='small'
            onClick={onApply} disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color='inherit' /> : <i className='ri-refresh-line' />}
          >
            {loading ? 'Loading…' : 'Apply'}
          </Button>
          {extra && <Box sx={{ ml: 'auto' }}>{extra}</Box>}
        </Box>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Shared: Section card wrapper
// ---------------------------------------------------------------------------

function SectionCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <Card variant='outlined'>
      {title && (
        <>
          <Box sx={{ px: 3, py: 2 }}>
            <Typography variant='subtitle1' fontWeight={700}>{title}</Typography>
          </Box>
          <Divider />
        </>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Tab 0 — Tenant Funnel
// ---------------------------------------------------------------------------

function FunnelSkeletons() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Grid container spacing={3}>
        {[0, 1, 2].map(i => (
          <Grid key={i} item xs={12} md={4}>
            <Card variant='outlined'><CardContent>
              <Skeleton variant='text' width='50%' height={20} />
              <Skeleton variant='text' width='70%' height={44} />
              <Skeleton variant='text' width='40%' height={20} />
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Skeleton variant='rounded' height={200} />
    </Box>
  )
}

function FunnelTab() {
  const [report, setReport] = useState<FunnelReportDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getFunnelReport()
      .then(setReport)
      .catch(() => setError('Failed to load funnel data. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <FunnelSkeletons />
  if (error)   return <Alert severity='error'>{error}</Alert>
  if (!report) return null

  const maxCount = report.stages[0]?.count ?? 1

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Stat cards row */}
      <Grid container spacing={3}>
        {report.stages.map((stage, idx) => {
          const color = (['primary', 'success', 'info'] as const)[idx] ?? 'primary'
          const icon  = ['ri-building-2-line', 'ri-user-heart-line', 'ri-vip-crown-2-line'][idx] ?? 'ri-bar-chart-line'
          return (
            <Grid key={stage.label} item xs={12} md={4}>
              <StatCard
                label={stage.label}
                value={fmtNum(stage.count)}
                icon={icon}
                color={color}
                sub={idx === 0 ? 'Baseline — all registered' : `${stage.pctOfRegistered.toFixed(1)}% of registered`}
              />
            </Grid>
          )
        })}
      </Grid>

      {/* Visual funnel */}
      <SectionCard title='Conversion Funnel'>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {report.stages.map((stage, idx) => {
            const color  = STAGE_COLORS[idx] ?? '#90a4ae'
            const barPct = maxCount > 0 ? (stage.count / maxCount) * 100 : 0

            return (
              <Box key={stage.label}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: '50%',
                      bgcolor: color, color: '#fff', fontWeight: 700, fontSize: '0.8rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {idx + 1}
                    </Box>
                    <Typography variant='body2' fontWeight={600}>{stage.label}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant='body2' fontWeight={700} sx={{ color }}>
                      {fmtNum(stage.count)}
                    </Typography>
                    {idx > 0 && (
                      <Typography variant='caption' color='text.secondary'>
                        {stage.pctOfPrevious.toFixed(1)}% of prev. stage
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Progress bar */}
                <Box sx={{ height: 10, bgcolor: 'action.hover', borderRadius: 5, overflow: 'hidden' }}>
                  <Box sx={{
                    height: '100%', bgcolor: color, borderRadius: 5,
                    width: `${barPct}%`, transition: 'width 0.7s ease',
                  }} />
                </Box>

                {/* Arrow between stages */}
                {idx < report.stages.length - 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                    <i className='ri-arrow-down-line' style={{ color: '#aaa', fontSize: '1rem' }} />
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>

        {/* Conversion rate summary */}
        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant='caption' color='text.secondary' fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Stage-to-stage conversion
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 1, flexWrap: 'wrap' }}>
            {report.stages.slice(1).map((stage, i) => {
              const prev = report.stages[i]
              return (
                <Chip
                  key={stage.label}
                  variant='outlined'
                  size='small'
                  label={`${prev.label} → ${stage.label}: ${stage.pctOfPrevious.toFixed(1)}%`}
                />
              )
            })}
          </Box>
        </Box>

        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 2 }}>
          Snapshot taken {new Date(report.generatedAt).toLocaleString()}
        </Typography>
      </SectionCard>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Tab 1 — Plan Changes
// ---------------------------------------------------------------------------

function PlanChangesSkeletons() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Skeleton variant='rounded' height={60} />
      <Grid container spacing={3}>
        {[0, 1, 2].map(i => (
          <Grid key={i} item xs={12} md={4}>
            <Card variant='outlined'><CardContent>
              <Skeleton variant='text' width='50%' height={20} />
              <Skeleton variant='text' width='60%' height={44} />
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Skeleton variant='rounded' height={240} />
    </Box>
  )
}

function PlanChangesTab() {
  const range = defaultRange()
  const [start, setStart]   = useState(range.start)
  const [end,   setEnd]     = useState(range.end)
  const [report, setReport] = useState<PlanChangesReportDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const load = useCallback((s: string, e: string) => {
    setLoading(true); setError(null)
    getPlanChangesReport(s, e)
      .then(setReport)
      .catch(() => setError('Failed to load plan change data. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(start, end) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const total = report ? report.totalUpgrades + report.totalDowngrades + report.totalLateral : 0

  if (loading && !report) return (
    <>
      <DateRangeToolbar start={start} end={end} loading={loading}
        onStartChange={setStart} onEndChange={setEnd} onApply={() => load(start, end)} />
      <PlanChangesSkeletons />
    </>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <DateRangeToolbar start={start} end={end} loading={loading}
        onStartChange={setStart} onEndChange={setEnd} onApply={() => load(start, end)} />

      {error && <Alert severity='error'>{error}</Alert>}

      {report && (
        <>
          {/* Summary stats */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <StatCard label='Total Plan Changes' value={fmtNum(total)}
                icon='ri-exchange-line' color='primary'
                sub={`${start} – ${end}`} />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard label='Upgrades' value={fmtNum(report.totalUpgrades)}
                icon='ri-arrow-up-circle-line' color='success'
                sub='Moved to higher tier' />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard label='Downgrades' value={fmtNum(report.totalDowngrades)}
                icon='ri-arrow-down-circle-line' color='error'
                sub='Moved to lower tier' />
            </Grid>
          </Grid>

          {/* Changes table */}
          {report.changes.length === 0 ? (
            <Card variant='outlined'>
              <CardContent>
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <i className='ri-bar-chart-2-line' style={{ fontSize: '2.5rem', color: '#aaa' }} />
                  <Typography variant='body2' color='text.secondary' mt={1}>
                    No plan changes recorded in this date range.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ) : (
            <Card variant='outlined'>
              <Box sx={{ px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant='subtitle1' fontWeight={700}>Plan Change Breakdown</Typography>
                <Typography variant='caption' color='text.secondary'>{report.changes.length} pairs</Typography>
              </Box>
              <Divider />
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontWeight: 700 }}>From Plan</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>To Plan</TableCell>
                      <TableCell align='center' sx={{ fontWeight: 700 }}>Direction</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 700 }}>Count</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 700 }}>% of Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {report.changes.map((row, i) => {
                      const chip = DIRECTION_CHIP[row.direction] ?? DIRECTION_CHIP['UNKNOWN']
                      const pct  = total > 0 ? ((row.count / total) * 100).toFixed(1) : '0.0'
                      return (
                        <TableRow key={i} hover>
                          <TableCell>
                            <Chip label={row.fromPlan} size='small' variant='outlined' />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <i className='ri-arrow-right-line' style={{ color: 'var(--mui-palette-text-disabled)' }} />
                              <Chip label={row.toPlan} size='small' variant='outlined' />
                            </Box>
                          </TableCell>
                          <TableCell align='center'>
                            <Chip label={chip.label} color={chip.color} size='small' />
                          </TableCell>
                          <TableCell align='right'>
                            <Typography variant='body2' fontWeight={700}>{fmtNum(row.count)}</Typography>
                          </TableCell>
                          <TableCell align='right'>
                            <Typography variant='body2' color='text.secondary'>{pct}%</Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </>
      )}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Tab 2 — Custom Summary + Export
// ---------------------------------------------------------------------------

function SummarySkeletons() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Skeleton variant='rounded' height={60} />
      <Grid container spacing={3}>
        {[0, 1, 2, 3].map(i => (
          <Grid key={i} item xs={12} sm={6} md={3}>
            <Card variant='outlined'><CardContent>
              <Skeleton variant='text' width='60%' height={20} />
              <Skeleton variant='text' width='70%' height={44} />
              <Skeleton variant='text' width='45%' height={20} />
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={3}>
        {[0, 1, 2].map(i => (
          <Grid key={i} item xs={12} md={4}>
            <Card variant='outlined'><CardContent>
              <Skeleton variant='text' width='50%' height={20} />
              <Skeleton variant='text' width='60%' height={44} />
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}

function SummaryTab() {
  const range = defaultRange()
  const [start,     setStart]     = useState(range.start)
  const [end,       setEnd]       = useState(range.end)
  const [report,    setReport]    = useState<SummaryReportDto | null>(null)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const load = useCallback((s: string, e: string) => {
    setLoading(true); setError(null)
    getSummaryReport(s, e)
      .then(setReport)
      .catch(() => setError('Failed to load summary report. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(start, end) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleExport() {
    setExporting(true)
    try {
      const url   = buildSummaryExportUrl(start, end)
      const token = getStoredAdminToken() ?? ''
      const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      if (!res.ok) throw new Error()
      const blob  = await res.blob()
      const href  = URL.createObjectURL(blob)
      const a     = document.createElement('a')
      a.href = href; a.download = `tenant-report-${start}_${end}.csv`; a.click()
      URL.revokeObjectURL(href)
    } catch {
      setError('CSV export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const exportBtn = (
    <Tooltip title='Download summary as CSV'>
      <span>
        <Button
          variant='outlined' size='small'
          startIcon={exporting ? <CircularProgress size={14} /> : <i className='ri-download-2-line' />}
          onClick={handleExport}
          disabled={exporting || !report}
        >
          Export CSV
        </Button>
      </span>
    </Tooltip>
  )

  if (loading && !report) return (
    <>
      <DateRangeToolbar start={start} end={end} loading={loading}
        onStartChange={setStart} onEndChange={setEnd}
        onApply={() => load(start, end)} extra={exportBtn} />
      <SummarySkeletons />
    </>
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <DateRangeToolbar start={start} end={end} loading={loading}
        onStartChange={setStart} onEndChange={setEnd}
        onApply={() => load(start, end)} extra={exportBtn} />

      {error && <Alert severity='error'>{error}</Alert>}

      {report && (
        <>
          {/* Acquisition & Revenue */}
          <Box>
            <Typography variant='overline' color='text.secondary' fontWeight={600}>
              Acquisition &amp; Revenue
            </Typography>
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard label='New Tenants' value={fmtNum(report.newTenants)}
                  icon='ri-user-add-line' color='primary'
                  sub={`${start} – ${end}`} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard label='Revenue' value={fmtCurrency(report.revenue)}
                  icon='ri-money-dollar-circle-line' color='success'
                  sub='Paid invoices in period' />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard label='Cancelled Subs' value={fmtNum(report.cancelledSubscriptions)}
                  icon='ri-user-unfollow-line' color='warning'
                  sub='Voluntary cancellations' />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatCard label='Delinquent Churn' value={fmtNum(report.delinquentChurns)}
                  icon='ri-error-warning-line' color='error'
                  sub='Failed-payment churns' />
              </Grid>
            </Grid>
          </Box>

          <Divider />

          {/* Plan movement */}
          <Box>
            <Typography variant='overline' color='text.secondary' fontWeight={600}>
              Plan Movement
            </Typography>
            <Grid container spacing={3} sx={{ mt: 0.5 }}>
              <Grid item xs={12} md={4}>
                <StatCard label='Plan Upgrades' value={fmtNum(report.planUpgrades)}
                  icon='ri-arrow-up-circle-line' color='success'
                  sub='Moved to a higher tier' />
              </Grid>
              <Grid item xs={12} md={4}>
                <StatCard label='Plan Downgrades' value={fmtNum(report.planDowngrades)}
                  icon='ri-arrow-down-circle-line' color='error'
                  sub='Moved to a lower tier' />
              </Grid>
              <Grid item xs={12} md={4}>
                {(() => {
                  const net = report.planUpgrades - report.planDowngrades
                  return (
                    <StatCard
                      label='Net Movement'
                      value={(net >= 0 ? '+' : '') + fmtNum(net)}
                      icon='ri-scales-2-line'
                      color={net >= 0 ? 'success' : 'error'}
                      sub='Upgrades minus downgrades'
                    />
                  )
                })()}
              </Grid>
            </Grid>
          </Box>
        </>
      )}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Tab 3 — Revenue by Plan stacked bar
// ---------------------------------------------------------------------------

const PLAN_COLORS: Record<string, string> = {
  FREE:    '#9E9E9E',
  BASIC:   '#42A5F5',
  PRO:     '#7E57C2',
  STARTER: '#66BB6A',
  GROWTH:  '#FFA726',
}

function planColor(name: string): string {
  return PLAN_COLORS[name.toUpperCase()] ?? '#26A69A'
}

function RevenueByPlanTab() {
  const [data, setData]       = useState<RevenueByPlanDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [months, setMonths]   = useState(12)

  const load = useCallback(async (m = months) => {
    setLoading(true); setError(null)
    try { setData(await getRevenueByPlan(m)) }
    catch { setError('Failed to load revenue data') }
    finally { setLoading(false) }
  }, [months])

  useEffect(() => { load(months) }, [months]) // eslint-disable-line

  if (error) return <Alert severity='error'>{error}</Alert>

  // Build ApexCharts series from flat cell array
  const planNames = data ? [...new Set(data.cells.map(c => c.planName))].sort() : []
  const series = planNames.map(plan => ({
    name: plan,
    data: (data?.months ?? []).map(month => {
      const cell = data?.cells.find(c => c.month === month && c.planName === plan)
      return cell ? Number(cell.revenue) : 0
    }),
  }))

  const chartOptions: ApexOptions = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false } },
    xaxis: { categories: data?.months ?? [] },
    yaxis: {
      labels: {
        formatter: (v: number) => `GHS ${v.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      },
    },
    colors: planNames.map(planColor),
    dataLabels: { enabled: false },
    legend: { position: 'top' },
    tooltip: {
      y: {
        formatter: (v: number) =>
          new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(v),
      },
    },
    fill: { opacity: 1 },
    plotOptions: { bar: { borderRadius: 2 } },
    grid: { borderColor: 'var(--mui-palette-divider)' },
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant='subtitle1' fontWeight={700} sx={{ flex: 1 }}>
          Monthly Revenue by Subscription Plan
        </Typography>
        <TextField
          select
          size='small'
          label='Period'
          value={months}
          onChange={e => setMonths(Number(e.target.value))}
          sx={{ width: 160 }}
          slotProps={{ select: { native: true } }}
        >
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
          <option value={24}>Last 24 months</option>
        </TextField>
      </Box>

      <Card variant='outlined'>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : !data || data.months.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <i className='ri-bar-chart-2-line' style={{ fontSize: '2.5rem', color: 'var(--mui-palette-text-disabled)' }} />
              <Typography color='text.secondary' sx={{ mt: 1 }}>No paid invoice data in the selected period</Typography>
            </Box>
          ) : (
            <AppReactApexCharts type='bar' height={360} options={chartOptions} series={series} />
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Tab 4 — Rental Revenue
// ---------------------------------------------------------------------------

function RentalRevenueTab() {
  const [months, setMonths] = useState(12)
  const [data, setData] = useState<AdminRentalRevenueDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback((m: number) => {
    setLoading(true)
    setError(null)
    getRentalRevenue(m)
      .then(setData)
      .catch(() => setError('Failed to load rental revenue data.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(months) }, [months, load])

  const series = [
    { name: 'Invoiced', data: data?.invoiced ?? [] },
    { name: 'Collected', data: data?.collected ?? [] },
  ]

  const chartOptions: ApexOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    xaxis: { categories: data?.labels ?? [] },
    yaxis: {
      labels: {
        formatter: (v: number) =>
          `GHS ${v.toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      },
    },
    colors: ['#7367f0', '#28c76f'],
    dataLabels: { enabled: false },
    legend: { position: 'top' },
    tooltip: {
      y: {
        formatter: (v: number) =>
          new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(v),
      },
    },
    plotOptions: { bar: { borderRadius: 2, columnWidth: '55%' } },
    grid: { borderColor: 'var(--mui-palette-divider)' },
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant='subtitle1' fontWeight={700} sx={{ flex: 1 }}>
          Rental Revenue — Invoiced vs Collected
        </Typography>
        <TextField
          select size='small' label='Period' value={months}
          onChange={e => setMonths(Number(e.target.value))}
          sx={{ width: 160 }}
          slotProps={{ select: { native: true } }}
        >
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
          <option value={24}>Last 24 months</option>
        </TextField>
      </Box>
      <Card variant='outlined'>
        <CardContent>
          {error ? (
            <Alert severity='error'>{error}</Alert>
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : !data || data.labels.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <i className='ri-bar-chart-line' style={{ fontSize: '2.5rem', color: 'var(--mui-palette-text-disabled)' }} />
              <Typography color='text.secondary' sx={{ mt: 1 }}>No rental invoice data in the selected period</Typography>
            </Box>
          ) : (
            <AppReactApexCharts type='bar' height={360} options={chartOptions} series={series} />
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Tab 5 — Occupancy
// ---------------------------------------------------------------------------

function OccupancyTab() {
  const [data, setData] = useState<AdminOccupancyDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getOccupancyStats()
      .then(setData)
      .catch(() => setError('Failed to load occupancy data.'))
      .finally(() => setLoading(false))
  }, [])

  const vacant = data ? data.totalUnits - data.occupiedUnits : 0

  const chartOptions: ApexOptions = {
    chart: { type: 'donut' },
    labels: ['Occupied', 'Vacant'],
    colors: ['#28c76f', '#ea5455'],
    legend: { position: 'bottom' },
    dataLabels: { enabled: true, formatter: (v: number) => `${v.toFixed(1)}%` },
    tooltip: { y: { formatter: (v: number) => `${v} units` } },
    plotOptions: { pie: { donut: { size: '65%' } } },
  }

  return (
    <Box>
      <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 3 }}>
        Current Occupancy — All Tenants
      </Typography>
      {error ? (
        <Alert severity='error'>{error}</Alert>
      ) : loading ? (
        <Grid container spacing={3}>
          {[0, 1, 2].map(i => (
            <Grid key={i} item xs={12} md={4}>
              <Card variant='outlined'><CardContent>
                <Skeleton variant='text' width='50%' height={20} />
                <Skeleton variant='text' width='70%' height={44} />
              </CardContent></Card>
            </Grid>
          ))}
        </Grid>
      ) : data ? (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <StatCard label='Total Units' value={fmtNum(data.totalUnits)} icon='ri-building-4-line' color='primary' />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard label='Occupied Units' value={fmtNum(data.occupiedUnits)} icon='ri-home-heart-line' color='success'
              sub={`${data.occupancyRate.toFixed(1)}% occupancy rate`} />
          </Grid>
          <Grid item xs={12} md={4}>
            <StatCard label='Vacant Units' value={fmtNum(vacant)} icon='ri-home-line' color='warning'
              sub={`${(100 - data.occupancyRate).toFixed(1)}% vacancy rate`} />
          </Grid>
          {data.totalUnits > 0 && (
            <Grid item xs={12} md={6} sx={{ mx: 'auto' }}>
              <Card variant='outlined'>
                <CardContent>
                  <AppReactApexCharts
                    type='donut'
                    height={320}
                    options={chartOptions}
                    series={[data.occupiedUnits, vacant]}
                  />
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      ) : null}
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Tab 6 — Top Tenants
// ---------------------------------------------------------------------------

function TopTenantsTab() {
  const [months, setMonths] = useState(12)
  const [data, setData] = useState<AdminTopTenantsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback((m: number) => {
    setLoading(true)
    setError(null)
    getTopTenants(m)
      .then(setData)
      .catch(() => setError('Failed to load top tenants data.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load(months) }, [months, load])

  const maxRevenue = data?.items[0]?.revenue ?? 1

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography variant='subtitle1' fontWeight={700} sx={{ flex: 1 }}>
          Top Tenants by Rental Revenue
        </Typography>
        <TextField
          select size='small' label='Period' value={months}
          onChange={e => setMonths(Number(e.target.value))}
          sx={{ width: 160 }}
          slotProps={{ select: { native: true } }}
        >
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
          <option value={24}>Last 24 months</option>
        </TextField>
      </Box>
      {error ? (
        <Alert severity='error'>{error}</Alert>
      ) : loading ? (
        <Card variant='outlined'><CardContent>
          {[0,1,2,3,4].map(i => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Skeleton variant='circular' width={32} height={32} />
              <Skeleton variant='text' width='40%' height={20} />
              <Skeleton variant='text' width='20%' height={20} sx={{ ml: 'auto' }} />
            </Box>
          ))}
        </CardContent></Card>
      ) : !data || data.items.length === 0 ? (
        <Card variant='outlined'><CardContent>
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <i className='ri-trophy-line' style={{ fontSize: '2.5rem', color: 'var(--mui-palette-text-disabled)' }} />
            <Typography color='text.secondary' sx={{ mt: 1 }}>No paid revenue data in the selected period</Typography>
          </Box>
        </CardContent></Card>
      ) : (
        <Card variant='outlined'>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>Tenant</TableCell>
                  <TableCell>Revenue Share</TableCell>
                  <TableCell align='right'>Paid Revenue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((item, idx) => {
                  const barPct = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
                  return (
                    <TableRow key={item.tenantId} hover>
                      <TableCell>
                        <Box sx={{
                          width: 28, height: 28, borderRadius: '50%',
                          bgcolor: idx === 0 ? 'warning.main' : idx === 1 ? 'text.secondary' : idx === 2 ? 'warning.light' : 'action.hover',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Typography variant='caption' fontWeight={700} color={idx < 3 ? '#fff' : 'text.secondary'}>
                            {idx + 1}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body2' fontWeight={600}>{item.tenantName}</Typography>
                        <Typography variant='caption' color='text.secondary'>{item.tenantId}</Typography>
                      </TableCell>
                      <TableCell sx={{ width: '35%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{
                            flex: 1, height: 8, borderRadius: 1,
                            bgcolor: 'action.hover', overflow: 'hidden',
                          }}>
                            <Box sx={{
                              width: `${barPct}%`, height: '100%',
                              bgcolor: 'primary.main', borderRadius: 1,
                            }} />
                          </Box>
                          <Typography variant='caption' color='text.secondary' sx={{ minWidth: 40, textAlign: 'right' }}>
                            {barPct.toFixed(0)}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' fontWeight={600}>
                          {fmtCurrency(item.revenue)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}
    </Box>
  )
}

export default function AdminReportsView() {
  const [tab, setTab] = useState(0)

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant='h5' fontWeight={700}>Analytics &amp; Reports</Typography>
        <Typography variant='body2' color='text.secondary'>
          Tenant funnel analysis, plan movement tracking, and custom date range reports.
        </Typography>
      </Box>

      {/* Tab bar */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label='Tenant Funnel'       icon={<i className='ri-filter-3-line'             style={{ fontSize: '1rem' }} />} iconPosition='start' />
          <Tab label='Plan Changes'        icon={<i className='ri-exchange-line'              style={{ fontSize: '1rem' }} />} iconPosition='start' />
          <Tab label='Custom Summary'      icon={<i className='ri-file-chart-line'            style={{ fontSize: '1rem' }} />} iconPosition='start' />
          <Tab label='Revenue by Plan'     icon={<i className='ri-bar-chart-2-line'           style={{ fontSize: '1rem' }} />} iconPosition='start' />
          <Tab label='Rental Revenue'      icon={<i className='ri-money-dollar-circle-line'   style={{ fontSize: '1rem' }} />} iconPosition='start' />
          <Tab label='Occupancy'           icon={<i className='ri-building-4-line'            style={{ fontSize: '1rem' }} />} iconPosition='start' />
          <Tab label='Top Tenants'         icon={<i className='ri-trophy-line'                style={{ fontSize: '1rem' }} />} iconPosition='start' />
        </Tabs>
      </Box>

      {tab === 0 && <FunnelTab />}
      {tab === 1 && <PlanChangesTab />}
      {tab === 2 && <SummaryTab />}
      {tab === 3 && <RevenueByPlanTab />}
      {tab === 4 && <RentalRevenueTab />}
      {tab === 5 && <OccupancyTab />}
      {tab === 6 && <TopTenantsTab />}
    </Box>
  )
}
