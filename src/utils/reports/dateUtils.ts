// Documentation: /docs/reports/reports-flow.md

import type { DateRangePreset, DateRange } from '@/types/reports/reportTypes'

export const getDateRangeFromPreset = (preset: DateRangePreset): DateRange => {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  const startDate = new Date()

  switch (preset) {
    case 'last7days':
      startDate.setDate(today.getDate() - 7)
      break
    case 'last30days':
      startDate.setDate(today.getDate() - 30)
      break
    case 'last3months':
      startDate.setMonth(today.getMonth() - 3)
      break
    case 'last6months':
      startDate.setMonth(today.getMonth() - 6)
      break
    case 'lastyear':
      startDate.setFullYear(today.getFullYear() - 1)
      break
    case 'alltime':
      startDate.setFullYear(2020, 0, 1) // Set to a reasonable start date
      break
    case 'custom':
      return { startDate: null, endDate: null, preset: 'custom' }
  }

  startDate.setHours(0, 0, 0, 0)

  return {
    startDate,
    endDate: today,
    preset
  }
}

export const formatDateRange = (dateRange: DateRange): string => {
  if (!dateRange.startDate || !dateRange.endDate) {
    return 'Select date range'
  }

  const start = dateRange.startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  const end = dateRange.endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return `${start} - ${end}`
}

export const getPresetLabel = (preset: DateRangePreset): string => {
  const labels: Record<DateRangePreset, string> = {
    last7days: 'Last 7 days',
    last30days: 'Last 30 days',
    last3months: 'Last 3 months',
    last6months: 'Last 6 months',
    lastyear: 'Last year',
    alltime: 'All time',
    custom: 'Custom range'
  }

  return labels[preset]
}

