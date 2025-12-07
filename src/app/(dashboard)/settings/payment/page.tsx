// Documentation: /docs/settings/settings-module.md

'use client'

// Component Imports
import PageBanner from '@components/banner/PageBanner'
import PaymentSettingsContent from '@/views/settings/payment/PaymentSettingsContent'

const PaymentSettingsPage = () => {
  return (
    <>
      <PageBanner
        title='Payment Settings'
        description='Configure payment gateways, methods, tax, and currency settings'
        icon='ri-bank-card-line'
      />
      <PaymentSettingsContent />
    </>
  )
}

export default PaymentSettingsPage
