import { describe, it, expect } from 'vitest'

import { toApiDateParams } from '@/utils/reports/dateUtils'

/**
 * These assertions are about the WIRE FORMAT, not about formatting prettily.
 *
 * The backend binds these query params to Java types, and Spring's parsers are
 * strict:
 *   - `LocalDate`     accepts `2026-07-13`
 *   - `LocalDateTime` accepts `2026-07-13T00:00:00` and rejects anything with
 *     milliseconds or a zone designator
 *
 * `datetime` mode used to send a full `toISOString()` — `2026-07-13T00:00:00.000Z`
 * — so every request carrying it came back 400:
 *
 *   GET /api/v1/occupants?startDate=2026-07-13T00:00:00.000Z
 *   {"message":"Parameter 'startDate' is not a valid LocalDateTime."}
 *
 * Measured against the running backend before this was written:
 *
 *   /occupants           ?startDate=2026-07-13T00:00:00.000Z  400
 *   /occupants           ?startDate=2026-07-13T00:00:00       200
 *   /maintenance/requests?startDate=2026-07-13T00:00:00.000Z  400
 *   /maintenance/requests?startDate=2026-07-13T00:00:00       200
 *
 * The Tenants and Maintenance reports were the two callers, and both rendered
 * the failure as legitimate zeros.
 */
describe('toApiDateParams', () => {
  const range = {
    startDate: new Date('2026-07-13T00:00:00.000Z'),
    endDate: new Date('2026-08-12T23:59:59.999Z')
  } as any

  describe('datetime mode (LocalDateTime params)', () => {
    it('emits no milliseconds and no zone designator', () => {
      // Either one on its own is enough to make Spring reject the request.
      const { startDate, endDate } = toApiDateParams(range, 'datetime')

      expect(startDate).toBe('2026-07-13T00:00:00')
      expect(endDate).toBe('2026-08-12T23:59:59')

      for (const v of [startDate, endDate]) {
        expect(v).not.toContain('Z')
        expect(v).not.toContain('.')
      }
    })

    it('matches the exact shape LocalDateTime accepts', () => {
      const { startDate } = toApiDateParams(range, 'datetime')

      expect(startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    })
  })

  describe('date mode (LocalDate params)', () => {
    it('still emits a bare calendar date', () => {
      // Unchanged — the invoices/expenses/P&L endpoints take LocalDate and work.
      expect(toApiDateParams(range, 'date')).toEqual({
        startDate: '2026-07-13',
        endDate: '2026-08-12'
      })
    })

    it('defaults to date mode when no mode is given', () => {
      expect(toApiDateParams(range).startDate).toBe('2026-07-13')
    })
  })

  it('leaves an absent bound undefined rather than sending an empty param', () => {
    // "All time" has no bounds; the params must be omitted, not sent blank.
    const open = { startDate: null, endDate: null } as any

    expect(toApiDateParams(open, 'datetime')).toEqual({
      startDate: undefined,
      endDate: undefined
    })
  })
})
