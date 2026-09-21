import type { Metadata } from 'next'

import AgentSignupView from '@views/auth/AgentSignupView'

import { getServerMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  title: 'Agent Sign Up',
  description: 'Join TenantX as an independent letting agent'
}

const AgentRegisterPage = async () => {
  const mode = await getServerMode()

  return <AgentSignupView mode={mode} />
}

export default AgentRegisterPage
