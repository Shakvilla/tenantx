# Listings city segmentation + location filter — design

Date: 2026-07-14
Status: approved (pending spec review)

## Problem

The public listings index (`/listings`) is a single flat grid today, sorted only
by newest/price. There's no way to browse or filter by location, and the app
has no way to show "what's popular where" the way Zillow/Airbnb city landing
pages do. We're adding:

1. A **location filter** alongside the existing bed/price filters.
2. A **segmented home feed** — grouped into city sections, e.g. "Homes
   available in Adenta, Accra - Ghana" — with the main page surfacing the
   **top 10 cities** ranked by active listing count.

## Source data

`PublicListingDto.propertyAddress` (from `getPublicListings()`) is a flattened,
comma-separated string built server-side from the property's structured
address fields (`district`, `address.city`, `region` — see
`src/types/property.ts`). Confirmed from live data:

```
"Adenta, Accra, Greater Accra"   → district=Adenta,  city=Accra,  region=Greater Accra
"Accra, Accra, Greater Accra"    → district=Accra,   city=Accra,  region=Greater Accra
"Tamale, Tamale, Northern"       → district=Tamale,  city=Tamale, region=Northern
```

There is no dedicated city field on the public DTO — this feature derives
"city" entirely client-side by parsing this string. No backend changes.

## Decisions (confirmed)

- **City bucket = "{district}, {city}"**, collapsed to just `"{city}"` when
  district and city are the same word (case-insensitive). This is the ranking
  and grouping key everywhere in this feature. A popular suburb (e.g. a heavy
  Adenta listing count) can rank above a less-listed literal city — that's
  intentional and matches the requested heading pattern exactly.
- **Dedicated routes per city** — `/listings/city/[slug]` — server-rendered,
  own `<title>`, shareable/bookmarkable, matches Zillow/Airbnb city pages.
- **Filters collapse to the existing flat grid.** The segmented, top-10-cities
  view is only the *default, no-filters-applied* state of `/listings`. The
  instant any filter is active — search, beds, price, or the new location
  filter — the page (main or city) shows the same flat grid it does today.

## Data layer — `src/views/listings/lib/city.ts`

```ts
export interface CityGroup {
  label: string   // "Adenta, Accra" | "Accra" | "Tamale"
  slug: string     // "adenta-accra" | "accra" | "tamale"
  listings: PublicListingDto[]  // ACTIVE only
}

export function cityLabel(address: string | null | undefined): string
export function citySlug(label: string): string
export function groupByCity(listings: PublicListingDto[]): CityGroup[]
export function topCities(groups: CityGroup[], n = 10): CityGroup[]
```

- `cityLabel`: split on `,`, trim each part. If ≥2 parts: `district = parts[0]`,
  `city = parts[1]`; return `city` if `district.toLowerCase() === city.toLowerCase()`,
  else `"${district}, ${city}"`. If exactly 1 part: return it as-is. If empty/
  null/blank: return the sentinel `'Other areas'`.
- `citySlug`: lowercase, strip anything but `[a-z0-9]+`, join remaining tokens
  with `-` (so `"Adenta, Accra"` → `"adenta-accra"`, `"Accra"` → `"accra"`).
  `'Other areas'` → `'other-areas'`.
