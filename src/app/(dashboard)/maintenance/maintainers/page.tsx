'use client'

// Component Imports
import MaintainersListTable from '@/views/maintenance/maintainers/MaintainersListTable'
import { FeatureGate } from '@/components/subscription/FeatureGate'

const MaintainersPage = () => {
  return (
    <FeatureGate
      feature='MAINTENANCE_CONTRACTORS'
      lockedMessage='Managing contractors is available on the Basic plan. Upgrade to assign vetted maintainers to requests.'
    >
      <MaintainersListTable />
    </FeatureGate>
  )
}

export default MaintainersPage
