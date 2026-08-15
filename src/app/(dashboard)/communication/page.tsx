'use client'

// Component Imports
import CommunicationsListTable from '@/views/communication/CommunicationsListTable'
import { FeatureGate } from '@/components/subscription/FeatureGate'

const CommunicationPage = () => {
  return (
    <FeatureGate
      feature='COMMUNICATION'
      lockedMessage='Sending messages and notices to occupants is available on the Basic plan.'
    >
      <CommunicationsListTable />
    </FeatureGate>
  )
}

export default CommunicationPage
