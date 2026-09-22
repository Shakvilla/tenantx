import { apiGet, apiPost, apiPatch, API_BASE } from './client'
import type {
  AgentRelationshipType,
  AgentMandateType,
  RelationshipStatus,
  MandateStatus
} from '@/types/members/agentNetworkTypes'

const BASE = `${API_BASE}`

// ── Agent signup & profile (global, no tenant required) ─────────────────────

export interface AgentSignupBeginPayload {
  identifier: string
}

export interface AgentSignupCompletePayload {
  otp: string
  password: string
  publicName: string
  phone?: string
  operatingLocations?: string
  languages?: string
}

export async function beginAgentSignup(payload: AgentSignupBeginPayload): Promise<{ globalUserId: string; otpSent: boolean }> {
  return apiPost<{ globalUserId: string; otpSent: boolean }>(`${BASE}/agent-signup/begin`, payload)
}

export async function completeAgentSignup(
  payload: AgentSignupCompletePayload,
  identifier: string
): Promise<{ globalUserId: string; agentProfileId: string }> {
  return apiPost<{ globalUserId: string; agentProfileId: string }>(
    `${BASE}/agent-signup/complete?identifier=${encodeURIComponent(identifier)}`,
    payload
  )
}

export interface AgentProfileMe {
  id: string
  globalUserId: string
  profileType: 'INDIVIDUAL' | 'AGENCY_MEMBER'
  publicName: string
  bio?: string
  operatingLocations?: string
  languages?: string
  identityStatus: string
  credentialStatus: string
  platformStatus: string
}

export async function getAgentProfileMe(): Promise<AgentProfileMe> {
  return apiGet<AgentProfileMe>(`${BASE}/agent-profile/me`)
}

export async function updateAgentProfileMe(payload: Partial<AgentProfileMe>): Promise<AgentProfileMe> {
  return apiPatch<AgentProfileMe>(`${BASE}/agent-profile/me`, payload)
}

export async function createAgentProfileMe(payload: { publicName: string; bio?: string }): Promise<AgentProfileMe> {
  return apiPost<AgentProfileMe>(`${BASE}/agent-profile/me`, payload)
}

// ── Claims & workspaces (global session) ─────────────────────────────────────

export async function acceptAgentClaim(token: string): Promise<{ relationshipId: string; tenantId: string; status: string }> {
  // Identity binding is server-side: the backend matches the invitation
  // against the authenticated caller's own contact. Nothing to send.
  return apiPost<{ relationshipId: string; tenantId: string; status: string }>(
    `${BASE}/agent-claims/${encodeURIComponent(token)}/accept`,
    undefined
  )
}

export interface AgentWorkspace {
  tenantId: string
  tenantName?: string
  relationshipStatus: string
  userType: string
}

export async function getAgentWorkspaces(): Promise<AgentWorkspace[]> {
  return apiGet<AgentWorkspace[]>(`${BASE}/agent-workspaces`)
}

// ── Referrals (global session) ───────────────────────────────────────────────

export async function createAgentReferral(payload: {
  landlordName: string
  contact: string
  consentAttestation: boolean
  privateNote?: string
}): Promise<{ referralId: string; status: string }> {
  return apiPost<{ referralId: string; status: string }>(`${BASE}/agent-referrals`, payload)
}

export async function getAgentReferrals(): Promise<{ referralId: string; landlordName: string; status: string; createdAt: string }[]> {
  return apiGet<{ referralId: string; landlordName: string; status: string; createdAt: string }[]>(`${BASE}/agent-referrals`)
}

export async function withdrawAgentReferral(id: string): Promise<{ referralId: string; status: string }> {
  return apiPost<{ referralId: string; status: string }>(`${BASE}/agent-referrals/${id}/withdraw`, undefined)
}

export async function acceptLandlordReferral(code: string): Promise<{ relationshipId: string; status: string }> {
  return apiPost<{ relationshipId: string; status: string }>(`${BASE}/landlord-referrals/accept`, { code })
}

// ── Relationships (tenant-scoped) ────────────────────────────────────────────

export interface AgentRelationshipSummary {
  relationshipId: string
  displayName: string
  status: string
  source: string
  claimed: boolean
}

export async function getAgentRelationships(): Promise<AgentRelationshipType[]> {
  const data = await apiGet<AgentRelationshipSummary[]>(`${BASE}/agent-relationships`)

  // JSON carries no enums — narrow the wire strings to the domain unions once,
  // at the boundary, so views stay strictly typed.
  return (Array.isArray(data) ? data : []).map(r => ({
    ...r,
    status: r.status as RelationshipStatus,
    source: r.source as AgentRelationshipType['source']
  }))
}

