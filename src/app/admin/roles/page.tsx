'use client'

// Component Imports
import PageBanner from '@components/banner/PageBanner'
import AdminRolesView from '@/views/admin/AdminRolesView'

export default function AdminRolesPage() {
  return (
    <>
      <PageBanner
        title='Roles & Permissions'
        description='Create roles and choose exactly what each platform administrator can do'
        icon='ri-shield-user-line'
      />
      <AdminRolesView />
    </>
  )
}
