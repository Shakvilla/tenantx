// Documentation: /docs/reports/reports-flow.md

'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

// Type Imports
import type { DateRange, DateRangePreset } from '@/types/reports/reportTypes'

// Util Imports
import { getDateRangeFromPreset, getPresetLabel, formatDateRange } from '@/utils/reports/dateUtils'

type Props = {
  dateRange: DateRange
  onDateRangeChange: (dateRange: DateRange) => void
}

const DateRangeFilter = ({ dateRange, onDateRangeChange }: Props) => {
  const initialPreset = dateRange.preset || 'last30days'
  const [preset, setPreset] = useState<DateRangePreset>(initialPreset)
  const [startDate, setStartDate] = useState<string>(
    dateRange.startDate ? dateRange.startDate.toISOString().split('T')[0] : ''
  )
  const [endDate, setEndDate] = useState<string>(
    dateRange.endDate ? dateRange.endDate.toISOString().split('T')[0] : ''
  )

  const handlePresetChange = (newPreset: DateRangePreset) => {
    setPreset(newPreset)
    if (newPreset !== 'custom') {
      const newRange = getDateRangeFromPreset(newPreset)
      setStartDate(newRange.startDate ? newRange.startDate.toISOString().split('T')[0] : '')
      setEndDate(newRange.endDate ? newRange.endDate.toISOString().split('T')[0] : '')
      onDateRangeChange(newRange)
    }
  }

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)

      onDateRangeChange({
        startDate: start,
        endDate: end,
        preset: 'custom'
      })
    }
  }

  const presets: DateRangePreset[] = ['last7days', 'last30days', 'last3months', 'last6months', 'lastyear', 'alltime', 'custom']

  return (
    <Box className='flex flex-col gap-4'>
      <Grid container spacing={4}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <FormControl fullWidth size='small'>
            <InputLabel id='preset-label'>Date Range</InputLabel>
            <Select
              labelId='preset-label'
              label='Date Range'
              value={preset}
              onChange={e => handlePresetChange(e.target.value as DateRangePreset)}
            >
              {presets.map(p => (
                <MenuItem key={p} value={p}>
                  {getPresetLabel(p)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {preset === 'custom' && (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                type='date'
                label='Start Date'
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size='small'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                type='date'
                label='End Date'
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                size='small'
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Button
                variant='contained'
                color='primary'
                size='medium'
                onClick={handleCustomDateChange}
                fullWidth
                disabled={!startDate || !endDate}
              >
                Apply
              </Button>
            </Grid>
          </>
        )}

        {preset !== 'custom' && (
          <Grid size={{ xs: 12, sm: 6, md: 8 }}>
            <TextField
              fullWidth
              label='Selected Range'
              value={formatDateRange(dateRange)}
              InputProps={{ readOnly: true }}
              size='small'
            />
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default DateRangeFilter

