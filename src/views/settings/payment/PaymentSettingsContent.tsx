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
        <LateFeeSettings />
      </Grid>
    </Grid>
  )
}

export default PaymentSettingsContent
