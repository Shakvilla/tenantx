// React Imports
import { useState, useEffect } from 'react'

// MUI Imports
import CardContent from '@mui/material/CardContent'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid2'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'

// Type Imports
import type { CustomerType } from '@/types/members/customerTypes'

const TableFilters = ({
  setData,
  tableData
}: {
  setData: (data: CustomerType[]) => void
  tableData?: CustomerType[]
}) => {
  // States
  const [status, setStatus] = useState<CustomerType['status'] | ''>('')
  const [agent, setAgent] = useState<string>('')
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  useEffect(() => {
    const filteredData = tableData?.filter(customer => {
      if (status && customer.status !== status) return false
      if (agent && customer.agent !== agent) return false

      // Date range filtering
      if (startDate || endDate) {
        // Parse registration date (format: "2023-10-30 11:19:51")
        const registrationDateStr = customer.registrationDate.split(' ')[0] // Get date part only
        const registrationDate = new Date(registrationDateStr)

        if (startDate) {
          const start = new Date(startDate)

          start.setHours(0, 0, 0, 0)
          if (registrationDate < start) return false
        }

        if (endDate) {
          const end = new Date(endDate)

          end.setHours(23, 59, 59, 999)
          if (registrationDate > end) return false
        }
      }

      return true
    })

    setData(filteredData || [])
  }, [status, agent, startDate, endDate, tableData, setData])

  // Get unique agents from tableData
  const uniqueAgents = Array.from(new Set(tableData?.map(customer => customer.agent).filter(Boolean) || []))

  return (
    <CardContent>
      <Grid container spacing={5}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth>
            <InputLabel id='status-select' size='small'>
              Select Status
            </InputLabel>
            <Select
              fullWidth
              id='select-status'
              size='small'
              value={status}
              onChange={e => setStatus(e.target.value as CustomerType['status'] | '')}
              label='Select Status'
              labelId='status-select'
              inputProps={{ placeholder: 'Select Status' }}
            >
              <MenuItem value=''>Select Status</MenuItem>
              <MenuItem value='active'>Active</MenuItem>
              <MenuItem value='suspend'>Suspend</MenuItem>
              <MenuItem value='inactive'>Inactive</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth>
            <InputLabel id='agent-select' size='small'>
              Select Agent
            </InputLabel>
            <Select
              fullWidth
              id='select-agent'
              size='small'
              value={agent}
              onChange={e => setAgent(e.target.value)}
              label='Select Agent'
              labelId='agent-select'
              inputProps={{ placeholder: 'Select Agent' }}
            >
              <MenuItem value=''>Select Agent</MenuItem>
              {uniqueAgents.map(agentName => (
                <MenuItem key={agentName} value={agentName}>
                  {agentName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
          />
        </Grid>
      </Grid>
    </CardContent>
  )
}

export default TableFilters
