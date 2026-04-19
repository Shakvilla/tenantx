// Next.js Imports
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

// API Imports
import { serverGetUnitById } from '@/lib/api/units.server'
import { serverGetTenantById } from '@/lib/api/tenants.server'
import { serverGetProperties } from '@/lib/api/properties.server'

// Component Imports
import UnitDetails from '@/views/properties/view/UnitDetails'

// Type Imports
import type { Unit, Property } from '@/types/property'

type UnitViewData = {
  id: string
  unitNumber: string
  propertyName: string
  propertyId: string
  tenantName: string | null
  status: 'occupied' | 'vacant' | 'maintenance' | 'available' | 'reserved'
  rent: string
  rentPeriod: string
  bedrooms: number
  bathrooms: number
  size: string
  floor: number | null
  type: string
  images: string[]
  amenities: string[]
  features: Record<string, any>
  metadata: Record<string, any>
}

/**
 * Maps a backend Unit DTO to the shape expected by the UI components.
 */
function toUnitViewData(unit: Unit, propertyName?: string, resolvedTenantName?: string | null): UnitViewData {
  return {
    id: unit.id,
    unitNumber: unit.unitNo,
    propertyName: propertyName || 'Unknown Property',
    propertyId: unit.propertyId,
    tenantName: resolvedTenantName || null,
    status: unit.status as any,
    rent: `${unit.currency === 'GHS' ? '₵' : unit.currency}${unit.rent.toLocaleString()}`,
    rentPeriod: unit.metadata?.rentPeriod || 'monthly',
    bedrooms: unit.bedrooms || 0,
    bathrooms: unit.bathrooms || 0,
    size: unit.sizeSqft ? `${unit.sizeSqft.toLocaleString()} sqft` : 'N/A',
    floor: unit.floor || null,
    type: unit.type,
    images: unit.images || [],
    amenities: unit.amenities || [],
    features: unit.features || {},
    metadata: unit.metadata || {}
  }
}

type Props = {
  params: Promise<{ id: string }>
}

const ViewUnitPage = async (props: Props) => {
  const params = await props.params
  const unitId = params.id

  const cookieStore = await cookies()
  const tenantId = cookieStore.get('tenant_id')?.value || ''

  if (!tenantId) {
    return notFound()
  }

  // Fetch unit data and property list in parallel
  const [unit, properties] = await Promise.all([serverGetUnitById(tenantId, unitId), serverGetProperties(tenantId)])

  if (!unit) {
    return notFound()
  }

  // Resolve tenant name if possible
  let resolvedTenantName: string | null = null

  if (unit.tenantRecordId) {
    const tenantRecord = await serverGetTenantById(tenantId, unit.tenantRecordId)

    if (tenantRecord) {
      resolvedTenantName = `${tenantRecord.first_name} ${tenantRecord.last_name}`
    }
  }

  // Find property name
  const unitProperty = properties.find(p => p.id === unit.propertyId)
  const propertyName = unitProperty?.name

  const unitData = toUnitViewData(unit, propertyName, resolvedTenantName)

  return <UnitDetails unitData={unitData} unitId={unitId} properties={properties} />
}

export default ViewUnitPage
