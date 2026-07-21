import type { Metadata } from 'next'

import AdminLoginView from '@views/admin/AdminLoginView'

export const metadata: Metadata = {
  title: 'Admin Login',
  description: 'Platform administrator sign in'
}

const AdminLoginPage = () => {
  return <AdminLoginView />
}

export default AdminLoginPage
