import { describe, it, expect } from 'vitest'

import { formatCurrency } from '@/utils/currency'

/**
 * A unit's rent must be shown in the currency it is stored in.
 *
 * The units list built its display string as `₵${unit.rent}` — a hardcoded cedi sign over a
 * field that really can be USD. The East Legon lease is $800; the list said ₵800, eleven times
 * too small, and that figure went on to feed the vacancy sum, the forecast and the P&L. The
 * landlord reported it as his number one finding on three separate visits, each time believing
 * the currency had been thrown away on save.
 *
 * It had not: the database holds USD faithfully. Two things were wrong, and neither was the
 * save — the list hardcoded the symbol, and the edit form never loaded the currency, so the
 * next edit really would have rewritten it to cedis.
 */
describe('unit rent display', () => {
  it('shows a dollar-priced unit in dollars', () => {
    expect(formatCurrency(800, 'USD')).toContain('$')
    expect(formatCurrency(800, 'USD')).not.toContain('₵')
  })

  it('still shows a cedi-priced unit in cedis', () => {
    expect(formatCurrency(850, 'GHS')).toContain('₵')
  })

  it('defaults to cedis when a unit has no currency recorded', () => {
    expect(formatCurrency(600, undefined)).toContain('₵')
  })
})
