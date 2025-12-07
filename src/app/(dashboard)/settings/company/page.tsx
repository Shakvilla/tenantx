// Documentation: /docs/settings/settings-module.md

'use client'

// Component Imports
import PageBanner from '@components/banner/PageBanner'
import CompanySettingsContent from '@/views/settings/company/CompanySettingsContent'

const CompanySettingsPage = () => {
  return (
    <>
      <PageBanner
        title='Company Settings'
        description='Configure company basic information and advanced details'
        icon='ri-building-line'
      />
      <CompanySettingsContent />
    </>
  )
}

export default CompanySettingsPage
