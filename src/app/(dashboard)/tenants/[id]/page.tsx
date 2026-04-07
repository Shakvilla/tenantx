// Next.js Imports
import { cookies } from 'next/headers'

// MUI Imports
import Alert from '@mui/material/Alert'

// Component Imports
import TenantDetails from '@/views/tenants/view/TenantDetails'

// API Imports
import { getTenantById, type TenantRecord } from '@/lib/api/tenants'

// Util Imports
import { calculateLeasePeriod } from '@/utils/math'

/**
 * Transform API TenantRecord to the format expected by TenantDetails component
 */
function transformTenantData(record: TenantRecord) {
  const fullName = `${record.first_name} ${record.last_name}`

  return {
    id: record.id,
    name: fullName,
    email: record.email,
    phone: record.phone,
    roomNo: record.unit_no || record.unit?.unit_no || '-',
    propertyName: record.property?.name || '-',
    numberOfUnits: 1,
    costPerMonth: '-', // TODO: Get from unit data when available
    leasePeriod: calculateLeasePeriod(record.move_in_date, record.move_out_date),
    totalAmount: '-', // TODO: Calculate total
    status: (record.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
    avatar: record.avatar || undefined,
    age: undefined, // TODO: Add to tenant record if needed
    familyMembers: undefined, // TODO: Add to tenant record if needed
    job: undefined, // TODO: Add to tenant record if needed
    previousAddress: undefined, // TODO: Add to tenant record if needed
    permanentAddress: undefined, // TODO: Add to tenant record if needed
    propertyImage: undefined, // TODO: Get from property data
    propertyAddress: undefined, // TODO: Get from property data
    unitName: record.unit_no || record.unit?.unit_no || '-',
    securityDeposit: '-', // TODO: Get from unit/lease data
    lateFee: '-', // TODO: Get from lease data
    rentType: 'Monthly',
    receipt: '-',
    paymentDueDate: record.move_in_date ? new Date(record.move_in_date).toLocaleDateString() : '-'
  }
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function ViewTenantPage(props: Props) {
  // 1. Await Next.js 15 Async APIs
  const params = await props.params
  const cookieStore = await cookies()
  const tenantIdCookie = cookieStore.get('tenant_id')?.value

  if (!tenantIdCookie) {
    return (
      <Alert severity='error' sx={{ m: 2 }}>
        Unauthenticated/No Tenant Setup
      </Alert>
    )
  }

  try {
    // 2. Fetch data directly via RSC, passing TenantID explicitly
    const response = await getTenantById(tenantIdCookie, params.id)

    if (!response || !response.success || !response.data) {
      return (
        <Alert severity='warning' sx={{ m: 2 }}>
          Tenant not found
        </Alert>
      )
    }

    // 3. Transform and Forward
    const tenantData = transformTenantData(response.data)

    return <TenantDetails tenantData={tenantData} tenantId={params.id} />
  } catch (error) {
    console.error('Failed to fetch tenant:', error)

    return (
      <Alert severity='error' sx={{ m: 2 }}>
        {error instanceof Error ? error.message : 'Failed to load tenant data'}
      </Alert>
    )
  }
}
