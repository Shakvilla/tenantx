// Next.js Imports
import { cookies } from 'next/headers'

// API Imports
import { serverGetPropertyById } from '@/lib/api/properties.server'

// Component Imports
import PropertyDetails from '@/views/properties/view/PropertyDetails'

type Props = {
  params: Promise<{ id: string }>
}

/**
 * Helper to convert a string to Title Case (handles multiple words).
 */
function toTitleCase(str: string | undefined | null) {
  if (!str) return ''

  return str
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Maps numbers to UI select strings (e.g., 6 -> "6+").
 */
function mapToSelectValue(val: number | undefined | null, max: number) {
  if (val === undefined || val === null) return ''
  if (val >= max) return `${max}+`

  return val.toString()
}

/**
 * Transform a backend Property object into the shape expected by
 * the PropertyDetails view component.
 */
function toPropertyViewData(property: Record<string, any>) {
  const amenitiesRecord: Record<string, boolean> = {}

  if (property.amenities && Array.isArray(property.amenities)) {
    property.amenities.forEach((amenity: string) => {
      amenitiesRecord[amenity] = true
    })
  }

  // Handle Type matching
  let type = toTitleCase(property.type)

  if (type === 'Residential') type = 'House' // fallback for common backend value

  // Handle District matching (e.g. "Accra Metropolitan" -> "Accra")
  let district = toTitleCase(property.district)

  if (district.includes('Accra')) district = 'Accra'
  if (district.includes('Tema')) district = 'Tema'

  return {
    id: property.id,
    name: property.name || 'Unnamed Property',
    location: property.district || property.region || 'Unknown',
    type: type || 'House',
    stock: property.status === 'active',
    address: property.gpsCode || property.address?.street || '',
    price: property.currentValue ? `${property.currency ?? '₵'}${property.currentValue.toLocaleString()}` : 'N/A',
    bedrooms: mapToSelectValue(property.bedrooms, 6),
    bathrooms: mapToSelectValue(property.bathrooms, 5),
    rooms: mapToSelectValue(property.rooms, 6),
    facilities: property.amenities || [],
    condition: toTitleCase(property.condition) || 'New',
    region: toTitleCase(property.region) || '',
    district: district || '',
    city: toTitleCase(property.address?.city) || '',
    gpsCode: property.gpsCode || '',
    description: property.description || '',
    images: property.images || [],
    thumbnailIndex: property.thumbnailIndex ?? 0,
    amenities: amenitiesRecord,

    // Raw backend fields preserved for the edit dialog payload
    ownership: property.ownership || 'own',
    totalUnits: property.totalUnits ?? 0,
    occupiedUnits: property.occupiedUnits ?? 0,
    purchasePrice: property.purchasePrice ?? undefined,
    currentValue: property.currentValue ?? undefined,
    currency: property.currency || 'GHS',
    street: property.address?.street || '',
    zip: property.address?.zip || '00233',
    rawType: property.type || 'residential',
    rawCondition: property.condition || 'new',
    rawRegion: property.region || '',
    rawDistrict: property.district || ''
  }
}

const ViewPropertyPage = async (props: Props) => {
  const params = await props.params
  const cookieStore = await cookies()
  const tenantId = cookieStore.get('tenant_id')?.value || ''

  const property = await serverGetPropertyById(tenantId, params.id)

  if (!property) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-center'>
          <h2 className='text-xl font-semibold text-gray-700'>Property Not Found</h2>
          <p className='text-gray-500 mt-2'>
            The property you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
          </p>
        </div>
      </div>
    )
  }

  const propertyData = toPropertyViewData(property)

  return <PropertyDetails propertyData={propertyData} propertyId={params.id} />
}

export default ViewPropertyPage

