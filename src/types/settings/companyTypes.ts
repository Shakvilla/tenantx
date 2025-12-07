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
  phone: string
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
