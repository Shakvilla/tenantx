'use client'

import PageBanner from '@components/banner/PageBanner'
import WalletDashboard from '@/views/wallet/WalletDashboard'
import { FeatureGate } from '@/components/subscription/FeatureGate'

const WalletPage = () => {
  return (
    <>
      <PageBanner
        title='My Wallet'
        description='Track your rental income, view transaction history, and withdraw funds to Mobile Money'
      />
      <FeatureGate
        feature='LANDLORD_WALLET'
        lockedMessage='The Landlord Wallet is available on the Pro plan. Upgrade to collect rent digitally and withdraw via Mobile Money.'
      >
        <WalletDashboard />
      </FeatureGate>
    </>
  )
}

export default WalletPage
