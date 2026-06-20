import { apiGet, apiPost, apiPatch, apiDelete } from './client'
import { API_BASE } from './client'
import type {
  AgentType,
  AgentCommission,
  AgentCommissionStats,
  CreateAgentPayload,
  CreateCommissionPayload
} from '@/types/members/agentTypes'

const BASE = `${API_BASE}/agents`

// ── Agents ───────────────────────────────────────────────────────────────────

export async function getAgents(status?: string): Promise<AgentType[]> {
  const params = status ? `?status=${status}` : ''
  return apiGet<AgentType[]>(`${BASE}${params}`)
}

export async function getAgentById(id: string): Promise<AgentType> {
  return apiGet<AgentType>(`${BASE}/${id}`)
}

export async function createAgent(payload: CreateAgentPayload): Promise<AgentType> {
  return apiPost<AgentType>(BASE, payload)
}

export async function updateAgent(id: string, payload: Partial<CreateAgentPayload>): Promise<AgentType> {
  return apiPatch<AgentType>(`${BASE}/${id}`, payload)
}

export async function deleteAgent(id: string): Promise<void> {
  return apiDelete(`${BASE}/${id}`)
}

// ── Commissions ───────────────────────────────────────────────────────────────

export async function recordCommission(payload: CreateCommissionPayload): Promise<AgentCommission> {
  return apiPost<AgentCommission>(`${BASE}/commissions`, payload)
}

export async function getCommissionsForAgent(agentId: string): Promise<AgentCommission[]> {
  return apiGet<AgentCommission[]>(`${BASE}/${agentId}/commissions`)
}

export async function getAllCommissions(status?: string): Promise<AgentCommission[]> {
  const params = status ? `?status=${status}` : ''
  return apiGet<AgentCommission[]>(`${BASE}/commissions${params}`)
}

export async function getCommissionStats(agentId?: string): Promise<AgentCommissionStats> {
  const params = agentId ? `?agentId=${agentId}` : ''
  return apiGet<AgentCommissionStats>(`${BASE}/commissions/stats${params}`)
}

export async function markCommissionPaid(commissionId: string): Promise<AgentCommission> {
  return apiPost<AgentCommission>(`${BASE}/commissions/${commissionId}/pay`)
}

export async function cancelCommission(commissionId: string): Promise<AgentCommission> {
  return apiPost<AgentCommission>(`${BASE}/commissions/${commissionId}/cancel`)
}
