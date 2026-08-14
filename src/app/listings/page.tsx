import type { Metadata } from 'next'
import { getPublicListings, type PublicListingDto } from '@/lib/api/listings-public-client'
import { rethrowIfNextControlFlow } from '@/lib/next-control-flow'
import ListingsIndexView from '@/views/listings/ListingsIndexView'

/**
 * A public feed of what is available right now, so it must never be a build-time
 * snapshot. The underlying fetch is already `no-store`, which Next detects by
 * throwing DYNAMIC_SERVER_USAGE mid-render during `next build`; saying so here
 * means it never has to, and the intent is stated rather than inferred.
 */
export const dynamic = 'force-dynamic'

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
    // Next's own signals are not failures — swallowing one logged the
    // dynamic-rendering bail-out as "failed to load public listings" on every
    // production build.
    rethrowIfNextControlFlow(err)

    // Render empty state — don't 404 on a list page. But log it: an
    // unreachable API and a genuinely empty catalogue both render "No listings
    // yet", and without this line there is nothing anywhere to tell them apart.
    console.error('[listings] failed to load public listings:', err)
  }

  return <ListingsIndexView listings={listings} />
}
