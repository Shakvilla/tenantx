// Documentation: /docs/settings/settings-module.md
// NOTE: PaymentGatewaySettings and PaymentMethodsSettings are platform admin-only
// (API keys, webhook URLs, gateway toggles). TODO: re-add to System Admin panel.

'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import TaxSettings from './TaxSettings'
import CurrencySettings from './CurrencySettings'
import LateFeeSettings from './LateFeeSettings'
import { FeatureGate } from '@/components/subscription/FeatureGate'

const PaymentSettingsContent = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <TaxSettings />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <CurrencySettings />
      </Grid>
      <Grid size={{ xs: 12 }}>
        {/* Late fees are applied by a nightly job that now checks the plan, so without
            this gate a Free landlord could configure a switch that silently did nothing. */}
        <FeatureGate feature='LATE_FEES'>
          <LateFeeSettings />
        </FeatureGate>
      </Grid>
    </Grid>
  )
}

export default PaymentSettingsContent
