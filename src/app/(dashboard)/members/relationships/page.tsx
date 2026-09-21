import RelationshipsView from '@/views/members/relationships/RelationshipsView'
import { FeatureGate } from '@/components/subscription/FeatureGate'

const RelationshipsPage = () => {
  return (
    <FeatureGate
      feature='AGENT_NETWORK'
      lockedMessage='Agent relationships are part of the agent network. Enable it for your plan to invite agents and manage mandates.'
    >
      <RelationshipsView />
    </FeatureGate>
  )
}

export default RelationshipsPage
