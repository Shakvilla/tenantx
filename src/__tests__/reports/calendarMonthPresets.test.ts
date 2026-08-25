import { describe, it, expect } from 'vitest'

import { getDateRangeFromPreset, getPresetLabel } from '@/utils/reports/dateUtils'

/**
 * The filter offered Last 7 days / 30 days / 3 months / 6 months / Last year / All time / Custom.
 * A landlord's question is "how did August go" and "August against last August" — neither of
 * which a rolling window ending today can express, so every calendar month had to be assembled
 * by hand through Custom range, twice, to make one comparison.
 */
describe('calendar-month presets', () => {
  it('this month runs from the 1st, not 30 days back', () => {
    const { startDate, endDate } = getDateRangeFromPreset('thismonth')
    const today = new Date()

    expect(startDate!.getDate()).toBe(1)
    expect(startDate!.getMonth()).toBe(today.getMonth())
    expect(endDate!.getMonth()).toBe(today.getMonth())
  })

  it('last month is a whole month, first to last day', () => {
    const { startDate, endDate } = getDateRangeFromPreset('lastmonth')
    const expected = new Date()

    expected.setMonth(expected.getMonth() - 1)

    expect(startDate!.getDate()).toBe(1)
    expect(startDate!.getMonth()).toBe(expected.getMonth())
    // The last day of that month, whatever length it happens to be.
    expect(endDate!.getMonth()).toBe(expected.getMonth())
    expect(new Date(endDate!.getTime() + 86_400_000).getDate()).toBe(1)
  })

  it('same month last year is the comparison the rolling presets could not make', () => {
    const { startDate, endDate } = getDateRangeFromPreset('samemonthlastyear')
    const today = new Date()

    expect(startDate!.getFullYear()).toBe(today.getFullYear() - 1)
    expect(startDate!.getMonth()).toBe(today.getMonth())
    expect(startDate!.getDate()).toBe(1)
    expect(endDate!.getMonth()).toBe(today.getMonth())
  })

  it('every preset has a label a landlord would recognise', () => {
    expect(getPresetLabel('thismonth')).toBe('This month')
    expect(getPresetLabel('lastmonth')).toBe('Last month')
    expect(getPresetLabel('samemonthlastyear')).toBe('Same month last year')
  })
})
