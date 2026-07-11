# Listings pages — Airbnb/Zillow-style redesign

**Date:** 2026-07-11
**Scope:** `/listings` (index) and `/listings/[id]` (detail) public pages in the Next.js landlord portal (`Tenants/`). These are unauthenticated, white-labeled, SEO-facing pages — separate from the TenantX marketing site (`tenantx-landing/`), which already went through its own Awwwards-style rebuild. This redesign takes inspiration from Airbnb and Zillow instead: dense, trustworthy, conversion-focused real-estate UI rather than scroll-driven motion storytelling.

## Goals

- Rebuild `ListingsIndexView.tsx` and `ListingDetailView.tsx` with Tailwind utility classes instead of inline `style={{}}` objects, so the layout can actually be responsive (breakpoints, hover/focus states) instead of fixed-pixel grids that break on mobile.
- Adopt recognizable Airbnb/Zillow interaction patterns: pill search bar, swipeable photo carousels, photo mosaic with lightbox, sticky booking sidebar (desktop) / sticky booking bar (mobile), "more like this" row.
- Preserve all existing functional behavior: filtering (bedrooms, max price), sorting, image carousel, lightbox, WhatsApp deep link, inquiry form (POST to `/support/tickets`), Google Maps deep link, save/heart toggle, white-label branding via `PlatformBrandingContext`, Ghana-specific formatting (GH₵, `en-GH` locale).
- No new dependencies. No fabricated trust signals (no star ratings, no fake review counts) — the API has no review data.
- Keep both pages server components at the route level (`page.tsx` fetches, passes data down) with the views themselves as `'use client'`, same as today.

## Non-goals

- No map/geocoding on the index page (addresses are free-text, not lat/lng — see decision below).
- No changes to the public API client (`listings-public-client.ts`) or backend.
- No visual changes to the dashboard/authenticated portal.
- No account creation, saved-search persistence server-side, or any auth-gated feature — "Save" stays a local, client-only heart toggle (persisted to `localStorage` so it survives reloads, same as before but now durable).

## Decisions from brainstorming

