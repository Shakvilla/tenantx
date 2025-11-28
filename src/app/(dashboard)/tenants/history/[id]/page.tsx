'use client'

// React Imports
import { useParams } from 'next/navigation'

// Component Imports
import TenantHistoryDetails from '@/views/tenants/view/TenantHistoryDetails'

const ViewTenantHistoryPage = () => {
  const params = useParams()
  const tenantId = params.id as string

  // TODO: Fetch tenant data from API using tenantId
  // For now, using sample data
  const tenantData = {
    id: tenantId,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+233 24 123 4567',
    roomNo: 'Unit 101',
    propertyName: 'Xorla House',
    numberOfUnits: 1,
    costPerMonth: '₵1,200',
    leasePeriod: '12 months',
    totalAmount: '₵14,400',
    status: 'active' as const,
    avatar:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.0.3'
  }

  return <TenantHistoryDetails tenantData={tenantData} tenantId={tenantId} />
}

export default ViewTenantHistoryPage
