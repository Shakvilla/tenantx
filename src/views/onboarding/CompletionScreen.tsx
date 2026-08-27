'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'

import type { OnboardingEntityIds } from './onboardingTypes'

interface CompletionScreenProps {
  onGoToDashboard: () => void
  onViewInvoice: () => void
  /** What the wizard actually created. Every step can be skipped, so this is the only truth. */
  entityIds: OnboardingEntityIds
}

/**
 * This screen used to read, unconditionally:
 *
 *   "Your property, occupant, and first invoice are ready. Your tenant will receive a
 *    notification."
 *
 * with no reference to what had been created. Every step of the wizard can be skipped, and a
 * field-test landlord who skipped occupant, agreement and invoice was told all three were ready.
 * None existed. "View Invoice" then dropped him on the dashboard.
 *
 * A setup screen that congratulates you for work it did not do is worse than no screen: the next
 * thing the landlord does is look for the tenant he was told he has.
 */
export default function CompletionScreen({ onGoToDashboard, onViewInvoice, entityIds }: CompletionScreenProps) {
  const created: string[] = []

  if (entityIds.propertyId) created.push('your property')
  if (entityIds.unitId) created.push('its first unit')
  if (entityIds.occupantId) created.push('your first tenant')
  if (entityIds.invoiceId) created.push('their first invoice')

  const list =
    created.length === 0
      ? null
      : created.length === 1
        ? created[0]
        : `${created.slice(0, -1).join(', ')} and ${created[created.length - 1]}`

  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
      <Avatar sx={{ bgcolor: 'success.main', width: 72, height: 72, mx: 'auto', mb: 4 }}>
        <i className='ri-check-line' style={{ fontSize: 40 }} />
      </Avatar>
      <Typography variant='h4' sx={{ mb: 2 }}>
        {list ? "You're all set!" : 'Setup skipped'}
      </Typography>
      <Typography color='text.secondary' sx={{ mb: 6, maxWidth: 460, mx: 'auto' }}>
        {list
          ? `We've set up ${list}. You can add the rest whenever you're ready.`
          : 'Nothing was set up — you skipped every step. You can add a property, a tenant and an invoice from the dashboard whenever you like.'}
      </Typography>
      <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
        <Button variant='contained' onClick={onGoToDashboard}>
          Go to Dashboard
        </Button>
        {/* Only offered when there is one. It used to appear regardless and land on the
            dashboard, which reads as the invoice having gone missing. */}
        {entityIds.invoiceId && (
          <Button variant='outlined' onClick={onViewInvoice}>
            View Invoice
          </Button>
        )}
      </Box>
    </Box>
  )
}
