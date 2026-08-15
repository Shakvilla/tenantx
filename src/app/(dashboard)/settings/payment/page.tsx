// Documentation: /docs/settings/settings-module.md

'use client'

// Component Imports
import PageBanner from '@components/banner/PageBanner'
import PaymentSettingsContent from '@/views/settings/payment/PaymentSettingsContent'
import { FeatureGate } from '@/components/subscription/FeatureGate'

const PaymentSettingsPage = () => {
  return (
    <>
      <PageBanner
        title='Payment Settings'
        description='Configure payment gateways, methods, tax, and currency settings'
        icon='ri-bank-card-line'
      />
      <FeatureGate
        feature='RENT_COLLECTION'
        lockedMessage='Payment gateway configuration is available on the Pro plan. Upgrade to collect rent via Mobile Money.'
      >
        <PaymentSettingsContent />
      </FeatureGate>
    </>
  )
}

export default PaymentSettingsPage
