import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublicListing } from '@/lib/api/listings-public-client'
import ListingDetailView from '@/views/listings/ListingDetailView'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  params: { id: string }
}

// ---------------------------------------------------------------------------
// Metadata (OG tags for WhatsApp / social share previews)
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const listing = await getPublicListing(params.id)

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
  } catch {
    return {
      title: 'Listing not found',
    }
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function PublicListingPage({ params }: Props) {
  let listing

  try {
    listing = await getPublicListing(params.id)
  } catch {
    notFound()
  }

  return <ListingDetailView listing={listing} />
}
