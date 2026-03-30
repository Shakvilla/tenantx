/**
 * Currency utility functions
 */

/**
 * Formats a number as Ghanaian Cedi (GHS)
 * @param amount - The amount to format
 * @returns The formatted currency string
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '₵0.00'
  
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}
