'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Divider from '@mui/material/Divider'
import TextField from '@mui/material/TextField'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import Grid from '@mui/material/Grid2'
import Button from '@mui/material/Button'

const AutoGenerationSettings = () => {
  // States
  const [autoGenerate, setAutoGenerate] = useState(true)
  const [generationDay, setGenerationDay] = useState('1')
  const [advanceDays, setAdvanceDays] = useState('7')

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving auto generation settings', {
      autoGenerate,
      generationDay,
      advanceDays
    })
  }

  return (
    <Card>
      <CardHeader
        title='Auto Generation Settings'
        subheader='Configure automatic invoice generation for recurring payments'
      />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <FormControlLabel
          control={<Switch checked={autoGenerate} onChange={e => setAutoGenerate(e.target.checked)} />}
          label={
            <div className='flex flex-col'>
              <Typography className='font-medium'>Enable Auto Generation</Typography>
              <Typography variant='body2' color='text.secondary'>
                Automatically generate invoices based on recurring settings
              </Typography>
            </div>
          }
        />

        {autoGenerate && (
          <Grid container spacing={6}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size='small'>
                <InputLabel>Generation Day</InputLabel>
                <Select value={generationDay} onChange={e => setGenerationDay(e.target.value)} label='Generation Day'>
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <MenuItem key={day} value={day.toString()}>
                      Day {day}
                    </MenuItem>
                  ))}
                  <MenuItem value='last'>Last Day of Month</MenuItem>
                </Select>
              </FormControl>
              <Typography variant='caption' color='text.secondary' className='mts-1'>
                Day of the month when invoices should be generated
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size='small'
                type='number'
                label='Advance Days'
                value={advanceDays}
                onChange={e => setAdvanceDays(e.target.value)}
                helperText='Number of days before due date to generate invoice'
                slotProps={{
                  input: {
                    inputProps: { min: 1, max: 30 }
                  }
                }}
              />
            </Grid>
          </Grid>
        )}

        <div className='flex justify-end'>
          <Button variant='contained' color='primary' onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default AutoGenerationSettings