export async function recordOfflineAgent(payload: { displayName: string; email?: string; phone?: string }): Promise<{ relationshipId: string; status: string }> {
  return apiPost<{ relationshipId: string; status: string }>(`${BASE}/agent-relationships`, payload)
}

export interface ClaimedAgentMatch {
  relationshipId: string
  displayName: string
  status: string
  contactMasked: string
}

export async function searchClaimedAgents(contact: string): Promise<ClaimedAgentMatch[]> {
  return apiGet<ClaimedAgentMatch[]>(`${BASE}/agent-relationships/search?contact=${encodeURIComponent(contact)}`)
}

export async function inviteAgentRelationship(id: string, payload: { contactChannel?: string; contact?: string }): Promise<{ invitationId: string; claimCode: string; expiresAt: string }> {
  return apiPost<{ invitationId: string; claimCode: string; expiresAt: string }>(`${BASE}/agent-relationships/${id}/invite`, payload)
}

export async function approveAgentRelationship(id: string): Promise<{ relationshipId: string; status: string }> {
  return apiPost<{ relationshipId: string; status: string }>(`${BASE}/agent-relationships/${id}/approve`, undefined)
}

export async function suspendAgentRelationship(id: string, reason?: string): Promise<{ relationshipId: string; status: string }> {
  return apiPost<{ relationshipId: string; status: string }>(`${BASE}/agent-relationships/${id}/suspend`, { reason })
}

export async function endAgentRelationship(id: string, reason?: string): Promise<{ relationshipId: string; status: string }> {
  return apiPost<{ relationshipId: string; status: string }>(`${BASE}/agent-relationships/${id}/end`, { reason })
}

// ── Mandates awaiting the agent (global session) ─────────────────────────────

export interface PendingAgentMandate {
  mandateId: string
  tenantId: string
  relationshipId: string
  status: string
  termsVersion: number
}

export async function getPendingAgentMandates(): Promise<PendingAgentMandate[]> {
  return apiGet<PendingAgentMandate[]>(`${BASE}/agent-mandates/pending`)
}

export async function acceptMandateAsAgent(id: string): Promise<{ mandateId: string; status: string }> {
  return apiPost<{ mandateId: string; status: string }>(`${BASE}/agent-mandates/${id}/accept-as-agent`, undefined)
}

// ── Mandates (tenant-scoped) ─────────────────────────────────────────────────

export interface AgentMandateSummary {
  mandateId: string
  status: string
  termsVersion: number
}

export async function getMandatesForRelationship(relationshipId: string): Promise<AgentMandateType[]> {
  const data = await apiGet<AgentMandateSummary[]>(`${BASE}/agent-relationships/${relationshipId}/mandates`)

  return (Array.isArray(data) ? data : []).map(m => ({
    ...m,
    status: m.status as MandateStatus
  }))
}

export async function createMandateDraft(relationshipId: string, payload?: { startTime?: string; endTime?: string }): Promise<{ mandateId: string; status: string }> {
  return apiPost<{ mandateId: string; status: string }>(`${BASE}/agent-relationships/${relationshipId}/mandates`, payload ?? {})
}

export async function updateMandate(
  id: string,
  payload: { propertyIds?: string[]; capabilities?: string[]; startTime?: string; endTime?: string; feeTerms?: Record<string, unknown>[] }
): Promise<{ mandateId: string; status: string; termsVersion: number }> {
  return apiPatch<{ mandateId: string; status: string; termsVersion: number }>(`${BASE}/agent-mandates/${id}`, payload)
}

export async function proposeMandate(id: string): Promise<{ mandateId: string; status: string }> {
  return apiPost<{ mandateId: string; status: string }>(`${BASE}/agent-mandates/${id}/propose`, undefined)
}

export async function acceptMandate(id: string): Promise<{ mandateId: string; status: string }> {
  return apiPost<{ mandateId: string; status: string }>(`${BASE}/agent-mandates/${id}/accept`, undefined)
}

export async function activateMandate(id: string): Promise<{ mandateId: string; status: string }> {
  return apiPost<{ mandateId: string; status: string }>(`${BASE}/agent-mandates/${id}/activate`, undefined)
}

export async function revokeMandate(id: string): Promise<{ mandateId: string; status: string }> {
  return apiPost<{ mandateId: string; status: string }>(`${BASE}/agent-mandates/${id}/revoke`, undefined)
}
