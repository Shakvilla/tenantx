import type { Metadata } from 'next'
import { getPublicListings, type PublicListingDto } from '@/lib/api/listings-public-client'
import ListingsIndexView from '@/views/listings/ListingsIndexView'

export const metadata: Metadata = {
  title: 'Available Properties — PropManager',
  description: 'Browse all available rental units. Filter by bedrooms, price, and location.',
  openGraph: {
    title: 'Available Properties',
    description: 'Browse all available rental units. Filter by bedrooms, price, and location.',
    type: 'website',
  },
}

export default async function ListingsPage() {
  let listings: PublicListingDto[] = []

  try {
    listings = await getPublicListings()
  } catch (err) {
    // Render empty state — don't 404 on a list page. But log it: an
    // unreachable API and a genuinely empty catalogue both render "No listings
    // yet", and without this line there is nothing anywhere to tell them apart.
    console.error('[listings] failed to load public listings:', err)
  }

  return <ListingsIndexView listings={listings} />
}
