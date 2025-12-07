// Documentation: /docs/settings/settings-module.md

'use client'

// Component Imports
import PageBanner from '@components/banner/PageBanner'
import NotificationSettingsContent from '@/views/settings/notification/NotificationSettingsContent'

const NotificationSettingsPage = () => {
  return (
    <>
      <PageBanner
        title='Notification Settings'
        description='Configure SMTP, email templates, preferences, and SMS settings'
        icon='ri-notification-line'
      />
      <NotificationSettingsContent />
    </>
  )
}

export default NotificationSettingsPage
