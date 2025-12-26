// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid2'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

// Type Imports
import type { ExpenseType } from '@/types/expenses/expenseTypes'

const TableFilters = ({
  setData,
  tableData
}: {
  setData: (data: ExpenseType[]) => void
  tableData?: ExpenseType[]
}) => {
  // States
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  const handleSearch = () => {
    const filteredData = tableData?.filter(expense => {
      // Date range filtering
      if (startDate || endDate) {
        const expenseDate = new Date(expense.date)

        if (startDate) {
          const start = new Date(startDate)

          start.setHours(0, 0, 0, 0)
          if (expenseDate < start) return false
        }

        if (endDate) {
          const end = new Date(endDate)

          end.setHours(23, 59, 59, 999)
          if (expenseDate > end) return false
        }
      }

      return true
    })

    setData(filteredData || [])
  }

  return (
    <CardContent>
      <Grid container spacing={5}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            type='date'
            label='Start Date'
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            InputLabelProps={{
              shrink: true
            }}
            size='small'
            placeholder='dd/mm/yyyy'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <TextField
            fullWidth
            type='date'
            label='End Date'
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            InputLabelProps={{
              shrink: true
            }}
            size='small'
            placeholder='dd/mm/yyyy'
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }} className='flex items-end'>
          <Button
            variant='contained'
            color='primary'
            size='medium'
            onClick={handleSearch}
            startIcon={<i className='ri-search-line' />}
            fullWidth
          >
            Search
          </Button>
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
