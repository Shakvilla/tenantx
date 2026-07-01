import type { Metadata } from 'next'
import { getPublicListings } from '@/lib/api/listings-public-client'
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
  let listings = []

  try {
    listings = await getPublicListings()
  } catch {
    // Render empty state — don't 404 on a list page
  }

  return <ListingsIndexView listings={listings} />
}
