'use client'

// Component Imports
import PageBanner from '@components/banner/PageBanner'
import RecurringSettingsContent from '@/views/settings/recurring-invoice/RecurringSettingsContent'

const RecurringInvoiceSettingsPage = () => {
  return (
    <>
      <PageBanner
        title='Recurring Invoice Settings'
        description='Configure automatic invoice generation, frequency, and notification settings'
        icon='ri-repeat-line'
      />
      <RecurringSettingsContent />
    </>
  )
}

export default RecurringInvoiceSettingsPage

