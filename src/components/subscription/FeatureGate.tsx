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

const PLAN_LABELS: Record<string, string> = {
  FREE:  'Basic or Pro',
  BASIC: 'Pro',
  PRO:   'Pro',
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
  const { subscription } = useSubscription()
  const router = useRouter()

  if (hasFeature) return <>{children}</>

  const requiredPlan = PLAN_LABELS[subscription?.plan ?? 'FREE'] ?? 'a higher plan'
  const message = lockedMessage ?? `This feature requires ${requiredPlan}. Upgrade to unlock it.`

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
