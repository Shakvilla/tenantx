'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

interface Props {
  activated: boolean
  occupantName: string
  unitNo?: string
  onCreateInvoice: () => void
  onViewTenant: () => void
  onOnboardAnother: () => void
  onDone: () => void
}

export default function OnboardCompletionScreen({
  activated,
  occupantName,
  unitNo,
  onCreateInvoice,
  onViewTenant,
  onOnboardAnother,
  onDone
}: Props) {
  const where = unitNo ? `Unit ${unitNo}` : 'the unit'

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto', textAlign: 'center', mt: 6 }}>
      <Box sx={{ fontSize: 56, mb: 2 }}>
        <i className='ri-checkbox-circle-line' style={{ color: 'var(--mui-palette-success-main)' }} />
      </Box>
      {activated ? (
        <>
          <Typography variant='h5' sx={{ mb: 1 }}>
            {occupantName} has moved into {where}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 5 }}>
            The lease is active and the unit is now marked occupied. The natural next step is the first rent invoice.
          </Typography>
        </>
      ) : (
        <>
          <Typography variant='h5' sx={{ mb: 1 }}>
            Lease saved as pending for {occupantName}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 5 }}>
            Nothing else is needed now. Activate the lease from the Agreements page on the day {occupantName} gets the
            keys to {where}.
          </Typography>
        </>
      )}
      <Stack spacing={2} sx={{ maxWidth: 320, mx: 'auto' }}>
        <Button variant='contained' onClick={onCreateInvoice} startIcon={<i className='ri-file-add-line' />}>
          Create first invoice
        </Button>
        <Button variant='outlined' onClick={onViewTenant} startIcon={<i className='ri-user-line' />}>
          View tenant
        </Button>
        <Button variant='text' onClick={onOnboardAnother} startIcon={<i className='ri-user-add-line' />}>
          Onboard another tenant
        </Button>
        <Button variant='text' color='inherit' onClick={onDone}>
          Done
        </Button>
      </Stack>
    </Box>
  )
}
