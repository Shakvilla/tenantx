// Next.js Imports
import { cookies } from 'next/headers'

// API Imports
import { serverGetPropertyById } from '@/lib/api/properties'

// Component Imports
import PropertyDetails from '@/views/properties/view/PropertyDetails'

type Props = {
  params: Promise<{ id: string }>
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

  return {
    id: property.id,
    name: property.name || 'Unnamed Property',
    location: property.district || property.region || 'Unknown',
    type: property.type || 'residential',
    stock: property.status === 'active',
    address: property.gpsCode || property.address?.street || '',
    price: property.currentValue ? `₵${property.currentValue.toLocaleString()}` : 'N/A',
    bedroom: property.bedrooms || 0,
    bathroom: property.bathrooms || 0,
    rooms: property.rooms || 0,
    facilities: property.amenities || [],
    condition: property.condition || 'Unknown',
    region: property.region || '',
    district: property.district || '',
    city: property.address?.city || '',
    gpsCode: property.gpsCode || '',
    description: property.description || '',
    images: property.images || [],
    thumbnailIndex: property.thumbnailIndex ?? 0,
    amenities: amenitiesRecord
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

