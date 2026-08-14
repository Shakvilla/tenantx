import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublicListing, getPublicListings } from '@/lib/api/listings-public-client'
import { rethrowIfNextControlFlow } from '@/lib/next-control-flow'
import ListingDetailView from '@/views/listings/ListingDetailView'

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
  params: Promise<{ id: string }>
}

// ---------------------------------------------------------------------------
// Metadata (OG tags for WhatsApp / social share previews)
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params
    const listing = await getPublicListing(id)

    const description = listing.description
      ? listing.description.slice(0, 155) + (listing.description.length > 155 ? '…' : '')
      : `${listing.unitType} · ${listing.bedrooms ?? '?'} bed · ${listing.bathrooms ?? '?'} bath — ${listing.propertyAddress}`

    const image = listing.images.length > 0 ? listing.images[0] : undefined

    return {
      title: listing.title,
      description,
      openGraph: {
        title: listing.title,
        description,
        type: 'website',
        ...(image && {
          images: [{ url: image, width: 1200, height: 630, alt: listing.title }],
        }),
      },
      twitter: {
        card: image ? 'summary_large_image' : 'summary',
        title: listing.title,
        description,
        ...(image && { images: [image] }),
      },
    }
  } catch (err) {
    rethrowIfNextControlFlow(err)

    return {
      title: 'Listing not found',
    }
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PublicListingPage({ params }: Props) {
  // Full list powers the "More homes you might like" row — fail-open to empty.
  // Started before awaiting the single listing so both requests run concurrently.
  const allListingsPromise = getPublicListings().catch(err => {
    rethrowIfNextControlFlow(err)

    return []
  })

  let listing

  try {
    const { id } = await params
    listing = await getPublicListing(id)
  } catch (err) {
    // Without this, a build-time DYNAMIC_SERVER_USAGE was caught here and
    // answered with notFound() — turning "render this on demand" into a 404.
    rethrowIfNextControlFlow(err)

    notFound()
  }

  const allListings = await allListingsPromise

  return <ListingDetailView listing={listing} allListings={allListings} />
}
