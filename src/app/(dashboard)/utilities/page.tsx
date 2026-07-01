import UtilitiesView from '@/views/utilities/UtilitiesView'
import { FeatureGate } from '@/components/subscription/FeatureGate'

const UtilitiesPage = () => {
  return (
    <FeatureGate
      feature='UTILITIES_MANAGEMENT'
      lockedMessage='Utility meter management is available on the Pro plan. Upgrade to manage ECG meters, bills, and prepaid tokens.'
    >
      <UtilitiesView />
    </FeatureGate>
  )
}

export default UtilitiesPage
