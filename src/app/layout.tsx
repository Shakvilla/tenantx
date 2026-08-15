// Next Imports
import { headers } from 'next/headers'
import { Bricolage_Grotesque } from 'next/font/google'

// MUI Imports
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'

// Third-party Imports
import 'react-perfect-scrollbar/dist/css/styles.css'

const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-bricolage-grotesque',
  display: 'swap',
})

// Type Imports
import type { ChildrenType } from '@core/types'

// Util Imports
import { getSystemMode } from '@core/utils/serverHelpers'

// Style Imports
import '@/app/globals.css'

// Custom Fonts
import '@/assets/fonts/stylesheet.css'

// Generated Icon CSS Imports
import '@assets/iconify-icons/generated-icons.css'

export const metadata = {
  title: 'TenantX',
  description: 'TenantX'
}

const RootLayout = async (props: ChildrenType) => {
  const { children } = props

  // Vars

  const systemMode = await getSystemMode()
  const direction = 'ltr'

  // Next stamps its own inline scripts with the nonce from the CSP header the
  // middleware sets, but this one is ours, so it has to be handed the nonce
  // explicitly. Without it the script is blocked and the page paints in the
  // wrong colour scheme before React corrects it.
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    <html id='__next' lang='en' dir={direction} suppressHydrationWarning className={bricolageGrotesque.variable}>
      <body className='flex is-full min-bs-full flex-auto flex-col'>
        <InitColorSchemeScript attribute='data' defaultMode={systemMode} nonce={nonce} />
        {children}
      </body>
    </html>
  )
}

export default RootLayout
