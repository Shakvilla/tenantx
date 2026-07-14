import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublicListings } from '@/lib/api/listings-public-client'
import { labelForSlug } from '@/views/listings/lib/city'
import ListingsIndexView from '@/views/listings/ListingsIndexView'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  params: Promise<{ slug: string }>
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const listings = await getPublicListings().catch(() => [])
  const label = labelForSlug(listings, slug)

  if (!label) return { title: 'Listings' }

  const title = `Homes available in ${label} - Ghana`
  const description = `Browse rental homes available in ${label}, Ghana. Prices in Ghana Cedis (GHS).`

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function CityListingsPage({ params }: Props) {
  const { slug } = await params
  const listings = await getPublicListings().catch(() => [])

  // Slug must have matched SOME listing ever (any status) — a city whose
  // homes all went INACTIVE still renders (with an empty state) so shared
  // links don't break; a slug that never existed 404s.
  const label = labelForSlug(listings, slug)
  if (!label) notFound()

  return <ListingsIndexView listings={listings} cityScope={{ slug, label }} />
}
