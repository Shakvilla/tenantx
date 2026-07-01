'use client'

// Component Imports
import PreventativeSchedulesListTable from '@/views/maintenance/preventative-schedules/PreventativeSchedulesListTable'
import { FeatureGate } from '@/components/subscription/FeatureGate'

const PreventativeSchedulesPage = () => {
  return (
    <FeatureGate
      feature='PREVENTATIVE_MAINTENANCE'
      lockedMessage='Preventative maintenance scheduling is available on the Basic plan.'
    >
      <PreventativeSchedulesListTable />
    </FeatureGate>
  )
}

export default PreventativeSchedulesPage
