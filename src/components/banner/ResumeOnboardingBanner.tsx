'use client'

import { useEffect, useState } from 'react'

import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'

import { getStoredTenantId } from '@/lib/api/storage'
import { getOnboardingState, isOnboardingDismissed } from '@/views/onboarding/onboardingState'

export default function ResumeOnboardingBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const evaluate = () => {
      const tid = getStoredTenantId()

      if (!tid) return setShow(false)
      setShow(!isOnboardingDismissed(tid) && getOnboardingState(tid) !== null)
    }

    evaluate()
    const onAvail = () => evaluate()

    window.addEventListener('onboarding:resume-available', onAvail)
    
return () => window.removeEventListener('onboarding:resume-available', onAvail)
  }, [])

  if (!show) return null

  return (
    <Alert
      severity='info'
      action={
        <Button
          color='inherit'
          size='small'
          onClick={() => {
            setShow(false)
            window.dispatchEvent(new CustomEvent('onboarding:open'))
          }}
        >
          Continue your setup →
        </Button>
      }
    >
      You haven&apos;t finished setting up your first property.
    </Alert>
  )
}
