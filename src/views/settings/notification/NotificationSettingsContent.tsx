// Documentation: /docs/settings/settings-module.md

'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import SMTPConfiguration from './SMTPConfiguration'
import EmailTemplatesSettings from './EmailTemplatesSettings'
import EmailPreferencesSettings from './EmailPreferencesSettings'
import SMSSettings from './SMSSettings'

const NotificationSettingsContent = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <SMTPConfiguration />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <EmailTemplatesSettings />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <EmailPreferencesSettings />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <SMSSettings />
      </Grid>
    </Grid>
  )
}

export default NotificationSettingsContent
