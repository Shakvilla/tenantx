'use client'

import { useState, useEffect, useCallback } from 'react'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import LinearProgress from '@mui/material/LinearProgress'
import Grid from '@mui/material/Grid'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableBody from '@mui/material/TableBody'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import Skeleton from '@mui/material/Skeleton'
import InputAdornment from '@mui/material/InputAdornment'

import { useSubscription } from '@/contexts/SubscriptionContext'
import {
  getAvailablePlans,
  initiateUpgrade,
  scheduleDowngrade,
  cancelSubscription,
  getMyInvoices,
  retryMyInvoice,
  type SubscriptionPlanPublicDto,
  type SubscriptionInvoiceDto,
} from '@/lib/api/subscription-client'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLAN_ORDER: Record<string, number> = { FREE: 0, BASIC: 1, PRO: 2 }
const PLAN_COLOR: Record<string, 'default' | 'primary' | 'success'> = {
  FREE: 'default', BASIC: 'primary', PRO: 'success',
}

function formatGHS(amount: number) {
  return 'GH₵ ' + Number(amount).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusChipColor(status: string): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'PAID') return 'success'
  if (status === 'PENDING') return 'warning'
  if (status === 'FAILED') return 'error'
  return 'default'
}

// ---------------------------------------------------------------------------
// Current plan card
// ---------------------------------------------------------------------------

