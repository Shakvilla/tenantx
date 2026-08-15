'use client'

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'

interface CompletionScreenProps {
  onGoToDashboard: () => void
  onViewInvoice: () => void
}

export default function CompletionScreen({ onGoToDashboard, onViewInvoice }: CompletionScreenProps) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, px: 4 }}>
      <Avatar sx={{ bgcolor: 'success.main', width: 72, height: 72, mx: 'auto', mb: 4 }}>
        <i className='ri-check-line' style={{ fontSize: 40 }} />
      </Avatar>
      <Typography variant='h4' sx={{ mb: 2 }}>
        You&apos;re all set!
      </Typography>
      <Typography color='text.secondary' sx={{ mb: 6, maxWidth: 460, mx: 'auto' }}>
        Your property, occupant, and first invoice are ready. Your tenant will receive a notification.
      </Typography>
      <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
        <Button variant='contained' onClick={onGoToDashboard}>
          Go to Dashboard
        </Button>
        <Button variant='outlined' onClick={onViewInvoice}>
          View Invoice
        </Button>
      </Box>
    </Box>
  )
}

export type { CompletionScreenProps }
