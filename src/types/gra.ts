/**
 * GRA Tax Compliance Types
 *
 * Used for rental income reporting and Withholding Tax (WHT) estimation.
 * WHT rate: 8% on rental income for residents (GRA Act 896, Section 114).
 * Stamp Duty: 0.5% of total lease value (computed per-agreement on the frontend).
 */

export interface GraPropertyBreakdown {
  propertyId: string
  propertyName: string
  totalInvoiced: number
  totalCollected: number
  estimatedWHT: number
}

export interface GraTaxSummary {
  year: number
  quarter: number | null   // null = full year
  totalInvoiced: number
  totalCollected: number
  estimatedWHT: number
  invoiceCount: number
  properties: GraPropertyBreakdown[]
}
