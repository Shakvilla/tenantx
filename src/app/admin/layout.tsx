/**
 * Admin shell layout.
 *
 * /admin/** sits outside the (dashboard) and (blank-layout-pages) route groups,
 * so Providers must be included here directly to supply MUI theme + AdminAuthProvider.
 *
 * Middleware guards all /admin/** routes — unauthenticated visitors are redirected
 * to /login before this layout even renders.
 */

import Providers from '@components/Providers'
import { AdminNavigation } from '@/components/admin/AdminNavigation'

const direction = 'ltr' as const

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers direction={direction}>
      <AdminNavigation>{children}</AdminNavigation>
    </Providers>
  )
}
