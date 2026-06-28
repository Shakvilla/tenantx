// MUI Imports
import Button from '@mui/material/Button'

// Type Imports
import type { ChildrenType } from '@core/types'

// Layout Imports
import LayoutWrapper from '@layouts/LayoutWrapper'
import VerticalLayout from '@layouts/VerticalLayout'
import HorizontalLayout from '@layouts/HorizontalLayout'

// Component Imports
import Providers from '@components/Providers'
import Navigation from '@components/layout/vertical/Navigation'
import Header from '@components/layout/horizontal/Header'
import Navbar from '@components/layout/vertical/Navbar'
import VerticalFooter from '@components/layout/vertical/Footer'
import HorizontalFooter from '@components/layout/horizontal/Footer'
import Customizer from '@core/components/customizer'
import ScrollToTop from '@core/components/scroll-to-top'
import AnnouncementBanner from '@components/banner/AnnouncementBanner'
import SubscriptionWarningBanner from '@components/banner/SubscriptionWarningBanner'
import ImpersonationBanner from '@components/banner/ImpersonationBanner'
import ResumeOnboardingBanner from '@components/banner/ResumeOnboardingBanner'
import OnboardingWizard from '@views/onboarding/OnboardingWizard'
import { ReferenceDataProvider } from '@/contexts/ReferenceDataContext'
import { PlatformBrandingProvider } from '@/contexts/PlatformBrandingContext'
import BrandingThemeBridge from '@components/theme/BrandingThemeBridge'

// Util Imports
import { getMode, getSystemMode } from '@core/utils/serverHelpers'

const Layout = async (props: ChildrenType) => {
  const { children } = props

  // Vars
  const direction = 'ltr'
  const mode = await getMode()
  const systemMode = await getSystemMode()

  return (
    <Providers direction={direction}>
      <ReferenceDataProvider>
      <PlatformBrandingProvider>
      <BrandingThemeBridge />
      <ImpersonationBanner />
      <AnnouncementBanner />
      <ResumeOnboardingBanner />
      <OnboardingWizard />
      <SubscriptionWarningBanner />
      <LayoutWrapper
        systemMode={systemMode}
        verticalLayout={
          <VerticalLayout navigation={<Navigation mode={mode} />} navbar={<Navbar />} footer={<VerticalFooter />}>
            {children}
          </VerticalLayout>
        }
        horizontalLayout={
          <HorizontalLayout header={<Header />} footer={<HorizontalFooter />}>
            {children}
          </HorizontalLayout>
        }
      />
      <ScrollToTop className='mui-fixed'>
        <Button variant='contained' className='is-10 bs-10 rounded-full p-0 min-is-0 flex items-center justify-center'>
          <i className='ri-arrow-up-line' />
        </Button>
      </ScrollToTop>
      <Customizer dir={direction} />
      </PlatformBrandingProvider>
      </ReferenceDataProvider>
    </Providers>
  )
}

export default Layout
