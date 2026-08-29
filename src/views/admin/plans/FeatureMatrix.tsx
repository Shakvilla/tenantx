'use client'

// MUI Imports
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'

// Type Imports
import type { GrantableFeature } from '@/lib/api/subscription-plans-admin'

/**
 * Which capabilities a plan grants.
 *
 * `available` carries only the keys the write API accepts — the ones enforced by
 * `@SubscriptionRequired` on a controller. The server refuses anything else with a 422, so
 * offering a wider list would render checkboxes that cannot be saved.
 *
 * The keys governed elsewhere are named rather than silently dropped. An admin looking for
 * SMS reminders and finding nothing would reasonably assume a bug; telling them it is gated by
 * purchased credit answers the question the absence raises.
 */

interface FeatureMatrixProps {
  value: string[]

  /** From the server's registry — never a literal. See getGrantableFeatures. */
  available: GrantableFeature[]
  onChange: (keys: string[]) => void
}

const FeatureMatrix = ({ value, available, onChange }: FeatureMatrixProps) => {
  const toggle = (key: string, checked: boolean) =>
    onChange(checked ? [...value, key] : value.filter(k => k !== key))

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
        {available.map(feature => (
          <FormControlLabel
            key={feature.key}
            control={
              <Checkbox
                checked={value.includes(feature.key)}
                inputProps={{ 'aria-label': feature.key }}
                onChange={e => toggle(feature.key, e.target.checked)}
              />
            }
            label={<Typography variant='body2'>{feature.label}</Typography>}
          />
        ))}
      </Box>

      <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 2 }}>
        Some capabilities are governed elsewhere and cannot be granted by a plan: SMS and WhatsApp
        reminders are gated by purchased credit, and inspections and caution fees are available to
        every tenant regardless of plan.
      </Typography>
    </Box>
  )
}

export default FeatureMatrix
