'use client'

import SubscriptionWarningBanner from '@components/banner/SubscriptionWarningBanner'
import SmsCreditWarningBanner from '@components/banner/SmsCreditWarningBanner'
import SmsSetupBanner from '@components/banner/SmsSetupBanner'
import ResumeOnboardingBanner from '@components/banner/ResumeOnboardingBanner'
import OnboardingWizard from '@views/onboarding/OnboardingWizard'
import OnboardTenantWizard from '@views/onboarding/OnboardTenantWizard'
import { useAuth } from '@/contexts/AuthContext'

export function TenantOnlyBanners() {
  const { user } = useAuth()

  if (!user || user.userType === 'AGENT') return null

  return (
    <>
      <ResumeOnboardingBanner />
      <SubscriptionWarningBanner />
      <SmsCreditWarningBanner />
      <SmsSetupBanner />
    </>
  )
}

export function TenantOnlyOnboarding() {
  const { user } = useAuth()

  if (!user || user.userType === 'AGENT') return null

  return (
    <>
      <OnboardingWizard />
      <OnboardTenantWizard />
    </>
  )
}
