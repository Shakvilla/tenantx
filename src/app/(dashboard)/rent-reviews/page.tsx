import RentReviewsView from '@/views/rent-reviews/RentReviewsView'
import { FeatureGate } from '@/components/subscription/FeatureGate'

const RentReviewsPage = () => {
  return (
    <FeatureGate
      feature='RENT_REVIEWS'
      lockedMessage='Rent review workflows are available on the Basic plan. Upgrade to manage annual rent increases.'
    >
      <RentReviewsView />
    </FeatureGate>
  )
}

export default RentReviewsPage
