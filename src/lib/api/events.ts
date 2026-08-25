/**
 * Cross-screen "this data changed" signals.
 *
 * Some figures are rendered by a component that has no idea what caused them to change. The
 * invoice stats tiles are the clearest case: they sit beside the invoice table as siblings with
 * no shared state, and they also move when a payment is recorded from an entirely different
 * screen. So neither a prop nor a page-level refresh key covers it.
 *
 * The tiles used to load once on mount and never again — `useEffect(..., [])` — so a landlord
 * who created an invoice while the page was open saw the old counts until a full page load.
 * "Overdue Invoices: 0" for a bill seven weeks past due, and pressing Refresh did not help
 * because Refresh reloaded the table, not the tiles.
 *
 * A window event rather than a store: this codebase already signals across components this way
 * (`onboard-tenant:open`, `AUTH_SESSION_EXPIRED`), and it keeps the API layer free of any
 * dependency on which components happen to be listening.
 */
export const BILLING_CHANGED = 'billing:changed'

/** Call after any mutation that moves an invoice figure — created, edited, paid, deleted. */
export function emitBillingChanged(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(BILLING_CHANGED))
}
