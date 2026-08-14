import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublicListings } from '@/lib/api/listings-public-client'
import { rethrowIfNextControlFlow } from '@/lib/next-control-flow'
import { labelForSlug } from '@/views/listings/lib/city'
import ListingsIndexView from '@/views/listings/ListingsIndexView'

/**
 * Always rendered on demand: the listing behind this URL can be taken down at
 * any moment, and the fetch is `no-store`. Declaring it stops Next raising
 * DYNAMIC_SERVER_USAGE mid-render during `next build`, which a catch below
 * would otherwise have to recognise.
 */
export const dynamic = 'force-dynamic'


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
  const listings = await getPublicListings().catch(err => {
    rethrowIfNextControlFlow(err)

    return []
  })
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
  const listings = await getPublicListings()

  // Slug must have matched SOME listing ever (any status) — a city whose
  // homes all went INACTIVE still renders (with an empty state) so shared
  // links don't break; a slug that never existed 404s. Fetch errors are
  // deliberately NOT caught here — they propagate to the Next error boundary
  // (5xx, retryable) instead of falling through to notFound() (a cacheable
  // 404 on the feature's shareable URLs).
  const label = labelForSlug(listings, slug)
  if (!label) notFound()

  return <ListingsIndexView listings={listings} cityScope={{ slug, label }} />
}