- `groupByCity`: filter `status === 'ACTIVE'`, group by
  `cityLabel(propertyAddress).toLowerCase()` as the map key (so inconsistent
  casing between listings — `"Adenta, Accra"` vs `"adenta, accra"` — still
  merges into one bucket), keeping the first-seen original-cased string as
  the displayed `label`. Sort by `listings.length` descending, tie-break
  alphabetically by `label`. `'Other areas'` is included like any other group
  (needed so its listings aren't dropped), but excluded from `topCities()` —
  see below.
- `topCities`: `groups.filter(g => g.slug !== 'other-areas').slice(0, n)`.

## New route — `src/app/listings/city/[slug]/page.tsx`

Both `generateMetadata` and the page component need a `{slug → label}` lookup
that survives a city's listings all going INACTIVE. `labelForSlug(listings, slug)`
builds this from *all* listings regardless of status — `cityLabel` per listing,
keyed by `citySlug(cityLabel(...))` — and returns the matching label, or
`undefined` if the slug has never matched any listing, ever:

```ts
// lib/city.ts — also exported
function labelForSlug(listings: PublicListingDto[], slug: string): string | undefined {
  for (const l of listings) {
    const label = cityLabel(l.propertyAddress)
    if (citySlug(label) === slug) return label
  }
  return undefined
}
```

```tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const { slug } = await params
  const listings = await getPublicListings().catch(() => [])
  const label = labelForSlug(listings, slug)
  if (!label) return { title: 'Listing not found' }
  return {
    title: `Homes available in ${label} - Ghana`,
    description: `Browse rental homes available in ${label}, Ghana.`,
  }
}

export default async function CityListingsPage({ params }) {
  const { slug } = await params
  const listings = await getPublicListings().catch(() => [])
  const label = labelForSlug(listings, slug)
  if (!label) notFound()

  return <ListingsIndexView listings={listings} cityScope={{ slug, label }} />
}
```

**Existence vs. emptiness rule:** `labelForSlug` scans *all* listings
regardless of status — so a city that once had listings but currently has
zero ACTIVE ones still resolves a `label`, and the page renders with the
existing "No exact matches" / "No listings yet"-style empty state (scoped
copy: *"No homes currently available in {label}."*) rather than a 404. A slug
that has **never** matched any listing, ever, is the only case that 404s.
This means a bookmarked/shared city link never breaks just because
availability changed.

## `ListingsIndexView` changes

One new optional prop:

```ts
interface ListingsIndexViewProps {
  listings: PublicListingDto[]
  cityScope?: { slug: string; label: string }   // NEW
}
```

When `cityScope` is present, city becomes just another filter predicate
applied unconditionally (the user can't clear it, and it isn't part of
`hasFilters`/`clearAll` — clearing filters on a city page returns to *that
city's* full list, not the whole site). Reusing the same predicate as the
Location filter (see below) means the filtering pipeline — search, beds,
price, sort — is identical code on both the main index and every city page.

**Header, `cityScope` present:**
- Breadcrumb "← All listings" (link to `/listings`) above the title.
- Title becomes `Homes available in {label} - Ghana` instead of the generic
  "Homes available in Ghana".
- No "Explore by city" strip, no segmentation — this page is already scoped
  to one city, so it always renders the existing flat grid.

**Header, `cityScope` absent (main `/listings`), unfiltered state (`hasFilters === false`):**
1. New "Explore by city" row: horizontal-scroll, up to 10 cards from
   `topCities(groupByCity(listings))`. Each card: background photo (first
   image of the first listing in that group, gradient overlay for text
   contrast), city `label`, `"{count} homes"`, links to `/listings/city/{slug}`.
2. Below it, the feed is segmented: one section per top-10 `CityGroup`, in
   ranked order. Section heading: `Homes available in {label} - Ghana`. Each
   section shows up to 8 `ListingCard`s in the existing responsive grid; if
   the group has more than 8, a `"See all {count} homes in {label} →"` link
   to the dedicated city page follows the grid.
3. `'Other areas'` listings (unparseable address) are never their own
   section and never appear in the explore strip — they're only reachable
   via the "All locations" state of the Location filter, so nothing is
   silently hidden but nothing un-brandable gets a headline slot either.

**Any filter active (`hasFilters === true`), `cityScope` absent:** unchanged
from today — flat single grid, "N homes · Prices in GHS", no sections, no
explore strip. This is also the state once a Location filter is chosen.

## `FilterBar` changes

New prop pair, same shape as the existing bed/price controls:

```ts
interface FilterBarProps {
  // ...existing
  locationFilter: string | null       // a citySlug, or null for "All locations"
  onLocationFilter: (slug: string | null) => void
  locationOptions: { slug: string; label: string; count: number }[]  // ALL cities, not just top 10
}
```

Rendered as a `<select>` styled like the existing sort control (not chips —
could be a long list), options sorted by `count` descending, default "All
locations". Included in `hasFilters` and cleared by "Clear all" (main page
only — on a city page there's no location control, since the scope is fixed
by the URL).

Filtering logic gains one predicate:
`locationFilter === null || citySlug(cityLabel(l.propertyAddress)) === locationFilter`.

## Testing plan (TDD)

- `src/__tests__/listings/city.test.ts` — `cityLabel` (3-segment normal case,
  district===city collapse, 1-segment fallback, empty/null → 'Other areas'),
  `citySlug` (lowercasing, punctuation/space handling, 'Other areas' →
  'other-areas'), `groupByCity` (ACTIVE-only, correct counts, sort order,
  alphabetical tie-break, 'Other areas' bucket present but not double-counted),
  `topCities` (caps at n, excludes 'other-areas').
- `FilterBar.test.tsx` — location `<select>` renders all options with counts,
  `onLocationFilter` fires on change, included in `hasFilters`/clear-all.
- `ListingsIndexView.test.tsx` — unfiltered: explore strip renders top-10 in
  ranked order with correct labels/counts; segmented sections render with
  correct headings (including the "Accra" collapse and "Adenta, Accra" split
  cases); any filter (search/bed/price/location) collapses to the existing
  flat grid; `cityScope` prop renders the scoped heading/breadcrumb, no
  strip/sections, city predicate can't be cleared.
- City route test — found slug renders correct subset + metadata title;
  historically-valid-but-currently-empty slug renders the empty state, not
  404; never-seen slug 404s.

## Out of scope

- No backend/API changes — this is 100% derived from the existing
  `propertyAddress` string.
- No change to the listing detail page or its similar-listings logic.
- No persistence of the location filter in the URL query string (consistent
  with how bed/price filters already work — pure client state).
