'use client'

/**
 * UnitCapGate — renders children normally if the tenant is below their unit cap,
 * otherwise renders children in a disabled state with an upgrade tooltip.
 *
 * @example
 * <UnitCapGate>
 *   <AddUnitButton />
 * </UnitCapGate>
 */

import type { ReactNode } from 'react'

import Tooltip from '@mui/material/Tooltip'
import Box from '@mui/material/Box'

import { useSubscription } from '@/contexts/SubscriptionContext'

interface UnitCapGateProps {
  children: ReactNode
}

export function UnitCapGate({ children }: UnitCapGateProps) {
  const { isAtUnitCap, subscription } = useSubscription()

  if (!isAtUnitCap) return <>{children}</>

  const cap = subscription?.unitCap ?? 0
  const tooltipText = `You've reached your ${cap}-unit limit. Upgrade your plan to add more units.`

  return (
    <Tooltip title={tooltipText} placement='top'>
      {/* Box wrapper needed because Tooltip requires a single child that accepts refs */}
      <Box sx={{ display: 'inline-flex', cursor: 'not-allowed', opacity: 0.5 }}>
        <Box sx={{ pointerEvents: 'none' }}>
          {children}
        </Box>
      </Box>
    </Tooltip>
  )
}
