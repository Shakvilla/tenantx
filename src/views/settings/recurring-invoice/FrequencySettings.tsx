'use client'

// React Imports
import { useState } from 'react'

// MUI Imports
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import Divider from '@mui/material/Divider'
import Button from '@mui/material/Button'

const FrequencySettings = () => {
  // States
  const [frequency, setFrequency] = useState('monthly')

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving frequency settings', { frequency })
  }

  return (
    <Card>
      <CardHeader
        title='Recurring Frequency'
        subheader='Set the default frequency for recurring invoices'
      />
      <Divider />
      <CardContent className='flex flex-col gap-6'>
        <FormControl>
          <FormLabel>Default Recurring Frequency</FormLabel>
          <RadioGroup value={frequency} onChange={e => setFrequency(e.target.value)}>
            <FormControlLabel value='weekly' control={<Radio />} label='Weekly' />
            <FormControlLabel value='bi-weekly' control={<Radio />} label='Bi-Weekly' />
            <FormControlLabel value='monthly' control={<Radio />} label='Monthly' />
            <FormControlLabel value='quarterly' control={<Radio />} label='Quarterly' />
            <FormControlLabel value='semi-annually' control={<Radio />} label='Semi-Annually' />
            <FormControlLabel value='annually' control={<Radio />} label='Annually' />
          </RadioGroup>
        </FormControl>

        <Typography variant='body2' color='text.secondary'>
          This frequency will be used as the default when creating new recurring invoices. You can override this for
          individual invoices.
        </Typography>

        <div className='flex justify-end'>
          <Button variant='contained' color='primary' onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default FrequencySettings

