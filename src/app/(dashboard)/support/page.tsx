'use client'

import PageBanner from '@components/banner/PageBanner'
import SupportView from '@/views/support/SupportView'

const SupportPage = () => {
  return (
    <>
      <PageBanner
        title='Support'
        description='Submit a ticket for technical help or share feedback to help us improve the platform'
      />
      <SupportView />
    </>
  )
}

export default SupportPage
