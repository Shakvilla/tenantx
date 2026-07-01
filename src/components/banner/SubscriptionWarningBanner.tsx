'use client'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'

import { useSubscription } from '@/contexts/SubscriptionContext'

// ---------------------------------------------------------------------------
// Config per subscription status
// ---------------------------------------------------------------------------

interface BannerConfig {
  severity: 'error' | 'warning'
  icon: string
  message: string
  cta: string
}

const STATUS_CONFIG: Record<string, BannerConfig> = {
  PAST_DUE: {
    severity: 'error',
    icon: 'ri-error-warning-line',
    message:
      'Your subscription payment failed. Some features may be restricted until payment is resolved.',
    cta: 'Manage subscription',
  },
  CANCELLED: {
    severity: 'warning',
    icon: 'ri-spam-2-line',
    message:
      'Your subscription has been cancelled. Your account will be downgraded at the end of the billing period.',
    cta: 'Reactivate',
  },
  SUSPENDED: {
    severity: 'error',
    icon: 'ri-forbid-2-line',
    message:
      'Your account has been suspended. Please contact support or resolve your outstanding balance.',
    cta: 'Manage subscription',
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * Persistent (non-dismissible) banner shown when the tenant's subscription
 * is PAST_DUE, CANCELLED, or SUSPENDED. Reads from SubscriptionContext —
 * no extra fetch needed.
 */
export default function SubscriptionWarningBanner() {
  const { subscription, isLoading } = useSubscription()

  if (isLoading || !subscription) return null

  const config = STATUS_CONFIG[subscription.status]

  if (!config) return null

  return (
    <Collapse in unmountOnExit>
      <Alert
        severity={config.severity}
        icon={<i className={config.icon} />}
        action={
          <Button
            component='a'
            href='/subscription-plans'
            size='small'
            color='inherit'
            variant='outlined'
            sx={{ whiteSpace: 'nowrap', fontWeight: 600, borderColor: 'currentColor' }}
          >
            {config.cta}
          </Button>
        }
        sx={{
          borderRadius: 0,
          borderBottom: '1px solid',
          borderColor: `${config.severity}.dark`,
        }}
      >
        {config.message}
      </Alert>
    </Collapse>
  )
}
