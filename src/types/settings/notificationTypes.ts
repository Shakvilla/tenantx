// Documentation: /docs/settings/settings-module.md

export type EncryptionType = 'none' | 'tls' | 'ssl'

export type EmailTemplateType =
  | 'invoice_sent'
  | 'payment_received'
  | 'payment_reminder'
  | 'tenant_welcome'
  | 'maintenance_request'
  | 'invoice_due'
  | 'payment_overdue'

export type NotificationType =
  | 'invoice_sent'
  | 'payment_received'
  | 'payment_reminder'
  | 'tenant_welcome'
  | 'maintenance_request'

export type NotificationChannel = 'email' | 'sms'

export interface SMTPConfig {
  host: string
  port: number
  encryption: EncryptionType
  username: string
  password: string
  fromEmail: string
  fromName: string
  enabled: boolean
}

export interface TemplateVariable {
  key: string
  label: string
  description: string
  example: string
}

export interface EmailTemplate {
  id: string
  type: EmailTemplateType
  name: string
  subject: string
  body: string
  variables: TemplateVariable[]
  isDefault: boolean
}

export interface NotificationPreference {
  type: NotificationType
  enabled: boolean
  channels: NotificationChannel[]
  frequency?: 'immediate' | 'daily' | 'weekly'
}

export interface SMSSettings {
  provider: 'frog'
  enabled: boolean
  apiEndpoint?: string
  status: 'connected' | 'disconnected'
  testPhoneNumber?: string
  notificationPreferences: NotificationPreference[]
}

export interface NotificationSettings {
  smtp: SMTPConfig
  emailTemplates: EmailTemplate[]
  emailPreferences: NotificationPreference[]
  sms: SMSSettings
}
