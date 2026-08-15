export type CommunicationType = {
  id: string
  subject: string
  from: string
  fromAvatar?: string
  to: string
  toAvatar?: string
  message: string
  date: string
  type: 'email' | 'sms' | 'notification' | 'message'
  status: 'sent' | 'delivered' | 'read' | 'failed'
  propertyId?: string
  propertyName?: string
  unitId?: string
  unitNo?: string
  occupantId?: string
  tenantName?: string
}
