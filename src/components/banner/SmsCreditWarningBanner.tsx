'use client'

import { useState, useEffect } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import Collapse from '@mui/material/Collapse'

import { getSmsCreditAccount } from '@/lib/api/sms-credit'

const LOW_BALANCE_MESSAGE_THRESHOLD = 10

/**
 * Shown only when the tenant has an active SMS sender ID (i.e. opted into the SMS credit
 * system) AND their balance is low — mirrors SubscriptionWarningBanner's shape exactly.
 */
export default function SmsCreditWarningBanner() {
  const [show, setShow] = useState(false)
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    getSmsCreditAccount()
      .then(account => {
        if (account.activeSenderId && account.estimatedMessagesRemaining < LOW_BALANCE_MESSAGE_THRESHOLD) {
          setRemaining(account.estimatedMessagesRemaining)
          setShow(true)
        }
      })
      .catch(() => {})
  }, [])

  if (!show) return null

  return (
    <Collapse in unmountOnExit>
      <Alert
        severity='warning'
        icon={<i className='ri-message-3-line' />}
        action={
          <Button
            component='a'
            href='/settings/sms'
            size='small'
            color='inherit'
            variant='outlined'
            sx={{ whiteSpace: 'nowrap', fontWeight: 600, borderColor: 'currentColor' }}
          >
            Top Up Now
          </Button>
        }
        sx={{ borderRadius: 0, borderBottom: '1px solid', borderColor: 'warning.dark' }}
      >
        Your SMS credit is running low (~{remaining} messages remaining). Some reminders may not be sent until you top up.
      </Alert>
    </Collapse>
  )
}
