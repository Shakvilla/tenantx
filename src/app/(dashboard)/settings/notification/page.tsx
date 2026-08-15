// Documentation: /docs/settings/settings-module.md

'use client'

// Component Imports
import PageBanner from '@components/banner/PageBanner'
import NotificationSettingsContent from '@/views/settings/notification/NotificationSettingsContent'
import { FeatureGate } from '@/components/subscription/FeatureGate'

const NotificationSettingsPage = () => {
  return (
    <>
      <PageBanner
        title='Notification Settings'
        description='Configure SMTP, email templates, preferences, and SMS settings'
        icon='ri-notification-line'
      />
      <FeatureGate
        feature='SMS_REMINDERS'
        lockedMessage='SMS and WhatsApp reminder settings are available on the Basic plan.'
      >
        <NotificationSettingsContent />
      </FeatureGate>
    </>
  )
}

export default NotificationSettingsPage
