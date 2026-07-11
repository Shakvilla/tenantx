# Listings Airbnb/Zillow Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public `/listings` and `/listings/[id]` pages as a responsive, Tailwind-styled, Airbnb/Zillow-class experience with search, photo mosaic + lightbox, embedded map, similar listings, and a mobile booking bar — preserving all existing behavior.

**Architecture:** Break the two monolithic inline-styled view files into a component family under `src/views/listings/components/` plus pure helpers in `src/views/listings/lib/`. Route-level `page.tsx` files keep fetching server-side; views stay `'use client'`. White-label brand colour arrives at runtime via `PlatformBrandingContext`, so brand-coloured elements use inline `style={{ background: primaryColour }}` while everything neutral uses Tailwind utilities.

**Tech Stack:** Next.js 15 App Router, React 18, Tailwind 3 (preflight OFF, `important: '#__next'` — utilities work because `<html id='__next'>`), Vitest 4 + happy-dom + React Testing Library, Remix-icon classes (`ri-*`, already globally loaded).

**Spec:** `docs/superpowers/specs/2026-07-11-listings-airbnb-redesign-design.md`

## Global Constraints

- Repo: `/Users/mac/Desktop/TenantApp/Tenants`. Current branch `feat/rbac-fixes` has MANY unrelated uncommitted changes. NEVER `git add -A` or `git add .` — always add explicit file paths.
- The default shell node is v10. EVERY npm/npx/vitest/tsc command MUST be prefixed: `export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && …`
- No new npm dependencies.
- Tests live under `src/__tests__/` and must match `src/__tests__/**/*.{test,spec}.{ts,tsx}` (vitest include pattern). Non-test helper files under `src/__tests__/` are NOT collected (safe for fixtures).
- Path alias `@` → `src` works in app code AND tests.
- Tailwind preflight is disabled — do not rely on preflight resets; the `.listings-root` wrapper in `src/app/listings/layout.tsx` already resets box-sizing/fonts and must stay.
- Fonts are fixed brand assets: headings get Bricolage Grotesque automatically via the `.listings-root h1–h6` rule; body is Proxima Nova. Never change font-family.
- Ghana specifics preserved verbatim: `GH₵` prefix, `en-GH` locale, WhatsApp `0…` → `+233…` phone rewrite.
- White-label: `usePlatformBranding()` gives `{ platformName, logoUrl, primaryColour }`. `primaryColour` is a runtime hex string — use inline `style` for it, never hardcode a brand colour.
- localStorage key for saves: `tenantx-saved-listings` (exact).
- Neutral palette (Airbnb-style): text `#222222`, muted `#717171`, borders `#DDDDDD`/`#EBEBEB`, image placeholder `#F0F0F0`, page `#fff`, footer `#F7F7F7`, green `#0A7B34`/`#F0FBF0`, red `#B91C1C`/`#FEF2F2`, WhatsApp `#25D366`.
- Existing user-visible copy that tests or users rely on keeps its exact text: "Homes available in Ghana", "No listings yet", "No exact matches", "Request a viewing", "What this place offers", "Where you'll be", "Show all photos", "You won't be charged anything", "More homes you might like" (new).
- Type-check gate: `export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx tsc --noEmit` must pass at the end of every task. (Pre-existing failures elsewhere in the repo, if any, are not yours — compare against a baseline run taken before Task 1.)

---

### Task 1: Shared formatting/link helpers (`format.ts`)

**Files:**
- Create: `src/views/listings/lib/format.ts`
- Test: `src/__tests__/listings/format.test.ts`

**Interfaces:**
- Consumes: `PublicListingDto` from `@/lib/api/listings-public-client` (exists).
- Produces (all later tasks import from `@/views/listings/lib/format`):
  - `formatGHS(n: number | null): string`
  - `bedroomLabel(n: number | null): string | null`
  - `daysSince(iso: string | null | undefined): number | null`
  - `formatDate(iso: string | null): string | null`
  - `buildWhatsApp(phone: string, title: string): string`
  - `buildMaps(q: string): string`
  - `buildMapsEmbed(q: string): string`
  - `matchesSearch(listing: PublicListingDto, query: string): boolean`

- [ ] **Step 1: Create the shared listing fixture used by every listings test**

Create `src/__tests__/listings/fixtures.ts` (not collected as a test — no `.test.` suffix):

```ts
import type { PublicListingDto } from '@/lib/api/listings-public-client'

export function makeListing(overrides: Partial<PublicListingDto> = {}): PublicListingDto {
  return {
    id: 'listing-1',
    unitId: 'unit-1',
    unitNo: '110',
    unitType: 'Apartment',
    bedrooms: 2,
    bathrooms: 1,
    sizeSqft: 870,
    rent: 1500,
    currency: 'GHS',
    amenities: ['Wifi', 'Parking', 'Security'],
    images: ['/img/a.jpg', '/img/b.jpg'],
    propertyId: 'prop-1',
    propertyName: 'Sunrise Apartments',
    propertyAddress: 'East Legon, Accra, Greater Accra',
    title: 'Unit 110 — Sunrise Apartments',
    description: 'A lovely two-bedroom apartment.',
    contactPhone: '0244123456',
    contactEmail: 'agent@example.com',
    availableFrom: '2026-08-01',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: null,
    ...overrides,
  }
}
```

- [ ] **Step 2: Write the failing tests**

Create `src/__tests__/listings/format.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  formatGHS, bedroomLabel, daysSince, formatDate,
  buildWhatsApp, buildMaps, buildMapsEmbed, matchesSearch,
} from '@/views/listings/lib/format'
import { makeListing } from './fixtures'

describe('formatGHS', () => {
  it('formats a number with GH₵ prefix and en-GH grouping', () => {
    expect(formatGHS(1500)).toBe('GH₵ 1,500')
  })
  it('renders an em dash for null', () => {
    expect(formatGHS(null)).toBe('—')
  })
})

describe('bedroomLabel', () => {
  it('returns Studio for 0', () => expect(bedroomLabel(0)).toBe('Studio'))
  it('singular for 1', () => expect(bedroomLabel(1)).toBe('1 bed'))
  it('plural for 2', () => expect(bedroomLabel(2)).toBe('2 beds'))
  it('null passes through', () => expect(bedroomLabel(null)).toBeNull())
})

describe('daysSince', () => {
  it('returns 0 for now-ish', () => {
    expect(daysSince(new Date().toISOString())).toBe(0)
  })
  it('returns null for missing input', () => {
    expect(daysSince(null)).toBeNull()
    expect(daysSince(undefined)).toBeNull()
  })
})

describe('formatDate', () => {
  it('formats an ISO date long-form', () => {
    expect(formatDate('2026-08-01')).toMatch(/August/)
    expect(formatDate('2026-08-01')).toMatch(/2026/)
  })
  it('returns null for null', () => expect(formatDate(null)).toBeNull())
})

describe('buildWhatsApp', () => {
  it('rewrites a leading 0 to +233 and strips spaces', () => {
    const url = buildWhatsApp('024 412 3456', 'Nice flat')
    expect(url).toContain('wa.me/+233244123456')
  })
  it('embeds the listing title in the prefilled message', () => {
    expect(buildWhatsApp('0244123456', 'Nice flat')).toContain(encodeURIComponent('"Nice flat"'))
  })
})

describe('buildMaps / buildMapsEmbed', () => {
  it('buildMaps produces a Google Maps search URL with encoded query', () => {
    expect(buildMaps('East Legon, Accra')).toBe(
      'https://www.google.com/maps/search/?api=1&query=East%20Legon%2C%20Accra'
    )
  })
  it('buildMapsEmbed produces the keyless embed URL', () => {
    expect(buildMapsEmbed('East Legon, Accra')).toBe(
      'https://www.google.com/maps?q=East%20Legon%2C%20Accra&output=embed'
    )
  })
})

describe('matchesSearch', () => {
  const listing = makeListing()
  it('matches on address, case-insensitive', () => {
    expect(matchesSearch(listing, 'east legon')).toBe(true)
  })
  it('matches on property name', () => {
    expect(matchesSearch(listing, 'sunrise')).toBe(true)
  })
  it('matches on unit type', () => {
    expect(matchesSearch(listing, 'apartment')).toBe(true)
  })
  it('empty query matches everything', () => {
    expect(matchesSearch(listing, '   ')).toBe(true)
  })
  it('non-matching query rejects', () => {
    expect(matchesSearch(listing, 'kumasi')).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/format.test.ts`
Expected: FAIL — cannot resolve `@/views/listings/lib/format`.

- [ ] **Step 4: Implement `format.ts`**

Create `src/views/listings/lib/format.ts` (logic moved verbatim from the two old views, plus `buildMapsEmbed` and `matchesSearch`):

```ts
import type { PublicListingDto } from '@/lib/api/listings-public-client'

export function formatGHS(n: number | null): string {
  if (n == null) return '—'
  return 'GH₵ ' + Number(n).toLocaleString('en-GH', { minimumFractionDigits: 0 })
}

export function bedroomLabel(n: number | null): string | null {
  if (n == null) return null
  if (n === 0) return 'Studio'
  return `${n} bed${n !== 1 ? 's' : ''}`
}

export function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
}

export function formatDate(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GH', { year: 'numeric', month: 'long', day: 'numeric' })
}

export function buildWhatsApp(phone: string, title: string): string {
  const cleaned = phone.replace(/\s+/g, '').replace(/^0/, '+233')
  const msg = encodeURIComponent(
    `Hi, I saw your listing for "${title}" and I'm interested. Could you please share more details?`
  )
  return `https://wa.me/${cleaned}?text=${msg}`
}

