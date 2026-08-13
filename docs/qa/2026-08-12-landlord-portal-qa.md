# Landlord Portal — Final Pre-Production QA

Environment: local Docker (`web` :3099, `api` :8099), branch `feat/rbac-fixes`.
Tester: manual UI sweep + Playwright. Swept 2026-08-12, fixed through 2026-08-13.

> Written to a scratchpad and nearly lost — it survived only because the path
> was remembered. Kept in the repo from here.

---

## STATUS — 2026-08-13, end of the fix pass

**All 19 findings are fixed, verified against a rebuilt stack, and pushed.**

| suite | at first report | now |
|---|---|---|
| backend | 894 | **918** |
| frontend unit | 463 | **479** |
| E2E | 16 | **35** |

No `test.fail` markers remain: every test asserts what its name claims.

### The ten that were open at first report, and what closed them

| id | fix | commit |
|----|-----|--------|
| F-02 | listing pause is reported on the card AND notified; `unitStatus` added to the API | `12dcdaf` · `63f6102` · `17ec7bd` · `d24beca` |
| F-04 | duplicate amenity block deleted | `c59049f` |
| F-05 | street outranks the GPS code | `c59049f` |
| F-06 | valuation is captured by the form at last, and formatted in cedis | `7db0f70` · `00ad62a` |
| F-07 | detail page shows real counts; the edit round trip stops rewriting 11 to 6 | `7db0f70` |
| F-09 | three FKs added with backfill, `ON DELETE SET NULL` | `4dea498` |
| F-10 | decision chip shows only when it differs from the status | `7a88231` |
| F-11 | invoice status is a labelled chip | `5af5ea6` |
| F-12 | six tiles, in lifecycle order, reconciling to the total | `7a88231` |
| F-13 | offline screen moved to `/platform-offline` | `cfe9144` |

### Found while fixing — not in the original sweep

| what | severity | commit |
|---|---|---|
| `isPublicPageRoute` matched by bare prefix, so the whole `/maintenance/**` subtree skipped the auth guard | 🔴 | `cfe9144` |
| the property edit dialog sent the DISPLAY region back over the stored slug, corrupting `region`/`district` on **every save** — this is how the two forms got mixed in the database | 🟠 | uncommitted |
| a property's own GPS code, decoded on open, cleared its city — with an unmatchable district that made the property unsaveable | 🟠 | `9016bfc` |
| `POST /properties` accepted any region/district string | 🟠 | uncommitted |
| E2E fixtures used display names the UI cannot produce, which is why an empty city list looked normal for so long | — | uncommitted |

Also scoped, not started:
[district & region slug backfill](../../../TenantX-backend/docs/superpowers/specs/2026-08-13-district-slug-backfill-scope.md).

### Coverage — what changed

**Now covered:** create chain, payment recording, deletes and their guards,
property/unit/occupant **edit** (change one field, assert every other survives
in the database), route guards, listing visibility, the pause notification.

**Still not covered:** **exports** (PDF/Excel/CSV) — and they were 500ing in the
July platform-admin sweep, never re-verified. Also Settings, Support, Occupant
History, and the ~20 feature areas swept manually in earlier sessions
(utilities, expenses, agents, comms, caution fee, guarantors, rent reviews,
advance rent, documents, violations, team management, subscription, reports,
wallet). Those are unwatched, not known-broken.

**Everything here was verified against local Docker with ten properties and one
real tenant.** Nothing in this report speaks to scale, concurrency, or real
payment gateways.

### Corrections made to this document after the fact

Beyond the two withdrawn findings below, the fix pass also corrected claims
made *during* it, recorded here because the pattern matters more than the
individual errors:

- `learned_localities` was blamed for empty city lists. Wrong: the catalogue
  ships 7,150 localities and works. The lists were empty because the lookup
  matches the district **slug** and some rows store a display name. The wrong
  claim was built on `401`s read as empty responses without checking status.
- The first attempt at the GPS-code fix compared display names against slugs,
  so it changed nothing. It type-checked and passed every existing test; only
  the E2E caught it.
- Three E2E failures were initially read as product bugs and were the
  fixtures.

The common thread, and the thing to watch for next time: **treating absence of
output as evidence.**

---

## The original fix pass — 9 of 19

