'use client'

import { useEffect, useState, useCallback } from 'react'

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

import { getPropertyStats } from '@/lib/api/properties'
import { getStoredTenantId } from '@/lib/api/storage'
import {
  getOnboardingState,
  saveOnboardingState,
  clearOnboardingState,
  isOnboardingDismissed,
  setOnboardingDismissed
} from './onboardingState'
import { trackOnboardingEvent } from './onboardingAnalytics'
import type { OnboardingEntityIds } from './onboardingTypes'
import PropertyStep from './steps/PropertyStep'
import UnitStep from './steps/UnitStep'
import OccupantStep from './steps/OccupantStep'
import AgreementStep from './steps/AgreementStep'
import InvoiceStep from './steps/InvoiceStep'
import CompletionScreen from './CompletionScreen'

const STEP_LABELS = ['Add Property', 'Add Unit', 'Add Occupant', 'Create Agreement', 'Generate Invoice']

export default function OnboardingWizard() {
  const router = useRouter()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [entityIds, setEntityIds] = useState<OnboardingEntityIds>({})
  const [rent, setRent] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  // W-01: trigger detection on mount.
  useEffect(() => {
    const tid = getStoredTenantId()

    if (!tid) return
    setTenantId(tid)
    if (isOnboardingDismissed(tid)) return

    let cancelled = false

    getPropertyStats(tid)
      .then(res => {
        if (cancelled) return


        // PropertyStats maps backend totalProperties -> .total
        if (res.success && res.data && res.data.total === 0) {
          const saved = getOnboardingState(tid)

          if (saved) {
            setStep(saved.currentStep)
            setEntityIds(saved.entityIds)
          }

          setOpen(true)
        }
      })
      .catch(() => {
        /* fail silent: never block dashboard on stats error */
      })

    return () => {
      cancelled = true
    }
  }, [])

  // W-08: allow the resume banner to reopen the wizard.
  useEffect(() => {
    const reopen = () => {
      const tid = getStoredTenantId()

      if (!tid) return
      const saved = getOnboardingState(tid)

      if (saved) {
        setStep(saved.currentStep)
        setEntityIds(saved.entityIds)
      }

      setCompleted(false)
      setOpen(true)
    }

    window.addEventListener('onboarding:open', reopen)
    
return () => window.removeEventListener('onboarding:open', reopen)
  }, [])

  const persist = useCallback(
    (nextStep: number, ids: OnboardingEntityIds) => {
      if (tenantId) saveOnboardingState(tenantId, { currentStep: nextStep, entityIds: ids })
    },
    [tenantId]
  )

  const advance = useCallback(
    (ids: Partial<OnboardingEntityIds>) => {
      const merged = { ...entityIds, ...ids }
      const next = step + 1

      setEntityIds(merged)
      trackOnboardingEvent('onboarding_step_completed', { step: step + 1 })

      if (next > 4) {
        setCompleted(true)
        trackOnboardingEvent('onboarding_wizard_completed')

        if (tenantId) {
          setOnboardingDismissed(tenantId)
          clearOnboardingState(tenantId)
        }

        
return
      }

      setStep(next)
      persist(next, merged)
    },
    [entityIds, step, tenantId, persist]
  )

  // W-08 "Resume Later"
  const handleResumeLater = () => {
    setConfirmClose(false)
    setOpen(false)
    persist(step, entityIds)
    trackOnboardingEvent('onboarding_wizard_dismissed', { mode: 'resume' })
    window.dispatchEvent(new CustomEvent('onboarding:resume-available'))
  }

  // W-08 "Skip Setup"
  const handleSkip = () => {
    setConfirmClose(false)
    setOpen(false)
    if (tenantId) setOnboardingDismissed(tenantId)
    trackOnboardingEvent('onboarding_wizard_dismissed', { mode: 'skip' })
  }

  if (!open) return null

  return (
    <>
      <Dialog fullScreen open={open} onClose={() => setConfirmClose(true)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant='h5' component='span'>Set up your first property</Typography>
          <IconButton aria-label='close setup' onClick={() => setConfirmClose(true)}>
            <i className='ri-close-line' />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {completed ? (
            <CompletionScreen
              onGoToDashboard={() => setOpen(false)}
              onViewInvoice={() => {
                setOpen(false)
                if (entityIds.invoiceId) router.push(`/billing/invoices/${entityIds.invoiceId}`)
              }}
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
                <PropertyStep tenantId={tenantId} entityIds={entityIds} onComplete={advance} onSkip={() => advance({})} />
              )}
              {step === 1 && tenantId && (
                <UnitStep
                  tenantId={tenantId}
                  entityIds={entityIds}
                  onComplete={advance}
                  onUnitCreated={(unitId, r) => {
                    setRent(r)
                    advance({ unitId })
                  }}
                  onSkip={() => advance({})}
                />
              )}
              {step === 2 && tenantId && (
                <OccupantStep tenantId={tenantId} entityIds={entityIds} onComplete={advance} onSkip={() => advance({})} />
              )}
              {step === 3 && tenantId && (
                <AgreementStep tenantId={tenantId} entityIds={entityIds} onComplete={advance} defaultRent={rent} onSkip={() => advance({})} />
              )}
              {step === 4 && tenantId && (
                <InvoiceStep tenantId={tenantId} entityIds={entityIds} onComplete={advance} defaultRent={rent} onSkip={() => advance({})} />
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* W-08 dismissal confirmation */}
      <Dialog open={confirmClose} onClose={() => setConfirmClose(false)}>
        <DialogTitle>Exit setup?</DialogTitle>
        <DialogContent>
          <Typography>You can resume later from the dashboard.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleResumeLater}>Resume Later</Button>
          <Button color='error' onClick={handleSkip}>
            Skip Setup
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