export function buildMaps(q: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function buildMapsEmbed(q: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
}

export function matchesSearch(listing: PublicListingDto, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [listing.propertyAddress, listing.propertyName, listing.unitType, listing.title].some(field =>
    (field ?? '').toLowerCase().includes(q)
  )
}
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/format.test.ts`
Expected: PASS (17 tests).

- [ ] **Step 6: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/lib/format.ts src/__tests__/listings/format.test.ts src/__tests__/listings/fixtures.ts
git commit -m "feat(listings): extract shared format/link helpers with tests"
```

---

### Task 2: Similar-listings matcher (`similar.ts`)

**Files:**
- Create: `src/views/listings/lib/similar.ts`
- Test: `src/__tests__/listings/similar.test.ts`

**Interfaces:**
- Consumes: `PublicListingDto`.
- Produces: `findSimilarListings(all: PublicListingDto[], current: PublicListingDto, cap?: number): PublicListingDto[]` — active listings only, excludes `current`, ranked address-token match (score 2) then same bedrooms (+1) then recency, capped at `cap` (default 4). Zero-score listings still fill remaining slots by recency.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/listings/similar.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { findSimilarListings } from '@/views/listings/lib/similar'
import { makeListing } from './fixtures'

const current = makeListing({ id: 'current', propertyAddress: 'East Legon, Accra', bedrooms: 2 })

describe('findSimilarListings', () => {
  it('excludes the current listing itself', () => {
    const out = findSimilarListings([current, makeListing({ id: 'other' })], current)
    expect(out.map(l => l.id)).not.toContain('current')
  })

  it('excludes inactive listings', () => {
    const inactive = makeListing({ id: 'inactive', status: 'INACTIVE' })
    expect(findSimilarListings([current, inactive], current)).toHaveLength(0)
  })

  it('ranks same-area listings above same-bedroom listings', () => {
    const sameArea = makeListing({ id: 'area', propertyAddress: 'Adjiringanor, Accra', bedrooms: 5 })
    const sameBeds = makeListing({ id: 'beds', propertyAddress: 'Ahodwo, Kumasi', bedrooms: 2 })
    const out = findSimilarListings([sameBeds, sameArea, current], current)
    expect(out[0].id).toBe('area')
    expect(out[1].id).toBe('beds')
  })

  it('caps at 4 by default', () => {
    const many = Array.from({ length: 8 }, (_, i) => makeListing({ id: `l${i}` }))
    expect(findSimilarListings([...many, current], current)).toHaveLength(4)
  })

  it('fills remaining slots with most-recent zero-score listings', () => {
    const older = makeListing({ id: 'older', propertyAddress: 'Takoradi', bedrooms: 9, createdAt: '2026-01-01T00:00:00Z' })
    const newer = makeListing({ id: 'newer', propertyAddress: 'Tamale', bedrooms: 9, createdAt: '2026-07-01T00:00:00Z' })
    const out = findSimilarListings([older, newer, current], current)
    expect(out.map(l => l.id)).toEqual(['newer', 'older'])
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/similar.test.ts`
Expected: FAIL — cannot resolve `@/views/listings/lib/similar`.

- [ ] **Step 3: Implement `similar.ts`**

Create `src/views/listings/lib/similar.ts`:

```ts
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
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/similar.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/lib/similar.ts src/__tests__/listings/similar.test.ts
git commit -m "feat(listings): similar-listings matcher (area > bedrooms > recency)"
```

---

### Task 3: `useSavedListings` hook

**Files:**
- Create: `src/views/listings/lib/useSavedListings.ts`
- Test: `src/__tests__/listings/useSavedListings.test.tsx`

**Interfaces:**
- Produces: `useSavedListings(): { isSaved: (id: string) => boolean; toggle: (id: string) => void }`. Persists a JSON string array under localStorage key `tenantx-saved-listings`. Hydrates from storage in a mount effect (starts empty during SSR/first render — no hydration mismatch).

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/listings/useSavedListings.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSavedListings } from '@/views/listings/lib/useSavedListings'

beforeEach(() => window.localStorage.clear())

describe('useSavedListings', () => {
  it('starts unsaved', () => {
    const { result } = renderHook(() => useSavedListings())
    expect(result.current.isSaved('a')).toBe(false)
  })

  it('toggle saves and unsaves', () => {
    const { result } = renderHook(() => useSavedListings())
    act(() => result.current.toggle('a'))
    expect(result.current.isSaved('a')).toBe(true)
    act(() => result.current.toggle('a'))
    expect(result.current.isSaved('a')).toBe(false)
  })

  it('persists across remount via localStorage', () => {
    const first = renderHook(() => useSavedListings())
    act(() => first.result.current.toggle('a'))
    first.unmount()

    const second = renderHook(() => useSavedListings())
    expect(second.result.current.isSaved('a')).toBe(true)
  })

  it('survives corrupt storage', () => {
    window.localStorage.setItem('tenantx-saved-listings', '{not json')
    const { result } = renderHook(() => useSavedListings())
    expect(result.current.isSaved('a')).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/useSavedListings.test.tsx`
Expected: FAIL — cannot resolve module.

- [ ] **Step 3: Implement the hook**

Create `src/views/listings/lib/useSavedListings.ts`:

```ts
'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'tenantx-saved-listings'

function readSaved(): Set<string> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [])
  } catch {
    return new Set()
  }
}

/**
 * Client-only saved-listings state, persisted to localStorage.
 * Starts empty on the server and first client render, then hydrates in an
 * effect — keeps SSR markup and first client render identical.
 */
export function useSavedListings() {
  const [saved, setSaved] = useState<Set<string>>(new Set())

  useEffect(() => {
    setSaved(readSaved())
  }, [])

  const toggle = useCallback((id: string) => {
    setSaved(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]))
      } catch {
        // storage full/blocked — keep in-memory state
      }
      return next
    })
  }, [])

  const isSaved = useCallback((id: string) => saved.has(id), [saved])

  return { isSaved, toggle }
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/useSavedListings.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/lib/useSavedListings.ts src/__tests__/listings/useSavedListings.test.tsx
git commit -m "feat(listings): localStorage-backed saved-listings hook"
```

---

### Task 4: Card building blocks — `SaveButton`, `PhotoCarousel`, `ListingCard`

**Files:**
- Create: `src/views/listings/components/SaveButton.tsx`
- Create: `src/views/listings/components/PhotoCarousel.tsx`
- Create: `src/views/listings/components/ListingCard.tsx`
- Test: `src/__tests__/listings/ListingCard.test.tsx`

**Interfaces:**
- Consumes: `formatGHS`, `bedroomLabel`, `daysSince` from Task 1.
- Produces:
  - `SaveButton({ saved: boolean; onToggle: () => void; className?: string })` — controlled; stops event propagation so it works inside `<Link>` cards.
  - `PhotoCarousel({ images: string[]; alt: string })` — internal index state, hover arrows, dot indicators, pointer-swipe.
  - `ListingCard({ listing: PublicListingDto; saved: boolean; onToggleSave: () => void })` — the shared grid card used by the index grid (Task 6) AND SimilarListings (Task 9).

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/listings/ListingCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ListingCard from '@/views/listings/components/ListingCard'
import { makeListing } from './fixtures'

describe('ListingCard', () => {
  it('links to the listing detail page', () => {
    render(<ListingCard listing={makeListing()} saved={false} onToggleSave={() => {}} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/listings/listing-1')
  })

  it('leads with the location line (Airbnb convention)', () => {
    render(<ListingCard listing={makeListing()} saved={false} onToggleSave={() => {}} />)
    expect(screen.getByText('East Legon, Accra, Greater Accra')).toBeInTheDocument()
  })

  it('shows property, beds/baths and monthly price', () => {
    render(<ListingCard listing={makeListing()} saved={false} onToggleSave={() => {}} />)
    expect(screen.getByText(/Sunrise Apartments/)).toBeInTheDocument()
    expect(screen.getByText(/2 beds · 1 bath/)).toBeInTheDocument()
    expect(screen.getByText('GH₵ 1,500')).toBeInTheDocument()
    expect(screen.getByText('/ month')).toBeInTheDocument()
  })

  it('shows the New badge for listings under 15 days old', () => {
    render(<ListingCard listing={makeListing()} saved={false} onToggleSave={() => {}} />)
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('hides the New badge for old listings', () => {
    render(
      <ListingCard listing={makeListing({ createdAt: '2025-01-01T00:00:00Z' })} saved={false} onToggleSave={() => {}} />
    )
    expect(screen.queryByText('New')).not.toBeInTheDocument()
  })

  it('save button calls onToggleSave without navigating', () => {
    const onToggle = vi.fn()
    render(<ListingCard listing={makeListing()} saved={false} onToggleSave={onToggle} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('save button reflects saved state', () => {
    render(<ListingCard listing={makeListing()} saved={true} onToggleSave={() => {}} />)
    expect(screen.getByRole('button', { name: 'Remove from saved' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('renders a no-photo placeholder when there are no images', () => {
    render(<ListingCard listing={makeListing({ images: [] })} saved={false} onToggleSave={() => {}} />)
    expect(screen.getByText('No photo')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/ListingCard.test.tsx`
Expected: FAIL — cannot resolve components.

- [ ] **Step 3: Implement `SaveButton.tsx`**

```tsx
'use client'

interface SaveButtonProps {
  saved: boolean
  onToggle: () => void
  className?: string
}

export default function SaveButton({ saved, onToggle, className = '' }: SaveButtonProps) {
  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    onToggle()
  }

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? 'Remove from saved' : 'Save'}
      aria-pressed={saved}
      className={`flex cursor-pointer border-none bg-transparent p-0.5 leading-none ${className}`}
    >
      <svg width='26' height='26' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'>
        <path
          d='M16 28l-1.5-1.4C7.4 19.8 3 16 3 11A7 7 0 0116 6.6 7 7 0 0129 11c0 5-4.4 8.8-11.5 15.6z'
          fill='none' stroke='rgba(0,0,0,0.3)' strokeWidth='3'
        />
        <path
          d='M16 28l-1.5-1.4C7.4 19.8 3 16 3 11A7 7 0 0116 6.6 7 7 0 0129 11c0 5-4.4 8.8-11.5 15.6z'
          fill={saved ? '#E53E3E' : 'rgba(255,255,255,0.88)'}
          stroke={saved ? '#E53E3E' : 'rgba(255,255,255,0.9)'} strokeWidth='1.5'
        />
      </svg>
    </button>
  )
}
```

- [ ] **Step 4: Implement `PhotoCarousel.tsx`**

```tsx
'use client'

import { useRef, useState } from 'react'

interface PhotoCarouselProps {
  images: string[]
  alt: string
}

export default function PhotoCarousel({ images, alt }: PhotoCarouselProps) {
  const [idx, setIdx] = useState(0)
  const pointerStartX = useRef<number | null>(null)

  if (images.length === 0) {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center gap-1.5 text-[#C0C0C0]'>
        <i className='ri-image-line text-3xl' aria-hidden='true' />
        <span className='text-xs'>No photo</span>
      </div>
    )
  }

  function prev(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setIdx(i => Math.max(0, i - 1))
  }
  function next(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation()
    setIdx(i => Math.min(images.length - 1, i + 1))
  }

  function onPointerDown(e: React.PointerEvent) {
    pointerStartX.current = e.clientX
  }
  function onPointerUp(e: React.PointerEvent) {
    if (pointerStartX.current == null) return
    const dx = e.clientX - pointerStartX.current
    pointerStartX.current = null
    if (Math.abs(dx) < 40) return
    e.preventDefault()
    setIdx(i => (dx < 0 ? Math.min(images.length - 1, i + 1) : Math.max(0, i - 1)))
  }

  const arrowClass =
    'absolute top-1/2 z-[3] flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center ' +
    'rounded-full border-none bg-white/95 shadow-md opacity-0 transition-opacity group-hover/card:opacity-100'

  return (
    <div className='relative h-full w-full touch-pan-y' onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
      <img
        src={images[idx]} alt={alt} loading='lazy' draggable={false}
        className='block h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105'
      />
      {images.length > 1 && (
        <>
          {idx > 0 && (
            <button onClick={prev} aria-label='Previous photo' className={`${arrowClass} left-2.5`}>
              <i className='ri-arrow-left-s-line text-base text-[#222222]' aria-hidden='true' />
            </button>
          )}
          {idx < images.length - 1 && (
            <button onClick={next} aria-label='Next photo' className={`${arrowClass} right-2.5`}>
              <i className='ri-arrow-right-s-line text-base text-[#222222]' aria-hidden='true' />
            </button>
          )}
          <div className='absolute bottom-2.5 left-0 right-0 z-[2] flex justify-center gap-1' aria-hidden='true'>
            {images.slice(0, 5).map((_, i) => (
              <span
                key={i}
                className={`rounded-full transition-all duration-150 ${
                  i === idx ? 'h-1.5 w-1.5 bg-white' : 'h-[5px] w-[5px] bg-white/50'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Implement `ListingCard.tsx`**

```tsx
'use client'

import Link from 'next/link'
import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { formatGHS, bedroomLabel, daysSince } from '../lib/format'
import PhotoCarousel from './PhotoCarousel'
import SaveButton from './SaveButton'

interface ListingCardProps {
  listing: PublicListingDto
  saved: boolean
  onToggleSave: () => void
}

export default function ListingCard({ listing, saved, onToggleSave }: ListingCardProps) {
  const age = daysSince(listing.createdAt)
  const isNew = age != null && age <= 14

  const bedBath = [
    bedroomLabel(listing.bedrooms),
    listing.bathrooms != null && `${listing.bathrooms} bath${listing.bathrooms !== 1 ? 's' : ''}`,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Link href={`/listings/${listing.id}`} className='group/card block text-inherit no-underline'>
      <article>
        <div className='relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#F0F0F0]'>
          <PhotoCarousel images={listing.images} alt={listing.title} />
          <SaveButton saved={saved} onToggle={onToggleSave} className='absolute right-3 top-3 z-[2]' />
          {isNew && (
            <span className='absolute left-3 top-3 z-[2] rounded-full bg-white px-2.5 py-1 text-[11px] font-bold tracking-wide text-[#222222] shadow-sm'>
              New
            </span>
          )}
        </div>

        <div className='pt-2.5'>
          <div className='truncate text-sm font-semibold text-[#222222]'>{listing.propertyAddress}</div>
          <div className='mt-0.5 truncate text-[13px] text-[#717171]'>
            {[listing.propertyName, listing.unitNo && `Unit ${listing.unitNo}`].filter(Boolean).join(' · ')}
          </div>
          {bedBath && <div className='text-[13px] text-[#717171]'>{bedBath}</div>}
          <div className='mt-2 text-[15px]'>
            <span className='font-bold text-[#222222]'>{formatGHS(listing.rent)}</span>
            <span className='text-[13px] text-[#717171]'> / month</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/ListingCard.test.tsx`
Expected: PASS (8 tests).

- [ ] **Step 7: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/components/SaveButton.tsx src/views/listings/components/PhotoCarousel.tsx src/views/listings/components/ListingCard.tsx src/__tests__/listings/ListingCard.test.tsx
git commit -m "feat(listings): SaveButton, PhotoCarousel and shared ListingCard"
```

---

### Task 5: `SearchPill` and `FilterBar`

**Files:**
- Create: `src/views/listings/components/SearchPill.tsx`
- Create: `src/views/listings/components/FilterBar.tsx`
- Test: `src/__tests__/listings/FilterBar.test.tsx`

**Interfaces:**
- Produces:
  - `SearchPill({ value: string; onChange: (v: string) => void; brandColour: string })` — single free-text input, brand-coloured search icon circle, clear button when non-empty.
  - `FilterBar(props: FilterBarProps)` with `FilterBarProps = { bedFilter: number | null; onBedFilter: (v: number | null) => void; maxPrice: number | null; onMaxPrice: (v: number | null) => void; maxRent: number; sort: SortValue; onSort: (v: SortValue) => void; hasFilters: boolean; onClearAll: () => void; brandColour: string }`
  - `export type SortValue = 'newest' | 'price_asc' | 'price_desc'`
  - `export const BED_FILTERS` (same five options as the old view: Any type / Studio / 1 bed / 2 beds / 3+ beds)

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/listings/FilterBar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FilterBar from '@/views/listings/components/FilterBar'
import SearchPill from '@/views/listings/components/SearchPill'

const baseProps = {
  bedFilter: null,
  onBedFilter: vi.fn(),
  maxPrice: null,
  onMaxPrice: vi.fn(),
  maxRent: 10000,
  sort: 'newest' as const,
  onSort: vi.fn(),
  hasFilters: false,
  onClearAll: vi.fn(),
  brandColour: '#7367F0',
}

describe('FilterBar', () => {
  it('renders all five bedroom chips', () => {
    render(<FilterBar {...baseProps} />)
    for (const label of ['Any type', 'Studio', '1 bed', '2 beds', '3+ beds']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('clicking a chip reports the bedroom value', () => {
    const onBedFilter = vi.fn()
    render(<FilterBar {...baseProps} onBedFilter={onBedFilter} />)
    fireEvent.click(screen.getByRole('button', { name: '2 beds' }))
    expect(onBedFilter).toHaveBeenCalledWith(2)
  })

  it('price chip opens the slider panel', () => {
    render(<FilterBar {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: /price/i }))
    expect(screen.getByRole('slider')).toBeInTheDocument()
  })

  it('sort select reports changes', () => {
    const onSort = vi.fn()
    render(<FilterBar {...baseProps} onSort={onSort} />)
    fireEvent.change(screen.getByLabelText('Sort listings'), { target: { value: 'price_asc' } })
    expect(onSort).toHaveBeenCalledWith('price_asc')
  })

  it('Clear all appears only when filters are active', () => {
    const { rerender } = render(<FilterBar {...baseProps} />)
    expect(screen.queryByText('Clear all')).not.toBeInTheDocument()
    rerender(<FilterBar {...baseProps} hasFilters={true} />)
    expect(screen.getByText('Clear all')).toBeInTheDocument()
  })
})

describe('SearchPill', () => {
  it('reports typed text', () => {
    const onChange = vi.fn()
    render(<SearchPill value='' onChange={onChange} brandColour='#7367F0' />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'accra' } })
    expect(onChange).toHaveBeenCalledWith('accra')
  })

  it('shows a clear button only when there is text', () => {
    const onChange = vi.fn()
    const { rerender } = render(<SearchPill value='' onChange={onChange} brandColour='#7367F0' />)
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
    rerender(<SearchPill value='accra' onChange={onChange} brandColour='#7367F0' />)
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onChange).toHaveBeenCalledWith('')
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/FilterBar.test.tsx`
Expected: FAIL — cannot resolve components.

- [ ] **Step 3: Implement `SearchPill.tsx`**

```tsx
'use client'

interface SearchPillProps {
  value: string
  onChange: (v: string) => void
  brandColour: string
}

export default function SearchPill({ value, onChange, brandColour }: SearchPillProps) {
  return (
    <div
      className='flex w-full items-center gap-2 rounded-full border border-[#DDDDDD] bg-white py-1.5 pl-5 pr-1.5
                 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)] transition-shadow
                 focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.14)]'
    >
      <i className='ri-map-pin-2-line shrink-0 text-[#717171]' aria-hidden='true' />
      <input
        type='search'
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder='Search by area, city or property'
        aria-label='Search listings by location or property name'
        className='w-full border-none bg-transparent text-sm text-[#222222] outline-none [&::-webkit-search-cancel-button]:hidden'
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label='Clear search'
          className='flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-[#F0F0F0] text-[#717171] hover:bg-[#E4E4E4]'
        >
          <i className='ri-close-line text-sm' aria-hidden='true' />
        </button>
      )}
      <span
        aria-hidden='true'
        className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white'
        style={{ background: brandColour }}
      >
        <i className='ri-search-line text-sm' />
      </span>
    </div>
  )
}
```

- [ ] **Step 4: Implement `FilterBar.tsx`**

```tsx
'use client'

import { useState } from 'react'

export type SortValue = 'newest' | 'price_asc' | 'price_desc'

export const BED_FILTERS: { label: string; value: number | null }[] = [
  { label: 'Any type', value: null },
  { label: 'Studio', value: 0 },
  { label: '1 bed', value: 1 },
  { label: '2 beds', value: 2 },
  { label: '3+ beds', value: 3 },
]

const SORT_OPTIONS: { label: string; value: SortValue }[] = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: low to high', value: 'price_asc' },
  { label: 'Price: high to low', value: 'price_desc' },
]

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
}

function chipClass(active: boolean): string {
  return (
    'cursor-pointer whitespace-nowrap rounded-full border px-4 py-2 text-[13px] transition-colors ' +
    (active
      ? 'border-[#222222] bg-[#222222] font-semibold text-white'
      : 'border-[#DDDDDD] bg-white font-medium text-[#222222] hover:border-[#222222]')
  )
}

export default function FilterBar(props: FilterBarProps) {
  const {
    bedFilter, onBedFilter, maxPrice, onMaxPrice, maxRent,
    sort, onSort, hasFilters, onClearAll, brandColour,
  } = props
  const [showSlider, setShowSlider] = useState(false)

  return (
    <div>
      <div className='flex items-center gap-2 overflow-x-auto pb-0.5'>
        {BED_FILTERS.map(f => (
          <button key={String(f.value)} onClick={() => onBedFilter(f.value)} className={chipClass(bedFilter === f.value)}>
            {f.label}
          </button>
        ))}

        <span className='mx-1 h-5 w-px shrink-0 bg-[#DDDDDD]' aria-hidden='true' />

        <button
          onClick={() => setShowSlider(s => !s)}
          className={`${chipClass(maxPrice !== null)} flex items-center gap-1.5`}
        >
          <i className='ri-equalizer-line' aria-hidden='true' />
          {maxPrice !== null ? `Max GH₵ ${Number(maxPrice).toLocaleString()}` : 'Price'}
        </button>

        <label className='ml-auto flex shrink-0 cursor-pointer items-center gap-2'>
          <span className='text-[13px] text-[#717171]'>Sort</span>
          <select
            value={sort}
            onChange={e => onSort(e.target.value as SortValue)}
            aria-label='Sort listings'
            className='cursor-pointer rounded-full border border-[#DDDDDD] bg-white px-3 py-2 text-[13px] font-medium text-[#222222]'
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        {hasFilters && (
          <button
            onClick={onClearAll}
            className='shrink-0 cursor-pointer whitespace-nowrap border-none bg-transparent px-2 py-2 text-[13px] text-[#222222] underline'
          >
            Clear all
          </button>
        )}
      </div>

      {showSlider && (
        <div className='mt-2.5 flex flex-wrap items-center gap-4 border-t border-[#F0F0F0] pt-3.5 pb-1'>
          <label htmlFor='max-price-slider' className='min-w-[180px] text-[13px] font-semibold text-[#222222]'>
            Max: {maxPrice !== null ? `GH₵ ${Number(maxPrice).toLocaleString()}` : 'Any price'}
          </label>
          <input
            id='max-price-slider'
            type='range' min={0} max={maxRent} step={100}
            value={maxPrice ?? maxRent}
            onChange={e => onMaxPrice(Number(e.target.value) >= maxRent ? null : Number(e.target.value))}
            className='max-w-[340px] flex-1'
            style={{ accentColor: brandColour }}
          />
          <button
            onClick={() => setShowSlider(false)}
            className='cursor-pointer border-none bg-transparent text-[13px] font-semibold text-[#222222] underline'
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/FilterBar.test.tsx`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/components/SearchPill.tsx src/views/listings/components/FilterBar.tsx src/__tests__/listings/FilterBar.test.tsx
git commit -m "feat(listings): SearchPill and FilterBar controls"
```

---

### Task 6: Rewrite `ListingsIndexView`

**Files:**
- Modify: `src/views/listings/ListingsIndexView.tsx` (full rewrite)
- Test: `src/__tests__/listings/ListingsIndexView.test.tsx`

**Interfaces:**
- Consumes: `ListingCard`, `SearchPill`, `FilterBar` + `SortValue`, `useSavedListings`, `matchesSearch`, `usePlatformBranding`.
- Produces: default export `ListingsIndexView({ listings: PublicListingDto[] })` — same prop contract as today, `src/app/listings/page.tsx` needs NO change.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/listings/ListingsIndexView.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ListingsIndexView from '@/views/listings/ListingsIndexView'
import { makeListing } from './fixtures'

beforeEach(() => window.localStorage.clear())

const listings = [
  makeListing({ id: 'a', propertyAddress: 'East Legon, Accra', propertyName: 'Sunrise', bedrooms: 2, rent: 1500 }),
  makeListing({ id: 'b', propertyAddress: 'Ahodwo, Kumasi', propertyName: 'Palm Court', bedrooms: 1, rent: 900 }),
  makeListing({ id: 'c', propertyAddress: 'Tamale Central, Tamale', propertyName: 'Chandiba', bedrooms: 2, rent: 3000, status: 'INACTIVE' }),
]

describe('ListingsIndexView', () => {
  it('renders the page heading', () => {
    render(<ListingsIndexView listings={listings} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Homes available in Ghana')
  })

  it('renders only ACTIVE listings', () => {
    render(<ListingsIndexView listings={listings} />)
    expect(screen.getByText('East Legon, Accra')).toBeInTheDocument()
    expect(screen.getByText('Ahodwo, Kumasi')).toBeInTheDocument()
    expect(screen.queryByText('Tamale Central, Tamale')).not.toBeInTheDocument()
  })

  it('search filters by location text', () => {
    render(<ListingsIndexView listings={listings} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'kumasi' } })
    expect(screen.queryByText('East Legon, Accra')).not.toBeInTheDocument()
    expect(screen.getByText('Ahodwo, Kumasi')).toBeInTheDocument()
  })

  it('bedroom chip filters the grid', () => {
    render(<ListingsIndexView listings={listings} />)
    fireEvent.click(screen.getByRole('button', { name: '1 bed' }))
    expect(screen.queryByText('East Legon, Accra')).not.toBeInTheDocument()
    expect(screen.getByText('Ahodwo, Kumasi')).toBeInTheDocument()
  })

  it('shows the no-exact-matches empty state and clears it', () => {
    render(<ListingsIndexView listings={listings} />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz-nowhere' } })
    expect(screen.getByText('No exact matches')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }))
    expect(screen.getByText('East Legon, Accra')).toBeInTheDocument()
  })

  it('shows the no-listings empty state when the API returned nothing', () => {
    render(<ListingsIndexView listings={[]} />)
    expect(screen.getByText('No listings yet')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/ListingsIndexView.test.tsx`
Expected: FAIL — old view has no searchbox / different structure.

- [ ] **Step 3: Rewrite `ListingsIndexView.tsx` (replace the whole file)**

```tsx
'use client'

import { useMemo, useState } from 'react'
import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { usePlatformBranding } from '@/contexts/PlatformBrandingContext'
import { matchesSearch } from './lib/format'
import { useSavedListings } from './lib/useSavedListings'
import ListingCard from './components/ListingCard'
import SearchPill from './components/SearchPill'
import FilterBar, { type SortValue } from './components/FilterBar'

export default function ListingsIndexView({ listings }: { listings: PublicListingDto[] }) {
  const { platformName, logoUrl, primaryColour } = usePlatformBranding()
  const { isSaved, toggle } = useSavedListings()

  const [searchQuery, setSearchQuery] = useState('')
  const [bedFilter, setBedFilter] = useState<number | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [sort, setSort] = useState<SortValue>('newest')

  const maxRent = useMemo(() => {
    const rents = listings.map(l => l.rent).filter((r): r is number => r != null)
    return rents.length ? Math.max(...rents) : 10000
  }, [listings])

  const filtered = useMemo(() => {
    let out = listings.filter(l => l.status === 'ACTIVE')
    if (searchQuery.trim()) out = out.filter(l => matchesSearch(l, searchQuery))
    if (bedFilter !== null) {
      out = bedFilter >= 3
        ? out.filter(l => (l.bedrooms ?? 0) >= 3)
        : out.filter(l => l.bedrooms === bedFilter)
    }
    if (maxPrice !== null) out = out.filter(l => l.rent == null || l.rent <= maxPrice)
    return [...out].sort((a, b) => {
      if (sort === 'price_asc') return (a.rent ?? 0) - (b.rent ?? 0)
      if (sort === 'price_desc') return (b.rent ?? 0) - (a.rent ?? 0)
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    })
  }, [listings, searchQuery, bedFilter, maxPrice, sort])

  const hasFilters = bedFilter !== null || maxPrice !== null || searchQuery.trim() !== ''

  function clearAll() {
    setSearchQuery('')
    setBedFilter(null)
    setMaxPrice(null)
  }

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
          />
        </div>
      </div>
      </div>{/* /sticky wrapper */}

      {/* ── Content ── */}
      <main className='mx-auto max-w-[1400px] px-6 pb-20 pt-8 lg:px-10'>
        {listings.length > 0 && (
          <div className='mb-7'>
            <h1 className='text-2xl font-extrabold text-[#222222]'>Homes available in Ghana</h1>
            <p className='mt-1.5 text-sm text-[#717171]'>
              {filtered.length} home{filtered.length !== 1 ? 's' : ''} · Prices in GHS
            </p>
          </div>
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
              {listings.length === 0 ? 'No listings yet' : 'No exact matches'}
            </div>
            <div className='max-w-[300px] text-sm leading-relaxed text-[#717171]'>
              {listings.length === 0
                ? 'Check back soon — new rentals are added regularly.'
                : "Try adjusting your filters to find what you're looking for."}
            </div>
            {listings.length > 0 && (
              <button
                onClick={clearAll}
                className='mt-2 cursor-pointer rounded-lg border-none bg-[#222222] px-7 py-3 text-sm font-semibold text-white'
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
            {filtered.map(listing => (
              <ListingCard
                key={listing.id}
                listing={listing}
                saved={isSaved(listing.id)}
                onToggleSave={() => toggle(listing.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className='border-t border-[#EBEBEB] bg-[#F7F7F7] px-6 py-5'>
        <div className='mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 text-xs text-[#717171]'>
          <span>© 2025 {platformName} · Ghana Property Platform</span>
          <span className='text-[#BBBBBB]'>All prices in Ghana Cedis (GHS)</span>
        </div>
      </footer>
    </div>
  )
}
```

Note: the old file's `SaveButton`, `ListingCard`, `BED_FILTERS`, `SORT_OPTIONS`, helper functions are all deleted with the rewrite — their replacements live in `components/` and `lib/`.

- [ ] **Step 4: Run tests, verify they pass**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/`
Expected: ALL listings tests PASS.

- [ ] **Step 5: Type-check**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx tsc --noEmit`
Expected: no NEW errors versus baseline.

- [ ] **Step 6: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/ListingsIndexView.tsx src/__tests__/listings/ListingsIndexView.test.tsx
git commit -m "feat(listings): rewrite index view — search pill, filter bar, responsive card grid"
```

---

### Task 7: `Lightbox` and `PhotoMosaic`

**Files:**
- Create: `src/views/listings/components/Lightbox.tsx`
- Create: `src/views/listings/components/PhotoMosaic.tsx`
- Test: `src/__tests__/listings/PhotoMosaic.test.tsx`

**Interfaces:**
- Produces:
  - `Lightbox({ images: string[]; title: string; index: number; onIndexChange: (i: number) => void; onClose: () => void })` — fullscreen viewer; Escape closes, ArrowLeft/ArrowRight cycle (wrap-around), thumbnail filmstrip jumps.
  - `PhotoMosaic({ images: string[]; title: string })` — 1-big-4-small grid, "Show all photos" button, owns the lightbox open/index state internally.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/listings/PhotoMosaic.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import PhotoMosaic from '@/views/listings/components/PhotoMosaic'

const images = ['/a.jpg', '/b.jpg', '/c.jpg', '/d.jpg', '/e.jpg', '/f.jpg']

describe('PhotoMosaic', () => {
  it('renders a no-photos placeholder for empty images', () => {
    render(<PhotoMosaic images={[]} title='Test home' />)
    expect(screen.getByText('No photos available')).toBeInTheDocument()
  })

  it('shows at most 5 tiles plus a Show all photos button', () => {
    render(<PhotoMosaic images={images} title='Test home' />)
    expect(screen.getAllByRole('img')).toHaveLength(5)
    expect(screen.getByRole('button', { name: /show all photos/i })).toBeInTheDocument()
  })

  it('opens the lightbox from the Show all button and closes with Escape', () => {
    render(<PhotoMosaic images={images} title='Test home' />)
    fireEvent.click(screen.getByRole('button', { name: /show all photos/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('1 / 6')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('arrow keys navigate with wrap-around', () => {
    render(<PhotoMosaic images={images} title='Test home' />)
    fireEvent.click(screen.getByRole('button', { name: /show all photos/i }))
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('6 / 6')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('1 / 6')).toBeInTheDocument()
  })

  it('single image renders full-width without the Show all button', () => {
    render(<PhotoMosaic images={['/only.jpg']} title='Test home' />)
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /show all photos/i })).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/PhotoMosaic.test.tsx`
Expected: FAIL — cannot resolve components.

- [ ] **Step 3: Implement `Lightbox.tsx`**

```tsx
'use client'

import { useEffect } from 'react'

interface LightboxProps {
  images: string[]
  title: string
  index: number
  onIndexChange: (i: number) => void
  onClose: () => void
}

export default function Lightbox({ images, title, index, onIndexChange, onClose }: LightboxProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onIndexChange(index === 0 ? images.length - 1 : index - 1)
      if (e.key === 'ArrowRight') onIndexChange(index === images.length - 1 ? 0 : index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, images.length, onClose, onIndexChange])

  const navBtn =
    'flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-none bg-white/10 text-2xl text-white hover:bg-white/20'

  return (
    <div
      role='dialog'
      aria-modal='true'
      aria-label={`Photos of ${title}`}
      onClick={onClose}
      className='fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95'
    >
      <button
        onClick={onClose}
        aria-label='Close photos'
        className='absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none bg-white/10 text-lg text-white hover:bg-white/20'
      >
        ✕
      </button>
      <span className='absolute top-5 left-1/2 -translate-x-1/2 text-[13px] text-white/60'>
        {index + 1} / {images.length}
      </span>

      <div className='flex w-full items-center justify-center gap-3 px-4' onClick={e => e.stopPropagation()}>
        <button onClick={() => onIndexChange(index === 0 ? images.length - 1 : index - 1)} aria-label='Previous photo' className={navBtn}>
          ‹
        </button>
        <img
          src={images[index]}
          alt={`${title} — photo ${index + 1}`}
          className='max-h-[72vh] max-w-[80vw] rounded-lg object-contain'
        />
        <button onClick={() => onIndexChange(index === images.length - 1 ? 0 : index + 1)} aria-label='Next photo' className={navBtn}>
          ›
        </button>
      </div>

      {/* Thumbnail filmstrip */}
      <div
        className='absolute bottom-4 left-0 right-0 flex justify-center gap-2 overflow-x-auto px-4 py-1'
        onClick={e => e.stopPropagation()}
      >
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => onIndexChange(i)}
            aria-label={`Go to photo ${i + 1}`}
            className={`h-14 w-20 shrink-0 cursor-pointer overflow-hidden rounded-md border-2 border-solid bg-transparent p-0 transition-opacity ${
              i === index ? 'border-white opacity-100' : 'border-transparent opacity-50 hover:opacity-80'
            }`}
          >
            <img src={src} alt='' aria-hidden='true' className='h-full w-full object-cover' />
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement `PhotoMosaic.tsx`**

```tsx
'use client'

import { useState } from 'react'
import Lightbox from './Lightbox'

interface PhotoMosaicProps {
  images: string[]
  title: string
}

export default function PhotoMosaic({ images, title }: PhotoMosaicProps) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (images.length === 0) {
    return (
      <div className='flex h-[380px] flex-col items-center justify-center gap-2.5 rounded-2xl bg-[#F7F7F7] text-[#BBBBBB]'>
        <i className='ri-image-line text-5xl' aria-hidden='true' />
        <span className='text-sm'>No photos available</span>
      </div>
    )
  }

  const tiles = images.slice(1, 5)

  return (
    <>
      <div className='relative overflow-hidden rounded-2xl'>
        {images.length === 1 ? (
          <button
            onClick={() => setLightbox(0)}
            aria-label='Open photo'
            className='block h-[300px] w-full cursor-zoom-in border-none bg-transparent p-0 sm:h-[420px]'
          >
            <img src={images[0]} alt={title} className='block h-full w-full object-cover' />
          </button>
        ) : (
          <div className='grid h-[300px] grid-cols-1 gap-0.5 sm:h-[420px] sm:grid-cols-2'>
            <button
              onClick={() => setLightbox(0)}
              aria-label='Open photo 1'
              className='block cursor-zoom-in overflow-hidden border-none bg-transparent p-0'
            >
              <img
                src={images[0]} alt={title}
                className='block h-full w-full object-cover transition-transform duration-300 hover:scale-[1.04]'
              />
            </button>
            <div className={`hidden gap-0.5 sm:grid ${tiles.length > 2 ? 'grid-cols-2' : 'grid-cols-1'} grid-rows-2`}>
              {tiles.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setLightbox(i + 1)}
                  aria-label={`Open photo ${i + 2}`}
                  className='block cursor-zoom-in overflow-hidden border-none bg-transparent p-0'
                >
                  <img
                    src={src} alt={`${title} ${i + 2}`}
                    className='block h-full w-full object-cover transition-transform duration-300 hover:scale-[1.05]'
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {images.length > 1 && (
          <button
            onClick={() => setLightbox(0)}
            className='absolute bottom-3.5 right-3.5 flex cursor-pointer items-center gap-1.5 rounded-lg border border-solid border-[#222222] bg-white px-4 py-2 text-[13px] font-semibold text-[#222222] shadow-sm'
          >
            <i className='ri-grid-line' aria-hidden='true' /> Show all photos
          </button>
        )}
      </div>

      {lightbox !== null && (
        <Lightbox
          images={images}
          title={title}
          index={lightbox}
          onIndexChange={setLightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/PhotoMosaic.test.tsx`
Expected: PASS (5 tests). Note: thumbnail-strip `<img>` elements are `aria-hidden` with empty alt so `getAllByRole('img')` counts only mosaic tiles when the lightbox is closed.

- [ ] **Step 6: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/components/Lightbox.tsx src/views/listings/components/PhotoMosaic.tsx src/__tests__/listings/PhotoMosaic.test.tsx
git commit -m "feat(listings): photo mosaic + keyboard-navigable lightbox with filmstrip"
```

---

### Task 8: Detail-page content blocks — `Highlights`, `LocationMap`, `InquiryForm`

**Files:**
- Create: `src/views/listings/components/Highlights.tsx`
- Create: `src/views/listings/components/LocationMap.tsx`
- Create: `src/views/listings/components/InquiryForm.tsx`
- Test: `src/__tests__/listings/DetailBlocks.test.tsx`

**Interfaces:**
- Consumes: `formatDate`, `buildMaps`, `buildMapsEmbed` from Task 1.
- Produces:
  - `Highlights({ listing: PublicListingDto })` — up to 3 icon rows (logic identical to old view).
  - `LocationMap({ propertyName: string; propertyAddress: string })` — lazy Google Maps iframe (`title` = `Map of {propertyName}`) + address + "Open in Maps" link.
  - `InquiryForm({ listing: PublicListingDto; primaryColour: string })` — same POST to `${API_BASE}/support/tickets`, same success/error states.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/listings/DetailBlocks.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Highlights from '@/views/listings/components/Highlights'
import LocationMap from '@/views/listings/components/LocationMap'
import InquiryForm from '@/views/listings/components/InquiryForm'
import { makeListing } from './fixtures'

describe('Highlights', () => {
  it('shows availability, bedrooms and amenities rows', () => {
    render(<Highlights listing={makeListing()} />)
    expect(screen.getByText(/Available/)).toBeInTheDocument()
    expect(screen.getByText(/2-bedroom apartment/)).toBeInTheDocument()
    expect(screen.getByText(/3 amenities included/)).toBeInTheDocument()
  })

  it('renders nothing when there is nothing to highlight', () => {
    const bare = makeListing({
      availableFrom: null, bedrooms: null, amenities: [], contactPhone: null,
    })
    const { container } = render(<Highlights listing={bare} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('LocationMap', () => {
  it('embeds a keyless Google Maps iframe for the address', () => {
    render(<LocationMap propertyName='Sunrise Apartments' propertyAddress='East Legon, Accra' />)
    const iframe = screen.getByTitle('Map of Sunrise Apartments')
    expect(iframe).toHaveAttribute('src', expect.stringContaining('output=embed'))
    expect(iframe.getAttribute('src')).toContain(encodeURIComponent('Sunrise Apartments, East Legon, Accra'))
  })

  it('links out to Google Maps', () => {
    render(<LocationMap propertyName='Sunrise Apartments' propertyAddress='East Legon, Accra' />)
    expect(screen.getByRole('link', { name: /open in maps/i })).toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps/search')
    )
  })
})

describe('InquiryForm', () => {
  it('disables submit until name and phone are filled', () => {
    render(<InquiryForm listing={makeListing()} primaryColour='#7367F0' />)
    const submit = screen.getByRole('button', { name: /request a viewing/i })
    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText('Your name *'), { target: { value: 'Ama' } })
    fireEvent.change(screen.getByPlaceholderText('Phone number *'), { target: { value: '0244000000' } })
    expect(submit).toBeEnabled()
  })

  it('prefills the message with the listing title', () => {
    render(<InquiryForm listing={makeListing()} primaryColour='#7367F0' />)
    expect(screen.getByDisplayValue(/Unit 110 — Sunrise Apartments/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/DetailBlocks.test.tsx`
Expected: FAIL — cannot resolve components.

- [ ] **Step 3: Implement `Highlights.tsx`**

```tsx
'use client'

import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { formatDate } from '../lib/format'

export default function Highlights({ listing }: { listing: PublicListingDto }) {
  const items: { icon: string; title: string; sub: string }[] = []

  if (listing.availableFrom) {
    items.push({
      icon: 'ri-calendar-check-line',
      title: `Available ${formatDate(listing.availableFrom)}`,
      sub: 'Secure your move-in date today',
    })
  }
  if (listing.bedrooms === 0) {
    items.push({ icon: 'ri-home-2-line', title: 'Studio apartment', sub: 'Efficient open-plan living' })
  } else if (listing.bedrooms != null) {
    items.push({
      icon: 'ri-hotel-bed-line',
      title: `${listing.bedrooms}-bedroom ${listing.unitType.toLowerCase()}`,
      sub: 'Fully private bedrooms',
    })
  }
  if (listing.amenities.length >= 3) {
    items.push({
      icon: 'ri-star-line',
      title: `${listing.amenities.length} amenities included`,
      sub: listing.amenities.slice(0, 2).join(', ') + ' & more',
    })
  }
  if (listing.contactPhone) {
    items.push({
      icon: 'ri-shield-check-line',
      title: 'Verified property manager',
      sub: 'Identity and licence confirmed',
    })
  }

  if (!items.length) return null

  return (
    <div className='flex flex-col'>
      {items.slice(0, 3).map((h, i) => (
        <div
          key={i}
          className={`flex items-start gap-4 py-4 ${
            i < Math.min(items.length, 3) - 1 ? 'border-b border-[#EBEBEB]' : ''
          }`}
        >
          <i className={`${h.icon} mt-0.5 shrink-0 text-2xl text-[#222222]`} aria-hidden='true' />
          <div>
            <div className='text-[15px] font-semibold text-[#222222]'>{h.title}</div>
            <div className='mt-0.5 text-[13px] text-[#717171]'>{h.sub}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Implement `LocationMap.tsx`**

```tsx
'use client'

import { buildMaps, buildMapsEmbed } from '../lib/format'

interface LocationMapProps {
  propertyName: string
  propertyAddress: string
}

export default function LocationMap({ propertyName, propertyAddress }: LocationMapProps) {
  const query = `${propertyName}, ${propertyAddress}`

  return (
    <div>
      <div className='overflow-hidden rounded-2xl border border-[#EBEBEB]'>
        <iframe
          src={buildMapsEmbed(query)}
          title={`Map of ${propertyName}`}
          loading='lazy'
          referrerPolicy='no-referrer-when-downgrade'
          className='block h-[300px] w-full border-0 sm:h-[380px]'
        />
      </div>
      <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <i className='ri-map-pin-2-fill shrink-0 text-2xl text-[#222222]' aria-hidden='true' />
          <div>
            <div className='text-[15px] font-semibold text-[#222222]'>{propertyName}</div>
            <div className='mt-0.5 text-[13px] text-[#717171]'>{propertyAddress}</div>
          </div>
        </div>
        <a
          href={buildMaps(query)}
          target='_blank'
          rel='noopener noreferrer'
          className='flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-solid border-[#222222] px-4 py-2 text-[13px] font-semibold text-[#222222] no-underline'
        >
          <i className='ri-external-link-line' aria-hidden='true' /> Open in Maps
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Implement `InquiryForm.tsx`** (logic unchanged from the old view, Tailwind classes)

```tsx
'use client'

import { useState } from 'react'
import type { PublicListingDto } from '@/lib/api/listings-public-client'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1'

const inputClass =
  'w-full rounded-lg border border-solid border-[#DDDDDD] bg-white px-3.5 py-3 text-sm text-[#222222] ' +
  'outline-none transition-colors focus:border-[#222222]'

interface InquiryFormProps {
  listing: PublicListingDto
  primaryColour: string
}

export default function InquiryForm({ listing, primaryColour }: InquiryFormProps) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState(
    `Hi, I'm interested in "${listing.title}" and would like to arrange a viewing.`
  )
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const body = [
        `Name: ${name}`,
        `Phone: ${phone}`,
        email && `Email: ${email}`,
        '',
        message,
        '',
        `Listing: ${listing.title} (${listing.id})`,
      ]
        .filter(Boolean)
        .join('\n')
      await fetch(`${API_BASE}/support/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: `listing-${listing.id}`,
          submitterEmail: email || `${phone}@inquiry`,
          subject: `Viewing request: ${listing.title}`,
          body,
          priority: 'MEDIUM',
        }),
      })
      setSuccess(true)
    } catch {
      setError('Could not send your message. Please call or WhatsApp directly.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className='px-4 py-8 text-center'>
        <div className='mx-auto mb-3 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#F0FBF0]'>
          <i className='ri-checkbox-circle-line text-3xl text-[#0A7B34]' aria-hidden='true' />
        </div>
        <div className='mb-1.5 text-base font-bold text-[#222222]'>Message sent!</div>
        <div className='text-[13px] text-[#717171]'>The property manager will contact you shortly.</div>
      </div>
    )
  }

  const canSubmit = !loading && name.trim() !== '' && phone.trim() !== ''

  return (
    <form onSubmit={submit} className='flex flex-col gap-2.5'>
      {error && (
        <div className='rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-[13px] text-[#B91C1C]'>
          {error}
        </div>
      )}
      <div className='grid grid-cols-1 gap-2.5 sm:grid-cols-2'>
        <input className={inputClass} placeholder='Your name *' value={name} onChange={e => setName(e.target.value)} required />
        <input className={inputClass} placeholder='Phone number *' type='tel' value={phone} onChange={e => setPhone(e.target.value)} required />
      </div>
      <input className={inputClass} placeholder='Email (optional)' type='email' value={email} onChange={e => setEmail(e.target.value)} />
      <textarea
        className={`${inputClass} min-h-[100px] resize-y`}
        value={message}
        onChange={e => setMessage(e.target.value)}
        required
        aria-label='Message to the property manager'
      />
      <button
        type='submit'
        disabled={!canSubmit}
        className={`rounded-lg border-none py-3.5 text-[15px] font-semibold text-white ${
          canSubmit ? 'cursor-pointer' : 'cursor-default'
        }`}
        style={{ background: canSubmit ? primaryColour : '#D1D5DB' }}
      >
        {loading ? 'Sending…' : 'Request a viewing'}
      </button>
      <p className='text-center text-xs text-[#717171]'>You won't be charged anything</p>
    </form>
  )
}
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/DetailBlocks.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 7: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/components/Highlights.tsx src/views/listings/components/LocationMap.tsx src/views/listings/components/InquiryForm.tsx src/__tests__/listings/DetailBlocks.test.tsx
git commit -m "feat(listings): highlights, embedded location map and inquiry form blocks"
```

---

### Task 9: Booking surfaces + similar listings — `BookingCard`, `MobileBookingBar`, `SimilarListings`

**Files:**
- Create: `src/views/listings/components/BookingCard.tsx`
- Create: `src/views/listings/components/MobileBookingBar.tsx`
- Create: `src/views/listings/components/SimilarListings.tsx`
- Test: `src/__tests__/listings/BookingSurfaces.test.tsx`

**Interfaces:**
- Consumes: `formatGHS`, `formatDate`, `buildWhatsApp` (Task 1), `findSimilarListings` (Task 2), `ListingCard` (Task 4).
- Produces:
  - `BookingCard({ listing: PublicListingDto; primaryColour: string; onRequestViewing: () => void })` — desktop sidebar card (price, availability, WhatsApp, request-viewing, call/email, copy link, agent badge).
  - `MobileBookingBar({ listing: PublicListingDto; primaryColour: string; onRequestViewing: () => void })` — `fixed bottom-0` bar, `lg:hidden`.
  - `SimilarListings({ all: PublicListingDto[]; current: PublicListingDto; isSaved: (id: string) => boolean; onToggleSave: (id: string) => void })` — renders `null` when no matches; heading "More homes you might like".

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/listings/BookingSurfaces.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BookingCard from '@/views/listings/components/BookingCard'
import MobileBookingBar from '@/views/listings/components/MobileBookingBar'
import SimilarListings from '@/views/listings/components/SimilarListings'
import { makeListing } from './fixtures'

describe('BookingCard', () => {
  it('shows price, WhatsApp link and viewing CTA', () => {
    render(<BookingCard listing={makeListing()} primaryColour='#7367F0' onRequestViewing={() => {}} />)
    expect(screen.getByText('GH₵ 1,500')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /whatsapp agent/i })).toHaveAttribute(
      'href',
      expect.stringContaining('wa.me/+233244123456')
    )
    expect(screen.getByRole('button', { name: /request a viewing/i })).toBeInTheDocument()
  })

  it('fires onRequestViewing', () => {
    const cb = vi.fn()
    render(<BookingCard listing={makeListing()} primaryColour='#7367F0' onRequestViewing={cb} />)
    fireEvent.click(screen.getByRole('button', { name: /request a viewing/i }))
    expect(cb).toHaveBeenCalledOnce()
  })

  it('omits WhatsApp/call when there is no phone', () => {
    render(
      <BookingCard listing={makeListing({ contactPhone: null })} primaryColour='#7367F0' onRequestViewing={() => {}} />
    )
    expect(screen.queryByRole('link', { name: /whatsapp/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /call agent/i })).not.toBeInTheDocument()
  })
})

describe('MobileBookingBar', () => {
  it('shows the monthly price and CTA', () => {
    const cb = vi.fn()
    render(<MobileBookingBar listing={makeListing()} primaryColour='#7367F0' onRequestViewing={cb} />)
    expect(screen.getByText('GH₵ 1,500')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /request a viewing/i }))
    expect(cb).toHaveBeenCalledOnce()
  })
})

describe('SimilarListings', () => {
  const current = makeListing({ id: 'current', propertyAddress: 'East Legon, Accra' })

  it('renders matched cards under the heading', () => {
    const other = makeListing({ id: 'other', propertyAddress: 'Adjiringanor, Accra', propertyName: 'Palm Court' })
    render(<SimilarListings all={[current, other]} current={current} isSaved={() => false} onToggleSave={() => {}} />)
    expect(screen.getByText('More homes you might like')).toBeInTheDocument()
    expect(screen.getByText('Adjiringanor, Accra')).toBeInTheDocument()
  })

  it('renders nothing when there are no matches', () => {
    const { container } = render(
      <SimilarListings all={[current]} current={current} isSaved={() => false} onToggleSave={() => {}} />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/BookingSurfaces.test.tsx`
Expected: FAIL — cannot resolve components.

- [ ] **Step 3: Implement `BookingCard.tsx`**

```tsx
'use client'

import { useState } from 'react'
import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { formatGHS, formatDate, buildWhatsApp } from '../lib/format'

interface BookingCardProps {
  listing: PublicListingDto
  primaryColour: string
  onRequestViewing: () => void
}

const outlineLink =
  'flex w-full items-center justify-center gap-2 rounded-lg border border-solid border-[#DDDDDD] bg-white ' +
  'px-3 py-3 text-sm font-medium text-[#222222] no-underline transition-colors hover:border-[#222222]'

export default function BookingCard({ listing, primaryColour, onRequestViewing }: BookingCardProps) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className='flex flex-col gap-3.5 rounded-2xl border border-solid border-[#DDDDDD] p-6 shadow-[0_6px_20px_rgba(0,0,0,0.10)]'>
      <div className='flex items-end gap-1.5'>
        <span className='text-2xl font-extrabold text-[#222222]'>{formatGHS(listing.rent)}</span>
        <span className='pb-0.5 text-sm text-[#717171]'>/ month</span>
      </div>

      {listing.availableFrom && (
        <div className='flex items-center gap-2 rounded-lg bg-[#F0FBF0] px-3.5 py-2.5 text-[13px] font-medium text-[#0A7B34]'>
          <i className='ri-calendar-check-line' aria-hidden='true' />
          Available {formatDate(listing.availableFrom)}
        </div>
      )}

      <hr className='m-0 border-0 border-t border-solid border-[#EBEBEB]' />

      {listing.contactPhone && (
        <a
          href={buildWhatsApp(listing.contactPhone, listing.title)}
          target='_blank'
          rel='noopener noreferrer'
          className='flex w-full items-center justify-center gap-2 rounded-lg border-none bg-[#25D366] px-3 py-3.5 text-[15px] font-semibold text-white no-underline'
        >
          <i className='ri-whatsapp-line text-lg' aria-hidden='true' />
          WhatsApp agent
        </a>
      )}

      <button
        onClick={onRequestViewing}
        className='w-full cursor-pointer rounded-lg border-none px-3 py-3.5 text-[15px] font-semibold text-white'
        style={{ background: primaryColour }}
      >
        Request a viewing
      </button>

      <p className='m-0 text-center text-xs text-[#717171]'>You won't be charged anything</p>

      <hr className='m-0 border-0 border-t border-solid border-[#EBEBEB]' />

      {listing.contactPhone && (
        <a href={`tel:${listing.contactPhone}`} className={outlineLink}>
          <i className='ri-phone-line' aria-hidden='true' /> Call agent
        </a>
      )}
      {listing.contactEmail && (
        <a
          href={`mailto:${listing.contactEmail}?subject=${encodeURIComponent('Enquiry: ' + listing.title)}`}
          className={outlineLink}
        >
          <i className='ri-mail-line' aria-hidden='true' /> Email agent
        </a>
      )}

      <button
        onClick={copy}
        className={`cursor-pointer border-none bg-transparent py-1 text-xs underline ${
          copied ? 'text-[#0A7B34]' : 'text-[#717171]'
        }`}
      >
        <i className={`${copied ? 'ri-check-line' : 'ri-link'} mr-1`} aria-hidden='true' />
        {copied ? 'Link copied!' : 'Copy listing link'}
      </button>

      <div className='flex items-center gap-3 pt-1'>
        <div
          className='flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full text-base font-bold text-white'
          style={{ background: primaryColour }}
        >
          {listing.propertyName.charAt(0).toUpperCase()}
        </div>
        <div>
          <div className='text-[13px] font-semibold text-[#222222]'>{listing.propertyName}</div>
          <div className='mt-0.5 flex items-center gap-1 text-xs text-[#717171]'>
            <i className='ri-shield-check-fill text-sm text-[#0A7B34]' aria-hidden='true' /> Verified manager
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Implement `MobileBookingBar.tsx`**

```tsx
'use client'

import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { formatGHS } from '../lib/format'

interface MobileBookingBarProps {
  listing: PublicListingDto
  primaryColour: string
  onRequestViewing: () => void
}

export default function MobileBookingBar({ listing, primaryColour, onRequestViewing }: MobileBookingBarProps) {
  return (
    <div
      className='fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-4 border-t border-solid border-[#EBEBEB] bg-white px-5 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] lg:hidden'
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div>
        <div className='text-lg font-extrabold text-[#222222]'>{formatGHS(listing.rent)}</div>
        <div className='text-xs text-[#717171]'>per month</div>
      </div>
      <button
        onClick={onRequestViewing}
        className='cursor-pointer rounded-lg border-none px-6 py-3 text-sm font-semibold text-white'
        style={{ background: primaryColour }}
      >
        Request a viewing
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Implement `SimilarListings.tsx`**

```tsx
'use client'

import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { findSimilarListings } from '../lib/similar'
import ListingCard from './ListingCard'

interface SimilarListingsProps {
  all: PublicListingDto[]
  current: PublicListingDto
  isSaved: (id: string) => boolean
  onToggleSave: (id: string) => void
}

export default function SimilarListings({ all, current, isSaved, onToggleSave }: SimilarListingsProps) {
  const matches = findSimilarListings(all, current)
  if (matches.length === 0) return null

  return (
    <section className='border-t border-[#EBEBEB] py-10'>
      <h2 className='mb-6 text-xl font-bold text-[#222222]'>More homes you might like</h2>
      {/* Horizontal scroll on mobile, 4-col grid from lg */}
      <div className='grid auto-cols-[75%] grid-flow-col gap-4 overflow-x-auto pb-2 sm:auto-cols-[45%] lg:auto-cols-auto lg:grid-flow-row lg:grid-cols-4 lg:gap-6 lg:overflow-visible lg:pb-0'>
        {matches.map(l => (
          <ListingCard key={l.id} listing={l} saved={isSaved(l.id)} onToggleSave={() => onToggleSave(l.id)} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Run tests, verify they pass**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/BookingSurfaces.test.tsx`
Expected: PASS (6 tests).

- [ ] **Step 7: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/components/BookingCard.tsx src/views/listings/components/MobileBookingBar.tsx src/views/listings/components/SimilarListings.tsx src/__tests__/listings/BookingSurfaces.test.tsx
git commit -m "feat(listings): booking card, mobile booking bar and similar-listings row"
```

---

### Task 10: Rewrite `ListingDetailView` + detail route fetch

**Files:**
- Modify: `src/views/listings/ListingDetailView.tsx` (full rewrite)
- Modify: `src/app/listings/[id]/page.tsx` (add `getPublicListings()` for similar listings)
- Test: `src/__tests__/listings/ListingDetailView.test.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–9.
- Produces: default export `ListingDetailView({ listing: PublicListingDto; allListings?: PublicListingDto[] })` — `allListings` optional (defaults `[]`) so the view renders even if the list fetch fails.

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/listings/ListingDetailView.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ListingDetailView from '@/views/listings/ListingDetailView'
import { makeListing } from './fixtures'

describe('ListingDetailView', () => {
  it('renders title, address and availability pill', () => {
    render(<ListingDetailView listing={makeListing()} allListings={[]} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Unit 110 — Sunrise Apartments')
    expect(screen.getByText('East Legon, Accra, Greater Accra')).toBeInTheDocument()
    expect(screen.getByText('Available')).toBeInTheDocument()
  })

  it('renders amenities section and map iframe', () => {
    render(<ListingDetailView listing={makeListing()} allListings={[]} />)
    expect(screen.getByText('What this place offers')).toBeInTheDocument()
    expect(screen.getByText("Where you'll be")).toBeInTheDocument()
    expect(screen.getByTitle('Map of Sunrise Apartments')).toBeInTheDocument()
  })

  it('renders share and save actions in the title row', () => {
    render(<ListingDetailView listing={makeListing()} allListings={[]} />)
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
  })

  it('renders similar listings when matches exist', () => {
    const other = makeListing({ id: 'other', propertyAddress: 'Adjiringanor, Accra', propertyName: 'Palm Court' })
    render(<ListingDetailView listing={makeListing()} allListings={[makeListing(), other]} />)
    expect(screen.getByText('More homes you might like')).toBeInTheDocument()
  })

  it('shows the unavailable state for inactive listings and hides booking CTAs', () => {
    render(<ListingDetailView listing={makeListing({ status: 'INACTIVE' })} allListings={[]} />)
    expect(screen.getByText('This unit is no longer available for rent.')).toBeInTheDocument()
    expect(screen.getByText('Unit unavailable')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /request a viewing/i })).not.toBeInTheDocument()
  })

  it('works without allListings (prop optional)', () => {
    render(<ListingDetailView listing={makeListing()} />)
    expect(screen.queryByText('More homes you might like')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/ListingDetailView.test.tsx`
Expected: FAIL — old view has no Share button / different structure.

- [ ] **Step 3: Rewrite `ListingDetailView.tsx` (replace the whole file)**

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { PublicListingDto } from '@/lib/api/listings-public-client'
import { usePlatformBranding } from '@/contexts/PlatformBrandingContext'
import { useSavedListings } from './lib/useSavedListings'
import PhotoMosaic from './components/PhotoMosaic'
import Highlights from './components/Highlights'
import LocationMap from './components/LocationMap'
import InquiryForm from './components/InquiryForm'
import BookingCard from './components/BookingCard'
import MobileBookingBar from './components/MobileBookingBar'
import SimilarListings from './components/SimilarListings'
import SaveButton from './components/SaveButton'

// ─── Amenity icon map (unchanged from previous version) ─────────────────────

const AMENITY_ICONS: Record<string, string> = {
  wifi: 'ri-wifi-line', parking: 'ri-parking-box-line', pool: 'ri-drop-line',
  gym: 'ri-run-line', security: 'ri-shield-check-line', generator: 'ri-flashlight-line',
  water: 'ri-water-flash-line', ac: 'ri-temp-cold-line', furnished: 'ri-sofa-line',
  balcony: 'ri-building-line', kitchen: 'ri-restaurant-line', laundry: 'ri-t-shirt-line',
}

function amenityIcon(name: string): string {
  const key = name.toLowerCase()
  for (const [k, v] of Object.entries(AMENITY_ICONS)) {
    if (key.includes(k)) return v
  }
  return 'ri-checkbox-circle-line'
}

// ─── View ────────────────────────────────────────────────────────────────────

interface ListingDetailViewProps {
  listing: PublicListingDto
  allListings?: PublicListingDto[]
}

export default function ListingDetailView({ listing, allListings = [] }: ListingDetailViewProps) {
  const { platformName, logoUrl, primaryColour } = usePlatformBranding()
  const { isSaved, toggle } = useSavedListings()
  const [descExpanded, setDescExpanded] = useState(false)
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false)
  const [shared, setShared] = useState(false)

  const isInactive = listing.status !== 'ACTIVE'

  const descWords = (listing.description ?? '').split(' ')
  const longDesc = descWords.length > 60
  const visibleDesc = !longDesc || descExpanded ? listing.description : descWords.slice(0, 60).join(' ') + '…'
  const visibleAmenities = amenitiesExpanded ? listing.amenities : listing.amenities.slice(0, 8)

  function scrollToForm() {
    document.getElementById('request-viewing')?.scrollIntoView({ behavior: 'smooth' })
  }

  function share() {
    const url = window.location.href
    if (typeof navigator.share === 'function') {
      navigator.share({ title: listing.title, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setShared(true)
        setTimeout(() => setShared(false), 2000)
      })
    }
  }

  const actionBtn =
    'flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-transparent px-2.5 py-1.5 text-[13px] font-semibold text-[#222222] underline hover:bg-[#F7F7F7]'

  return (
    <div className='min-h-screen bg-white'>
      {/* ── Header ── */}
      <header className='sticky top-0 z-50 border-b border-[#EBEBEB] bg-white'>
        <div className='mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6'>
          <Link href='/listings' className='flex items-center gap-1.5 text-sm font-medium text-[#222222] no-underline'>
            <svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
              <path d='M19 12H5M5 12l7-7M5 12l7 7' />
            </svg>
            Back to listings
          </Link>

          <div className='flex items-center gap-2'>
            {logoUrl ? (
              <img src={logoUrl} alt={platformName} className='h-8 object-contain' />
            ) : (
              <>
                <svg width='24' height='24' viewBox='0 0 32 32' fill={primaryColour} aria-hidden='true'>
                  <path d='M16 1C10.5 1 6 5.9 6 12c0 4.3 2.3 8.6 5 11.5L16 29l5-5.5c2.7-2.9 5-7.2 5-11.5C26 5.9 21.5 1 16 1zm0 15a4 4 0 110-8 4 4 0 010 8z' />
                </svg>
                <span className='text-base font-extrabold tracking-tight' style={{ color: primaryColour }}>
                  {platformName}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Inactive banner ── */}
      {isInactive && (
        <div className='flex items-center gap-2 border-b border-[#FECACA] bg-[#FEF2F2] px-6 py-3 text-[13px] font-medium text-[#B91C1C]'>
          <i className='ri-error-warning-line text-lg' aria-hidden='true' />
          This unit is no longer available for rent.
        </div>
      )}

      {/* ── Content (bottom padding clears the mobile booking bar) ── */}
      <div className={`mx-auto max-w-6xl px-6 py-7 ${!isInactive ? 'pb-28 lg:pb-7' : ''}`}>
        {/* Title + actions */}
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <h1 className='text-[26px] font-extrabold leading-tight text-[#222222]'>{listing.title}</h1>
            <div className='mt-1.5 flex flex-wrap items-center gap-1.5 text-sm text-[#717171]'>
              <i className='ri-map-pin-2-line' style={{ color: primaryColour }} aria-hidden='true' />
              <span>{listing.propertyAddress}</span>
              <span aria-hidden='true'>·</span>
              <span>{listing.unitType}</span>
              <span aria-hidden='true'>·</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isInactive ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#F0FBF0] text-[#0A7B34]'
                }`}
              >
                {isInactive ? 'Unavailable' : 'Available'}
              </span>
            </div>
          </div>

          <div className='flex shrink-0 items-center gap-1'>
            <button onClick={share} className={actionBtn}>
              <i className={shared ? 'ri-check-line' : 'ri-upload-2-line'} aria-hidden='true' />
              <span>{shared ? 'Copied' : 'Share'}</span>
            </button>
            <span className={actionBtn.replace('cursor-pointer ', '')} role='presentation'>
              <SaveButton saved={isSaved(listing.id)} onToggle={() => toggle(listing.id)} />
              <span aria-hidden='true'>{isSaved(listing.id) ? 'Saved' : 'Save'}</span>
            </span>
          </div>
        </div>

        {/* Photos */}
        <div className='mt-5'>
          <PhotoMosaic images={listing.images} title={listing.title} />
        </div>

        {/* Two-column body */}
        <div className='mt-9 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_380px] lg:gap-13'>
          {/* Left */}
          <div>
            {/* Host strip */}
            <div className='flex items-center justify-between border-b border-[#EBEBEB] pb-6'>
              <div>
                <div className='text-xl font-bold text-[#222222]'>
                  {listing.unitType} offered by {listing.propertyName}
                </div>
                <div className='mt-1 flex flex-wrap gap-2 text-sm text-[#717171]'>
                  {listing.bedrooms != null && (
                    <span>{listing.bedrooms === 0 ? 'Studio' : `${listing.bedrooms} bedroom${listing.bedrooms !== 1 ? 's' : ''}`}</span>
                  )}
                  {listing.bathrooms != null && (
                    <>
                      <span aria-hidden='true'>·</span>
                      <span>{listing.bathrooms} bathroom{listing.bathrooms !== 1 ? 's' : ''}</span>
                    </>
                  )}
                  {listing.sizeSqft != null && (
                    <>
                      <span aria-hidden='true'>·</span>
                      <span>{Number(listing.sizeSqft).toLocaleString()} sqft</span>
                    </>
                  )}
                </div>
              </div>
              <div
                className='flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full text-xl font-extrabold text-white'
                style={{ background: primaryColour }}
              >
                {listing.propertyName.charAt(0).toUpperCase()}
              </div>
            </div>

            {/* Highlights */}
            <div className='border-b border-[#EBEBEB] py-6'>
              <Highlights listing={listing} />
            </div>

            {/* Description */}
            {listing.description && (
              <div className='border-b border-[#EBEBEB] py-6'>
                <p className='whitespace-pre-wrap text-[15px] leading-7 text-[#222222]'>{visibleDesc}</p>
                {longDesc && (
                  <button
                    onClick={() => setDescExpanded(e => !e)}
                    className='mt-3 flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-sm font-bold text-[#222222] underline'
                  >
                    {descExpanded ? 'Show less' : 'Show more'}
                    <i className={descExpanded ? 'ri-arrow-up-s-line' : 'ri-arrow-down-s-line'} aria-hidden='true' />
                  </button>
                )}
              </div>
            )}

            {/* Amenities */}
            {listing.amenities.length > 0 && (
              <div className='border-b border-[#EBEBEB] py-6'>
                <h2 className='mb-4.5 text-xl font-bold text-[#222222]'>What this place offers</h2>
                <div className='grid grid-cols-1 gap-x-6 gap-y-3.5 sm:grid-cols-2'>
                  {visibleAmenities.map((a, i) => (
                    <div key={i} className='flex items-center gap-3 text-sm text-[#222222]'>
                      <i className={`${amenityIcon(a)} shrink-0 text-xl`} aria-hidden='true' />
                      {a}
                    </div>
                  ))}
                </div>
                {listing.amenities.length > 8 && (
                  <button
                    onClick={() => setAmenitiesExpanded(e => !e)}
                    className='mt-4.5 cursor-pointer rounded-lg border border-solid border-[#222222] bg-white px-5 py-2.5 text-sm font-semibold text-[#222222]'
                  >
                    {amenitiesExpanded ? 'Show fewer amenities' : `Show all ${listing.amenities.length} amenities`}
                  </button>
                )}
              </div>
            )}

            {/* Location */}
            <div className='border-b border-[#EBEBEB] py-6'>
              <h2 className='mb-3.5 text-xl font-bold text-[#222222]'>Where you'll be</h2>
              <LocationMap propertyName={listing.propertyName} propertyAddress={listing.propertyAddress} />
            </div>

            {/* Inquiry form */}
            {!isInactive && (
              <div id='request-viewing' className='py-6'>
                <h2 className='mb-1.5 text-xl font-bold text-[#222222]'>Request a viewing</h2>
                <p className='mb-5 text-sm text-[#717171]'>
                  Fill in your details and the property manager will reach out to schedule a visit.
                </p>
                <InquiryForm listing={listing} primaryColour={primaryColour} />
              </div>
            )}
          </div>

          {/* Right (desktop sidebar) */}
          <div className='sticky top-[88px] hidden lg:block'>
            {isInactive ? (
              <div className='rounded-2xl border border-solid border-[#DDDDDD] p-7 text-center text-[#AAAAAA] shadow-[0_6px_20px_rgba(0,0,0,0.07)]'>
                <i className='ri-home-line mb-2.5 block text-4xl text-[#E0E0E0]' aria-hidden='true' />
                <div className='mb-1.5 text-[15px] font-semibold text-[#717171]'>Unit unavailable</div>
                <div className='mb-5 text-[13px]'>This listing has been deactivated.</div>
                <Link
                  href='/listings'
                  className='inline-block rounded-lg bg-[#222222] px-5 py-2.5 text-[13px] font-semibold text-white no-underline'
                >
                  Browse other listings
                </Link>
              </div>
            ) : (
              <BookingCard listing={listing} primaryColour={primaryColour} onRequestViewing={scrollToForm} />
            )}
          </div>
        </div>

        {/* Mobile-only inactive card (sidebar is hidden below lg) */}
        {isInactive && (
          <div className='mt-8 rounded-2xl border border-solid border-[#DDDDDD] p-7 text-center text-[#AAAAAA] lg:hidden'>
            <div className='mb-1.5 text-[15px] font-semibold text-[#717171]'>Unit unavailable</div>
            <Link href='/listings' className='mt-2 inline-block rounded-lg bg-[#222222] px-5 py-2.5 text-[13px] font-semibold text-white no-underline'>
              Browse other listings
            </Link>
          </div>
        )}

        {/* Similar listings */}
        <div className='mt-10'>
          <SimilarListings all={allListings} current={listing} isSaved={isSaved} onToggleSave={toggle} />
        </div>
      </div>

      {/* Mobile booking bar */}
      {!isInactive && (
        <MobileBookingBar listing={listing} primaryColour={primaryColour} onRequestViewing={scrollToForm} />
      )}

      {/* ── Footer ── */}
      <footer className='mt-10 border-t border-[#EBEBEB] bg-[#F7F7F7] px-6 py-5'>
        <div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-xs text-[#717171]'>
          <span>© 2025 {platformName} · Ghana Property Platform</span>
          <span className='text-[#BBBBBB]'>Listing #{listing.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </footer>
    </div>
  )
}
```

Notes for the implementer:
- Tailwind has no `gap-13` / `mb-4.5` / `mt-4.5` in the default scale — use `lg:gap-[52px]`, `mb-[18px]`, `mt-[18px]` arbitrary values instead. (Deliberate: keep the old view's exact spacing.)
- The Save action in the title row: `SaveButton` already carries the accessible name (`aria-label` "Save"/"Remove from saved"); the adjacent text span is `aria-hidden`.

- [ ] **Step 4: Update `src/app/listings/[id]/page.tsx`**

Replace the page component only (imports at top change too — add `getPublicListings`); `generateMetadata` stays exactly as-is:

```tsx
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getPublicListing, getPublicListings } from '@/lib/api/listings-public-client'
import ListingDetailView from '@/views/listings/ListingDetailView'
```

```tsx
export default async function PublicListingPage({ params }: Props) {
  let listing

  try {
    listing = await getPublicListing(params.id)
  } catch {
    notFound()
  }

  // Full list powers the "More homes you might like" row — fail-open to empty.
  const allListings = await getPublicListings().catch(() => [])

  return <ListingDetailView listing={listing} allListings={allListings} />
}
```

- [ ] **Step 5: Run the full listings test suite**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/`
Expected: ALL PASS.

- [ ] **Step 6: Type-check**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx tsc --noEmit`
Expected: no NEW errors versus baseline.

- [ ] **Step 7: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add src/views/listings/ListingDetailView.tsx src/app/listings/[id]/page.tsx src/__tests__/listings/ListingDetailView.test.tsx
git commit -m "feat(listings): rewrite detail view — mosaic, map, booking surfaces, similar homes"
```

---

### Task 11: Browser QA — desktop + mobile + fix pass

**Files:**
- Modify: whatever the QA pass surfaces (expect small Tailwind/z-index/sticky tweaks).

**Interfaces:** none — verification task.

- [ ] **Step 1: Start the dev server**

The Tenants app runs on port 3000: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npm run dev` (or use the already-running instance — check `http://localhost:3000/listings` first). Use the browser-preview tooling, not raw Bash, if available.

- [ ] **Step 2: Desktop pass (1280×800) on `/listings`**

Verify: sticky header with search pill centered; typing "kumasi" filters the grid live; bedroom chips + price slider + sort dropdown work; card hover zooms image and shows carousel arrows; heart toggles red and survives a page reload (localStorage); "Clear all" resets everything.

- [ ] **Step 3: Desktop pass on a listing detail page**

Verify: photo mosaic renders 1+4; "Show all photos" opens lightbox; ArrowRight/ArrowLeft/Escape work; filmstrip jumps; Share copies URL (button flips to "Copied"); Save heart syncs with the index grid; map iframe loads the address; booking card is sticky while scrolling; "Request a viewing" scrolls to form; form submit button disabled until name+phone filled; "More homes you might like" shows real cards and navigates.

- [ ] **Step 4: Mobile pass (375×812)**

Verify on `/listings`: search pill full-width under logo; filter chips scroll horizontally; single-column cards; swipe changes card photos. On detail: mosaic collapses to single hero image; booking sidebar hidden; sticky bottom bar shows price + CTA and doesn't cover the footer content (content has bottom padding); similar listings scroll horizontally.

- [ ] **Step 5: Console + network check**

No console errors on either page; the map iframe request is the only external call; no 404s for images.

- [ ] **Step 6: Fix anything found, re-run tests, commit**

Run: `cd /Users/mac/Desktop/TenantApp/Tenants && export PATH="$HOME/.nvm/versions/node/v22.17.1/bin:$PATH" && npx vitest run src/__tests__/listings/ && npx tsc --noEmit`
Expected: ALL PASS.

```bash
cd /Users/mac/Desktop/TenantApp/Tenants
git add <only files touched in fixes>
git commit -m "fix(listings): browser QA polish pass"
```

---

## Self-Review Notes

- **Spec coverage:** search pill (T5/T6), filter bar + sort dropdown (T5/T6), responsive card grid + carousel + localStorage saves (T3/T4/T6), photo mosaic + keyboard lightbox + filmstrip (T7), highlights/map embed/inquiry form (T8), booking card + mobile bar + similar listings (T9), detail assembly + share/save + route fetch (T10), QA (T11). Empty states, inactive-listing state, white-labeling, Ghana formatting all preserved in T6/T10.
- **Old `layout.tsx`:** intentionally untouched — `.listings-root` reset and fonts still apply.
- **`src/app/listings/page.tsx`:** intentionally untouched — index view keeps its prop contract.
- **Type consistency check:** `SortValue` defined once in FilterBar and imported by the index view; `isSaved`/`toggle` naming consistent between hook (T3) and consumers (T6/T9/T10); `findSimilarListings(all, current, cap?)` signature consistent between T2 and T9.
