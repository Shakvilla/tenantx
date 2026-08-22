'use client'

import { useState } from 'react'

import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import FormControl from '@mui/material/FormControl'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import CircularProgress from '@mui/material/CircularProgress'

import { updateAgreementStatus } from '@/lib/api/agreements'

interface Props {
  agreementId: string
  occupantName: string
  unitNo?: string
  onFinish: (activated: boolean) => void
}

export default function MoveInStep({ agreementId, occupantName, unitNo, onFinish }: Props) {
  const [choice, setChoice] = useState<'activate' | 'pending'>('activate')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleFinish = async () => {
    setError(null)

    if (choice === 'pending') {
      onFinish(false)

      return
    }

    setSubmitting(true)

    try {
      await updateAgreementStatus(agreementId, 'ACTIVE')
      onFinish(true)
    } catch (e: any) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Could not activate the lease. It has been saved as pending — you can activate it later.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box>
      {error && (
        <Alert severity='error' sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      <Typography variant='body1' sx={{ mb: 2 }}>
        {/* unitNo already carries its own label (e.g. "Unit A1", "Room 116") — don't prefix
            another "Unit" or the copy reads "Unit Unit A1". */}
        Almost done. Is {occupantName || 'this tenant'} moving into {unitNo || 'the unit'} now?
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 4 }}>
        Activating marks the unit as occupied and counts the tenant in your dashboard. Only activate on (or just
        before) the day they actually get the keys — otherwise keep it pending and activate it later.
      </Typography>
      <FormControl>
        <RadioGroup value={choice} onChange={e => setChoice(e.target.value as 'activate' | 'pending')}>
          <FormControlLabel value='activate' control={<Radio />} label='Activate now — the tenant is moving in' />
          <FormControlLabel value='pending' control={<Radio />} label='Keep pending — I&apos;ll activate later' />
        </RadioGroup>
      </FormControl>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant='contained'
          disabled={submitting}
          onClick={handleFinish}
          endIcon={submitting ? <CircularProgress size={18} color='inherit' /> : undefined}
        >
          Finish
        </Button>
      </Box>
    </Box>
  )
}
