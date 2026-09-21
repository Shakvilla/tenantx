export type RelationshipStatus =
  | 'UNCLAIMED'
  | 'INVITED'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ENDED'
  | 'DECLINED'

export type MandateStatus =
  | 'DRAFT'
  | 'PROPOSED'
  | 'PENDING_AGENT_ACCEPTANCE'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'REVOKED'
  | 'SUSPENDED'

export type AgentCapability =
  | 'VIEW_ASSIGNED_PROPERTIES'
  | 'MANAGE_ASSIGNED_LISTINGS'
  | 'MANAGE_ENQUIRIES'
  | 'SCHEDULE_VIEWINGS'
  | 'SUBMIT_APPLICANTS'
  | 'VIEW_ASSIGNED_APPLICATIONS'
  | 'RECORD_FEE_DISCLOSURES'
  | 'VIEW_OWN_COMMISSIONS'

export type AgentRelationshipType = {
  relationshipId: string
  displayName: string
  status: RelationshipStatus
  source: 'LANDLORD_CREATED' | 'AGENT_REFERRAL' | 'PLATFORM_MATCH' | 'MIGRATED'
  claimed: boolean
}

export type AgentMandateType = {
  mandateId: string
  status: MandateStatus
  termsVersion: number
}

export type AgentReferralType = {
  referralId: string
  landlordName: string
  status: 'SENT' | 'OPENED' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED' | 'WITHDRAWN'
  createdAt: string
}

export const AGENT_CAPABILITY_LABELS: Record<AgentCapability, string> = {
  VIEW_ASSIGNED_PROPERTIES: 'View assigned properties',
  MANAGE_ASSIGNED_LISTINGS: 'Manage assigned listings',
  MANAGE_ENQUIRIES: 'Manage enquiries',
  SCHEDULE_VIEWINGS: 'Schedule viewings',
  SUBMIT_APPLICANTS: 'Submit applicants',
  VIEW_ASSIGNED_APPLICATIONS: 'View assigned applications',
  RECORD_FEE_DISCLOSURES: 'Record fee disclosures',
  VIEW_OWN_COMMISSIONS: 'View own commissions'
}
