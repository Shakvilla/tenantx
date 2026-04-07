/**
 * Math and calculation utilities for the TenantApp
 */

/**
 * Calculate the lease period in months between two dates
 */
export function calculateLeasePeriod(moveInDate?: string | null, moveOutDate?: string | null): string {
  if (!moveInDate || !moveOutDate) return '-'

  const start = new Date(moveInDate)
  const end = new Date(moveOutDate)
  
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
  
  return `${months} months`
}

/**
 * Format currency value
 */
export function formatCurrency(amount: number | string): string {
  if (typeof amount === 'string') return amount
  
  return `₵${amount.toLocaleString()}`
}

/**
 * Calculate total amount based on monthly rent and period
 */
export function calculateTotalAmount(costPerMonth: number, months: number): string {
  return formatCurrency(costPerMonth * months)
}
