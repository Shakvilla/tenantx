import { cookies } from 'next/headers'

import PropertyDetails from '@/views/properties/view/PropertyDetails'

type Props = {
  params: Promise<{ id: string }>
}

// Transform backend Property to view PropertyData format
interface PropertyData {
  id: string
  name: string
  location: string
  type: string
  stock: boolean
  address: string
  price: string
  bedroom: number
  bathroom: number
  rooms: number
  facilities: string[]
  condition: string
  region: string
  district: string
  city: string
  gpsCode: string
  description: string
  images: string[]
  thumbnailIndex: number
  amenities: Record<string, boolean>
}

async function fetchProperty(id: string): Promise<PropertyData | null> {
  try {
    // Get cookies for authentication
    const cookieStore = await cookies()

    const cookieHeader = cookieStore.getAll()
      .map(c => `${c.name}=${c.value}`)
      .join('; ')

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/v1/properties/${id}`, {
      headers: {
        Cookie: cookieHeader,
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('Failed to fetch property:', response.status)
      
return null
    }

    const result = await response.json()

    if (!result.success || !result.data) {
      console.error('Invalid response:', result)
      
return null
    }

    const property = result.data

    // Transform backend data to view format
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
      address: property.gps_code || property.address?.street || '',
      price: property.current_value ? `₵${property.current_value.toLocaleString()}` : 'N/A',
      bedroom: property.bedrooms || 0,
      bathroom: property.bathrooms || 0,
      rooms: property.rooms || 0,
      facilities: property.amenities || [],
      condition: property.condition || 'Unknown',
      region: property.region || '',
      district: property.district || '',
      city: property.address?.city || '',
      gpsCode: property.gps_code || '',
      description: property.description || '',
      images: property.images || [],
      thumbnailIndex: property.thumbnail_index ?? 0,
      amenities: amenitiesRecord,
    }
  } catch (error) {
    console.error('Error fetching property:', error)
    
return null
  }
}

const ViewPropertyPage = async (props: Props) => {
  const params = await props.params
  const propertyData = await fetchProperty(params.id)

  if (!propertyData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Property Not Found</h2>
          <p className="text-gray-500 mt-2">The property you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.</p>
        </div>
      </div>
    )
  }

  return <PropertyDetails propertyData={propertyData} propertyId={params.id} />
}

export default ViewPropertyPage
