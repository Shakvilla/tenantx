'use client'

import { useEffect, useState, useCallback } from 'react'

import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Skeleton from '@mui/material/Skeleton'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import Alert from '@mui/material/Alert'

import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'

const AppReactApexCharts = dynamic(() => import('@/libs/styles/AppReactApexCharts'))

import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { getAdminKpis, type AdminKpiDto, type MonthlyDataPoint, type PlanDistributionPoint, type GrowthHistoryPoint } from '@/lib/api/admin-auth-client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function momDelta(current: number, previous: number): { pct: number; direction: 'up' | 'down' | 'flat' } {
  if (previous === 0) return { pct: 0, direction: 'flat' }
  const pct = ((current - previous) / previous) * 100
  return { pct: Math.abs(pct), direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' }
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  label: string
  value: string | number
  icon: string
  color: 'primary' | 'success' | 'warning' | 'error' | 'info'
  loading?: boolean
  /** Optional MoM trend — positive means good */
  trend?: { pct: number; direction: 'up' | 'down' | 'flat'; positiveIsUp?: boolean }
  /** Optional sub-label below value */
  subLabel?: string
  alert?: boolean
}

function KpiCard({ label, value, icon, color, loading, trend, subLabel, alert }: KpiCardProps) {
  const trendColor = trend
    ? trend.direction === 'flat'
      ? 'text.secondary'
      : (trend.positiveIsUp !== false ? trend.direction === 'up' : trend.direction === 'down')
        ? 'success.main'
        : 'error.main'
    : undefined

  const trendIcon = trend?.direction === 'up'
    ? 'ri-arrow-up-line'
    : trend?.direction === 'down'
    ? 'ri-arrow-down-line'
    : 'ri-minus-line'

  return (
    <Card variant='outlined' sx={{ height: '100%', borderColor: alert ? 'error.light' : 'divider' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant='body2' color='text.secondary' fontWeight={500}>
            {label}
          </Typography>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              bgcolor: `${color}.main`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i className={icon} style={{ fontSize: '1.3rem', color: '#fff' }} />
          </Box>
        </Box>

        {loading ? (
          <>
            <Skeleton variant='text' width='70%' height={44} />
            <Skeleton variant='text' width='40%' height={20} />
          </>
        ) : (
          <>
            <Typography variant='h4' fontWeight={800} lineHeight={1.1} sx={{ mb: 0.5 }}>
              {value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {trend && trend.direction !== 'flat' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <i className={trendIcon} style={{ fontSize: '0.85rem', color: trendColor as string }} />
                  <Typography variant='caption' sx={{ color: trendColor, fontWeight: 600 }}>
                    {trend.pct.toFixed(1)}% vs last month
                  </Typography>
                </Box>
              )}
              {subLabel && (
                <Typography variant='caption' color='text.secondary'>
                  {subLabel}
                </Typography>
              )}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// ARR card with sparkline
// ---------------------------------------------------------------------------

interface ArrCardProps {
  arrCurrentYear: number
  arrPreviousYear: number
  mrrLast12Months: MonthlyDataPoint[]
  loading?: boolean
}

function ArrCard({ arrCurrentYear, arrPreviousYear, mrrLast12Months, loading }: ArrCardProps) {
  const delta = momDelta(arrCurrentYear, arrPreviousYear)
  const trendColor = delta.direction === 'flat'
    ? 'text.secondary'
    : delta.direction === 'up' ? 'success.main' : 'error.main'
  const trendIcon = delta.direction === 'up' ? 'ri-arrow-up-line'
    : delta.direction === 'down' ? 'ri-arrow-down-line' : 'ri-minus-line'

  const primaryColor = 'var(--mui-palette-primary-main)'

  const sparklineOptions: ApexOptions = {
    chart: {
      type: 'area',
      sparkline: { enabled: true },
      animations: { enabled: false },
      toolbar: { show: false },
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0, stops: [0, 100] },
    },
    colors: [primaryColor],
    tooltip: {
      fixed: { enabled: false },
      x: { show: true, formatter: (_: number, { dataPointIndex }: { dataPointIndex: number }) =>
        mrrLast12Months[dataPointIndex]?.month ?? ''
      },
      y: { formatter: (val: number) => formatCurrency(val) },
      marker: { show: false },
    },
  }

  const sparklineSeries = [{ data: mrrLast12Months.map(p => Number(p.mrr)) }]

  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant='body2' color='text.secondary' fontWeight={500}>
            Annual Recurring Revenue
          </Typography>
          <Box
            sx={{
              width: 44, height: 44, borderRadius: 2,
              bgcolor: 'primary.main',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <i className='ri-line-chart-line' style={{ fontSize: '1.3rem', color: '#fff' }} />
          </Box>
        </Box>

        {loading ? (
          <>
            <Skeleton variant='text' width='70%' height={44} />
            <Skeleton variant='text' width='40%' height={20} />
            <Skeleton variant='rectangular' height={52} sx={{ mt: 1, borderRadius: 1 }} />
          </>
        ) : (
          <>
            <Typography variant='h4' fontWeight={800} lineHeight={1.1} sx={{ mb: 0.5 }}>
              {formatCurrency(arrCurrentYear)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, mb: 1.5, flexWrap: 'wrap' }}>
              {delta.direction !== 'flat' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                  <i className={trendIcon} style={{ fontSize: '0.85rem', color: trendColor as string }} />
                  <Typography variant='caption' sx={{ color: trendColor, fontWeight: 600 }}>
                    {delta.pct.toFixed(1)}% vs last month
                  </Typography>
                </Box>
              )}
              <Typography variant='caption' color='text.secondary'>
                MRR × 12
              </Typography>
            </Box>

            {/* Sparkline — last 12 months of MRR */}
            {sparklineSeries[0].data.length > 0 && (
              <AppReactApexCharts
                type='area'
                height={52}
                options={sparklineOptions}
                series={sparklineSeries}
                boxProps={{ sx: { mx: -1 } }}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// MRR Growth Chart
// ---------------------------------------------------------------------------

interface MrrGrowthChartProps {
  data: MonthlyDataPoint[]
  loading?: boolean
}

function MrrGrowthChart({ data, loading }: MrrGrowthChartProps) {
  const primaryColor = 'var(--mui-palette-primary-main)'

  const chartOptions: ApexOptions = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 400 },
      parentHeightOffset: 0,
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.02, stops: [0, 100] },
    },
    colors: [primaryColor],
    grid: {
      strokeDashArray: 4,
      borderColor: 'var(--mui-palette-divider)',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: -8, left: 0, right: 0, bottom: 0 },
    },
    xaxis: {
      categories: data.map(p => p.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          fontSize: '12px',
          colors: 'var(--mui-palette-text-secondary)',
          fontFamily: 'inherit',
        },
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => {
          if (val >= 1_000_000) return `GHS ${(val / 1_000_000).toFixed(1)}M`
          if (val >= 1_000) return `GHS ${(val / 1_000).toFixed(0)}K`
          return `GHS ${val.toFixed(0)}`
        },
        style: {
          fontSize: '12px',
          colors: ['var(--mui-palette-text-secondary)'],
          fontFamily: 'inherit',
        },
      },
    },
    tooltip: {
      theme: 'light',
      x: { show: true },
      y: {
        formatter: (val: number) => formatCurrency(val),
        title: { formatter: () => 'MRR' },
      },
    },
    markers: {
      size: 0,
      hover: { size: 5 },
    },
  }

  const series = [{ name: 'MRR', data: data.map(p => Number(p.mrr)) }]

  return (
    <Card variant='outlined'>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant='subtitle1' fontWeight={700}>MRR Growth</Typography>
            <Typography variant='caption' color='text.secondary'>Monthly recurring revenue — trailing 12 months</Typography>
          </Box>
          <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className='ri-line-chart-line' style={{ color: 'var(--mui-palette-primary-main)', fontSize: '1.1rem' }} />
          </Box>
        </Box>

        {loading ? (
          <Skeleton variant='rectangular' height={220} sx={{ borderRadius: 1 }} />
        ) : data.length === 0 ? (
          <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant='body2' color='text.disabled'>No revenue data yet</Typography>
          </Box>
        ) : (
          <AppReactApexCharts
            type='area'
            height={220}
            options={chartOptions}
            series={series}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Plan Distribution Donut
// ---------------------------------------------------------------------------

const PLAN_COLORS: Record<string, string> = {
  FREE: 'var(--mui-palette-info-main)',
  BASIC: 'var(--mui-palette-warning-main)',
  PRO: 'var(--mui-palette-primary-main)',
}

const PLAN_ORDER = ['FREE', 'BASIC', 'PRO']

interface PlanDistributionDonutProps {
  data: PlanDistributionPoint[]
  loading?: boolean
}

function PlanDistributionDonut({ data, loading }: PlanDistributionDonutProps) {
  // Sort consistently: FREE → BASIC → PRO
  const sorted = [...data].sort(
    (a, b) => PLAN_ORDER.indexOf(a.planName) - PLAN_ORDER.indexOf(b.planName)
  )

  const labels = sorted.map(p => p.planName)
  const values = sorted.map(p => p.count)
  const colors = sorted.map(p => PLAN_COLORS[p.planName] ?? 'var(--mui-palette-grey-500)')
  const total = values.reduce((sum, v) => sum + v, 0)

  const chartOptions: ApexOptions = {
    chart: {
      type: 'donut',
      toolbar: { show: false },
      animations: { enabled: true, speed: 400 },
    },
    labels,
    colors,
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
      style: { fontSize: '12px', fontFamily: 'inherit', fontWeight: 600 },
      dropShadow: { enabled: false },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Active',
              fontSize: '13px',
              fontFamily: 'inherit',
              color: 'var(--mui-palette-text-secondary)',
              formatter: () => String(total),
            },
            value: {
              fontSize: '20px',
              fontFamily: 'inherit',
              fontWeight: 700,
              color: 'var(--mui-palette-text-primary)',
            },
          },
        },
      },
    },
    stroke: { width: 0 },
    tooltip: {
      y: { formatter: (val: number) => `${val} subscriber${val !== 1 ? 's' : ''}` },
    },
  }

  return (
    <Card variant='outlined' sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant='subtitle1' fontWeight={700}>Plan Distribution</Typography>
            <Typography variant='caption' color='text.secondary'>Active subscribers by plan</Typography>
          </Box>
          <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'primary.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className='ri-pie-chart-2-line' style={{ color: 'var(--mui-palette-primary-main)', fontSize: '1.1rem' }} />
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Skeleton variant='circular' width={180} height={180} />
          </Box>
        ) : total === 0 ? (
          <Box sx={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant='body2' color='text.disabled'>No active subscribers</Typography>
          </Box>
        ) : (
          <>
            <AppReactApexCharts type='donut' height={200} options={chartOptions} series={values} />
            {/* Custom legend */}
            <Box sx={{ mt: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {sorted.map(p => {
                const pct = total > 0 ? ((p.count / total) * 100).toFixed(1) : '0.0'
                return (
                  <Box key={p.planName} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PLAN_COLORS[p.planName] ?? 'grey.500', flexShrink: 0 }} />
                      <Typography variant='body2' color='text.secondary'>{p.planName}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='body2' fontWeight={600}>{p.count}</Typography>
                      <Typography variant='caption' color='text.disabled'>({pct}%)</Typography>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// New Tenants vs. Churn grouped bar chart
// ---------------------------------------------------------------------------

interface NewVsChurnChartProps {
  data: GrowthHistoryPoint[]
  loading?: boolean
}

function NewVsChurnChart({ data, loading }: NewVsChurnChartProps) {
  const chartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true, speed: 400 },
      parentHeightOffset: 0,
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 3,
        borderRadiusApplication: 'end',
        grouped: true,
      },
    },
    dataLabels: { enabled: false },
    colors: [
      'var(--mui-palette-success-main)',
      'var(--mui-palette-error-main)',
    ],
    grid: {
      strokeDashArray: 4,
      borderColor: 'var(--mui-palette-divider)',
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: -8, left: 0, right: 0, bottom: 0 },
    },
    xaxis: {
      categories: data.map(p => p.month),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          fontSize: '12px',
          colors: 'var(--mui-palette-text-secondary)',
          fontFamily: 'inherit',
        },
      },
    },
    yaxis: {
      allowDecimals: false,
      labels: {
        formatter: (val: number) => String(Math.round(val)),
        style: {
          fontSize: '12px',
          colors: ['var(--mui-palette-text-secondary)'],
          fontFamily: 'inherit',
        },
      },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '13px',
      fontFamily: 'inherit',
      markers: { size: 8, shape: 'circle' as 'circle' },
      labels: { colors: 'var(--mui-palette-text-primary)' },
    },
    tooltip: {
      theme: 'light',
      shared: true,
      intersect: false,
      y: { formatter: (val: number) => `${val} tenant${val !== 1 ? 's' : ''}` },
    },
  }

  const series = [
    { name: 'New Sign-ups', data: data.map(p => p.newTenants) },
    { name: 'Churned',      data: data.map(p => p.churned) },
  ]

  return (
    <Card variant='outlined'>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant='subtitle1' fontWeight={700}>New Tenants vs. Churn</Typography>
            <Typography variant='caption' color='text.secondary'>Monthly sign-ups and churn — trailing 12 months</Typography>
          </Box>
          <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: 'success.lighter', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className='ri-bar-chart-grouped-line' style={{ color: 'var(--mui-palette-success-main)', fontSize: '1.1rem' }} />
          </Box>
        </Box>

        {loading ? (
          <Skeleton variant='rectangular' height={220} sx={{ borderRadius: 1 }} />
        ) : data.length === 0 ? (
          <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant='body2' color='text.disabled'>No data yet</Typography>
          </Box>
        ) : (
          <AppReactApexCharts
            type='bar'
            height={220}
            options={chartOptions}
            series={series}
          />
        )}
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Section divider with label
// ---------------------------------------------------------------------------

function SectionLabel({ label }: { label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, mt: 1 }}>
      <Typography variant='overline' color='text.secondary' fontWeight={700} letterSpacing={1.2}>
        {label}
      </Typography>
      <Divider sx={{ flex: 1 }} />
    </Box>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function AdminDashboardView() {
  const { adminUser } = useAdminAuth()

  const [kpis, setKpis]       = useState<AdminKpiDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetchKpis = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAdminKpis()
      setKpis(data)
    } catch {
      setError('Failed to load KPI data. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchKpis() }, [fetchKpis])

  // ── Derived trends ─────────────────────────────────────────────────────────
  const mrrTrend     = kpis ? momDelta(kpis.mrrCurrentMonth, kpis.mrrPreviousMonth) : null
  const signupsTrend = kpis ? momDelta(kpis.newSignUpsThisMonth, kpis.newSignUpsPreviousMonth) : null

  const now = new Date()
  const monthLabel = now.toLocaleString('en-GH', { month: 'long', year: 'numeric' })

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant='h5' fontWeight={700}>
            Welcome back, {adminUser?.fullName?.split(' ')[0] ?? 'Admin'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Platform overview · {monthLabel}
          </Typography>
        </Box>
        <Tooltip title='Refresh KPIs'>
          <span>
            <Button
              variant='outlined'
              size='small'
              onClick={fetchKpis}
              disabled={loading}
              startIcon={<i className='ri-refresh-line' />}
            >
              Refresh
            </Button>
          </span>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 3 }} action={
          <Button size='small' color='inherit' onClick={fetchKpis}>Retry</Button>
        }>
          {error}
        </Alert>
      )}

      {/* ── Revenue ──────────────────────────────────────────────────────────── */}
      <SectionLabel label='Revenue' />
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label='Monthly Recurring Revenue'
            value={kpis ? formatCurrency(kpis.mrrCurrentMonth) : '—'}
            icon='ri-money-dollar-circle-line'
            color='success'
            loading={loading}
            trend={mrrTrend ? { ...mrrTrend, positiveIsUp: true } : undefined}
            subLabel={`Paid invoices — ${monthLabel}`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ArrCard
            arrCurrentYear={kpis?.arrCurrentYear ?? 0}
            arrPreviousYear={kpis?.arrPreviousYear ?? 0}
            mrrLast12Months={kpis?.mrrLast12Months ?? []}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label='Outstanding Invoices'
            value={kpis ? formatCurrency(kpis.outstandingInvoicesAmount) : '—'}
            icon='ri-file-list-3-line'
            color='warning'
            loading={loading}
            subLabel='PENDING + FAILED across all tenants'
            alert={kpis ? kpis.outstandingInvoicesAmount > 0 : false}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label='Collection Rate'
            value={kpis ? `${kpis.collectionRateThisMonth.toFixed(1)}%` : '—'}
            icon='ri-percent-line'
            color={kpis && kpis.collectionRateThisMonth >= 80 ? 'success' : kpis && kpis.collectionRateThisMonth >= 50 ? 'warning' : 'error'}
            loading={loading}
            subLabel={`Invoices paid this month`}
          />
        </Grid>
      </Grid>

      {/* ── Tenants ──────────────────────────────────────────────────────────── */}
      <SectionLabel label='Tenants' />
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label='Active Subscribers'
            value={kpis?.activeTenants ?? '—'}
            icon='ri-building-2-line'
            color='primary'
            loading={loading}
            subLabel='Subscription status: ACTIVE'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label='Total Tenants'
            value={kpis?.totalTenants ?? '—'}
            icon='ri-group-line'
            color='info'
            loading={loading}
            subLabel='All registered accounts'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label='New Sign-ups'
            value={kpis?.newSignUpsThisMonth ?? '—'}
            icon='ri-user-add-line'
            color='success'
            loading={loading}
            trend={signupsTrend ? { ...signupsTrend, positiveIsUp: true } : undefined}
            subLabel='Registered this month'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label='Churn Rate'
            value={kpis ? `${kpis.churnRateThisMonth.toFixed(1)}%` : '—'}
            icon='ri-user-unfollow-line'
            color={kpis && kpis.churnRateThisMonth === 0 ? 'success' : kpis && kpis.churnRateThisMonth <= 5 ? 'warning' : 'error'}
            loading={loading}
            subLabel={kpis ? `${kpis.churnedThisMonth} cancelled or delinquent` : 'This month'}
            alert={kpis ? kpis.churnRateThisMonth > 5 : false}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard
            label='Failed Payments (7d)'
            value={kpis?.failedPaymentsLast7Days ?? '—'}
            icon='ri-error-warning-line'
            color='error'
            loading={loading}
            subLabel='Invoices with status FAILED'
            alert={kpis ? kpis.failedPaymentsLast7Days > 0 : false}
          />
        </Grid>
      </Grid>

      {/* ── MRR Growth Chart + Plan Distribution ─────────────────────────────── */}
      <Grid container spacing={3} sx={{ mb: 4 }} alignItems='stretch'>
        <Grid item xs={12} md={8}>
          <MrrGrowthChart data={kpis?.mrrLast12Months ?? []} loading={loading} />
        </Grid>
        <Grid item xs={12} md={4}>
          <PlanDistributionDonut data={kpis?.planDistribution ?? []} loading={loading} />
        </Grid>
      </Grid>

      {/* ── New Tenants vs. Churn ─────────────────────────────────────────────── */}
      <Box sx={{ mb: 4 }}>
        <NewVsChurnChart data={kpis?.growthHistory12Months ?? []} loading={loading} />
      </Box>

      {/* ── Quick links ───────────────────────────────────────────────────────── */}
      <SectionLabel label='Quick Actions' />
      <Grid container spacing={2}>
        {[
          { label: 'View All Tenants',        icon: 'ri-building-2-line',    href: '/admin/tenants' },
          { label: 'Subscription Plans',      icon: 'ri-price-tag-3-line',   href: '/admin/subscriptions' },
          { label: 'System Admins',           icon: 'ri-shield-user-line',   href: '/admin/admins' },
        ].map(link => (
          <Grid item xs={12} sm={4} key={link.href}>
            <Card
              variant='outlined'
              component='a'
              href={link.href}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                px: 2,
                py: 1.5,
                textDecoration: 'none',
                color: 'text.primary',
                cursor: 'pointer',
                transition: 'border-color 0.15s, box-shadow 0.15s',
                '&:hover': {
                  borderColor: 'primary.main',
                  boxShadow: 1,
                },
              }}
            >
              <i className={link.icon} style={{ fontSize: '1.3rem', opacity: 0.7 }} />
              <Typography variant='body2' fontWeight={500}>{link.label}</Typography>
              <i className='ri-arrow-right-s-line' style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* ── Admin role summary ────────────────────────────────────────────────── */}
      {adminUser && (
        <Card variant='outlined' sx={{ mt: 3 }}>
          <CardContent sx={{ py: '12px !important' }}>
            <Typography variant='caption' color='text.secondary' fontWeight={600} textTransform='uppercase' letterSpacing={1}>
              Your Access
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mt: 1 }}>
              {adminUser.roles.map(role => (
                <Chip key={role} label={role} size='small' color='primary' variant='tonal' />
              ))}
              {adminUser.permissions.map(perm => (
                <Chip key={perm} label={perm} size='small' variant='outlined' sx={{ fontSize: '0.7rem' }} />
              ))}
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  )
}
