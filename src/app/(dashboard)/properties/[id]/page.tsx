// Next.js Imports
import { cookies } from 'next/headers'

// API Imports
import { serverGetPropertyById } from '@/lib/api/properties.server'
import { countLabel } from '@/lib/property-options'
import { formatCurrency } from '@/utils/currency'

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

    // Street first. This read `gpsCode || street`, so the street address could
    // never display: a property with one showed its Ghana Post code here AND in
    // the GPS Code row below — the same value twice, and the actual street
    // nowhere. The code remains the fallback, since it locates the property
    // better than an empty row when no street was entered.
    address: property.address?.street || property.gpsCode || '',

    // Was `${currency ?? '₵'}${value.toLocaleString()}`, which prints the code
    // rather than the symbol — "GHS1,500,000" — since `currency` holds 'GHS'
    // and is only null on rows that predate the column. formatCurrency resolves
    // the symbol properly. Empty when unset; the card phrases the absence.
    price: property.currentValue != null ? formatCurrency(Number(property.currentValue), property.currency) : '',

    // The real counts, not the form's option buckets: `toCountOption` collapses
    // 6-and-above onto "6+" so a fixed Select can prefill, and reusing it here
    // made a property with exactly 6 bedrooms read "6+".
    bedrooms: countLabel(property.bedrooms),
    bathrooms: countLabel(property.bathrooms),
    rooms: countLabel(property.rooms),
    condition: toTitleCase(property.condition) || 'New',
    region: toTitleCase(property.region) || '',
    district: district || '',
    city: toTitleCase(property.address?.city) || '',
    gpsCode: property.gpsCode || '',
    description: property.description || '',
    images: property.images || [],
    imageFileIds: property.imageFileIds || [],
    thumbnailIndex: property.thumbnailIndex ?? 0,
    amenities: amenitiesRecord,

    // Raw backend fields preserved for the edit dialog payload. The counts go
    // through as numbers so the dialog maps them onto its options itself,
    // rather than the display strings above having to survive a parse.
    rawBedrooms: property.bedrooms ?? undefined,
    rawBathrooms: property.bathrooms ?? undefined,
    rawRooms: property.rooms ?? undefined,
    status: property.status,
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