| id | defect | commits |
|----|--------|---------|
| F-01 + F-08 | `reserved` counted nowhere; occupancy overstated | `7730b66` (be) · `ec92176` |
| F-03 | every list invented its row total ("1–10 of 10" for 1 row) | `42d831c` |
| F-14 | Tenants/Maintenance reports 400d, rendered as zeros | `b2cef27` |
| F-15 | wizard's required address said "Optional"; dead button | `875623e` |
| F-16 | a failed welcome email rolled back the occupant | `7fb44d0` (be) |
| F-17 | wizard invoices named nobody | `5b2d8fd` (be) |
| F-18 | full onboarding still left the unit `reserved` | `d7fec10` |
| F-19 | confirm dialogs announced success before acting | `959d7cc` · `3ce5e9a` |

Found and fixed before the numbered sweep, same session:
listings unreachable from the server (`5cd386b`) · listings amenities rendered
as raw ids (`10a7ef0`) · stale agreements row-action tests (`7329315`).

E2E built from nothing: create chain (`d0b00e0`), payments (`44207ac`),
deletes (`74d7b6c`).

Suites: **894 backend · 463 frontend · 16 E2E**, green on consecutive runs, and
**no `test.fail` markers remain** — every test asserts what its name claims.

### Corrections to this document

**F-08 was reported wrong.** It claimed abandoning the wizard *permanently*
strands the unit. It does not: `PENDING → ACTIVE` occupies the unit and
`PENDING → TERMINATED` frees it, both valid and working. The real defect was
that `reserved` appeared in no tile, so nothing signalled there was anything to
act on. Severity was overstated; the fix that shipped is the visibility one.

**Two findings withdrawn** after checking the DOM rather than extracted text:
the subscription plan comparison is correct (32 ✓ / 26 ✗ matches the DB), and
the `/inspections` 403 is correct RBAC (`allowedUserTypes: ['OCCUPANT']`).

### The pattern worth keeping

Four of the six fixes were the same mistake in different clothes: **a value the
system already had, discarded and recomputed wrongly.** The pagination total was
returned by the API and ignored. The unit count was one status short.
`vacant` was derived as `total − occupied` in two components. `totalUnits`
dropped two statuses. Each looked local; together they are a habit to watch for
in review.

### Was open at first report — 10 of 19, all since closed

Kept as written, because the reasoning is what justified the priority. Every
row here is fixed; see the status table at the top for the commits.

Ranked by what they cost a landlord:

| id | defect | why it matters |
|----|--------|----------------|
| F-09 🟠 | `agreements` has no FK to property/unit/occupant | a terminated lease can orphan and become unauditable; the app-level delete guards are the only protection, now E2E-covered |
| F-11 🟠 | invoice STATUS is icon-only — no text, no `aria-label`, no `title` | unreadable on touch, invisible to screen readers, on the column that decides whether you get paid |
| F-02 🟠 | a unit delisted from public listings is not told to the landlord | the Advertise card still says "Listed for rent" while nobody can see it |
| F-04 🟠 | property detail renders the same 16 amenities twice, once as raw ids | `properties/[id]/page.tsx:67` — `facilities: property.amenities` |
| F-05 🟠 | Address row shows the GPS code; the street can never display | `page.tsx:62` — `gpsCode \|\| street`, precedence backwards |
| F-12 🟠 | invoice tiles omit DRAFT, so the buckets don't sum to the total | same shape as F-01, which is fixed |
| F-06 🟡 | "Price N/A" on a rental property | maps from `currentValue`, which landlords rarely fill |
| F-07 🟡 | Bedrooms "6+" for exactly 6; Rooms duplicates Bedrooms | `toCountOption` suffixes exact values |
| F-10 🟡 | status column renders "Terminated Terminated" | decision chip duplicates the status chip |
| F-13 🟡 | `/maintenance` serves the platform "Under Maintenance" screen | nothing links there; a URL-editing hazard, not a broken path |

Plus: `/listings` swallows Next's `DynamicServerError`, which prints on every
build. Runtime is unaffected — Next opts the route into dynamic rendering
anyway — but the swallow is what Next explicitly warns against, and the fix is
to rethrow it. **Still open** — it was never one of the numbered nineteen, and
it is the only item from this report that has not been addressed.

**Coverage gap remaining:** edit and export flows. Create, payments and deletes
are covered. *(Edit is now covered; export is not — see the status at the top.)*

---

