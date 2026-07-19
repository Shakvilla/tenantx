import AgentsListTable from '@/views/members/agents/AgentsListTable'
import { FeatureGate } from '@/components/subscription/FeatureGate'

const AgentsPage = () => {
  return (
    <FeatureGate
      feature='AGENT_MANAGEMENT'
      lockedMessage='Agent management is available on the Pro plan. Upgrade to manage letting agents and track their commissions.'
    >
      <AgentsListTable />
    </FeatureGate>
  )
}

export default AgentsPage
