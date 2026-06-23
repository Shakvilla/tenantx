import AdminTenantDetailView from '@/views/admin/AdminTenantDetailView'

export default async function AdminTenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AdminTenantDetailView tenantId={id} />
}
