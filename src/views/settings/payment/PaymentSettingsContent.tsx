// Documentation: /docs/settings/settings-module.md

'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import PaymentGatewaySettings from './PaymentGatewaySettings'
import PaymentMethodsSettings from './PaymentMethodsSettings'
import TaxSettings from './TaxSettings'
import CurrencySettings from './CurrencySettings'

const PaymentSettingsContent = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <PaymentGatewaySettings />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <PaymentMethodsSettings />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TaxSettings />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <CurrencySettings />
      </Grid>
    </Grid>
  )
}

export default PaymentSettingsContent