## Legend
- 🔴 Blocker — cannot ship
- 🟠 Major — works but wrong / data risk
- 🟡 Minor — cosmetic or annoyance
- 💡 UX — flow-shortening suggestion
- 🔒 PRO-gated — needs tier elevation to test

---

## Findings

### F-01 🟠 Dashboard unit counters both read 0 while a unit exists
Tenant `shakvilla-homes` has 1 unit (Room 116). Dashboard shows
**Occupied Units 0** and **Vacant Units 0**.
Cause: assigning an occupant left `units.status = 'reserved'`. Occupied counts
`occupied`, Vacant counts `available`; `reserved` falls between the two, so the
unit disappears from the landlord's headline numbers entirely.
DB: `units.status='reserved'` + `occupants.status='active'` on that unit.
Expect: assigning an active occupant should move the unit to `occupied`, or the
dashboard must account for every status so the parts sum to the whole.

### F-02 🟠 Unit silently delisted from public listings, landlord not told
Because the unit went `reserved`, `/listings/public` correctly returns `[]`
(the feed requires `status='available'`). But `vacancy_listings.status` is still
`ACTIVE`, and the Advertise Unit card still reads **"Listed for rent /
Active listing / will appear on the public vacancy listing page"**.
The landlord believes they are advertising; nobody can see it.
Expect: the card should reflect effective visibility, e.g. "Not visible —
unit is occupied", not just the listing's own flag.

### F-03 🟠 Every paginated table reports a fabricated row total
Properties list holds **1** property and the footer reads **"1–10 of 10"**.
`count={hasNext ? (page + 2) * pageSize : (page + 1) * pageSize}` —
the total is invented from page arithmetic because the cursor API returns no
count. With `hasNext=false, page=0, pageSize=10` it always says 10.
Affects 4 tables: `PropertiesListTable:677`, `UnitsListTable:592`,
`OccupantsListTable:573`, `view/PropertyUnitsTable:473`.
A landlord with 3 properties is told they have 10. Reads as data loss/duplication.
Fix: return a real total from the API, or drop the count and render
"Showing N" / rely on next-prev only.

