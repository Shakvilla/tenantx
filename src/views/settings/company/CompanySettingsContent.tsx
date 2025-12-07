// Documentation: /docs/settings/settings-module.md

'use client'

// MUI Imports
import Grid from '@mui/material/Grid2'

// Component Imports
import BasicInformationSettings from './BasicInformationSettings'
import AdvancedInformationSettings from './AdvancedInformationSettings'

const CompanySettingsContent = () => {
  return (
    <Grid container spacing={6}>
      <Grid size={{ xs: 12 }}>
        <BasicInformationSettings />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <AdvancedInformationSettings />
      </Grid>
    </Grid>
  )
}

export default CompanySettingsContent
