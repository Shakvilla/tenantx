'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

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
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'

import { walletApi } from '@/lib/api/wallet'
import { canPayFromWallet } from '@/utils/canPayFromWallet'
import { useSubscription } from '@/contexts/SubscriptionContext'
import {
  getAvailablePlans,
  initiateUpgrade,
  scheduleDowngrade,
  cancelSubscription,
  getMyInvoices,
  retryMyInvoice,
  payInvoiceFromWallet,
  verifySubscriptionPayment,
  getManualPaymentDetails,
  type SubscriptionPlanPublicDto,
  type SubscriptionInvoiceDto,
  type ManualPaymentDetails,
} from '@/lib/api/subscription-client'
import { calculateMonthlyCharge, describeMonthlyCharge } from '@/lib/subscription/pricing'

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

function CurrentPlanCard({ freeUnitCap }: { freeUnitCap: number | null }) {
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
                <>
                  <Typography variant='body2' color='text.secondary'>
                    {formatGHS(pricePerUnit)} / unit / month
                    {currentPeriodEnd && ' · renews ' + formatDate(currentPeriodEnd)}
                  </Typography>
                  {/*
                    The rate alone is not the bill. The first units are free, so a
                    landlord multiplying rate by unit count gets a number the invoice
                    will contradict. Show the subtraction he can check.
                  */}
                  <Typography variant='body2' fontWeight={600} sx={{ mt: 0.5 }}>
                    {describeMonthlyCharge(calculateMonthlyCharge(unitCount, pricePerUnit, freeUnitCap), formatGHS)}
                  </Typography>
                </>
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
  plans: SubscriptionPlanPublicDto[]
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

function UpgradeDialog({ plan, plans, open, onClose, onSuccess }: UpgradeDialogProps) {
  const { subscription } = useSubscription()

  const freePlan      = plans.find(p => p.name === 'FREE')
  const freeCap       = freePlan?.freeUnitCap ?? 0
  const existingUnits = subscription?.unitCount ?? 0

  const [totalUnits, setTotalUnits] = useState(Math.max(freeCap + 1, existingUnits))
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY')
  const [paymentMethod, setPaymentMethod] = useState<'MOMO' | 'CARD' | 'MANUAL' | 'WALLET'>('MOMO')
  const [mobileNumber, setMobileNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [invoiceId, setInvoiceId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualDetails, setManualDetails] = useState<ManualPaymentDetails | null>(null)
  const [manualDetailsFailed, setManualDetailsFailed] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTotalUnits(Math.max(freeCap + 1, existingUnits))
      setBillingCycle('MONTHLY')
      setPaymentMethod('MOMO')
      setMobileNumber('')
      setError(null)
      setPending(false)
      setVerifying(false)
      setInvoiceId(null)
    }
  }, [open, freeCap, existingUnits])

  // Load wallet balance when the dialog opens (for the Wallet payment option)
  useEffect(() => {
    if (!open) return
    let cancelled = false
    walletApi.getWallet()
      .then(w => { if (!cancelled) setWalletBalance(w.status === 'ACTIVE' ? w.balance : 0) })
      .catch(() => { if (!cancelled) setWalletBalance(0) })
    return () => { cancelled = true }
  }, [open])

  // Fetched when the dialog OPENS, not lazily when MANUAL is first selected. Availability has
  // to be known before the landlord chooses, or the choice is offered and then withdrawn.
  useEffect(() => {
    if (!open) return

    setManualDetailsFailed(false)
    getManualPaymentDetails()
      .then(setManualDetails)
      .catch(() => setManualDetailsFailed(true))
  }, [open])

  // Bank transfer is only real when the platform has switched it on AND published somewhere to
  // send the money. The endpoint reports both — `enabled: 'false'` with empty fields — and the
  // page used to ignore it: the option was offered, and choosing it produced
  // "Transfer GH₵135.00 using the details below" above an empty box. A landlord who dodged the
  // MoMo error landed on instructions to pay nobody.
  const manualAvailable =
    manualDetails?.enabled === 'true' &&
    Boolean(manualDetails?.bank_name && manualDetails?.account_number)

  // If the landlord is sitting on a method that turns out to be unavailable, move them off it
  // rather than letting them press a button that cannot work.
  useEffect(() => {
    if (paymentMethod === 'MANUAL' && manualDetails && !manualAvailable) setPaymentMethod('MOMO')
  }, [paymentMethod, manualDetails, manualAvailable])

  // Poll for confirmation — applies to MOMO (webhook) and MANUAL (admin confirms) alike.
  // CARD redirects to Paystack checkout instead, so it never reaches this polling state.
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

  if (!plan) return null

  const discount       = plan.annualDiscountPct ?? 0
  const hasAnnual      = discount > 0
  const billableUnits  = Math.max(0, totalUnits - freeCap)
  const unitCost       = billableUnits * plan.pricePerUnit
  const annualTotal    = unitCost * 12 * (1 - discount)
  const annualSavings  = unitCost * 12 - annualTotal
  const dueToday       = billingCycle === 'ANNUAL' ? annualTotal : unitCost

  async function handlePay() {
    if (!plan || totalUnits < 1) return
    if (paymentMethod === 'MOMO' && !mobileNumber.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await initiateUpgrade({
        targetPlan: plan.name,
        unitCount: totalUnits,
        billingCycle,
        paymentMethod,
        ...(paymentMethod === 'MOMO' ? { mobileNumber: mobileNumber.trim() } : {}),
      })
      if (paymentMethod === 'CARD' && result.redirectUrl) {
        // Full-page redirect to Paystack checkout — plan activates via webhook once paid,
        // and the tenant lands back here per the callback_url the backend configured.
        window.location.href = result.redirectUrl
        return
      }
      if (paymentMethod === 'WALLET') {
        // Backend paid + activated synchronously (status PAID) — no polling needed.
        onSuccess()
        onClose()
        return
      }
      setInvoiceId(result.invoiceId)
      setPending(true)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setError(msg ?? 'Payment initiation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const walletOk = walletBalance !== null && canPayFromWallet(walletBalance, dueToday)
  const canPay = totalUnits >= 1
    && (paymentMethod === 'MOMO' ? !!mobileNumber.trim() : true)
    && (paymentMethod === 'WALLET' ? walletOk : true)

  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} maxWidth='sm' fullWidth>
      <DialogTitle>Upgrade to {plan.displayName}</DialogTitle>
      <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
        {error && <Alert severity='error'>{error}</Alert>}

        {pending ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            {paymentMethod === 'MANUAL' ? (
              <>
                <i className='ri-bank-line' style={{ fontSize: '2.5rem', color: 'var(--mui-palette-primary-main)' }} />
                <Typography variant='body1' fontWeight={600} sx={{ mt: 1 }}>Awaiting your bank transfer</Typography>
                {/* Only ever shown WITH the details. The instruction used to render
                    unconditionally while the card below was guarded on data that was not there. */}
                {manualAvailable ? (
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 1, mb: 2 }}>
                    Transfer <strong>{formatGHS(dueToday)}</strong> using the details below, then wait for an
                    admin to confirm the payment. This page updates automatically once confirmed.
                  </Typography>
                ) : (
                  <Typography variant='body2' color='text.secondary' sx={{ mt: 1, mb: 2 }}>
                    Bank transfer is not available yet — no account has been published to pay into.
                    Please use Mobile Money, or contact support.
                  </Typography>
                )}
                {manualDetails && (
                  <Card variant='outlined' sx={{ textAlign: 'left', maxWidth: 360, mx: 'auto' }}>
                    <CardContent sx={{ py: '12px !important' }}>
                      {([
                        ['Bank', manualDetails.bank_name],
                        ['Account Name', manualDetails.account_name],
                        ['Account Number', manualDetails.account_number],
                        ['Branch', manualDetails.branch],
                      ] as [string, string | undefined][])
                        .filter(([, value]) => !!value)
                        .map(([label, value]) => (
                          <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant='caption' color='text.secondary'>{label}</Typography>
                            <Typography variant='caption' fontWeight={600}>{value}</Typography>
                          </Box>
                        ))}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <>
                <CircularProgress sx={{ mb: 2 }} />
                <Typography variant='body1' fontWeight={600}>Payment prompt sent to your phone</Typography>
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                  Approve the payment of <strong>{formatGHS(dueToday)}</strong> in your mobile money app.
                  This page updates automatically once confirmed.
                </Typography>
                {invoiceId && (
                  <Button
                    variant='outlined'
                    size='small'
                    sx={{ mt: 2.5 }}
                    disabled={verifying}
                    startIcon={verifying ? <CircularProgress size={14} /> : <i className='ri-shield-check-line' />}
                    onClick={async () => {
                      setVerifying(true)
                      setError(null)
                      try {
                        const { verifySubscriptionPayment } = await import('@/lib/api/subscription-client')
                        const res = await verifySubscriptionPayment(invoiceId)
                        if (res.confirmed) {
                          setPending(false)
                          onSuccess()
                          onClose()
                        } else {
                          setPending(false)
                          setError('Payment not yet confirmed by the gateway. Please approve the MoMo prompt first, then try verifying again.')
                        }
                      } catch {
                        setError('Verification failed. Please try again.')
                      } finally {
                        setVerifying(false)
                      }
                    }}
                  >
                    {verifying ? 'Verifying…' : "I've paid — verify now"}
                  </Button>
                )}
              </>
            )}
          </Box>
        ) : (
          <>
            {/* Total units */}
            <Box>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.75 }}>
                How many total units do you want to license?
              </Typography>
              <TextField
                type='number'
                value={totalUnits}
                onChange={e => setTotalUnits(Math.max(1, parseInt(e.target.value) || 1))}
                size='small'
                fullWidth
                slotProps={{ input: { inputProps: { min: 1 } } }}
                helperText={
                  freeCap > 0
                    ? `Your first ${freeCap} unit${freeCap !== 1 ? 's' : ''} are free — you're only charged for units above ${freeCap}`
                    : 'Enter the total number of units you need'
                }
              />
            </Box>

            {/* Billing period — only shown if backend provides a discount */}
            {hasAnnual && (
              <Box>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.75 }}>
                  Billing period
                </Typography>
                <ToggleButtonGroup
                  value={billingCycle}
                  exclusive
                  onChange={(_, val) => { if (val) setBillingCycle(val) }}
                  size='small'
                  fullWidth
                >
                  <ToggleButton value='MONTHLY' sx={{ flex: 1 }}>Monthly</ToggleButton>
                  <ToggleButton value='ANNUAL' sx={{ flex: 1, gap: 1 }}>
                    Annual
                    <Chip
                      label={`${Math.round(discount * 100)}% off`}
                      size='small'
                      color='success'
                      sx={{ height: 18, fontSize: '0.65rem', pointerEvents: 'none' }}
                    />
                  </ToggleButton>
                </ToggleButtonGroup>
                {billingCycle === 'ANNUAL' && (
                  <Typography variant='caption' color='success.main' sx={{ mt: 0.5, display: 'block' }}>
                    You save {formatGHS(annualSavings)} vs 12 monthly payments
                  </Typography>
                )}
              </Box>
            )}

            {/* Invoice breakdown */}
            <Card variant='outlined'>
              <CardContent sx={{ py: '12px !important' }}>
                {[
                  ...(freeCap > 0
                    ? [['Free units (first ' + freeCap + ')', freeCap + ' unit' + (freeCap !== 1 ? 's' : '') + ' — no charge']]
                    : []),
                  ['Paid units', billableUnits + (freeCap > 0 ? ' (' + totalUnits + ' total − ' + freeCap + ' free)' : '')],
                  ['Rate',       formatGHS(plan.pricePerUnit) + ' / unit / mo'],
                  ...(plan.transactionFeePct
                    ? [['Transaction fee', (Number(plan.transactionFeePct) * 100).toFixed(1) + '% on collected rent']]
                    : []),
                  billingCycle === 'ANNUAL' ? ['Billing period', '12 months'] : ['Billing period', '1 month'],
                  ...(billingCycle === 'ANNUAL' && hasAnnual
                    ? [['Annual discount (' + Math.round(discount * 100) + '% off)', '−' + formatGHS(annualSavings)]]
                    : []),
                ].map(([label, value]) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant='body2' color='text.secondary'>{label}</Typography>
                    <Typography
                      variant='body2'
                      color={
                        label.startsWith('Free units')        ? 'success.main' :
                        label.startsWith('Annual discount')   ? 'success.main' :
                        'text.primary'
                      }
                    >
                      {value}
                    </Typography>
                  </Box>
                ))}
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' fontWeight={700}>Due today</Typography>
                  <Typography variant='body2' fontWeight={700} color='primary.main'>{formatGHS(dueToday)}</Typography>
                </Box>
                {billingCycle === 'ANNUAL' && (
                  <Typography variant='caption' color='text.secondary' sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
                    ≈ {formatGHS(annualTotal / 12)} effective / mo
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Payment method */}
            <Box>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 0.75 }}>
                Payment method
              </Typography>
              <ToggleButtonGroup
                value={paymentMethod}
                exclusive
                onChange={(_, val) => { if (val) setPaymentMethod(val) }}
                size='small'
                fullWidth
              >
                <ToggleButton value='MOMO' sx={{ flex: 1, gap: 0.75 }}>
                  <i className='ri-phone-line' />
                  Mobile Money
                </ToggleButton>
                <ToggleButton value='CARD' sx={{ flex: 1, gap: 0.75 }}>
                  <i className='ri-bank-card-line' />
                  Card
                </ToggleButton>
                <ToggleButton value='MANUAL' disabled={!manualAvailable} sx={{ flex: 1, gap: 0.75 }}>
                  <i className='ri-bank-line' />
                  Bank Transfer
                </ToggleButton>
                <ToggleButton
                  value='WALLET'
                  disabled={walletBalance === null || !canPayFromWallet(walletBalance, dueToday)}
                  sx={{ flex: 1, gap: 0.75 }}
                >
                  <i className='ri-wallet-3-line' />
                  Wallet
                </ToggleButton>
              </ToggleButtonGroup>
              {!manualAvailable && manualDetails && (
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.75 }}>
                  Bank transfer is not available yet — no account has been published to pay into.
                </Typography>
              )}
              {manualDetailsFailed && (
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.75 }}>
                  Could not check whether bank transfer is available.
                </Typography>
              )}
              {walletBalance !== null && (
                <Typography
                  variant='caption'
                  sx={{ display: 'block', mt: 0.75 }}
                  color={canPayFromWallet(walletBalance, dueToday) ? 'text.secondary' : 'error.main'}
                >
                  Wallet balance: {formatGHS(walletBalance)}
                  {!canPayFromWallet(walletBalance, dueToday) && ' — top up to pay from wallet'}
                </Typography>
              )}
            </Box>

            {/* MoMo input */}
            {paymentMethod === 'MOMO' && (
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
            )}

            {/* Card notice */}
            {paymentMethod === 'CARD' && (
              <Alert severity='info' icon={<i className='ri-bank-card-line' />}>
                You'll be redirected to a secure checkout page to enter your card details.
              </Alert>
            )}

            {/* Manual bank transfer notice */}
            {paymentMethod === 'MANUAL' && (
              <Alert severity='info' icon={<i className='ri-bank-line' />}>
                Bank details will be shown after you click Pay. Your plan activates once an admin
                confirms the transfer — this can take longer than instant payment methods.
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      {!pending && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>Cancel</Button>
          <Button
            variant='contained'
            onClick={handlePay}
            disabled={loading || !canPay}
            startIcon={loading ? <CircularProgress size={14} /> : <i className='ri-secure-payment-line' />}
          >
            {loading ? 'Initiating…' : 'Pay ' + formatGHS(dueToday)}
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
  unitCount,
  onUpgrade,
  onDowngrade,
  freeUnitCap,
}: {
  plan: SubscriptionPlanPublicDto
  currentPlanName: string
  /** The tenant's current active units, used to tell them before they click. */
  unitCount: number
  onUpgrade: (p: SubscriptionPlanPublicDto) => void
  onDowngrade: (p: SubscriptionPlanPublicDto) => void
  /** The FREE plan's allowance, which is what billing subtracts on every plan. */
  freeUnitCap: number | null
}) {
  const isCurrent = plan.name === currentPlanName
  const isHigher  = PLAN_ORDER[plan.name] > PLAN_ORDER[currentPlanName]
  const isLower   = PLAN_ORDER[plan.name] < PLAN_ORDER[currentPlanName]
  const isPro     = plan.name === 'PRO'

  // The server refuses a downgrade that would leave the landlord above the
  // target plan's cap. Saying so on the card is the difference between a
  // decision and an error message: a null cap means unlimited.
  const excessUnits = plan.freeUnitCap != null ? unitCount - plan.freeUnitCap : 0
  const wontFit     = isLower && excessUnits > 0

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
          {plan.pricePerUnit > 0 && unitCount > 0 && (
            /* What this landlord, with the units he actually has, would pay here. */
            <Typography variant='body2' fontWeight={600} color='text.primary' sx={{ mt: 0.5 }}>
              You would pay {formatGHS(calculateMonthlyCharge(unitCount, plan.pricePerUnit, freeUnitCap).monthlyTotal)} a month
              {freeUnitCap ? ' — ' + Math.min(unitCount, freeUnitCap) + ' of your ' + unitCount + ' units are free' : ' for ' + unitCount + ' units'}
            </Typography>
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
          <Box sx={{ width: '100%' }}>
            <Button
              fullWidth
              variant='outlined'
              color='inherit'
              disabled={wontFit}
              onClick={() => onDowngrade(plan)}
            >
              Downgrade to {plan.displayName}
            </Button>
            {wontFit && (
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                You have {unitCount} units and this plan allows {plan.freeUnitCap}. Remove{' '}
                {excessUnits} unit{excessUnits === 1 ? '' : 's'} to switch.
              </Typography>
            )}
          </Box>
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
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  // The feedback banner sits above the table while the buttons are in rows below it, so on a
  // phone — or anywhere the billing history is scrolled to — the answer landed off-screen and
  // both Verify and Pay from wallet read as doing nothing at all. Bring it into view.
  const noticeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (retryError || actionNotice) {
      noticeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [retryError, actionNotice])
  const [verifying, setVerifying]   = useState<Record<string, boolean>>({})
  const [payingId, setPayingId]     = useState<string | null>(null)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)

  const fetchInvoices = useCallback(() => {
    setLoading(true)
    getMyInvoices().then(data => setInvoices(Array.isArray(data) ? data : [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  useEffect(() => {
    let cancelled = false
    walletApi.getWallet()
      .then(w => { if (!cancelled) setWalletBalance(w.status === 'ACTIVE' ? w.balance : 0) })
      .catch(() => { if (!cancelled) setWalletBalance(0) })
    return () => { cancelled = true }
  }, [])

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

  async function handleVerify(invoiceId: string) {
    setVerifying(v => ({ ...v, [invoiceId]: true }))
    setRetryError(null)
    setActionNotice(null)
    try {
      const { confirmed } = await verifySubscriptionPayment(invoiceId)
      if (confirmed) {
        setActionNotice('Payment confirmed. The bill is settled.')
        fetchInvoices()
      } else {
        setRetryError('Payment not yet confirmed by the gateway. Approve the MoMo prompt first, then try again.')
      }
    } catch (err: any) {
      setRetryError(err?.response?.data?.message ?? 'Verification failed. Please try again.')
    } finally {
      setVerifying(v => ({ ...v, [invoiceId]: false }))
    }
  }

  async function handlePayFromWallet(invoiceId: string) {
    setPayingId(invoiceId)
    setRetryError(null)
    setActionNotice(null)
    try {
      await payInvoiceFromWallet(invoiceId)
      // Success said out loud. A row quietly changing from PENDING to PAID is not an answer to
      // "did my money move".
      setActionNotice('Paid from your wallet. The bill is settled and your balance is updated.')
      fetchInvoices()
      // Refresh the cached balance so any other PENDING row re-gates against the post-debit amount.
      walletApi.getWallet()
        .then(w => setWalletBalance(w.status === 'ACTIVE' ? w.balance : 0))
        .catch(() => {})
    } catch (err: any) {
      setRetryError(err?.response?.data?.message ?? 'Wallet payment failed. Please try again.')
    } finally {
      setPayingId(null)
    }
  }

  const hasAction = invoices.some(inv => inv.status === 'FAILED' || inv.status === 'PENDING')

  if (loading) return <Skeleton variant='rectangular' height={120} sx={{ borderRadius: 1 }} />
  if (invoices.length === 0) return (
    <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>No billing history yet.</Typography>
  )

  return (
    <>
      <div ref={noticeRef}>
        {retryError && (
          <Alert severity='error' sx={{ mb: 2 }} onClose={() => setRetryError(null)}>{retryError}</Alert>
        )}
        {actionNotice && !retryError && (
          <Alert severity='success' sx={{ mb: 2 }} onClose={() => setActionNotice(null)}>{actionNotice}</Alert>
        )}
      </div>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell>Period</TableCell>
            <TableCell>Type</TableCell>
            <TableCell align='right'>Units</TableCell>
            <TableCell align='right'>Amount</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Date</TableCell>
            {hasAction && <TableCell />}
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
              {hasAction && (
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
                  {inv.status === 'PENDING' && (
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <Button
                        size='small'
                        variant='outlined'
                        disabled={!!verifying[inv.id]}
                        onClick={() => handleVerify(inv.id)}
                        startIcon={verifying[inv.id] ? <CircularProgress size={12} /> : <i className='ri-refresh-line' />}
                      >
                        {verifying[inv.id] ? 'Checking…' : 'Verify'}
                      </Button>
                      <Button
                        size='small'
                        variant='outlined'
                        color='primary'
                        disabled={payingId === inv.id || walletBalance === null || !canPayFromWallet(walletBalance, inv.totalAmount)}
                        onClick={() => handlePayFromWallet(inv.id)}
                        startIcon={payingId === inv.id ? <CircularProgress size={12} /> : <i className='ri-wallet-3-line' />}
                      >
                        {payingId === inv.id ? 'Paying…' : 'Pay from wallet'}
                      </Button>
                    </Box>
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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
    } catch (err: any) {
      // This was `catch { /* silent */ }`. The card below disables the button
      // when the units will not fit, but a stale count — units added in another
      // tab, or by a colleague — still reaches the server, and the server's
      // refusal names exactly how many units to remove. Swallowing it left the
      // landlord pressing a button that did nothing and said nothing.
      setErrorMsg(
        err?.response?.data?.message ??
        err?.message ??
        'Could not schedule the downgrade. Please try again.'
      )
    }
  }

  const currentPlan = subscription?.plan ?? 'FREE'

  return (
    <Box>
      <CurrentPlanCard freeUnitCap={plans.find(p => p.name === 'FREE')?.freeUnitCap ?? null} />

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
              unitCount={subscription?.unitCount ?? 0}
              onUpgrade={setUpgradeTarget}
              onDowngrade={handleDowngrade}
              freeUnitCap={plans.find(p => p.name === 'FREE')?.freeUnitCap ?? null}
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
        plans={plans}
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

      <Snackbar
        open={errorMsg !== null}
        // Longer than the success toast: this one asks the landlord to do
        // something, and it names a number they need to read.
        autoHideDuration={10000}
        onClose={() => setErrorMsg(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity='error' onClose={() => setErrorMsg(null)} variant='filled'>
          {errorMsg}
        </Alert>
      </Snackbar>
    </Box>
  )
}
