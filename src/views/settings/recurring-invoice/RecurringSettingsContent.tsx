'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import AutoGenerationSettings from './AutoGenerationSettings'
import FrequencySettings from './FrequencySettings'
import NotificationSettings from './NotificationSettings'
import DefaultInvoiceSettings from './DefaultInvoiceSettings'

const RecurringSettingsContent = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <AutoGenerationSettings />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <FrequencySettings />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <DefaultInvoiceSettings />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <NotificationSettings />
      </Grid>
    </Grid>
  )
}

export default RecurringSettingsContent

