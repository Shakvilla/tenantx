/**
 * Settings API client — per-tenant settings stored on the Spring Boot backend.
 *
 * Endpoints:
 *   GET  /api/v1/settings/{category}  → { category, settings: {...} }
 *   PUT  /api/v1/settings/{category}  → { category, settings: {...} }
 *
 * Categories used by the landlord dashboard:
 *   company           — BasicInformationSettings + AdvancedInformationSettings
 *   payment           — TaxSettings + CurrencySettings
 *   notification      — EmailTemplatesSettings + EmailPreferencesSettings
 *   recurring_invoice — all four recurring-invoice sub-components
 */

import { apiGet, apiPost, apiPut, API_BASE } from './client'
import type { CompanySettings }      from '@/types/settings/companyTypes'
import type { PaymentSettings }      from '@/types/settings/paymentTypes'
import type { NotificationSettings } from '@/types/settings/notificationTypes'

// ---- Generic helpers -------------------------------------------------------

async function getSettings<T>(category: string): Promise<T> {
  const data = await apiGet<{ category: string; settings: T }>(
    `${API_BASE}/settings/${category}`
  )
  return data.settings
}

async function saveSettings<T>(category: string, payload: Partial<T>): Promise<T> {
  const data = await apiPut<{ category: string; settings: T }>(
    `${API_BASE}/settings/${category}`,
    payload
  )
  return data.settings
}

// ---- Company ---------------------------------------------------------------

export const companySettingsApi = {
  get:    ()                                   => getSettings<CompanySettings>('company'),
  update: (data: Partial<CompanySettings>)     => saveSettings<CompanySettings>('company', data),
}

// ---- Payment (Tax + Currency only — gateway settings are admin-only) --------

export type LandlordPaymentSettings = Pick<PaymentSettings, 'tax' | 'currency'>

export const paymentSettingsApi = {
  get:    ()                                        => getSettings<LandlordPaymentSettings>('payment'),
  update: (data: Partial<LandlordPaymentSettings>)  => saveSettings<LandlordPaymentSettings>('payment', data),
}

// ---- Notification (Email Templates + Email Preferences only) ---------------

export type LandlordNotificationSettings = Pick<NotificationSettings, 'emailTemplates' | 'emailPreferences'>

export const notificationSettingsApi = {
  get:    ()                                            => getSettings<LandlordNotificationSettings>('notification'),
  update: (data: Partial<LandlordNotificationSettings>) => saveSettings<LandlordNotificationSettings>('notification', data),
}

// ---- Late Fee Automation ---------------------------------------------------

export interface LateFeeSettings {
  enabled: boolean
  feeType: 'percentage' | 'fixed'
  feeValue: number
  feeFrequency: 'daily' | 'weekly' | 'one_time'
  gracePeriodDays: number
  maxFeeAmount: number | null
}

export const lateFeeSettingsApi = {
  get:    ()                               => getSettings<LateFeeSettings>('late_fee'),
  update: (data: Partial<LateFeeSettings>) => saveSettings<LateFeeSettings>('late_fee', data),
}

// ---- Late Fee Logs (per-invoice) -------------------------------------------

export interface LateFeeLogEntry {
  id: string
  invoiceId: string
  amount: number
  currency: string
  feeDate: string    // ISO date string
  appliedAt: string  // ISO datetime string
}

export async function getLateFeeLogsForInvoice(invoiceId: string): Promise<LateFeeLogEntry[]> {
  return apiGet<LateFeeLogEntry[]>(`${API_BASE}/late-fees/invoice/${invoiceId}`)
}

export async function applyLateFeeManually(invoiceId: string): Promise<LateFeeLogEntry | { message: string }> {
  return apiPost<LateFeeLogEntry | { message: string }>(
    `${API_BASE}/late-fees/invoice/${invoiceId}/apply`
  )
}

// ---- Recurring Invoice -----------------------------------------------------

export interface RecurringInvoiceSettings {
  autoGeneration: {
    enabled:        boolean
    daysBeforeDue:  number
    autoSend:       boolean
    generateOnDay:  number
  }
  frequency: {
    defaultFrequency: 'monthly' | 'quarterly' | 'annually' | 'weekly'
    allowCustom:      boolean
  }
  defaultInvoice: {
    defaultDueDays:   number
    defaultNotes:     string
    defaultFooter:    string
    includeLateFee:   boolean
    lateFeePercentage: number
  }
  notifications: {
    sendReminderBefore: number
    sendOverdueNotice:  boolean
    overdueDays:        number
  }
}

export const recurringInvoiceSettingsApi = {
  get:    ()                                           => getSettings<RecurringInvoiceSettings>('recurring_invoice'),
  update: (data: Partial<RecurringInvoiceSettings>)   => saveSettings<RecurringInvoiceSettings>('recurring_invoice', data),
}
