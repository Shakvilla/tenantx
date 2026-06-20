'use client'

import PageBanner from '@components/banner/PageBanner'
import WalletDashboard from '@/views/wallet/WalletDashboard'

const WalletPage = () => {
  return (
    <>
      <PageBanner
        title='My Wallet'
        description='Track your rental income, view transaction history, and withdraw funds to Mobile Money'
      />
      <WalletDashboard />
    </>
  )
}

export default WalletPage
