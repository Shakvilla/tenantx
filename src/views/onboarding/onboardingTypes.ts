export interface OnboardingEntityIds {
  propertyId?: string
  unitId?: string
  occupantId?: string
  agreementId?: string
  invoiceId?: string
}

export interface OnboardingState {
  currentStep: number // 0–4
  entityIds: OnboardingEntityIds
}

// Props every step form receives from the wizard shell.
export interface OnboardingStepProps {
  tenantId: string
  entityIds: OnboardingEntityIds

  // Called on successful create; passes the partial ids this step produced.
  onComplete: (ids: Partial<OnboardingEntityIds>) => void

  // Called when the user skips this step without creating anything.
  onSkip?: () => void
}
