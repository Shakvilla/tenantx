export type CommunicationType = {
  id: number
  subject: string
  from: string
  fromAvatar?: string
  to: string
  toAvatar?: string
  message: string
  date: string
  type: 'email' | 'sms' | 'notification' | 'message'
  status: 'sent' | 'delivered' | 'read' | 'failed'
  propertyName?: string
  unitNo?: string
  tenantName?: string
}

