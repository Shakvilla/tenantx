import type { PublicListingDto } from '@/lib/api/listings-public-client'

/** Comma-separated address parts, lowercased; short tokens (<3 chars) dropped. */
function addressTokens(address: string | null | undefined): Set<string> {
  return new Set(
    (address ?? '')
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length >= 3)
  )
}

export function findSimilarListings(
  all: PublicListingDto[],
  current: PublicListingDto,
  cap = 4
): PublicListingDto[] {
  const currentTokens = addressTokens(current.propertyAddress)

  const scored = all
    .filter(l => l.id !== current.id && l.status === 'ACTIVE')
    .map(l => {
      let score = 0
      for (const t of addressTokens(l.propertyAddress)) {
        if (currentTokens.has(t)) { score += 2; break }
      }
      if (l.bedrooms != null && l.bedrooms === current.bedrooms) score += 1
      return { listing: l, score }
    })

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      new Date(b.listing.createdAt ?? 0).getTime() - new Date(a.listing.createdAt ?? 0).getTime()
  )

  return scored.slice(0, cap).map(s => s.listing)
}