function CurrentPlanCard() {
  const { subscription, isLoading, refresh } = useSubscription()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    setCancelling(true)
    setError(null)
    try {
      await cancelSubscription()
      await refresh()
      setCancelOpen(false)
    } catch {
      setError('Failed to cancel. Please try again.')
    } finally {
      setCancelling(false)
    }
  }

  if (isLoading || !subscription) {
    return (
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Skeleton width='40%' height={32} />
          <Skeleton width='60%' height={20} sx={{ mt: 1 }} />
          <Skeleton variant='rectangular' height={8} sx={{ mt: 2, borderRadius: 1 }} />
        </CardContent>
      </Card>
    )
  }

  const { plan, displayName, status, unitCount, unitCap, pricePerUnit, transactionFeePct, currentPeriodEnd, pendingDowngradePlan } = subscription
  const isFree = plan === 'FREE'
  const unitProgress = unitCap ? Math.min((unitCount / unitCap) * 100, 100) : 0
  const atCap = unitCap !== null && unitCount >= unitCap

  return (
    <>
      <Card variant='outlined' sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography variant='h6' fontWeight={700}>Current Plan</Typography>
                <Chip label={displayName} color={PLAN_COLOR[plan] ?? 'default'} size='small' />
                <Chip
                  label={status}
                  size='small'
                  color={status === 'ACTIVE' ? 'success' : status === 'PAST_DUE' ? 'error' : 'default'}
                  variant='outlined'
                />
              </Box>
              {!isFree && pricePerUnit > 0 && (
                <Typography variant='body2' color='text.secondary'>
                  {formatGHS(pricePerUnit)} / unit / month
                  {currentPeriodEnd && ' · renews ' + formatDate(currentPeriodEnd)}
                </Typography>
              )}
              {transactionFeePct != null && (
                <Typography variant='caption' color='text.secondary'>
                  {(Number(transactionFeePct) * 100).toFixed(1)}% transaction fee on collected rent
                </Typography>
              )}
            </Box>
            {!isFree && !pendingDowngradePlan && (
              <Button size='small' color='error' variant='outlined' onClick={() => setCancelOpen(true)}>
                Cancel plan
              </Button>
            )}
          </Box>

          {pendingDowngradePlan && (
            <Alert severity='info' sx={{ mb: 2 }} icon={<i className='ri-information-line' />}>
              Your plan will switch to <strong>{pendingDowngradePlan}</strong> at end of billing period
              {currentPeriodEnd && ' (' + formatDate(currentPeriodEnd) + ')'}. Full access retained until then.
            </Alert>
          )}

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant='caption' color='text.secondary'>Units used</Typography>
              <Typography variant='caption' fontWeight={600} color={atCap ? 'error.main' : 'text.primary'}>
                {unitCount} / {unitCap !== null ? unitCap : '∞'}
              </Typography>
            </Box>
            {unitCap !== null && (
              <LinearProgress
                variant='determinate'
                value={unitProgress}
                color={atCap ? 'error' : unitProgress > 80 ? 'warning' : 'primary'}
                sx={{ height: 8, borderRadius: 4 }}
              />
            )}
            {atCap && (
              <Typography variant='caption' color='error.main' sx={{ mt: 0.5, display: 'block' }}>
                Unit limit reached. Upgrade to add more units.
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth='xs' fullWidth>
        <DialogTitle>Cancel subscription?</DialogTitle>
        <DialogContent>
          {error && <Alert severity='error' sx={{ mb: 2 }}>{error}</Alert>}
          <DialogContentText>
            Your {displayName} plan remains active until {formatDate(currentPeriodEnd)}. After that your account switches to Free. No data will be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelOpen(false)} disabled={cancelling}>Keep plan</Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleCancel}
            disabled={cancelling}
            startIcon={cancelling ? <CircularProgress size={14} /> : undefined}
          >
            {cancelling ? 'Cancelling…' : 'Yes, cancel'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

// ---------------------------------------------------------------------------
// Upgrade dialog
// ---------------------------------------------------------------------------

interface UpgradeDialogProps {
  plan: SubscriptionPlanPublicDto | null
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function UpgradeDialog({ plan, open, onClose, onSuccess }: UpgradeDialogProps) {
  const { subscription } = useSubscription()
  const [mobileNumber, setMobileNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pending || !plan) return
    const interval = setInterval(async () => {
      try {
        const { getMySubscription } = await import('@/lib/api/subscription-client')
        const sub = await getMySubscription()
        if (sub.plan === plan.name) {
          clearInterval(interval)
          setPending(false)
          onSuccess()
          onClose()
        }
      } catch { /* keep polling */ }
    }, 5000)
    return () => clearInterval(interval)
  }, [pending, plan, onSuccess, onClose])

  async function handlePay() {
    if (!plan || !mobileNumber.trim()) return
    setLoading(true)
    setError(null)
    try {
      await initiateUpgrade({ targetPlan: plan.name, mobileNumber: mobileNumber.trim() })
      setPending(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Payment initiation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!plan) return null

  const unitCount = subscription?.unitCount ?? 1
  const monthlyCost = unitCount * plan.pricePerUnit

  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Upgrade to {plan.displayName}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {error && <Alert severity='error'>{error}</Alert>}

        {pending ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant='body1' fontWeight={600}>Payment prompt sent to your phone</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Approve the payment of <strong>{formatGHS(monthlyCost)}</strong> in your mobile money app.
              This page updates automatically once confirmed.
            </Typography>
          </Box>
        ) : (
          <>
            <Card variant='outlined'>
              <CardContent sx={{ py: '12px !important' }}>
                {[
                  ['Plan', plan.displayName],
                  ['Units', String(unitCount)],
                  ['Rate', formatGHS(plan.pricePerUnit) + ' / unit / mo'],
                  ...(plan.transactionFeePct ? [['Transaction fee', (Number(plan.transactionFeePct) * 100).toFixed(1) + '% on collected rent']] : []),
                ].map(([label, value]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant='body2' color='text.secondary'>{label}</Typography>
                    <Typography variant='body2'>{value}</Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' fontWeight={700}>Due today</Typography>
                  <Typography variant='body2' fontWeight={700} color='primary.main'>{formatGHS(monthlyCost)}</Typography>
                </Box>
              </CardContent>
            </Card>

            <TextField
              label='Mobile Money Number'
              placeholder='e.g. 0241234567'
              value={mobileNumber}
              onChange={e => setMobileNumber(e.target.value)}
              fullWidth
              size='small'
              helperText='A payment prompt will be sent to this number'
              slotProps={{ input: { startAdornment: <InputAdornment position='start'>+233</InputAdornment> } }}
            />
          </>
        )}
      </DialogContent>
      {!pending && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handlePay}
            disabled={loading || !mobileNumber.trim()}
            startIcon={loading ? <CircularProgress size={14} /> : <i className='ri-secure-payment-line' />}
          >
            {loading ? 'Initiating…' : 'Pay ' + formatGHS(monthlyCost)}
          </Button>
        </DialogActions>
      )}
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Plan comparison card
// ---------------------------------------------------------------------------

function PlanCard({
  plan,
  currentPlanName,
  onUpgrade,
  onDowngrade,
}: {
  plan: SubscriptionPlanPublicDto
  currentPlanName: string
  onUpgrade: (p: SubscriptionPlanPublicDto) => void
  onDowngrade: (p: SubscriptionPlanPublicDto) => void
}) {
  const isCurrent = plan.name === currentPlanName
  const isHigher  = PLAN_ORDER[plan.name] > PLAN_ORDER[currentPlanName]
  const isLower   = PLAN_ORDER[plan.name] < PLAN_ORDER[currentPlanName]
  const isPro     = plan.name === 'PRO'

  return (
    <Card
      variant='outlined'
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        borderColor: isCurrent ? 'primary.main' : isPro ? 'success.main' : 'divider',
        borderWidth: isCurrent || isPro ? 2 : 1,
      }}
    >
      {isPro && !isCurrent && (
        <Box sx={{ position: 'absolute', top: -1, right: 16 }}>
          <Chip label='Recommended' size='small' color='success' sx={{ borderRadius: '0 0 6px 6px', height: 22, fontSize: '0.7rem' }} />
        </Box>
      )}
      {isCurrent && (
        <Box sx={{ position: 'absolute', top: -1, left: 16 }}>
          <Chip label='Current plan' size='small' color='primary' sx={{ borderRadius: '0 0 6px 6px', height: 22, fontSize: '0.7rem' }} />
        </Box>
      )}

      <CardContent sx={{ flex: 1 }}>
        <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 1, mt: isCurrent || isPro ? 1.5 : 0 }}>
          {plan.displayName}
        </Typography>

        <Box sx={{ mb: 2 }}>
          {plan.pricePerUnit === 0 ? (
            <Typography variant='h4' fontWeight={800}>Free</Typography>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
              <Typography variant='caption' color='text.secondary' sx={{ alignSelf: 'flex-start', mt: 1 }}>GH₵</Typography>
              <Typography variant='h4' fontWeight={800}>{plan.pricePerUnit}</Typography>
              <Typography variant='caption' color='text.secondary'>/unit/mo</Typography>
            </Box>
          )}
          {plan.freeUnitCap && (
            <Typography variant='caption' color='text.secondary'>Up to {plan.freeUnitCap} units</Typography>
          )}
          {plan.transactionFeePct != null && (
            <Typography variant='caption' color='text.secondary'>
              {(Number(plan.transactionFeePct) * 100).toFixed(1)}% transaction fee on collected rent
            </Typography>
          )}
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {Object.entries(plan.features)
            .sort(([, a], [, b]) => a.label.localeCompare(b.label))
            .map(([key, info]) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <i
                  className={info.enabled ? 'ri-check-line' : 'ri-close-line'}
                  style={{
                    fontSize: '1rem',
                    color: info.enabled ? 'var(--mui-palette-success-main)' : 'var(--mui-palette-text-disabled)',
                    flexShrink: 0,
                  }}
                />
                <Typography variant='body2' color={info.enabled ? 'text.primary' : 'text.disabled'}>
                  {info.label}
                </Typography>
              </Box>
            ))}
        </Box>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
        {isCurrent ? (
          <Button fullWidth disabled variant='outlined'>Current plan</Button>
        ) : isHigher ? (
          <Button fullWidth variant='contained' onClick={() => onUpgrade(plan)}
            startIcon={<i className='ri-arrow-up-circle-line' />}>
            Upgrade to {plan.displayName}
          </Button>
        ) : isLower ? (
          <Button fullWidth variant='outlined' color='inherit' onClick={() => onDowngrade(plan)}>
            Downgrade to {plan.displayName}
          </Button>
        ) : null}
      </CardActions>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Invoice table
// ---------------------------------------------------------------------------

function InvoiceTable() {
  const [invoices, setInvoices]     = useState<SubscriptionInvoiceDto[]>([])
  const [loading, setLoading]       = useState(true)
  const [retrying, setRetrying]     = useState<string | null>(null)
  const [retryError, setRetryError] = useState<string | null>(null)

  const fetchInvoices = useCallback(() => {
    setLoading(true)
    getMyInvoices().then(data => setInvoices(Array.isArray(data) ? data : [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  async function handleRetry(invoiceId: string) {
    setRetrying(invoiceId)
    setRetryError(null)
    try {
      await retryMyInvoice(invoiceId)
      fetchInvoices()
    } catch {
      setRetryError('Retry failed. Please try again.')
    } finally {
      setRetrying(null)
    }
  }

  const hasFailedInvoice = invoices.some(inv => inv.status === 'FAILED')

  if (loading) return <Skeleton variant='rectangular' height={120} sx={{ borderRadius: 1 }} />
  if (invoices.length === 0) return (
    <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>No billing history yet.</Typography>
  )

  return (
    <>
      {retryError && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setRetryError(null)}>{retryError}</Alert>
      )}
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Period</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align='right'>Units</TableCell>
            <TableCell align='right'>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            {hasFailedInvoice && <TableCell />}
          </TableRow>
        </TableHead>
        <TableBody>
          {invoices.map(inv => (
            <TableRow key={inv.id} hover>
              <TableCell>
                <Typography variant='caption'>{formatDate(inv.periodStart)} – {formatDate(inv.periodEnd)}</Typography>
              </TableCell>
              <TableCell><Chip label={inv.invoiceType} size='small' variant='outlined' /></TableCell>
              <TableCell align='right'>{inv.unitCount}</TableCell>
              <TableCell align='right'>
                <Typography variant='caption' fontWeight={600}>{formatGHS(inv.totalAmount)}</Typography>
              </TableCell>
              <TableCell><Chip label={inv.status} size='small' color={statusChipColor(inv.status)} /></TableCell>
              <TableCell>
                <Typography variant='caption' color='text.secondary'>{formatDate(inv.paidAt ?? inv.createdAt)}</Typography>
              </TableCell>
              {hasFailedInvoice && (
                <TableCell align='right' sx={{ minWidth: 110 }}>
                  {inv.status === 'FAILED' && (
                    <Button
                      size='small'
                      variant='contained'
                      color='error'
                      disabled={retrying === inv.id}
                      onClick={() => handleRetry(inv.id)}
                      startIcon={retrying === inv.id ? <CircularProgress size={12} color='inherit' /> : <i className='ri-refresh-line' />}
                    >
                      {retrying === inv.id ? 'Retrying…' : 'Pay Now'}
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

// ---------------------------------------------------------------------------
// Main view
// ---------------------------------------------------------------------------

export default function SubscriptionPlansListTable() {
  const { subscription, refresh, isLoading } = useSubscription()
  const [plans, setPlans]           = useState<SubscriptionPlanPublicDto[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [upgradeTarget, setUpgradeTarget] = useState<SubscriptionPlanPublicDto | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    getAvailablePlans()
      .then(data => {
        data.sort((a, b) => (PLAN_ORDER[a.name] ?? 99) - (PLAN_ORDER[b.name] ?? 99))
        setPlans(data)
      })
      .catch(() => {})
      .finally(() => setPlansLoading(false))
  }, [])

  const handleUpgradeSuccess = useCallback(async () => {
    await refresh()
    setSuccessMsg('Plan upgraded! Your new features are now active.')
  }, [refresh])

  async function handleDowngrade(plan: SubscriptionPlanPublicDto) {
    try {
      await scheduleDowngrade(plan.name)
      await refresh()
      setSuccessMsg('Downgrade to ' + plan.displayName + ' scheduled for end of billing period.')
    } catch { /* silent */ }
  }

  const currentPlan = subscription?.plan ?? 'FREE'

  return (
    <Box>
      <CurrentPlanCard />

      <Typography variant='h6' fontWeight={700} sx={{ mb: 2 }}>Choose a plan</Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {plansLoading || isLoading ? (
          [0, 1, 2].map(i => (
            <Grid item xs={12} md={4} key={i}>
              <Card variant='outlined'>
                <CardContent>
                  <Skeleton width='50%' height={28} sx={{ mb: 1 }} />
                  <Skeleton width='40%' height={48} sx={{ mb: 2 }} />
                  <Skeleton variant='rectangular' height={160} sx={{ borderRadius: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : plans.map(plan => (
          <Grid item xs={12} md={4} key={plan.id}>
            <PlanCard
              plan={plan}
              currentPlanName={currentPlan}
              onUpgrade={setUpgradeTarget}
              onDowngrade={handleDowngrade}
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant='h6' fontWeight={700} sx={{ mb: 2 }}>Billing History</Typography>
      <Card variant='outlined'>
        <CardContent><InvoiceTable /></CardContent>
      </Card>

      <UpgradeDialog
        plan={upgradeTarget}
        open={upgradeTarget !== null}
        onClose={() => setUpgradeTarget(null)}
        onSuccess={handleUpgradeSuccess}
      />

      <Snackbar
        open={successMsg !== null}
        autoHideDuration={5000}
        onClose={() => setSuccessMsg(null)}
        message={successMsg}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
