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
 *
 * `contact` is NOT one of them — see `contactSettingsApi` below.
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

// ---- Contact phone ---------------------------------------------------------

/**
 * The landlord's published contact number. Typed, unlike everything above it:
 * it writes the `tenants.contact_phone` column rather than a JSON blob, so it
 * does not go through `getSettings`/`saveSettings` and its response is the bare
 * object rather than `{ category, settings }`.
 *
 * This is the number occupants see and dial in the mobile app's "Contact
 * landlord" sheet. Until it is set, that sheet's call and WhatsApp rows stay
 * inert, so this endpoint is the only thing that turns them on.
 *
 * `/settings/contact` resolves to this typed controller rather than
 * `/settings/{category}`, because Spring ranks a literal path segment above a
 * path variable. `contact` is therefore a reserved category name.
 */
export interface TenantContact {

  /** Normalised to E.164 by the backend on write; null when none is set. */
  contactPhone: string | null

  /**
   * The company name captured at signup (`tenants.name`). Read-only — writes go
   * to the settings blob as before. It is here so Company Settings can pre-fill
   * its required Company Name field instead of showing it blank to a landlord
   * who already typed it.
   */
  companyName?: string | null
}

/** Matches the backend's `@Pattern` exactly. Blank is legal — it clears. */
export const CONTACT_PHONE_PATTERN = /^\s*$|^\+?[0-9()\s-]{7,16}$/

export const contactSettingsApi = {
  get:    ()                        => apiGet<TenantContact>(`${API_BASE}/settings/contact`),
  update: (contactPhone: string)    => apiPut<TenantContact>(`${API_BASE}/settings/contact`, { contactPhone }),
}

// ---- Payment (Tax + Currency only — gateway settings are admin-only) --------

export type LandlordPaymentSettings = Pick<PaymentSettings, 'tax' | 'currency'>

export const paymentSettingsApi = {
  get:    ()                                        => getSettings<LandlordPaymentSettings>('payment'),
  update: (data: Partial<LandlordPaymentSettings>)  => saveSettings<LandlordPaymentSettings>('payment', data),
}

// ---- Notification (Email Templates + Email Preferences only) ---------------

export type LandlordNotificationSettings = Pick<NotificationSettings, 'emailTemplates' | 'emailPreferences'> & {

  /** Master toggle for in-app (bell) notifications. Defaults to true when unset. */
  inAppEnabled?: boolean
}

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
