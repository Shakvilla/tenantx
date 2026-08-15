# Listings City Segmentation + Location Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Segment the public listings index into city sections (top 10 cities ranked by active listing count, headings like "Homes available in Adenta, Accra - Ghana"), add a location filter, and give each city a dedicated shareable route `/listings/city/[slug]`.

**Architecture:** All "city" data is derived client-side from `PublicListingDto.propertyAddress` (a `"{district}, {city}, {region}"` string) by a new pure-function module `lib/city.ts`. `ListingsIndexView` gains an optional `cityScope` prop so the SAME component renders both the main index (segmented default state, collapses to today's flat grid when any filter is active) and every dedicated city page (always flat, hard-scoped). No backend changes.

**Tech Stack:** Next.js 15 App Router (async `params`), React 18, Tailwind 3 (`preflight: false`), Vitest 4 + happy-dom + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-07-14-listings-city-segmentation-design.md`

## Global Constraints

- EVERY npm/npx command needs: `export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH"` (default shell node is v10).
- Repo root: `/Users/mac/Desktop/TenantApp/Tenants`. Branch `feat/rbac-fixes` has many UNRELATED uncommitted changes — NEVER `git add -A` or `git add .`; stage explicit paths only.
- Neutral palette EXACT values only: `#222222` `#717171` `#DDDDDD` `#EBEBEB` `#F0F0F0` `#F7F7F7`. Brand colour comes from `usePlatformBranding().primaryColour` via inline `style` ONLY — never hardcode a brand hex.
- Tailwind preflight is OFF: buttons need explicit `border-none`/`bg-transparent` (or `border-solid` when bordered); lists need `m-0 list-none pl-0`; links need `no-underline` where intended.
- Tests live in `src/__tests__/listings/*.test.tsx?` (Vitest only matches that dir). Tailwind classes are inert in vitest — `hidden`/`lg:` do NOT hide elements, so both "responsive variants" of an element are visible in tests.
- Headings copy pattern is EXACT: `Homes available in {label} - Ghana` (spaced hyphen, no "in" before Ghana).
- Test command: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/`

---

### Task 1: `lib/city.ts` — city derivation helpers

**Files:**
- Create: `src/views/listings/lib/city.ts`
- Test: `src/__tests__/listings/city.test.ts`

**Interfaces:**
- Consumes: `PublicListingDto` from `@/lib/api/listings-public-client` (existing).
- Produces (later tasks rely on these exact signatures):
  - `interface CityGroup { label: string; slug: string; listings: PublicListingDto[] }`
  - `cityLabel(address: string | null | undefined): string`
  - `citySlug(label: string): string`
  - `groupByCity(listings: PublicListingDto[]): CityGroup[]` (ACTIVE only, sorted count desc then label asc)
  - `topCities(groups: CityGroup[], n = 10): CityGroup[]` (excludes `other-areas`)
  - `labelForSlug(listings: PublicListingDto[], slug: string): string | undefined` (ALL statuses)

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/listings/city.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { cityLabel, citySlug, groupByCity, topCities, labelForSlug } from '@/views/listings/lib/city'
import { makeListing } from './fixtures'

describe('cityLabel', () => {
  it('returns "district, city" from a 3-part address', () => {
    expect(cityLabel('Adenta, Accra, Greater Accra')).toBe('Adenta, Accra')
  })

  it('collapses to just the city when district equals city (case-insensitive)', () => {
    expect(cityLabel('Accra, Accra, Greater Accra')).toBe('Accra')
    expect(cityLabel('tamale, Tamale, Northern')).toBe('Tamale')
  })

  it('returns a single-part address as-is', () => {
    expect(cityLabel('Kumasi')).toBe('Kumasi')
  })

  it('falls back to "Other areas" for empty, blank, or null input', () => {
    expect(cityLabel('')).toBe('Other areas')
    expect(cityLabel('   ')).toBe('Other areas')
    expect(cityLabel(null)).toBe('Other areas')
    expect(cityLabel(undefined)).toBe('Other areas')
  })
})

describe('citySlug', () => {
  it('slugifies a compound label', () => {
    expect(citySlug('Adenta, Accra')).toBe('adenta-accra')
  })

  it('slugifies a single-word label', () => {
    expect(citySlug('Accra')).toBe('accra')
  })

  it('maps the fallback label to other-areas', () => {
    expect(citySlug('Other areas')).toBe('other-areas')
  })

  it('drops punctuation and collapses whitespace', () => {
    expect(citySlug("Teshie-Nungua  Estates, Accra")).toBe('teshie-nungua-estates-accra')
  })
})

describe('groupByCity', () => {
  const listings = [
    makeListing({ id: 'a1', propertyAddress: 'Adenta, Accra, Greater Accra' }),
    makeListing({ id: 'a2', propertyAddress: 'adenta, accra, Greater Accra' }), // casing merges
    makeListing({ id: 'b1', propertyAddress: 'Tamale, Tamale, Northern' }),
    makeListing({ id: 'x1', propertyAddress: '' }),                              // Other areas
    makeListing({ id: 'dead', propertyAddress: 'Adenta, Accra, Greater Accra', status: 'INACTIVE' }),
  ]

  it('groups ACTIVE listings by city label, merging case variants', () => {
    const groups = groupByCity(listings)
    const adenta = groups.find(g => g.slug === 'adenta-accra')
    expect(adenta?.listings.map(l => l.id)).toEqual(['a1', 'a2'])
    expect(adenta?.label).toBe('Adenta, Accra') // first-seen casing wins
  })

  it('excludes INACTIVE listings entirely', () => {
    const groups = groupByCity(listings)
    expect(groups.flatMap(g => g.listings).some(l => l.id === 'dead')).toBe(false)
  })

  it('keeps unparseable addresses in an Other areas bucket', () => {
    const other = groupByCity(listings).find(g => g.slug === 'other-areas')
    expect(other?.listings.map(l => l.id)).toEqual(['x1'])
  })

  it('sorts by count desc, then label asc', () => {
    const groups = groupByCity([
      makeListing({ id: '1', propertyAddress: 'Ahodwo, Kumasi, Ashanti' }),
      makeListing({ id: '2', propertyAddress: 'Adenta, Accra, Greater Accra' }),
      makeListing({ id: '3', propertyAddress: 'Adenta, Accra, Greater Accra' }),
      makeListing({ id: '4', propertyAddress: 'Tamale, Tamale, Northern' }),
    ])
    expect(groups.map(g => g.label)).toEqual(['Adenta, Accra', 'Ahodwo, Kumasi', 'Tamale'])
  })
})

describe('topCities', () => {
  it('caps at n and never includes other-areas', () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      makeListing({ id: `l${i}`, propertyAddress: `Area${i}, City${i}, Region` })
    )
    many.push(makeListing({ id: 'x', propertyAddress: '' }))
    const top = topCities(groupByCity(many))
    expect(top).toHaveLength(10)
    expect(top.some(g => g.slug === 'other-areas')).toBe(false)
  })
})

describe('labelForSlug', () => {
  const listings = [
    makeListing({ id: 'a', propertyAddress: 'Adenta, Accra, Greater Accra', status: 'INACTIVE' }),
  ]

  it('resolves a label even when all its listings are INACTIVE', () => {
    expect(labelForSlug(listings, 'adenta-accra')).toBe('Adenta, Accra')
  })

  it('returns undefined for a slug that never matched anything', () => {
    expect(labelForSlug(listings, 'kumasi')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/city.test.ts`
Expected: FAIL — cannot resolve `@/views/listings/lib/city`.

- [ ] **Step 3: Write the implementation**

Create `src/views/listings/lib/city.ts`:

```ts
import type { PublicListingDto } from '@/lib/api/listings-public-client'

/** One bucket of listings sharing a "{district}, {city}" location. */
export interface CityGroup {
  label: string                 // "Adenta, Accra" | "Accra" | "Other areas"
  slug: string                  // "adenta-accra" | "accra" | "other-areas"
  listings: PublicListingDto[]  // ACTIVE only (when built via groupByCity)
}

const FALLBACK_LABEL = 'Other areas'

/**
 * Derive the display city from a "{district}, {city}, {region}" address.
 * "Adenta, Accra, Greater Accra" → "Adenta, Accra"
 * "Accra, Accra, Greater Accra"  → "Accra" (district === city collapses)
 * "Kumasi"                       → "Kumasi"
 * ""/null                        → "Other areas"
 */
export function cityLabel(address: string | null | undefined): string {
  const parts = (address ?? '').split(',').map(p => p.trim()).filter(Boolean)
  if (parts.length === 0) return FALLBACK_LABEL
  if (parts.length === 1) return parts[0]
  const [district, city] = parts
  return district.toLowerCase() === city.toLowerCase() ? city : `${district}, ${city}`
}

/** URL-safe slug: lowercase alphanumeric runs joined by hyphens. */
export function citySlug(label: string): string {
  const tokens = label.toLowerCase().match(/[a-z0-9]+/g)
  return tokens ? tokens.join('-') : 'other-areas'
}

/**
 * Group ACTIVE listings into CityGroups. Case variants of the same label
 * merge (first-seen casing wins). Sorted by listing count desc, label asc.
 */
export function groupByCity(listings: PublicListingDto[]): CityGroup[] {
  const map = new Map<string, CityGroup>()
  for (const l of listings) {
    if (l.status !== 'ACTIVE') continue
    const label = cityLabel(l.propertyAddress)
    const key = label.toLowerCase()
    let group = map.get(key)
    if (!group) {
      group = { label, slug: citySlug(label), listings: [] }
      map.set(key, group)
    }
    group.listings.push(l)
  }
  return [...map.values()].sort(
    (a, b) => b.listings.length - a.listings.length || a.label.localeCompare(b.label)
  )
}

/** Top n groups for headline placement — the fallback bucket never headlines. */
export function topCities(groups: CityGroup[], n = 10): CityGroup[] {
  return groups.filter(g => g.slug !== 'other-areas').slice(0, n)
}

/**
 * Resolve a slug back to its display label, scanning ALL listings regardless
 * of status — so a shared city link keeps resolving (and can render an empty
 * state) even after every listing there went INACTIVE. undefined = never
 * existed → the route 404s.
 */
export function labelForSlug(listings: PublicListingDto[], slug: string): string | undefined {
  for (const l of listings) {
    const label = cityLabel(l.propertyAddress)
    if (citySlug(label) === slug) return label
  }
  return undefined
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/city.test.ts`
Expected: PASS (17 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/lib/city.ts src/__tests__/listings/city.test.ts
git commit -m "feat(listings): city derivation helpers — label, slug, grouping, top-N"
```

---

### Task 2: `FilterBar` location select

**Files:**
- Modify: `src/views/listings/components/FilterBar.tsx`
- Test: `src/__tests__/listings/FilterBar.test.tsx` (append to the existing `FilterBar` describe block)

**Interfaces:**
- Consumes: nothing new from Task 1 (the option list is plain data).
- Produces: `FilterBarProps` gains three OPTIONAL props (all-or-nothing; the control renders only when `locationOptions` and `onLocationFilter` are both provided — city pages omit them):
  - `locationFilter?: string | null` (a city slug, `null` = all)
  - `onLocationFilter?: (slug: string | null) => void`
  - `locationOptions?: { slug: string; label: string; count: number }[]`
  - Also exports `interface LocationOption { slug: string; label: string; count: number }`

- [ ] **Step 1: Write the failing tests**

Append inside the existing `describe('FilterBar', ...)` block in `src/__tests__/listings/FilterBar.test.tsx`:

```tsx
  const locationProps = {
    locationFilter: null,
    onLocationFilter: vi.fn(),
    locationOptions: [
      { slug: 'adenta-accra', label: 'Adenta, Accra', count: 5 },
      { slug: 'tamale', label: 'Tamale', count: 2 },
    ],
  }

  it('renders a location select with all options and counts', () => {
    render(<FilterBar {...baseProps} {...locationProps} />)
    const select = screen.getByLabelText('Filter by location')
    expect(select).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'All locations' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Adenta, Accra (5)' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Tamale (2)' })).toBeInTheDocument()
  })

  it('reports a chosen location slug, and null for All locations', () => {
    const onLocationFilter = vi.fn()
    render(<FilterBar {...baseProps} {...locationProps} onLocationFilter={onLocationFilter} />)
    fireEvent.change(screen.getByLabelText('Filter by location'), { target: { value: 'tamale' } })
    expect(onLocationFilter).toHaveBeenCalledWith('tamale')
    fireEvent.change(screen.getByLabelText('Filter by location'), { target: { value: '' } })
    expect(onLocationFilter).toHaveBeenCalledWith(null)
  })

  it('renders no location select when location props are omitted', () => {
    render(<FilterBar {...baseProps} />)
    expect(screen.queryByLabelText('Filter by location')).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/FilterBar.test.tsx`
Expected: 3 new tests FAIL ("Filter by location" not found); the 7 existing tests still pass.

- [ ] **Step 3: Implement**

In `src/views/listings/components/FilterBar.tsx`:

(a) Add the exported option type and the three optional props to `FilterBarProps`:

```ts
export interface LocationOption {
  slug: string
  label: string
  count: number
}

export interface FilterBarProps {
  bedFilter: number | null
  onBedFilter: (v: number | null) => void
  maxPrice: number | null
  onMaxPrice: (v: number | null) => void
  maxRent: number
  sort: SortValue
  onSort: (v: SortValue) => void
  hasFilters: boolean
  onClearAll: () => void
  brandColour: string
  /** Location filter — omit all three on city pages (scope is fixed by the URL). */
  locationFilter?: string | null
  onLocationFilter?: (slug: string | null) => void
  locationOptions?: LocationOption[]
}
```

(b) Destructure the new props in the component:

```ts
  const {
    bedFilter, onBedFilter, maxPrice, onMaxPrice, maxRent,
    sort, onSort, hasFilters, onClearAll, brandColour,
    locationFilter, onLocationFilter, locationOptions,
  } = props
```

(c) Insert the select in the chip row, directly AFTER the price button and BEFORE the `{hasFilters && (` Clear-all block (Clear all must stay before the `ml-auto` sort control — QA regression from L11):

```tsx
        {locationOptions && onLocationFilter && (
          <select
            value={locationFilter ?? ''}
            onChange={e => onLocationFilter(e.target.value || null)}
            aria-label='Filter by location'
            className={
              'shrink-0 cursor-pointer rounded-full border border-solid px-3 py-2 text-[13px] transition-colors ' +
              ((locationFilter ?? '') !== ''
                ? 'border-[#222222] bg-[#222222] font-semibold text-white'
                : 'border-[#DDDDDD] bg-white font-medium text-[#222222] hover:border-[#222222]')
            }
          >
            <option value=''>All locations</option>
            {locationOptions.map(o => (
              <option key={o.slug} value={o.slug}>
                {o.label} ({o.count})
              </option>
            ))}
          </select>
        )}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/FilterBar.test.tsx`
Expected: PASS (10 FilterBar + 2 SearchPill).

- [ ] **Step 5: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/components/FilterBar.tsx src/__tests__/listings/FilterBar.test.tsx
git commit -m "feat(listings): location filter select in FilterBar"
```

---

### Task 3: `CityExploreStrip` component

**Files:**
- Create: `src/views/listings/components/CityExploreStrip.tsx`
- Test: `src/__tests__/listings/CityExploreStrip.test.tsx`

**Interfaces:**
- Consumes: `CityGroup` from `../lib/city` (Task 1).
- Produces: `export default function CityExploreStrip({ groups }: { groups: CityGroup[] })` — renders `null` when `groups` is empty; each card links to `/listings/city/{slug}`.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/listings/CityExploreStrip.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import CityExploreStrip from '@/views/listings/components/CityExploreStrip'
import { groupByCity } from '@/views/listings/lib/city'
import { makeListing } from './fixtures'

const groups = groupByCity([
  makeListing({ id: '1', propertyAddress: 'Adenta, Accra, Greater Accra', images: ['/img/adenta.jpg'] }),
  makeListing({ id: '2', propertyAddress: 'Adenta, Accra, Greater Accra', images: [] }),
  makeListing({ id: '3', propertyAddress: 'Tamale, Tamale, Northern', images: [] }),
])

describe('CityExploreStrip', () => {
  it('renders one card per group, in order, with label, count, and link', () => {
    render(<CityExploreStrip groups={groups} />)
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '/listings/city/adenta-accra')
    expect(links[0]).toHaveTextContent('Adenta, Accra')
    expect(links[0]).toHaveTextContent('2 homes')
    expect(links[1]).toHaveAttribute('href', '/listings/city/tamale')
    expect(links[1]).toHaveTextContent('1 home')
  })

  it('uses the first available photo in the group as the card image', () => {
    render(<CityExploreStrip groups={groups} />)
    const imgs = document.querySelectorAll('img')
    expect(imgs).toHaveLength(1) // Tamale group has no photos → no img
    expect(imgs[0]).toHaveAttribute('src', '/img/adenta.jpg')
  })

  it('renders nothing when there are no groups', () => {
    const { container } = render(<CityExploreStrip groups={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/CityExploreStrip.test.tsx`
Expected: FAIL — cannot resolve the component module.

- [ ] **Step 3: Implement**

Create `src/views/listings/components/CityExploreStrip.tsx`:

```tsx
'use client'

import Link from 'next/link'
import type { CityGroup } from '../lib/city'

/**
 * Horizontal-scroll row of city cards ("Explore by city") — photo, label,
 * listing count — each linking to the dedicated city page.
 */
export default function CityExploreStrip({ groups }: { groups: CityGroup[] }) {
  if (groups.length === 0) return null

  return (
    <section aria-label='Explore by city' className='mb-11'>
      <h2 className='text-xl font-extrabold text-[#222222]'>Explore by city</h2>
      <div className='mt-4 grid auto-cols-[150px] grid-flow-col gap-4 overflow-x-auto pb-2 sm:auto-cols-[190px]'>
        {groups.map(group => {
          const photo = group.listings.find(l => l.images.length > 0)?.images[0]
          return (
            <Link
              key={group.slug}
              href={`/listings/city/${group.slug}`}
              className='group/city relative block aspect-[4/5] overflow-hidden rounded-2xl bg-[#222222] no-underline'
            >
              {photo && (
                <img
                  src={photo}
                  alt=''
                  loading='lazy'
                  className='absolute inset-0 h-full w-full object-cover opacity-85 transition-transform duration-300 group-hover/city:scale-105'
                />
              )}
              <div className='absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent' aria-hidden='true' />
              <div className='absolute inset-x-0 bottom-0 p-3.5'>
                <div className='text-[15px] font-bold leading-tight text-white'>{group.label}</div>
                <div className='mt-0.5 text-xs text-white/80'>
                  {group.listings.length} home{group.listings.length !== 1 ? 's' : ''}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/CityExploreStrip.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/components/CityExploreStrip.tsx src/__tests__/listings/CityExploreStrip.test.tsx
git commit -m "feat(listings): explore-by-city card strip"
```

---

### Task 4: `ListingsIndexView` — segmentation, location filter, cityScope

**Files:**
- Modify: `src/views/listings/ListingsIndexView.tsx` (full replacement below)
- Test: `src/__tests__/listings/ListingsIndexView.test.tsx` (append new tests; existing 6 must keep passing unchanged)

**Interfaces:**
- Consumes: everything from Tasks 1–3 (`cityLabel`, `citySlug`, `groupByCity`, `topCities`, `CityExploreStrip`, FilterBar location props).
- Produces: `ListingsIndexView` accepts `{ listings: PublicListingDto[]; cityScope?: { slug: string; label: string } }` — Task 5's route renders it with `cityScope`.

Behavior matrix (from the spec):

| State | Renders |
|---|---|
| main page, no filters, ≥1 named city | Explore strip + one section per top-10 city (`Homes available in {label} - Ghana`, ≤8 cards, "See all N homes in {label} →" link when more) |
| main page, no filters, only `Other areas` listings | today's flat grid (guard: never a blank page) |
| main page, ANY filter active (search/bed/price/location) | today's flat grid |
| `cityScope` set | breadcrumb + `Homes available in {label} - Ghana` h1; ALWAYS flat grid, hard-scoped to the city; no location select; clear-all resets only search/bed/price |
| `cityScope` set, city currently has 0 ACTIVE listings, no filters | empty state: "No homes currently available in {label}." |

- [ ] **Step 1: Write the failing tests**

Append inside the existing `describe('ListingsIndexView', ...)` block (keep the existing 6 tests untouched). Note the existing `listings` fixture at the top of the file uses 2-part addresses (`'East Legon, Accra'`) — for these tests define a richer local fixture:

```tsx
  const cityListings = [
    makeListing({ id: 'ad1', propertyAddress: 'Adenta, Accra, Greater Accra', propertyName: 'Adenta One', rent: 1000 }),
    makeListing({ id: 'ad2', propertyAddress: 'Adenta, Accra, Greater Accra', propertyName: 'Adenta Two', rent: 1200 }),
    makeListing({ id: 'ac1', propertyAddress: 'Accra, Accra, Greater Accra', propertyName: 'Central One', rent: 2000 }),
    makeListing({ id: 'tm1', propertyAddress: 'Tamale, Tamale, Northern', propertyName: 'Tamale One', rent: 800, bedrooms: 1 }),
  ]

  it('unfiltered: segments the feed into ranked city sections with the exact heading pattern', () => {
    render(<ListingsIndexView listings={cityListings} />)
    const sections = screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)
    expect(sections).toContain('Explore by city')
    // Ranked: Adenta (2) before the two 1-listing cities (alphabetical tie-break)
    const cityHeadings = sections.filter(t => t?.startsWith('Homes available in'))
    expect(cityHeadings).toEqual([
      'Homes available in Adenta, Accra - Ghana',
      'Homes available in Accra - Ghana',
      'Homes available in Tamale - Ghana',
    ])
  })

  it('unfiltered: explore strip links to the city routes', () => {
    render(<ListingsIndexView listings={cityListings} />)
    const strip = screen.getByRole('region', { name: 'Explore by city' })
    expect(strip.querySelector('a[href="/listings/city/adenta-accra"]')).toBeTruthy()
  })

  it('picking a location collapses to a flat filtered grid', () => {
    render(<ListingsIndexView listings={cityListings} />)
    fireEvent.change(screen.getByLabelText('Filter by location'), { target: { value: 'tamale' } })
    expect(screen.queryByText('Explore by city')).not.toBeInTheDocument()
    expect(screen.queryByText('Homes available in Adenta, Accra - Ghana')).not.toBeInTheDocument()
    expect(screen.getByText('Tamale One')).toBeInTheDocument()
    expect(screen.queryByText('Adenta One')).not.toBeInTheDocument()
  })

  it('any other filter also collapses the segmented view', () => {
    render(<ListingsIndexView listings={cityListings} />)
    fireEvent.click(screen.getByRole('button', { name: '1 bed' }))
    expect(screen.queryByText('Explore by city')).not.toBeInTheDocument()
    expect(screen.getByText('Tamale One')).toBeInTheDocument()
  })

  it('clear-all restores the segmented view and resets the location filter', () => {
    render(<ListingsIndexView listings={cityListings} />)
    fireEvent.change(screen.getByLabelText('Filter by location'), { target: { value: 'tamale' } })
    fireEvent.click(screen.getByText('Clear all'))
    expect(screen.getByText('Explore by city')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter by location')).toHaveValue('')
  })

  it('falls back to the flat grid when only unparseable addresses exist', () => {
    render(<ListingsIndexView listings={[makeListing({ id: 'x', propertyAddress: '', propertyName: 'Mystery Home' })]} />)
    expect(screen.queryByText('Explore by city')).not.toBeInTheDocument()
    expect(screen.getByText('Mystery Home')).toBeInTheDocument()
  })

  describe('cityScope (dedicated city page)', () => {
    it('renders the scoped heading, breadcrumb, and only that city\'s listings', () => {
      render(<ListingsIndexView listings={cityListings} cityScope={{ slug: 'adenta-accra', label: 'Adenta, Accra' }} />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Homes available in Adenta, Accra - Ghana')
      expect(screen.getByRole('link', { name: /All listings/ })).toHaveAttribute('href', '/listings')
      expect(screen.getByText('Adenta One')).toBeInTheDocument()
      expect(screen.queryByText('Tamale One')).not.toBeInTheDocument()
      expect(screen.queryByText('Explore by city')).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Filter by location')).not.toBeInTheDocument()
    })

    it('filters still work within the scope', () => {
      render(<ListingsIndexView listings={cityListings} cityScope={{ slug: 'adenta-accra', label: 'Adenta, Accra' }} />)
      fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Adenta Two' } })
      expect(screen.getByText('Adenta Two')).toBeInTheDocument()
      expect(screen.queryByText('Adenta One')).not.toBeInTheDocument()
    })

    it('shows the city-specific empty state when the city has no ACTIVE homes', () => {
      const inactive = [makeListing({ id: 'ad1', propertyAddress: 'Adenta, Accra, Greater Accra', status: 'INACTIVE' })]
      render(<ListingsIndexView listings={inactive} cityScope={{ slug: 'adenta-accra', label: 'Adenta, Accra' }} />)
      expect(screen.getByText('No homes currently available in Adenta, Accra.')).toBeInTheDocument()
    })
  })
```

- [ ] **Step 2: Run tests to verify the new ones fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/ListingsIndexView.test.tsx`
Expected: the 9 new tests FAIL; the 6 existing tests still pass.

- [ ] **Step 3: Implement — full file replacement**

Replace `src/views/listings/ListingsIndexView.tsx` with:

```tsx
'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { usePlatformBranding } from '@/contexts/PlatformBrandingContext'
import { matchesSearch } from './lib/format'
import { cityLabel, citySlug, groupByCity, topCities } from './lib/city'
import { useSavedListings } from './lib/useSavedListings'
import ListingCard from './components/ListingCard'
import SearchPill from './components/SearchPill'
import FilterBar, { type SortValue } from './components/FilterBar'
import CityExploreStrip from './components/CityExploreStrip'
import SiteFooter from './components/SiteFooter'

/** Max cards shown per city section on the segmented main page. */
const SECTION_CARD_CAP = 8

interface ListingsIndexViewProps {
  listings: PublicListingDto[]
  /** When set, the view renders as a dedicated city page scoped to this city. */
  cityScope?: { slug: string; label: string }
}

export default function ListingsIndexView({ listings, cityScope }: ListingsIndexViewProps) {
  const { platformName, logoUrl, primaryColour } = usePlatformBranding()
  const { isSaved, toggle } = useSavedListings()

  const [searchQuery, setSearchQuery] = useState('')
  const [bedFilter, setBedFilter] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [locationFilter, setLocationFilter] = useState<string | null>(null)
  const [sort, setSort] = useState<SortValue>('newest')

  // City page: hard-scope everything (grid, counts, price slider max) to the
  // city fixed by the URL. Not clearable — it's the page's identity.
  const scoped = useMemo(
    () =>
      cityScope
        ? listings.filter(l => citySlug(cityLabel(l.propertyAddress)) === cityScope.slug)
        : listings,
    [listings, cityScope]
  )

  const cityGroups = useMemo(() => groupByCity(scoped), [scoped])
  const top = useMemo(() => topCities(cityGroups), [cityGroups])

  const maxRent = useMemo(() => {
    const rents = scoped.map(l => l.rent).filter((r): r is number => r != null)
    return rents.length ? Math.max(...rents) : 10000
  }, [scoped])

  const filtered = useMemo(() => {
    let out = scoped.filter(l => l.status === 'ACTIVE')
    if (searchQuery.trim()) out = out.filter(l => matchesSearch(l, searchQuery))
    if (bedFilter !== null) {
      out = bedFilter >= 3
        ? out.filter(l => (l.bedrooms ?? 0) >= 3)
        : out.filter(l => l.bedrooms === bedFilter)
    }
    if (maxPrice !== null) out = out.filter(l => l.rent == null || l.rent <= maxPrice)
    if (locationFilter !== null) {
      out = out.filter(l => citySlug(cityLabel(l.propertyAddress)) === locationFilter)
    }
    return [...out].sort((a, b) => {
      if (sort === 'price_asc') return (a.rent ?? 0) - (b.rent ?? 0)
      if (sort === 'price_desc') return (b.rent ?? 0) - (a.rent ?? 0)
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    })
  }, [scoped, searchQuery, bedFilter, maxPrice, locationFilter, sort])

  const hasFilters =
    bedFilter !== null || maxPrice !== null || locationFilter !== null || searchQuery.trim() !== ''

  // Segmented top-10 feed is only the default (no filters) state of the main
  // index — and only when at least one named city exists (all-"Other areas"
  // data falls back to the flat grid rather than a blank page).
  const segmented = !cityScope && !hasFilters && top.length > 0

  function clearAll() {
    setSearchQuery('')
    setBedFilter(null)
    setMaxPrice(null)
    setLocationFilter(null)
  }

  const renderCard = (listing: PublicListingDto) => (
    <ListingCard
      key={listing.id}
      listing={listing}
      saved={isSaved(listing.id)}
      onToggleSave={() => toggle(listing.id)}
    />
  )

  const gridClass = 'grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

  return (
    <div className='min-h-screen bg-white'>
      {/* ── Sticky top: header + filter bar stick together (header height varies
             when the search pill wraps on mobile, so they share one sticky wrapper) ── */}
      <div className='sticky top-0 z-50 bg-white'>
      <header className='border-b border-[#EBEBEB]'>
        <div className='mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-3.5 lg:px-10'>
          <div className='flex items-center gap-2.5'>
            {logoUrl ? (
              <img src={logoUrl} alt={platformName} className='h-9 object-contain' />
            ) : (
              <>
                <svg width='30' height='30' viewBox='0 0 32 32' fill={primaryColour} xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
                  <path d='M16 1C10.5 1 6 5.9 6 12c0 4.3 2.3 8.6 5 11.5L16 29l5-5.5c2.7-2.9 5-7.2 5-11.5C26 5.9 21.5 1 16 1zm0 15a4 4 0 110-8 4 4 0 010 8z' />
                </svg>
                <span className='text-lg font-extrabold tracking-tight' style={{ color: primaryColour }}>
                  {platformName}
                </span>
              </>
            )}
          </div>

          <div className='order-3 w-full sm:order-none sm:mx-auto sm:w-auto sm:min-w-[340px] sm:max-w-md sm:flex-1'>
            <SearchPill value={searchQuery} onChange={setSearchQuery} brandColour={primaryColour} />
          </div>

          <div className='ml-auto hidden text-[13px] text-[#717171] sm:block'>
            {filtered.length > 0 && `${filtered.length} available`}
          </div>
        </div>
      </header>

      {/* ── Filter bar (inside the sticky wrapper) ── */}
      <div className='border-b border-[#EBEBEB]'>
        <div className='mx-auto max-w-[1400px] px-6 py-2.5 lg:px-10'>
          <FilterBar
            bedFilter={bedFilter} onBedFilter={setBedFilter}
            maxPrice={maxPrice} onMaxPrice={setMaxPrice} maxRent={maxRent}
            sort={sort} onSort={setSort}
            hasFilters={hasFilters} onClearAll={clearAll}
            brandColour={primaryColour}
            {...(!cityScope && {
              locationFilter,
              onLocationFilter: setLocationFilter,
              locationOptions: cityGroups.map(g => ({ slug: g.slug, label: g.label, count: g.listings.length })),
            })}
          />
        </div>
      </div>
      </div>{/* /sticky wrapper */}

      {/* ── Content ── */}
      <main className='mx-auto max-w-[1400px] px-6 pb-20 pt-8 lg:px-10'>
        {cityScope ? (
          <div className='mb-7'>
            <Link
              href='/listings'
              className='text-[13px] font-medium text-[#717171] no-underline hover:text-[#222222] hover:underline'
            >
              ← All listings
            </Link>
            <h1 className='mt-2 text-2xl font-extrabold text-[#222222]'>
              Homes available in {cityScope.label} - Ghana
            </h1>
            <p className='mt-1.5 text-sm text-[#717171]'>
              {filtered.length} home{filtered.length !== 1 ? 's' : ''} · Prices in GHS
            </p>
          </div>
        ) : (
          listings.length > 0 && (
            <div className='mb-7'>
              <h1 className='text-2xl font-extrabold text-[#222222]'>Homes available in Ghana</h1>
              <p className='mt-1.5 text-sm text-[#717171]'>
                {filtered.length} home{filtered.length !== 1 ? 's' : ''} · Prices in GHS
              </p>
            </div>
          )
        )}

        {filtered.length === 0 ? (
          <div className='flex min-h-[400px] flex-col items-center justify-center gap-3 text-center'>
            <div
              className={`mb-1 flex h-20 w-20 items-center justify-center rounded-full ${
                listings.length === 0 ? 'bg-[#F7F7F7]' : 'bg-[#FFF5F5]'
              }`}
            >
              <i
                className={`${listings.length === 0 ? 'ri-home-4-line text-[#CCCCCC]' : 'ri-search-line'} text-4xl`}
                style={listings.length === 0 ? undefined : { color: primaryColour }}
                aria-hidden='true'
              />
            </div>
            <div className='text-[22px] font-bold text-[#222222]'>
              {listings.length === 0
                ? 'No listings yet'
                : cityScope && !hasFilters
                  ? `No homes currently available in ${cityScope.label}.`
                  : 'No exact matches'}
            </div>
            <div className='max-w-[300px] text-sm leading-relaxed text-[#717171]'>
              {hasFilters
                ? "Try adjusting your filters to find what you're looking for."
                : 'Check back soon — new rentals are added regularly.'}
            </div>
            {hasFilters && (
              <button
                onClick={clearAll}
                className='mt-2 cursor-pointer rounded-lg border-none bg-[#222222] px-7 py-3 text-sm font-semibold text-white'
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : segmented ? (
          <>
            <CityExploreStrip groups={top} />
            {top.map(group => (
              <section key={group.slug} aria-labelledby={`city-${group.slug}`} className='mb-12'>
                <h2 id={`city-${group.slug}`} className='text-xl font-extrabold text-[#222222]'>
                  Homes available in {group.label} - Ghana
                </h2>
                <div className={`mt-4 ${gridClass}`}>
                  {group.listings.slice(0, SECTION_CARD_CAP).map(renderCard)}
                </div>
                {group.listings.length > SECTION_CARD_CAP && (
                  <Link
                    href={`/listings/city/${group.slug}`}
                    className='mt-5 inline-block text-sm font-semibold text-[#222222] underline'
                  >
                    See all {group.listings.length} homes in {group.label} →
                  </Link>
                )}
              </section>
            ))}
          </>
        ) : (
          <div className={gridClass}>{filtered.map(renderCard)}</div>
        )}
      </main>

      <SiteFooter />
    </div>
  )
}
```

Behavior notes (implementer sanity checks):
- The old empty-state button rendered whenever `listings.length > 0`; it now renders only when `hasFilters` — on an unfiltered empty city page there are no filters to clear (the breadcrumb is the exit). The existing test "shows the no-exact-matches empty state and clears it" still passes because that state has an active search filter.
- `clearAll` on a city page resets search/bed/price only in effect — `locationFilter` is never set there because the select isn't rendered.
- Section cards keep API order and cap at 8; no per-section sorting (sort control applies to the flat grid states).

- [ ] **Step 4: Run the full listings suite**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/`
Expected: ALL tests pass — the 6 pre-existing ListingsIndexView tests unchanged, 9 new ones, plus every other file.

- [ ] **Step 5: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/ListingsIndexView.tsx src/__tests__/listings/ListingsIndexView.test.tsx
git commit -m "feat(listings): segmented city feed, location filter, cityScope mode"
```

---

### Task 5: `/listings/city/[slug]` route

**Files:**
- Create: `src/app/listings/city/[slug]/page.tsx`
- Test: `src/__tests__/listings/CityPage.test.tsx`

**Interfaces:**
- Consumes: `labelForSlug` (Task 1), `ListingsIndexView` + `cityScope` (Task 4), `getPublicListings` (existing).
- Produces: the public route. Async `params: Promise<{ slug: string }>` (Next 15 pattern — match `src/app/listings/[id]/page.tsx`).

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/listings/CityPage.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { makeListing } from './fixtures'

vi.mock('@/lib/api/listings-public-client', () => ({
  getPublicListings: vi.fn(),
}))

import { getPublicListings } from '@/lib/api/listings-public-client'
import CityListingsPage, { generateMetadata } from '@/app/listings/city/[slug]/page'

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

beforeEach(() => {
  vi.mocked(getPublicListings).mockReset()
  window.localStorage.clear()
})

describe('CityListingsPage', () => {
  it('renders the scoped city view for a known slug', async () => {
    vi.mocked(getPublicListings).mockResolvedValue([
      makeListing({ id: 'a', propertyAddress: 'Adenta, Accra, Greater Accra', propertyName: 'Adenta One' }),
      makeListing({ id: 'b', propertyAddress: 'Tamale, Tamale, Northern', propertyName: 'Tamale One' }),
    ])
    render(await CityListingsPage(params('adenta-accra')))
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Homes available in Adenta, Accra - Ghana')
    expect(screen.getByText('Adenta One')).toBeInTheDocument()
    expect(screen.queryByText('Tamale One')).not.toBeInTheDocument()
  })

  it('renders the empty state (not 404) when the city exists but has no ACTIVE homes', async () => {
    vi.mocked(getPublicListings).mockResolvedValue([
      makeListing({ id: 'a', propertyAddress: 'Adenta, Accra, Greater Accra', status: 'INACTIVE' }),
    ])
    render(await CityListingsPage(params('adenta-accra')))
    expect(screen.getByText('No homes currently available in Adenta, Accra.')).toBeInTheDocument()
  })

  it('404s for a slug that never matched any listing', async () => {
    vi.mocked(getPublicListings).mockResolvedValue([
      makeListing({ id: 'a', propertyAddress: 'Adenta, Accra, Greater Accra' }),
    ])
    await expect(CityListingsPage(params('kumasi'))).rejects.toThrow() // notFound() throws
  })

  it('generateMetadata titles the page with the exact heading pattern', async () => {
    vi.mocked(getPublicListings).mockResolvedValue([
      makeListing({ id: 'a', propertyAddress: 'Adenta, Accra, Greater Accra' }),
    ])
    const meta = await generateMetadata(params('adenta-accra'))
    expect(meta.title).toBe('Homes available in Adenta, Accra - Ghana')
  })

  it('generateMetadata falls back gracefully for unknown slugs and API failures', async () => {
    vi.mocked(getPublicListings).mockRejectedValue(new Error('down'))
    const meta = await generateMetadata(params('adenta-accra'))
    expect(meta.title).toBe('Listings')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/CityPage.test.tsx`
Expected: FAIL — cannot resolve `@/app/listings/city/[slug]/page`.

- [ ] **Step 3: Implement**

Create `src/app/listings/city/[slug]/page.tsx`:

```tsx
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
```

- [ ] **Step 4: Run the full listings suite + type-check**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/`
Expected: ALL pass.

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit 2>&1 | grep -iE "listings|city"`
Expected: no output (clean). Note: `tsc` may take ~2 min on this repo.

- [ ] **Step 5: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add "src/app/listings/city/[slug]/page.tsx" src/__tests__/listings/CityPage.test.tsx
git commit -m "feat(listings): dedicated city route /listings/city/[slug]"
```

---

### Task 6: Browser QA

**Files:** none created — verification only; fix anything found and commit fixes with explicit paths.

Dev server runs at `http://localhost:3000` (already running; do NOT start via Bash). Backend at `http://localhost:8080` currently has 3 listings: 2× "Accra, Accra, Greater Accra" (→ "Accra"), 1× "Tamale, Tamale, Northern" (→ "Tamale").

- [ ] **Step 1:** Open `http://localhost:3000/listings`. Verify: "Explore by city" strip with an Accra card (2 homes) and a Tamale card (1 home); sections "Homes available in Accra - Ghana" (2 cards) then "Homes available in Tamale - Ghana" (1 card).
- [ ] **Step 2:** Use the location select → pick Tamale. Verify collapse to flat grid with only the Tamale listing; "Clear all" appears; clicking it restores the segmented view.
- [ ] **Step 3:** Click the Accra explore card → lands on `/listings/city/accra`; verify h1 "Homes available in Accra - Ghana", breadcrumb "← All listings" works, document title matches, no location select in the filter bar.
- [ ] **Step 4:** Visit `/listings/city/never-existed` → Next.js 404 page.
- [ ] **Step 5:** Mobile check (375px): explore strip scrolls horizontally; city sections stack to 1-column grid.
- [ ] **Step 6:** Check browser console and dev-server logs for errors/warnings introduced by these pages.

**Do NOT submit the inquiry form during QA** (creates a real support ticket).

---

## Self-Review Notes

- Spec coverage: city derivation (T1), location filter incl. all-cities options + hasFilters/clear-all (T2+T4), explore strip (T3), segmented top-10 feed + exact heading pattern + collapse-on-filter + Other-areas rules (T4), cityScope reuse + scoped empty copy (T4), dedicated route + metadata + existence-vs-emptiness 404 rule (T5), out-of-scope items untouched. ✓
- Type consistency: `CityGroup`/`LocationOption`/`cityScope` shapes match across T1→T5. `generateMetadata` unknown-slug title is `'Listings'` in both code and test. ✓
- The `{...(!cityScope && {...})}` spread passes the three location props together or not at all, matching FilterBar's all-or-nothing render guard. ✓
