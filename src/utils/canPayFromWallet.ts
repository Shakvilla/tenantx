/**
 * Whether a wallet balance can cover a subscription charge.
 * Rule: balance must be at least the amount (>=), and the amount must be positive.
 */
export function canPayFromWallet(balance: number, amount: number): boolean {
  return amount > 0 && balance >= amount
}
