import type { PublicListingDto } from '@/lib/api/listings-public-client'

export function makeListing(overrides: Partial<PublicListingDto> = {}): PublicListingDto {
  return {
    id: 'listing-1',
    unitId: 'unit-1',
    unitNo: '110',
    unitType: 'Apartment',
    bedrooms: 2,
    bathrooms: 1,
    sizeSqft: 870,
    rent: 1500,
    currency: 'GHS',
    // Stored ids, as the API actually returns them. This fixture used to hold
    // ['Wifi', 'Parking', 'Security'] — already-presentable words that no real
    // row contains — so every amenity assertion passed while the live page
    // printed "kitchen_cabinets" at prospective tenants.
    amenities: ['wifi', 'parking', 'kitchen_cabinets'],
    images: ['/img/a.jpg', '/img/b.jpg'],
    propertyId: 'prop-1',
    propertyName: 'Sunrise Apartments',
    propertyAddress: 'East Legon, Accra, Greater Accra',
    title: 'Unit 110 — Sunrise Apartments',
    description: 'A lovely two-bedroom apartment.',
    contactPhone: '0244123456',
    contactEmail: 'agent@example.com',
    availableFrom: '2026-08-01',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: null,
    ...overrides,
  }
}
