'use client'

import { useCallback, useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import DialogActions from '@mui/material/DialogActions'
import IconButton from '@mui/material/IconButton'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

import { getStoredTenantId } from '@/lib/api/storage'
import type { OnboardingEntityIds } from './onboardingTypes'
import TenantHomeStep, { type TenantHomeResult } from './steps/TenantHomeStep'
import LeaseTermsStep from './steps/LeaseTermsStep'
import MoveInStep from './steps/MoveInStep'
import OnboardCompletionScreen from './steps/OnboardCompletionScreen'

const STEP_LABELS = ['Tenant & Home', 'Lease terms', 'Move-in']

const emptyCtx = { rent: 0, moveInDate: '', occupantName: '' }

export default function OnboardTenantWizard() {
  const router = useRouter()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [entityIds, setEntityIds] = useState<OnboardingEntityIds>({})
  const [ctx, setCtx] = useState(emptyCtx)
  const [activated, setActivated] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  const reset = useCallback(() => {
    setStep(0)
    setEntityIds({})
    setCtx(emptyCtx)
    setActivated(false)
    setCompleted(false)
  }, [])

  useEffect(() => {
    const openWizard = () => {
      setTenantId(getStoredTenantId())
      reset()
      setOpen(true)
    }

    window.addEventListener('onboard-tenant:open', openWizard)

    return () => window.removeEventListener('onboard-tenant:open', openWizard)
  }, [reset])

  const handleHomeComplete = (result: TenantHomeResult) => {
    setEntityIds(prev => ({ ...prev, ...result.ids }))
    setCtx({ rent: result.rent, moveInDate: result.moveInDate, occupantName: result.occupantName })
    setStep(1)
  }

  const handleLeaseComplete = (ids: Partial<OnboardingEntityIds>) => {
    setEntityIds(prev => ({ ...prev, ...ids }))
    setStep(2)
  }

  const handleFinish = (wasActivated: boolean) => {
    setActivated(wasActivated)
    setCompleted(true)
  }

  const requestClose = () => {
    if (!completed && entityIds.occupantId) {
      setConfirmClose(true)

      return
    }

    setOpen(false)
  }

  if (!open) return null

  return (
    <>
      <Dialog fullScreen open={open} onClose={requestClose}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant='h5' component='span'>
            Onboard a Tenant
          </Typography>
          <IconButton aria-label='close onboarding' onClick={requestClose}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {completed ? (
            <OnboardCompletionScreen
              activated={activated}
              occupantName={ctx.occupantName}
              unitNo={entityIds.unitNo}
              onCreateInvoice={() => {
                setOpen(false)
                const q = new URLSearchParams({ create: '1' })

                if (entityIds.occupantId) q.set('occupantId', entityIds.occupantId)
                if (entityIds.propertyId) q.set('propertyId', entityIds.propertyId)
                if (entityIds.unitId) q.set('unitId', entityIds.unitId)
                if (ctx.rent) q.set('amount', String(ctx.rent))
                router.push(`/billing/invoices?${q.toString()}`)
              }}
              onViewTenant={() => {
                setOpen(false)
                if (entityIds.occupantId) router.push(`/occupants/${entityIds.occupantId}`)
              }}
              onOnboardAnother={reset}
              onDone={() => setOpen(false)}
            />
          ) : (
            <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
              <Stepper activeStep={step} sx={{ mb: 8 }}>
                {STEP_LABELS.map(label => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              {step === 0 && tenantId && (
                <TenantHomeStep
                  tenantId={tenantId}
                  onComplete={handleHomeComplete}
                  onExit={route => {
                    setOpen(false)
                    router.push(route)
                  }}
                />
              )}
              {step === 1 && (
                <LeaseTermsStep
                  entityIds={entityIds}
                  defaultRent={ctx.rent}
                  defaultStartDate={ctx.moveInDate}
                  onComplete={handleLeaseComplete}
                />
              )}
              {step === 2 && entityIds.agreementId && (
                <MoveInStep
                  agreementId={entityIds.agreementId}
                  occupantName={ctx.occupantName}
                  unitNo={entityIds.unitNo}
                  onFinish={handleFinish}
                />
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmClose} onClose={() => setConfirmClose(false)}>
        <DialogTitle>Leave onboarding?</DialogTitle>
        <DialogContent>
          <Typography>
            The tenant has already been created. You can finish their lease later from the Agreements page.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClose(false)}>Keep going</Button>
          <Button
            color='error'
            onClick={() => {
              setConfirmClose(false)
              setOpen(false)
            }}
          >
            Leave
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
