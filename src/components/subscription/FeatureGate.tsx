'use client'

/**
 * FeatureGate — renders children if the tenant has access to the feature,
 * otherwise renders a locked upgrade prompt.
 *
 * Does NOT hide the feature — landlords should see what they're missing.
 *
 * @example
 * <FeatureGate feature="RENT_COLLECTION">
 *   <CollectRentButton />
 * </FeatureGate>
 */

import type { ReactNode } from 'react'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import { useRouter } from 'next/navigation'

import { useFeature } from '@/hooks/useFeature'
import { useSubscription } from '@/contexts/SubscriptionContext'

// Maps each feature key to the minimum plan name required to unlock it.
// Used to generate accurate "requires X plan" messages without needing
// to know the tenant's current plan.
const FEATURE_REQUIRED_PLAN: Record<string, string> = {
  // Basic features
  COMMUNICATION:            'Basic',
  EXPENSES:                 'Basic',
  INSPECTIONS:              'Basic',
  VACANCY_LISTINGS:         'Basic',
  ADVANCE_RENT:             'Basic',
  CAUTION_FEES:             'Basic',
  RENT_REVIEWS:             'Basic',
  LATE_FEES:                'Basic',
  MAINTENANCE_CONTRACTORS:  'Basic',
  PREVENTATIVE_MAINTENANCE: 'Basic',
  SMS_REMINDERS:            'Basic',
  WHATSAPP_REMINDERS:       'Basic',
  ADVANCED_REPORTS:         'Basic',
  // Pro features
  RENT_COLLECTION:          'Pro',
  LANDLORD_WALLET:          'Pro',
  AUTOMATED_RECONCILIATION: 'Pro',
  FINANCIAL_REPORTS:        'Pro',
  UTILITIES_MANAGEMENT:     'Pro',
  AGENT_MANAGEMENT:         'Pro',
}

interface FeatureGateProps {
  feature: string
  children: ReactNode
  /** Custom message to show when locked (defaults to generic) */
  lockedMessage?: string
  /** Render a compact inline locked badge instead of the full block */
  inline?: boolean
}

export function FeatureGate({ feature, children, lockedMessage, inline = false }: FeatureGateProps) {
  const hasFeature = useFeature(feature)
  const { isLoading } = useSubscription()
  const router = useRouter()

  // Don't flash the lock UI while subscription data is still loading
  if (isLoading) return null

  if (hasFeature) return <>{children}</>

  const planName = FEATURE_REQUIRED_PLAN[feature] ?? 'a higher'
  const message = lockedMessage ?? `This feature requires the ${planName} plan. Upgrade to unlock it.`

  if (inline) {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1,
          py: 0.25,
          borderRadius: 1,
          bgcolor: 'action.hover',
          cursor: 'pointer',
          color: 'text.secondary',
          fontSize: '0.75rem',
        }}
        onClick={() => router.push('/subscription-plans')}
        title={message}
      >
        <i className='ri-lock-line' style={{ fontSize: '0.8rem' }} />
        Upgrade
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        p: 4,
        borderRadius: 2,
        border: '1px dashed',
        borderColor: 'divider',
        bgcolor: 'action.hover',
        textAlign: 'center',
      }}
    >
      <i className='ri-lock-2-line' style={{ fontSize: '2rem', opacity: 0.4 }} />
      <Typography variant='body2' color='text.secondary' sx={{ maxWidth: 320 }}>
        {message}
      </Typography>
      <Button
        size='small'
        variant='contained'
        onClick={() => router.push('/subscription-plans')}
        startIcon={<i className='ri-arrow-up-circle-line' />}
      >
        Upgrade now
      </Button>
    </Box>
  )
}
