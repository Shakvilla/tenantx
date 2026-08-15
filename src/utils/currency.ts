/**
 * Currency utility functions — supports GHS (default) and USD.
 */

/**
 * Formats a number in the given currency (defaults to GHS).
 * Supports GHS (₵) and USD ($). Falls back to GHS for unknown codes.
 */
export const formatCurrency = (amount: number | null | undefined, currency = 'GHS'): string => {
  const value = amount ?? 0

  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)
  }

  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

/**
 * Formats an amount and, when currency is USD, appends the GHS equivalent.
 * e.g.  "$1,200.00 (≈₵14,400.00)"
 *
 * @param amount        - The amount in the given currency
 * @param currency      - 'GHS' | 'USD'
 * @param usdToGhsRate  - Current USD → GHS rate (required for the GHS equivalent)
 */
export const formatDual = (
  amount: number | null | undefined,
  currency = 'GHS',
  usdToGhsRate?: number | null,
): string => {
  const main = formatCurrency(amount, currency)
  if (currency !== 'USD' || !usdToGhsRate || amount == null) return main
  const ghs = amount * usdToGhsRate
  return `${main} (≈${formatCurrency(ghs, 'GHS')})`
}

/**
 * Converts a USD amount to GHS using the given rate.
 * Returns the original amount if currency is already GHS or rate is missing.
 */
export const toGhs = (amount: number, currency: string, usdToGhsRate?: number | null): number => {
  if (currency === 'USD' && usdToGhsRate) return amount * usdToGhsRate
  return amount
}
