// Type Imports
import type { ChildrenType, Direction } from '@core/types'

// Context Imports
import { VerticalNavProvider } from '@menu/contexts/verticalNavContext'
import { SettingsProvider } from '@core/contexts/settingsContext'
import ThemeProvider from '@components/theme'
import { AuthProviderWrapper } from '@components/AuthProviderWrapper'
import { AdminAuthProviderWrapper } from '@components/AdminAuthProviderWrapper'
import { SubscriptionProviderWrapper } from '@components/SubscriptionProviderWrapper'

// Util Imports
import { getMode, getSettingsFromCookie, getSystemMode } from '@core/utils/serverHelpers'

type Props = ChildrenType & {
  direction: Direction
}

const Providers = async (props: Props) => {
  // Props
  const { children, direction } = props

  // Vars
  const mode = await getMode()
  const settingsCookie = await getSettingsFromCookie()
  const systemMode = await getSystemMode()

  return (
    <VerticalNavProvider>
      <SettingsProvider settingsCookie={settingsCookie} mode={mode}>
        <ThemeProvider direction={direction} systemMode={systemMode}>
          <AdminAuthProviderWrapper>
            <AuthProviderWrapper>
              <SubscriptionProviderWrapper>
                {children}
              </SubscriptionProviderWrapper>
            </AuthProviderWrapper>
          </AdminAuthProviderWrapper>
        </ThemeProvider>
      </SettingsProvider>
    </VerticalNavProvider>
  )
}

export default Providers