1. **Full Airbnb/Zillow scope**, not just a visual polish pass — includes search pill, similar-listings row, mobile sticky booking bar, category-style filter chips.
2. **Map handling:** listings only carry `propertyAddress` (free text), no coordinates. Adding client-side geocoding (Leaflet + OSM) risks mis-pinning Ghanaian addresses and adds a dependency for little payoff. Instead: an embedded Google Maps iframe (`https://www.google.com/maps?q=<address>&output=embed`, no API key required) inside the existing "Where you'll be" section on the **detail page only**. The index page stays a pure photo grid — no split map view.
3. **Styling approach:** rewrite with Tailwind (`tailwindcss-logical` + the existing `@core/tailwind/plugin` already configured in `tailwind.config.ts`, scoped under `.listings-root` — Tailwind's `preflight: false` and `important: '#__next'` config already coexist with this pattern elsewhere in the app, so utility classes will apply here too). This is a page-level rewrite, not an incremental patch.

## Architecture

Both views get broken into smaller components under `src/views/listings/`, mirroring the isolation principle — each with one job, usable independently:

```
src/views/listings/
  ListingsIndexView.tsx        (orchestrates index page: state, layout)
  ListingDetailView.tsx        (orchestrates detail page: state, layout)
  components/
    SearchPill.tsx             (header free-text "where" search — matches address/property name/unit type)
    FilterBar.tsx              (bedroom chips, price popover, sort dropdown, clear-all)
    ListingCard.tsx            (shared grid card — used on index AND similar-listings row)
    SaveButton.tsx             (heart toggle, localStorage-backed)
    PhotoCarousel.tsx          (card-level image carousel + dot indicators)
    PhotoMosaic.tsx            (detail-page 1-big-4-small grid + "show all")
    Lightbox.tsx               (fullscreen photo viewer, keyboard nav + thumbnail strip)
    Highlights.tsx             (icon+text highlight rows on detail page)
    LocationMap.tsx            (Google Maps iframe embed + "open in maps" link)
    InquiryForm.tsx            (viewing request form — logic unchanged)
    BookingCard.tsx            (desktop sticky sidebar: price, CTAs, agent badge)
    MobileBookingBar.tsx       (mobile-only sticky bottom bar: price + CTA)
    SimilarListings.tsx        (bottom row: same-city/same-bedroom matches)
  lib/
    useSavedListings.ts        (localStorage-backed save/unsaved hook, shared by index + detail)
    format.ts                  (formatGHS, bedroomLabel, daysSince, buildWhatsApp, buildMaps — moved out of the view files, unchanged logic)
```

`format.ts` and `useSavedListings.ts` are extracted because both pages need them (detail page's `ReserveCard`/`BookingCard` and `SimilarListings` both render `ListingCard`-shaped price/save UI). Everything else stays page-specific — no premature sharing beyond what's actually reused.

## Data flow

- `page.tsx` files (index and `[id]`) are unchanged in responsibility: server-side fetch via `getPublicListings()` / `getPublicListing(id)`, pass straight through as props. No new API calls added to the client.
- `SimilarListings` receives the full listings array as a prop from `ListingDetailView` (already fetched once at the index level — but the detail route only fetches the single listing today). **Change required:** `app/listings/[id]/page.tsx` will additionally call `getPublicListings()` (already cached per-request by Next, cheap — it's the same list the index page fetches) and pass it to `ListingDetailView` so it can compute matches client-side without a second round trip pattern or new endpoint. If that fetch fails, `SimilarListings` simply renders nothing (same fail-open pattern the index page uses today for its own listing fetch).
- Matching logic (plain function, no component): filter out the current listing and inactive ones, prefer same `propertyAddress` city token, then same `bedrooms`, cap at 4, fall back to most-recent if fewer than 4 matches exist.

## Section 1 — `/listings` index page

**Header (sticky):**
- Logo/wordmark (unchanged white-label logic: `logoUrl` image or generic pin + `platformName` in `primaryColour`).
- `SearchPill`: rounded-full bordered container holding a single "Where" free-text input (matches against `propertyAddress` + `propertyName` + `unitType`, case-insensitive substring) with a circular gold/brand search icon-button. This is the *only* control in the pill — bedroom/price/sort filtering lives exclusively in the `FilterBar` below it, so there is one source of truth per filter dimension instead of duplicate controls in two places.
- On viewports `<768px`, the pill renders full-width under the logo row (stacks, doesn't collapse into a sheet — it's a single text input, no need to hide it).
- Result count on the right (desktop only; wraps below on mobile).

**Filter bar (sticky, below header):**
- Bedroom chips (`Any type / Studio / 1 bed / 2 beds / 3+ beds`) — kept from current implementation, restyled as Tailwind pill buttons (`rounded-full border`, active state `bg-ink text-white`). This is the single control for bedroom filtering.
- Price chip opens the same slider popover as today.
- Sort collapses from 3 chips to a single `<select>`-style dropdown button (Newest / Price ↑ / Price ↓) — reduces horizontal clutter, closer to Zillow's pattern.
- "Clear all" text link, shown only when filters are active (bedroom, price, **or** search text — clears all three).
- On mobile, this row scrolls horizontally (`overflow-x-auto`) below the full-width search pill — both bars are sticky and stack, no independent third sticky layer.

**Grid:**
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`, consistent gap.
- `ListingCard`: 4:3 rounded-xl (`rounded-2xl`) image via `PhotoCarousel` (arrows on hover, dot indicators, swipe-via-drag on touch using pointer events — no new gesture library), `SaveButton` heart (top-right, `localStorage`-backed via `useSavedListings`), "New" badge (`age <= 14` days, unchanged threshold), location line first (`propertyAddress`, Airbnb convention — location before title), then property/unit line, then bed/bath line, then bold price + "/ month".
- Card lift-on-hover: subtle `shadow-md → shadow-xl` transition, image `scale-105` on hover (unchanged from current behavior, just Tailwind instead of inline).

**Empty states:** same two variants (no listings at all vs. no matches for current filters) — restyled with Tailwind, same copy and icon logic.

**Footer:** unchanged content, restyled.

## Section 2 — `/listings/[id]` detail page

**Header:** unchanged (back-to-listings link + brand logo), restyled.

**Title block:** `h1` title, location line with map-pin icon + `propertyAddress` + unit type + availability pill (unchanged logic) — **plus** a right-aligned row with **Share** (native `navigator.share()` if available, else falls back to the existing copy-link behavior) and **Save** (heart, same `useSavedListings` hook as the card) buttons, Airbnb-pattern placement.

**Photos:** `PhotoMosaic` — 1 large + up to 4 small tiles in a `grid-cols-2` layout (single full-width image if only 1 photo, matches current conditional), "Show all photos" button bottom-right opens `Lightbox`. `Lightbox` keeps existing prev/next/close but adds: arrow-key navigation (`ArrowLeft`/`ArrowRight`/`Escape`) and a thumbnail filmstrip along the bottom for direct jumps.

**Two-column body (`lg:grid-cols-[1fr_380px]`, single column below `lg`):**

*Left column:*
1. Host strip — "{bedrooms}-bedroom {unitType} offered by {propertyName}" + avatar circle (unchanged).
2. `Highlights` — icon rows (availability date, bedroom count, amenity count, verified manager) — unchanged logic, restyled.
3. Description with "Show more/less" — unchanged 60-word truncation logic.
4. Amenities grid with icon mapping — unchanged `AMENITY_ICONS` logic, "Show all N amenities" toggle.
5. **"Where you'll be"** — `LocationMap`: Google Maps iframe (`src="https://www.google.com/maps?q=<encoded address>&output=embed"`, `loading="lazy"`, fixed 16:9-ish height, rounded corners) above the existing address text + "Open in Maps" external link (unchanged `buildMaps` helper).
6. Inquiry form (`#request-viewing` anchor) — unchanged submit logic (POST to `/support/tickets`), restyled inputs.

*Right column (desktop, `lg:` and up):* `BookingCard` — sticky (`sticky top-24`), price, availability pill, WhatsApp CTA (unchanged `buildWhatsApp` logic), "Request a viewing" (scrolls to form), call/email links, copy-link button, verified-manager agent badge. Hidden below `lg` breakpoint.

*Mobile (`<lg`):* `BookingCard` doesn't render in-flow. Instead `MobileBookingBar` renders fixed to the viewport bottom (`fixed bottom-0 inset-x-0`, safe-area padding, shadow-top) showing price + a single "Request a viewing" button that scrolls to the form. Only visible below `lg`.

**Inactive-listing state:** unchanged — banner at top, sidebar replaced with a muted "Unit unavailable" card, no mobile booking bar rendered (nothing to book).

**Similar listings:** `SimilarListings` renders below the two-column body, above the footer, only when at least one match exists. Heading "More homes you might like", horizontal-scroll row on mobile / grid on desktop, reusing `ListingCard`. Matching: same city-ish token from `propertyAddress` first, then same `bedrooms`, active listings only, excludes current listing, cap 4.

**Footer:** unchanged content, restyled.

## Shared behaviors

- **`useSavedListings` hook:** `Set<string>` of listing IDs in React state, synced to `localStorage` key `tenantx-saved-listings` on change, hydrated from `localStorage` on mount (guarded for SSR — starts empty on server, syncs after mount to avoid hydration mismatch). Exposes `isSaved(id)` and `toggle(id)`. Used by both `ListingCard` and the detail page's save button so state is consistent if a user saves from the grid and later opens the property.
- **`format.ts`:** pure functions moved verbatim from the two view files (`formatGHS`, `bedroomLabel`, `daysSince`, `buildWhatsApp`, `buildMaps`) — no behavior change, just deduplication since both pages need them.

## Testing

- Existing test suite (if any covers these views) gets updated for new component boundaries, not behavior — same `getByText`/`getByRole` assertions should still pass since visible copy doesn't change.
- New unit tests: `useSavedListings` (toggle persists across remount), `format.ts` helpers (already implicitly tested via view behavior, worth direct coverage since they're now a shared module), similar-listings matching function (same-city match, same-bedroom fallback, excludes self, excludes inactive, caps at 4).
- Manual verification in the browser preview: filter interactions (bedroom chips, price slider, search text, sort, clear-all), photo carousel + lightbox keyboard nav, save persists across reload, WhatsApp/call/email links resolve correctly, map embed loads, mobile sticky bar appears only below `lg` and desktop sidebar only at `lg`+, similar listings computed correctly for a real Chandiba/Xorla-style dataset.

## Out of scope / explicitly deferred

- Server-side saved-listings sync (would need auth — these are anonymous public pages).
- Map on the index/grid page.
- Star ratings / review counts (no data source).
- Changing the inquiry form's backend contact (`/support/tickets`) or the WhatsApp/call/email contact model.