### F-04 🟠 Property detail lists the same 16 amenities twice — once raw
"Property Features" renders them properly ("24-hour Electricity", "Kitchen
Cabinets", "POP Ceiling"…). Immediately below, a **"Facilities"** block renders
the *same array* as raw camelCase chips: `electricity`, `kitchenCabinets`,
`popCeiling`, `tiledFloor`, `diningArea`, `parking`, `security`, `wifi`, `pool`,
`gym`, `generator`, `borehole`, `gatedCompound`, `cctv`, `aircon`,
`serviceQuarters`.
Cause: `properties/[id]/page.tsx:67` — `facilities: property.amenities || []`.
The DB has ONE column (`properties.amenities`, a JSON array); the page copies it
into a second field and `PropertyFeaturesCard:65` renders it with `label={facility}`.
Same defect class as the listings amenities bug just fixed, on the landlord side.
Fix: delete the Facilities block (it is a duplicate), or label it.

### F-05 🟠 "Address" row shows the GPS code, never the street
`properties/[id]/page.tsx:62` — `address: property.gpsCode || property.address?.street`.
GPS code wins, so the street address can never display even when set. The detail
page then shows "Address: GD-077-2335" and "GPS Code: GD-077-2335" — the same
value twice — while Region/District/City sit in separate rows.
(Note: `address_line_1` is empty on this record, so I could not confirm whether
the street is being *persisted*; the precedence bug is certain regardless.)

### F-06 🟡 "Price N/A" on a rental property
`price` maps from `currentValue` (purchase/valuation), which landlords rarely
fill. A rental portfolio page showing "Price N/A" while the unit rents at
GH₵700 is confusing. Suggest showing rent roll, or hiding when unset.

### F-07 🟡 Bedrooms "6+", Bathrooms "5+", Rooms "6+"
Exact values rendered with a "+" suffix via `toCountOption`, so 6 bedrooms reads
as "6 or more". Also Rooms duplicates Bedrooms.

### F-08 🔴 Abandoning the onboarding wizard strands the unit permanently
CORRECTION to my first reading: the PENDING state is **deliberate**. Step 3
(`MoveInStep`) offers "Activate now" (default) vs "Keep pending — I'll activate
later", and explains that activating marks the unit occupied. That design is
sound. The defect is what happens when the wizard does not reach step 3.

The wizard commits entities **progressively, with no rollback**:
- Step 1 `TenantHomeStep:277` → `createOccupant(status:'active')` — committed
- Step 2 `LeaseTermsStep:55` → `createAgreement(...)` — committed, and
  `AgreementServiceImpl:142` sets the unit to **`reserved`**
- Step 3 `MoveInStep:41` → optional `updateAgreementStatus(id,'ACTIVE')`

Close the dialog after step 2 and you are left with a live occupant, a PENDING
agreement, and a `reserved` unit — with no indication anything is unfinished.

The trap: `TenantHomeStep:116` loads units with `status: 'available'` **only**.
A `reserved` unit therefore **never appears in the wizard again**. The landlord
cannot re-onboard into that unit at all without manually editing the unit's
status elsewhere. There is no "resume onboarding" and no warning.

This is the current live state of `shakvilla-homes`: Room 116 is `reserved`,
absent from both dashboard counters, absent from public listings, and
un-pickable in the wizard.

### F-08b 🟠 A pending tenancy is invisible everywhere
Given F-08's design is intentional, the gap is that "pending" has no presence:
no dashboard tile, no badge, no reminder. Occupied **0** · Vacant **0** ·
Active agreements **0** while a tenant is mid-move-in. The only route to
activate is Agreements → row menu → Update Status, which nothing points to.
Suggest a "1 move-in pending" dashboard tile linking straight to activation.

### F-09 🟠 Agreements can outlive their property, unit and occupant
`AGR-2026-001` renders occupant "—" and property/unit "—". Its `occupant_id` is
NULL and its `property_id` / `unit_id` point at rows that no longer exist.
Root cause: `agreements` has exactly ONE foreign key — `previous_agreement_id`.
There is **no FK on property_id, unit_id or occupant_id**, so nothing at the DB
level prevents a delete from orphaning agreements; any guard is app-level only
and this record slipped past it.
Impact: a terminated lease is unauditable — you cannot tell which property it
was for. Bad for a system of record.

### F-10 🟡 Status column renders "Terminated Terminated"
`AgreementsListTable:317` renders a renewal-decision chip
(`decision === 'RENEWED' ? 'Renewed' : 'Terminated'`) *next to* the status chip,
which for a terminated agreement already reads "Terminated". Two identical
chips side by side.

### F-11 🟠 Invoice STATUS column shows no text at all
`InvoicesListTable:338` renders status as an icon-only `CustomAvatar`; the word
lives only inside a hover Tooltip. Verified in the live DOM: the status cell has
empty `innerText`, no `aria-label`, no `title`.
- Unreadable at a glance on the one column that decides whether you get paid —
  DRAFT (info/blue), PENDING (warning/amber) and PARTIAL (primary) are near-
  indistinguishable by colour.
- Inaccessible: screen readers get nothing; touch devices cannot hover at all.
Fix: render the label beside the icon, as every other status column does.

### F-12 🟠 Invoice summary tiles do not account for DRAFT
Total Invoices **1**, Paid **0**, Pending **0**, Overdue **0**. The one invoice
is `DRAFT`, which no tile counts, so the three buckets sum to 0 of 1.
Same shape as F-01: a status that exists in the data but in none of the tiles.
Either add a Draft tile or make the tiles exhaustive.

### F-13 🟡 `/maintenance` serves the platform "Under Maintenance" screen
Two routes resolve to `/maintenance`: `(dashboard)/maintenance/` (no root
`page.tsx`, only children) and `(blank-layout-pages)/maintenance/page.tsx`.
The blank-layout one wins, so the bare URL claims the platform is offline —
with an auto-retry countdown — while it is running fine.
Nothing links there (the sidebar item is a parent that expands), so this is a
false alarm on URL-editing / bookmarking, not a broken nav path. Worth renaming
the platform screen to `/service-unavailable`.

---

# PRO-tier pass (tenant elevated to PRO/ACTIVE)

### F-14 🔴 Tenants and Maintenance reports are broken — and fail silently to zeros
Tenants Report shows **Total Tenants 0 / Active 0 / Occupancy 0%** while the
Occupants page shows 1 active occupant. It is not a counting bug: the underlying
request **400s** and the UI renders zeros instead of surfacing the error.

Observed on the wire:
```
GET /api/v1/occupants?size=500&startDate=2026-07-13T00:00:00.000Z&… → 400
{"message":"Parameter 'startDate' is not a valid LocalDateTime.","code":"VALIDATION_ERROR"}
```

Root cause — `src/utils/reports/dateUtils.ts:74`:
```ts
const format = (d: Date) => (mode === 'date' ? d.toISOString().slice(0, 10) : d.toISOString())
```
`datetime` mode emits `2026-07-13T00:00:00.000Z`. Spring `LocalDateTime` parses
neither the milliseconds nor the `Z`. The `date` mode (`slice(0,10)`) is fine,
which is why the Expenses/Earnings/P&L reports work — they hit `LocalDate`
endpoints.

Affected: the two reports using `'datetime'` —
`TenantsReport.tsx:78` (→ `OccupantController:98`, `LocalDateTime`)
`MaintenanceReport.tsx:79` (→ `MaintenanceRequestController:62`, `LocalDateTime`)

**Fix verified against the live backend** — `slice(0, 19)`:
| endpoint | `…T00:00:00.000Z` (current) | `…T00:00:00` (proposed) |
|---|---|---|
| `/occupants` | **400** | **200** |
| `/maintenance/requests` | **400** | **200** |

Secondary defect: a failed fetch renders as legitimate zeros. A landlord reading
"Occupancy Rate 0%" has no way to know the query failed. Reports must show an
error state, not zeros.

### PRO-tier features that unlocked cleanly ✅
All previously-gated pages now render with correct empty states and correct
"0–0 of 0" pagination:
Wallet (balance/ledger/withdrawals/MoMo panel), Utilities, Communication,
Rent Reviews, Expenses, Agents (`/members/agents`), Reports (8 tabs).

### Verified correct — two things I initially suspected and cleared
- **Subscription plan comparison is right.** Text extraction stripped the ✓/✗
  icons, making all three plans look identical. The DOM carries 32 checks and
  26 crosses, matching the DB exactly (FREE 0 enabled, BASIC 13, PRO 19 = 32).
  `SubscriptionPlansListTable:685` honours `info.enabled`. No defect.
- **`/inspections` 403 is correct RBAC**, not a broken link. The nav entry is
  `allowedUserTypes: ['OCCUPANT']`, so it is hidden from the landlord sidebar
  *and* enforced server-side. Guard works on both layers.

---

# E2E pass — the coverage gap, closed

Playwright installed and driving a real Chromium against the Docker stack, as a
dedicated tenant (`e2e-qa-ltd`) that is wiped before every run.
`npm run test:e2e`. Suite is green; two known defects are held in `test.fail()`
so they flip the suite RED the moment someone fixes them.

**The write paths do work.** The first-run wizard creates all five entities and
they persist: property (with region/district/city correct), unit, occupant,
agreement, invoice. That is the reassuring half.

The four findings below were invisible to the read-only pass.

### F-15 🔴 First-run wizard: required fields hidden behind an "Optional" control
Step 1 shows exactly two starred fields — **Property name\*** and
**Property type\***. Fill both and **"Save & continue" stays disabled**, with
nothing on screen explaining why.

`PropertyStep.tsx:32`:
```ts
const valid = form.name && form.type && form.region && form.district && (form.city || canWaiveCity)
```
`region`, `district` and `city` come *only* from the address control, which is
captioned **"Optional — a Ghana Post GPS code fills in the region and district."**
Using that "optional" control then reveals a **"City / area \*"** select that
did not exist on the step before — a required field that appears only if you
touch a field labelled optional.

A new landlord who does not guess this cannot get past step 1 of onboarding.

### F-16 🔴 A reused phone number destroys the occupant, and blames "User not found"
Creating an occupant whose phone number already belongs to another global user
fails with a red **"User not found"** and **rolls the entire creation back** —
zero rows written. Reproduced deterministically; passes as soon as the phone is
unique.

`OccupantServiceImpl` saves the occupant, provisions a global user, then calls
`otpService.sendOccupantWelcome(email)`. That resolves the user by
`findByEmailOrPhoneNumber` and throws `USER_NOT_FOUND` when it cannot. The call
is unprotected — unlike the in-app notification directly below it, which is
explicitly *"best-effort — never blocks occupant creation"* — so the throw takes
the transaction down with it.

Real-world triggers: two occupants sharing a phone (family), and **re-adding an
occupant after deleting them** — deleting the occupant leaves the global user
behind, so the phone collides forever after.

### F-17 🟠 Wizard-generated invoices name nobody
The invoice the wizard creates is written with `occupant_id` set but
`occupant_name`, `property_name` and `unit_no` all **empty**, so the invoices
list shows an invoice belonging to no one, for nothing.

### F-18 🔴 Completing ALL FIVE steps still leaves the unit reserved
This supersedes and worsens F-08. Final state after a *complete* onboarding:

| unit | occupant | agreement |
|---|---|---|
| `reserved` | `active` | `PENDING` |

The occupant step correctly sets the unit `occupied`; the agreement step then
**downgrades it to `reserved`** (`AgreementServiceImpl:142`). This wizard offers
no activation choice at all, so there is no way to finish onboarding in an
active state.

That is the root of F-01: the dashboard reads Occupied **0** and Vacant **0**
for a unit with a live tenant in it, and the unit drops out of public listings.

## UX / flow-shortening suggestions

### 💡 U-1 Two competing entry points on the Occupants page
"Onboard a Tenant" and "Add Occupant" sit side by side with no explanation of
the difference. One runs a 3-step wizard that creates occupant + agreement +
invoice; the other creates a bare record. Suggest one primary button with a
split-menu, or relabel to "Full onboarding" / "Quick add — details only".

### 💡 U-2 Make the wizard's progressive commits recoverable
The cheapest fix for F-08 is not to change the commit model but to make the
half-finished state visible and resumable: keep the wizard's unit picker
offering `reserved` units that belong to a PENDING agreement, and label them
"resume onboarding".

### 💡 U-3 Status columns should carry text, not just colour
F-11 is the acute case, but the pattern repeats. Colour-plus-icon alone forces
the user to hover, and fails entirely on touch.

### 💡 U-4 Dashboard tiles should partition, not sample
Occupied/Vacant/Damaged omit `reserved`; invoice tiles omit `DRAFT` and
`CANCELLED`. Either make the buckets exhaustive or label them "of N total" so
the gap is visible rather than silently misleading.

## ✅ Working correctly
- Occupants list: counters, row data, contact details all correct.
- Agreements pagination reads "1–2 of 2" — a real count, so F-03 is specific to
  the 4 cursor-paginated tables, not universal.
- Maintenance requests, Documents: clean empty states, correct "0–0 of 0".
- Subscription gates are graceful and specific — Reports says "requires the
  Basic plan", Wallet says "available on the Pro plan", each with an Upgrade
  now CTA. Server-side 402s back them up (`EXPENSES` 402 seen in console).
- Onboarding wizard opens, steps are well-labelled, Unit is correctly disabled
  until a Property is chosen, and the move-in copy explains activation clearly.

## Coverage status (updated after the E2E pass)

**Now covered by `npm run test:e2e`:** the first-run onboarding chain end to end
— property, unit, occupant, agreement and invoice creation, each asserted after
a navigation so it proves persistence rather than local state.

**Still not covered:** edit and delete flows, payment recording, exports
(PDF/Excel/CSV), the *other* onboarding wizard (`OnboardTenantWizard`, reached
from Occupants), and Settings. The scaffolding is in place for these — a new
spec in `e2e/` inherits auth and the per-run reset.

## Original coverage note (superseded above, kept for the record)
Interactive clicking never worked in my browser pane — element refs and
coordinates both resolve to the right element and report a click, but nothing
happens on the page. Navigation, JS execution, DOM reads and network capture
all work. I retried in a fresh context and after fixing a viewport mismatch;
neither helped. So:

**Confirmed against live UI + database + network:**
F-01…F-07, F-09…F-14, and every ✅ item above.
F-14's fix is empirically verified (400 → 200 against the running backend).

**Confirmed from code paths + live DB state, not clicked end-to-end:**
F-08 / F-08b (the wizard's progressive commits and the `available`-only unit
filter).

**NOT exercised at all — this is the real gap for a production gate:**
- Every create/edit form (Add Property, Add Unit, Add Occupant, Add Agreement,
  Create Invoice, Add Expense, Add Meter, New Review, Add Agent)
- Every delete / terminate / cancel flow
- Record-a-payment and any money-moving path
- Export buttons (PDF / Excel / CSV / Export CSV)
- The onboarding wizard past step 1
- Settings pages (`/settings/*`), Support, Occupant History, All Units

Recommendation: these are the flows that write data and move money. They should
be driven by a human or an E2E runner (Playwright) before production, not
signed off on the strength of this pass.

