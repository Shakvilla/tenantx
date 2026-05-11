// Next.js Imports
import { cookies } from 'next/headers'

// MUI Imports
import Alert from '@mui/material/Alert'

// Component Imports
import TenantDetails from '@/views/tenants/view/TenantDetails'

// API Imports
import { serverGetOccupantById } from '@/lib/api/occupants.server'
import type { OccupantRecord } from '@/lib/api/occupants'

// Util Imports
import { calculateLeasePeriod } from '@/utils/math'

/**
 * Transform OccupantRecord to the format expected by TenantDetails component
 */
function transformOccupantData(record: OccupantRecord) {
  const fullName = `${record.firstName} ${record.lastName}`
  const ec = record.emergencyContact || {}

  return {
    id: record.id,
    name: fullName,
    email: record.email,
    phone: record.phone,
    roomNo: record.unitNo || '-',
    propertyName: record.property?.name || '-',
    numberOfUnits: 1,
    costPerMonth: '-',
    leasePeriod: calculateLeasePeriod(record.moveInDate, record.moveOutDate),
    totalAmount: '-',
    status: (record.status === 'active' ? 'active' : 'inactive') as 'active' | 'inactive',
    avatar: record.avatar || undefined,
    age: undefined,
    familyMembers: ec.familyMembersCount ? Number(ec.familyMembersCount) : undefined,
    job: (ec.occupation as string) || undefined,
    previousAddress: (ec.previousAddress as any) || undefined,
    permanentAddress: (ec.permanentAddress as any) || undefined,
    propertyImage: undefined,
    propertyAddress: undefined,
    unitName: record.unitNo || '-',
    securityDeposit: '-',
    lateFee: '-',
    rentType: 'Monthly',
    receipt: '-',
    paymentDueDate: record.moveInDate ? new Date(record.moveInDate).toLocaleDateString() : '-'
  }
}

type Props = {
  params: Promise<{ id: string }>
}

export default async function ViewOccupantPage(props: Props) {
  const params = await props.params
  const cookieStore = await cookies()
  const tenantIdCookie = cookieStore.get('tenant_id')?.value

  if (!tenantIdCookie) {
    return (
      <Alert severity='error' sx={{ m: 2 }}>
        Unauthenticated / No Tenant Setup
      </Alert>
    )
  }

  try {
    const occupant = await serverGetOccupantById(tenantIdCookie, params.id)

    if (!occupant) {
      return (
        <Alert severity='warning' sx={{ m: 2 }}>
          Occupant not found
        </Alert>
      )
    }

    const occupantData = transformOccupantData(occupant)

    return <TenantDetails tenantData={occupantData} tenantId={params.id} />
  } catch (error) {
    console.error('Failed to fetch occupant:', error)

    return (
      <Alert severity='error' sx={{ m: 2 }}>
        {error instanceof Error ? error.message : 'Failed to load occupant data'}
      </Alert>
    )
  }
}
