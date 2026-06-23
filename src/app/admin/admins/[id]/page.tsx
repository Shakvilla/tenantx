import AdminAdminDetailView from '@/views/admin/AdminAdminDetailView'

export default async function AdminAdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <AdminAdminDetailView adminId={id} />
}
