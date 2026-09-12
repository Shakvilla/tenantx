'use client'

import { useState, useEffect } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'

import { getMySenderIdRequests, getSmsCreditAccount } from '@/lib/api/sms-credit'

/**
 * Persistent info banner shown on the dashboard until the landlord has completed
 * SMS setup (requested a Sender ID AND has SMS credits). Unlike the low-credit
 * warning banner, this one proactively guides new landlords to set up automated
 * SMS reminders before they start onboarding tenants.
 *
 * Dismissed automatically once:
 *  - A Sender ID request has been submitted (any status), OR
 *  - The tenant has SMS credit balance > 0
 */
export default function SmsSetupBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    Promise.all([getMySenderIdRequests(), getSmsCreditAccount()])
      .then(([requests, account]) => {
        const hasRequestedSender = requests.length > 0
        const hasCredits = account && account.balance > 0

        // Show banner only if landlord hasn't started SMS setup at all
        if (!hasRequestedSender && !hasCredits) {
          setShow(true)
        }
      })
      .catch(() => {})
  }, [])

  if (!show) return null

  return (
    <Collapse in unmountOnExit>
      <Alert
        severity='info'
        icon={<i className='ri-message-3-line' />}
        action={
          <Button
            component='a'
            href='/settings/sms'
            size='small'
            color='inherit'
            variant='outlined'
            sx={{ fontWeight: 600, borderColor: 'currentColor' }}
          >
            Get Started
          </Button>
        }
        sx={{
          borderRadius: 0,
          borderBottom: '1px solid',
          borderColor: 'info.dark',
          bgcolor: 'info.main',
          color: '#fff',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexWrap: 'wrap',
          '& .MuiAlert-message': { flex: '1 1 auto', minWidth: 0 },
          '& .MuiAlert-action': {
            paddingTop: { xs: 0, sm: 2 },
            width: { xs: '100%', sm: 'auto' }
          },
          '& .MuiAlert-action .MuiButton-root': {
            width: { xs: '100%', sm: 'auto' }
          }
        }}
      >
        Set up SMS reminders — your plan includes automated rent and lease notifications. Create a Sender ID and add credits to start sending.
      </Alert>
    </Collapse>
  )
}
