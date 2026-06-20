// Documentation: /docs/settings/settings-module.md
// NOTE: SMTPConfiguration and SMSSettings are platform admin-only
// (server credentials, SMS gateway keys). TODO: re-add to System Admin panel.

'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import EmailTemplatesSettings from './EmailTemplatesSettings'
import EmailPreferencesSettings from './EmailPreferencesSettings'

const NotificationSettingsContent = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <EmailTemplatesSettings />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <EmailPreferencesSettings />
      </Grid>
    </Grid>
  )
}

export default NotificationSettingsContent
