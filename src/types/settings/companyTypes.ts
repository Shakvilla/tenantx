// Documentation: /docs/settings/settings-module.md

export type LegalEntityType =
  | 'sole_proprietorship'
  | 'partnership'
  | 'limited_liability'
  | 'corporation'
  | 'non_profit'
  | 'other'

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface CompanyBasicInfo {
  companyName: string
  address: Address

  /**
   * @deprecated The published contact number lives on `tenants.contact_phone`,
   * written through `contactSettingsApi` — occupants read it, and this blob key
   * was never read by anything. Optional so nothing writes it going forward;
   * still declared because existing rows carry a stale copy that the settings
   * form reads once, as a fallback, to migrate the value on first save.
   */
  phone?: string
  email: string
  website?: string
  logo?: string
  timezone: string
}

export interface CompanyAdvancedInfo {
  taxId: string
  vatNumber?: string
  registrationNumber: string
  legalEntityType: LegalEntityType
  businessLicenseNumber?: string
  fiscalYearStart: string
  legalAddress?: Address
}

export interface CompanySettings {
  basic: CompanyBasicInfo
  advanced: CompanyAdvancedInfo
}
