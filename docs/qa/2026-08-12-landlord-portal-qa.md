# Landlord Portal — Final Pre-Production QA

Environment: local Docker (`web` :3099, `api` :8099), branch `feat/rbac-fixes`.
Tester: manual UI sweep + Playwright. Swept 2026-08-12, fixed through 2026-08-13.
On 2026-08-14: a second sweep opening all 28 sidebar destinations, a third
pressing each menu's primary action, and a fourth closing the items those left
open. Read the STATUS block below for where things stand — it links to each pass. The
sections after it are in the order they were written, not the order the work
happened, because each was appended as it finished.

> Written to a scratchpad and nearly lost — it survived only because the path
> was remembered. Kept in the repo from here.

---

## STATUS — 2026-08-14, end of day

**Nothing from this report is outstanding.** Every numbered finding is fixed and
pushed, or closed with a stated reason. Thirty findings in total: the original
nineteen, plus eleven from three further passes and the work that followed them.

- [The second pass](#the-second-pass--2026-08-14) opened all 28 sidebar
  destinations and read what they rendered. Four findings.
- [The third pass](#the-third-pass--2026-08-14--every-menus-primary-action)
  clicked the primary action on each one. Four findings.
- [The fourth pass](#the-fourth-pass--2026-08-14--closing-the-open-items) closed
  the two items left open, and found F-29 and F-30 on the way.

Larger pieces of work have their own sections:
[Ghana Card images removed](#ghana-card-images-removed--2026-08-14) ·
[Supabase removed](#supabase-removed--2026-08-14) ·
[F-28, deleted images on the CDN](#f-28--deleted-images-stayed-live-on-the-cdn--2026-08-14) ·
[the `/listings` build warning](#the-listings-build-warning--2026-08-14) ·
[the flaky frontend tests](#the-flaky-frontend-tests--2026-08-14)

| suite | at first report | after the fix pass | end of day |
|---|---|---|---|
| backend | 894 | 918 | **943** |
| frontend unit | 463 | 479 | **501** |
| E2E | 16 | 35 | **45** |

No `test.fail` markers remain: every test asserts what its name claims. The full
E2E suite was run against a stack rebuilt from the committed code — 45 passed in
4.9 minutes — after checking each container's image id against the freshly built
one, because a stale container fooled me twice today.

### The two that were open, and how they closed

| id | was | closed by |
|----|-----|-----------|
| F-23 | downgrade with no unit-cap check — **a product decision, not mine** | you chose a hard block; implemented and verified live |
| F-27 | document upload dead in every Docker deployment | the Supabase → ImageKit migration removed the cause entirely |

Also carried from the original report and now fixed: the `/listings`
`DynamicServerError` swallow, which was never one of the numbered nineteen.

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

**Now covered too, since the second pass:** CSV **export** from all four list
tables, driven by clicking the real button and asserting the downloaded file
contains that run's fixture. This closes the gap flagged here — they were
500ing in the July platform-admin sweep and had never been re-verified.

**Still not covered by tests:** Settings, Support, Occupant History and the ~20
feature areas swept manually (utilities, expenses, agents, comms, caution fee,
guarantors, rent reviews, advance rent, documents, violations, team management,
subscription, reports, wallet). Every one has now been *driven by hand* — the
third pass pressed each menu's primary button and checked the result persisted —
but only the MoMo pattern gained a test. Unwatched, not known-broken. F-24 is
the argument for changing that: it sat in the money-out path of a shipped
product and no suite would have caught it.

**Now covered too, since the fourth pass:** the downgrade unit cap (both the
disabled card and the server refusing a request from a stale page), and document
upload end to end — a real PDF through the real dialog, asserting the stored URL
is not publicly readable, that the signed link returns `%PDF` bytes, and that
deleting the document takes the file to 404.

**Document upload was previously untestable under Docker**, because
`docker-compose.yml` never passed the Supabase keys to the web container. The
ImageKit migration removed that: it uses vars compose already supplies.

**Everything here was verified against local Docker with ten properties and one
real tenant.** Nothing in this report speaks to scale, concurrency, or real
payment gateways.

### Operational notes that outlive this branch

Three things that cost time today and will cost it again:

- **A combined `docker compose up -d --build api web` reported success while
  silently not rebuilding one of the two services.** Build services explicitly
  and verify by behaviour — image ids, or an endpoint that only exists in the
  new code — not by timestamps.
- **The test suite and the running app use different databases.**
  `spring.datasource.url` is `localhost:5432`; the Docker stack publishes
  `55432`. A green backend suite says nothing about the app's schema until the
  container restarts and Flyway runs there. This is exactly how `V139` showed as
  applied on one and missing on the other.
- **A Vitest config key that does not exist is ignored in silence.** No warning,
  no error — the config simply does nothing. Verify a config change by observing
  the behaviour it was meant to change.

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

Later passes added more, kept here for the same reason:

- **The containers were called stale twice, and were not.** Once the new
  endpoint was missing from `/v3/api-docs` and a deleted Next route still
  answered 200 — the first was the endpoint correctly reporting "this document
  has no file", the second was Next serving its own 404 page. Settled by
  behaviour: hitting the endpoint and reading the bytes. (A third time the
  containers genuinely *were* stale, which is what made the pattern hard to
  see.)
- **The privacy assertion had the wrong number.** The E2E expected 401; ImageKit
  answers 403 for an unsigned private file. The product was right and the test
  was wrong — the opposite of the failure mode worth having.
- **The flaky tests were blamed on my own concurrent builds.** They failed on a
  quiet machine too; the all-green run cited as evidence was luck. Root cause
  was worker starvation, found by profiling rather than assuming.
- **A test-timing claim was drawn from the wrong two tests.** "1.3–1.9s" came
  from the cheapest tests in the file; the slow ones were 5.8–10.4s.
- **The E2E count was quoted as 47 and is 45.** Added 4 + 4 to 39 without
  re-counting; the setup steps are not test cases. Quote the number the runner
  prints.
- **A config fix was reported as applied when it did nothing.**
  `poolOptions.forks.maxForks` does not exist in this Vitest and was ignored in
  silence. Caught only by re-running and seeing the identical failures.

---

## The second pass — 2026-08-14

The first sweep visited **8 of the 28 destinations a landlord sees in the
sidebar**. This pass opened all 28 on a tenant elevated to PRO, so that a locked
screen anywhere would itself be a defect. None appeared, and no page produced a
failed request. Four defects came out of it.

Newly opened here for the first time: Occupant History, Agents, Documents,
Wallet, Expenses, Expense Config, Communication, Maintenance Categories,
Maintainers, Preventative Schedules, Utilities, Rent Reviews, Subscription
Plans, Support, and all six Settings pages.

| id | defect | severity | state |
|----|--------|----------|-------|
| F-20 | Units Overview tiles omit `reserved`, and mix a portfolio-wide total with page-local counts | 🟠 | fixed, uncommitted |
| F-21 | Login History records nothing for any real sign-in | 🟠 | fixed, uncommitted |
| F-22 | Company Settings asks for a company name the landlord gave at signup | 🟡 | fixed, uncommitted |
| F-23 | "Downgrade to Free Plan" offered with no unit-cap check anywhere | 🟠 | fixed in the [fourth pass](#the-fourth-pass--2026-08-14--closing-the-open-items) once the product decision was made |

### F-20 🟠 Units Overview tiles omit `reserved` and don't reconcile

Exactly F-01 on a second screen. `/properties/units` showed **All 4 · Occupied 0
· Vacant 1 · Maintenance 0**, with three reserved units in no tile at all.

Worse than the missing tile: `allUnits` came from the server-wide total while
the other three were `data.filter(...)` over the **current page**. A landlord
with 25 units saw four numbers that could not be made to add up, and that
changed as they paged.

Fixed by feeding all five tiles from `getPropertyStats`, the same portfolio-wide
endpoint the dashboard uses, and adding the Reserved tile with the caption
"Awaiting move-in". Verified on screen: **All 8 = Occupied 3 + Vacant 2 +
Reserved 3 + Maintenance 0**.

### F-21 🟠 Login History records nothing for any real sign-in

The Security page listed four `curl/8.7.1` entries and none of the browser
sign-ins that had just happened.

Only `AuthServiceImpl.login` — the single-tenant endpoint — ever wrote to
`tenant_login_history`. The portal stopped using it when login split into a
global step plus a workspace selection, and `POST /global/auth/login` writes
nothing. So the one page a landlord opens to ask *"has anyone else been in my
account?"* answered with a blank list. The same table backs the admin
dashboard's active-user count, which under-reported for the same reason.

Recording moved to tenant selection, in a new `LoginHistoryRecorder` shared with
the legacy path. That is the first point where a tenant **and** a tenant-scoped
user id both exist — the id the history is keyed by — and the first point where
it is settled which workspace was entered. It runs `REQUIRES_NEW` so a failed
history insert can never poison the sign-in transaction, which is the failure
that once turned every login into a 500.

Verified end to end: signed out, signed back in through the browser, and the row
appears as `Mozilla/5.0 (Macintosh…) — Just now`. Two unit tests pin it —
one that a landlord's selection records, one that an occupant's does not (their
id points at `occupants`, not `users`, so a row would be attributed to nobody).

### F-22 🟡 Company Settings asks for a name already given at signup

`tenants.name` has held the company name since signup, but the form hydrates
only from the schemaless settings blob, which does not exist until the first
save. Every new landlord opened a **required** Company Name field, blank.

`GET /settings/contact` already loads the Tenant row and returned only the
phone. It now also returns `companyName`, read-only, and the form uses it as a
fallback — a landlord who saved a different trading name keeps theirs.

### F-23 🟠 Downgrade to Free is offered with no unit-cap check

The button is enabled for a tenant with 8 units against Free's 5-unit cap.
`scheduleDowngrade` performs no check; `processRenewal` then applies the pending
plan unconditionally, with no grandfathering (that exists only for an admin
lowering the cap). The landlord clicks, is told it is scheduled, and at period
end lands on a plan they exceed — with nothing said about units 6–8.

**Left open deliberately.** Whether this should be a hard block, a warning
naming the units at risk, or automatic grandfathering is a product and billing
decision, not a bug fix.

### Seen but not confirmed

- ~~The email-template editor opens with blank Subject and Body.~~ **Wrong —
  withdrawn in the third pass.** The Subject reads
  `Invoice #{{invoice_number}} - Payment Due` and the body is 150 characters of
  real template. It looked blank because the page text was read with a tool that
  does not render input values. See [what this pass got
  wrong](#what-this-pass-got-wrong).
- Occupant History is built from `status=inactive`, which may not be the same
  set as "has vacated". The seeded portfolio had no vacated tenant to tell them
  apart. Still unconfirmed.

Also carried over, still open from the first pass and unrelated to the sidebar:
attaching a tenant by agreement sets `unit.occupantId` but never writes back to
the occupant, so the Occupants list shows `-` for unit, property and move-in
while the unit page names them as Current Tenant.

### A correction from this pass

The Wallet's balance (₵45,600) does not match its ledger (₵1,200). That was
reported in passing as if it were a product defect. It is not: it was caused by
this session's own fixture cleanup deleting ledger rows. Every balance mutation
in `WalletServiceImpl` writes a ledger entry, and the only foreign key on
`ledger_entries` is `wallet_id` with `NO ACTION` — nothing in the product can
delete a ledger row behind the balance.

---

## The fourth pass — 2026-08-14 — closing the open items

The third pass ended with two findings I would not close myself: F-23 needed a
product decision, and F-27 needed a deployment one. Both came back, and the work
turned up two more defects plus one that had been hiding in code I was deleting.

| id | defect | severity | state |
|----|--------|----------|-------|
| F-23 | downgrade offered with no unit-cap check | 🟠 | fixed — `4c7907f` · `2911b37` |
| F-27 | document upload dead in every Docker deployment | 🔴 | fixed by the migration — `94ebefe` |
| F-29 | a deleted unit orphans its rent reviews | 🟠 | fixed — `b5b8d93` |
| F-30 | internal error messages returned in production | 🟠 | fixed — `676a904` |

### F-23 🟠 Downgrading below your unit count

You chose a hard block. `scheduleDowngrade` now refuses when the tenant's active
units exceed the target plan's cap, with a message that does the arithmetic:

> You have 8 units and the FREE plan allows 5. Remove 3 units, or choose a plan
> that fits.

"Too many units" would leave a landlord guessing how many to remove.

Three decisions worth stating, because they are not obvious from the code:

- **Exactly on the cap is allowed.** Five units into a five-unit plan fits;
  refusing there would be the opposite mistake.
- **The grandfathered cap is deliberately not consulted.** It is an override
  attached to the tenant's *present* subscription, granted so an admin could
  lower a plan's cap without breaking existing customers. Carrying it into a
  plan the landlord is choosing to move to would let it defeat that plan's cap
  entirely. Verified live against a tenant whose grandfathered cap is 500: the
  downgrade was still refused.
- **Cancellation is deliberately not gated.** Cancelling is how a customer stops
  paying; refusing it until they delete units would trap them in a paid plan.
  Landing on FREE over cap only stops them *adding* units — nothing is deleted,
  because `enforceUnitCap` is consulted on creation only.

The card now disables the button and says why before it is clicked. That
uncovered a second half: `handleDowngrade` was `catch { /* silent */ }`, so the
server's refusal — the one that names how many units to remove — would have
shown the landlord nothing at all. The gate would have been invisible.

Verified live: 14 units → FREE returned 409 and wrote no pending plan; → BASIC
(no cap) returned 200 and scheduled normally.

### F-29 🟠 A deleted unit orphans its rent reviews

Found by driving the portal, not by reading code. `rent_reviews` had **no
foreign keys at all**, so deleting a unit left its reviews pointing at nothing.
They rendered as "Unit —" with no property and no occupant — and worse than
clutter, their row menu still offered **Notify Occupant** and **Apply Now**:
messaging a tenant who is not there, and applying a rent rise to a unit that no
longer exists. Two of four reviews in the QA tenant were in that state.

Fixed at the database rather than in `UnitServiceImpl.deleteUnit`, and that
choice was decided by something checked rather than assumed: `units.property_id`
already cascades, so deleting a **property** removes its units directly in the
database without `deleteUnit` ever running. Java-side cleanup would have closed
one path and left the other open.

CASCADE for unit and property, not the SET NULL that agreements took in F-09. A
terminated lease stays auditable after its unit is gone; a rent review is a
proposal about one specific unit, and detached from it cannot be displayed,
actioned or understood — SET NULL would have preserved exactly the "Unit —" row
this removes. `occupant_id` takes SET NULL instead: the review is about a unit
that still exists, and losing the tenant should not delete its rent history.

The test earns its keep. With the constraint dropped it fails with *"the review
outlived its unit"*, then passes with it — and it covers the property path,
which is the one Java cleanup would have missed.

### F-30 🟠 Internal error messages returned in production

Found while deleting the last Supabase references, and not the cosmetic cleanup
it looked like. `handleError` had a leftover branch whose type guard was:

```ts
typeof error === 'object' && error !== null && 'message' in error
```

— true of every `Error`. It sat **above** the generic handler, so it ran instead
of it for essentially everything: labelling all failures `DATABASE_ERROR`,
mapping them through a table of Postgres codes that no longer arrive, and
returning `error.message` verbatim. The generic branch two lines below
deliberately withholds the message outside development. Nothing ever reached it.

That is the reason this is a fix and not a tidy-up, and it is only visible if you
check the ordering rather than reading the branch in isolation.

---

## Supabase removed — 2026-08-14

Supabase was the only thing in the product still on it: three files and two
features, against ImageKit which already held every property, unit, occupant and
inspection image and was already wired through `docker-compose.yml`. The backend
never referenced it at all.

Three reasons to move, only one of which was tidiness:

- The old route returned a permanent **public** URL which the list opened
  directly. Anyone holding the link could read a tenancy agreement, and nothing
  checked they owned it — a document id from another tenant was as good as your
  own.
- It routed bytes through a Next route handler holding a **service-role key with
  full storage rights**, sitting in the web tier.
- It was **dead in every Docker deployment** (F-27): compose never passed the
  Supabase keys, so every upload 500'd there. Only `npm run dev` worked.

### What it looks like now

Files go straight to ImageKit as **private** objects, signed by a short-lived
token Spring issues, so bytes never touch our server and no storage key lives in
the web tier. Reading one goes through `GET /documents/{id}/download-url`, which
resolves the document within the caller's tenant and signs a link valid for five
minutes — long enough to click, short enough that a URL copied out of history, a
chat message or a proxy log is worthless later.

Deleting a document now removes the file server-side. The browser used to make
that call afterwards, best-effort, and skipped it entirely whenever the tab was
closed first.

The platform-admin logo moved too, and stays deliberately **public** — it renders
on the login page and in emails, where a signed link would be wrong.

No data migration was needed: the `documents` table was empty in every tenant,
which is why this was cheap today and would not have been later.

### Verified with a real PDF

Driven through the real dialog, with real PDF bytes rather than a renamed text
file:

| | |
|---|---|
| stored URL, on its own | **403** — and no `%PDF` bytes in the body |
| signed link | **200**, body begins `%PDF` |
| after deleting the document | **404** |

Under Supabase the first of those was **200, to anyone at all**.

### Known trade-off, deliberately taken

`isPrivateFile` is set by the browser, and the upload signature covers only the
token and its expiry, so a hand-built request could omit it. That is the same
trust this app already extends to `folder` on every property and occupant image.
Closing it means proxying uploads through Spring — server-controlled flags, at
the cost of streaming 10 MB files through Java. Worth doing if documents ever
carry something stricter than they do today.

### What is left of Supabase

Nothing that runs. No SDK (it was never in `package.json`), no routes, no keys
in `.env.example`, and three comments that explain what used to be there.

---

## The `/listings` build warning — 2026-08-14

Carried from the original report, never one of the numbered nineteen. Every
production build printed:

```
[listings] failed to load public listings: Error: Dynamic server usage:
Route /listings couldn't be rendered statically because it used no-store fetch
{ digest: 'DYNAMIC_SERVER_USAGE' }
```

That is the framework saying *"render this route on demand"*, caught by a
try/catch meant for *"the API was unreachable"* and logged as an application
failure. Runtime was never affected — Next opted the route into dynamic
rendering regardless — but anyone reading the build log would reasonably
conclude the listings API was broken.

Fixed at the cause and at the class: `export const dynamic = 'force-dynamic'` on
the three listing routes, and a `rethrowIfNextControlFlow()` guard called first
in every catch around a Server Component fetch. `notFound()`, `redirect()` and
the dynamic bail-out are all raised as exceptions carrying a `digest`, so any
catch broad enough to be useful is broad enough to eat them.

It was not only the index page. `/listings/[id]` had `catch { notFound() }`, so a
build-time dynamic signal was answered with a **404** — "render this on demand"
turned into "this listing does not exist".

Verified by building before and after — **2 warnings to 0**, with `/listings`
still classified `ƒ (Dynamic)` — then against the real built output, both halves
of what the catch exists for:

- **API up:** page renders, nothing logged, so an empty page means an empty
  catalogue
- **API pointed at a closed port:** still fails open to the empty state, *and*
  logs the real failure

---

## The flaky frontend tests — 2026-08-14

Five tests failed on `Test timed out in 30000ms` on a quiet machine, and every
one passed when run alone. Always a timeout, never an assertion — the kind of
red that teaches you to ignore the suite.

I first told you these were self-inflicted by my own concurrent builds. **That
was wrong**: they failed with nothing else running, and the all-green run I had
cited was luck.

Not a slow test doing something silly. Profiled phase by phase, the property
dialog costs **2.4s to render** and ~500ms per Select interaction, so walking its
wizard is 6–10s of real work — inherent to a 1600-line MUI form in happy-dom.

The failures were **starvation**: one fork per core, each re-importing the whole
MUI surface. Halving the workers more than halved the total work, because the
contention was costing more than the parallelism was buying:

| | before | after |
|---|---|---|
| cumulative import | 893s | **100s** |
| cumulative tests | 1025s | **104s** |
| wall clock | 202s *(5 failing)* | **47–55s green** |

Faster *and* green — four consecutive full runs at 501/501. Scaled to
`os.cpus()` rather than pinned, so a 4-core CI box does not hit the same
starvation from the other direction.

**The part worth remembering:** the first version of this fix set
`poolOptions.forks.maxForks`, which this Vitest does not have. It was ignored in
silence and the suite went on failing identically — the config looked applied and
did nothing. The working key is `maxWorkers` on `test`.

---

## Ghana Card images removed — 2026-08-14

Not a QA finding: a regulatory change. Ghana no longer permits holding images of
the Ghana Card. Payslips were dropped at the same time as no longer needed. The
card **number** is still permitted and is still collected.

### Where the capture actually was

| where | state | what happened |
|---|---|---|
| **Add Occupant** → Identification | live, sidebar-reachable | Front/Back of ID, JPG/PNG/PDF → ImageKit, stored on four `occupants` columns. **Removed.** |
| **Add Tenant** → Ghana Card Front/Back, marked required | dead | Lives on `/tenants`, whose API does not exist — the page prints "No endpoint found for GET /api/v1/tenants" and the OpenAPI spec has no `/tenants` path at all. It never stored anything. **Removed as dead code.** |
| **Documents** → `Ghana Card`, `ID Card`, `Passport Photo`, `Passport`, `Payslip` | live but unused | The `documents` table was **empty across every tenant**. **Removed from both the frontend list and the backend `@Pattern`.** |

Kept untouched: `occupants.ghana_card_id`, `occupants.id_type`,
`agents.ghana_card_number`, and the Ghana Card Number fields on the agent and
customer drawers. All text.

### Decisions taken

Removal went wider than the letter of the rule, on the reasoning that a
near-miss label is a way back in: the Front/Back control was generic, driven by
an ID Type dropdown, so keeping it for Passport or Voter ID would leave a
landlord able to photograph a Ghana Card under a different label — and the
control cannot verify what is in the picture. So the whole ID-image feature
went, and the neighbouring identity document types went with it.

### The data

One occupant held images: `shakvilla-homes`, both files **OnePayGh logo PNGs**
rather than real ID documents — someone had tested the upload with placeholders.
No real Ghana Card image existed anywhere in the system.

Both objects were deleted from ImageKit (details endpoint now 404s) **and their
CDN cache purged**. The purge is the part worth remembering: after deletion the
delivery URL still returned **200**, because deleting a file does not evict the
edge cache. A file id alone is not enough to make an image unreachable.

That has a consequence beyond this cleanup: `ImageKitService.deleteFile` —
called whenever an occupant, property or unit is deleted — deleted without
purging. Every image this product had ever "deleted" was still served from its
CDN URL. **Now fixed — see F-28 below.**

### Changes

Backend: four columns dropped from `occupants` via `V138`; the fields removed
from the entity, `OccupantResponse`, both request DTOs, `OccupantMapper` and
`OccupantServiceImpl.update`; the document-type `@Pattern` rewritten.

Frontend: the ID upload block removed from `AddOccupantDialog` (state, refs,
preview cleanup, ImageKit upload, payload); the Ghana Card block removed from
the dead `AddTenantDialog`; `uploadTenantImage`'s `fileType` union narrowed to
`'avatar'`; the display block removed from `ProfileInformationTab`;
`DOCUMENT_TYPES` rewritten.

The section is now titled **Identification** and holds ID Type beside ID Number,
which had been sitting in a different accordion — the field the rules still
allow now sits under a heading that says what it is, with the helper text
"The number only — we do not keep a copy of the card".

### Verified

- Migration `V138` applied; `id_card%` columns on `occupants`: **0**;
  `ghana_card_id` + `id_type`: **still present**.
- Add Occupant renders **ID Type + ID Number**, no upload controls, and the only
  remaining file input in the dialog is the profile avatar.
- Documents offers exactly the eight new types, agreements first.
- Server-side enforcement, driven through the real API:

  | documentType | result |
  |---|---|
  | Ghana Card · ID Card · Passport · Passport Photo · Payslip | **400** |
  | Signed Tenancy Agreement | **201** |

- Suites: **921 backend / 494 frontend / 39 E2E**, all green. The removed types
  are pinned as an explicit rejection list in `DocumentTypeValidationTest` and
  in the frontend dialog test, rather than merely deleted — a suite that only
  dropped them would pass just as happily if someone restored them.

---

## F-28 🔴 Deleted images stayed live on the CDN — 2026-08-14

Found while purging the Ghana Card files above. Deleting a file from ImageKit
does not evict it from the edge cache, and `ImageKitService.deleteFile` only
deleted. Every image the product had ever removed — a property photo a landlord
took down, an occupant avatar, a maintenance photo — kept serving 200 to anyone
holding the URL. Eight call sites across occupants, properties, units and
maintenance.

### The fix

`deleteFile` now resolves the delivery URL, deletes, then purges — in that
order, because after deletion the URL is unrecoverable and purging beforehand
just re-caches a live file.

The URL is resolved inside the service rather than passed in. The entities do
store URLs beside ids, but as parallel arrays; on the partial-update paths a
caller would have to re-pair "which removed id was which URL" by index, which is
how the wrong image gets purged. One extra lookup buys correctness at all eight
sites.

Cleanup also moved off the request thread. It is fire-and-forget — every caller
already ignores the outcome — and it runs inside `@Transactional` deletes such
as `PropertyServiceImpl.deleteProperty`. Purging tripled the round-trips per
image, so inline it would have held a database transaction open across three
sequential HTTPS calls for every image on the property.

### Two things only the live check caught

**The first version of this fix did not work.** ImageKit returns the URL with a
cache-busting `?updatedAt=...` query appended, but the product stores and serves
the bare path — check any row of `properties.images` or `occupants.avatar`.
Purging is per-variant, so the fix cleared a URL nobody requests and left the
one everybody does. Measured: the canonical URL still served **200 ninety
seconds** after a "successful" purge of a file whose details endpoint already
404'd. The query string is now stripped before purging.

The unit tests passed throughout — they mock the SDK, so they prove the call is
made, not that it does anything. This is the second time in this report a
green suite certified a fix that did nothing.

**`@Autowired` on the constructor is load-bearing.** Adding a test-seam
constructor made this a two-constructor bean; without the marker Spring looks
for a no-arg constructor, fails, and takes the entire application context down —
63 unrelated integration tests at once. (I first misread that failure as an
`@Async` CGLIB proxy problem. It was not.)

### Verified end to end, against real ImageKit

Uploaded a file, warmed its edge cache to **200**, attached it to a property,
deleted the property through the real API, and watched the URL:

| | |
|---|---|
| delete endpoint | `204` |
| ImageKit file details | `404` |
| backend log | deleted, then `purged CDN cache for …png` — canonical, no query — on the `Async-1` pool thread |
| canonical URL at t+15s | `200` |
| canonical URL at t+30s onward | **`404`** |

Both throwaway test files were removed afterwards; the folder is empty.

Suites: **928 backend**, up 7 — six pinning the delete/purge sequence and one
pinning the query-stripping, since that is the part that was silently wrong.

---

## The third pass — 2026-08-14 — every menu's primary action

The second pass opened all 28 destinations and read what they rendered. That is
not a test. Every one of those pages exists to *do* something — Add Agent, New
Category, Add Meter, Record Bill, Send Notice, Invite Staff, Submit ticket,
Save Settings — and not one of those buttons had been pressed. A page that
renders a correct empty state and a page that works are different claims, and
the second pass only established the first while reporting the second.

This pass clicked the primary action on each menu, filled the form as a landlord
would, submitted it, and confirmed the result persisted — reloading the page or
reading the database rather than trusting the screen.

### Worked, end to end

Maintenance Categories (created, icon persisted, Edit/Delete present) ·
Maintainers · Agents · Utility meters · Expense Config · Expenses (tiles updated
with the new total) · Rent Reviews · Preventative Schedules (with a clear
validation alert when Property was missing) · Communication (notice sent to all
6 tenants, all marked Sent) · Support ticket · Team invite (staff created and
listed) · Roles (new role created with permissions) · SMS Sender ID (request
went PENDING) · Notification settings (toggle persisted across reload) ·
Recurring-invoice settings (persisted across reload) · Wallet MoMo linking
(after the fix below).

### Not tested — and F-27, which is why

**Document upload.** The dialog returns "Supabase is not configured on the
server." The failure is reported clearly and offers Try Again, which is the
right behaviour — but the upload path is **unverified**, and so is everything
downstream of it (a document cannot be accepted without a file).

I first wrote this off as a local-environment limitation. It is not — see
[F-27](#f-27--document-upload-is-dead-in-every-docker-deployment) below.

Two corrections to what that paragraph originally said:

- **The landlord's company logo does not use Supabase.** `handleLogoUpload` in
  `BasicInformationSettings.tsx` reads the file with `FileReader` into a base64
  data URL and stores it in the settings blob. It is testable locally; I simply
  did not test it. (Only the *platform admin's* logo, in
  `AdminPlatformSettingsView.tsx:271`, posts to `/api/upload-logo`.)
- Storing a logo as base64 inside a JSON settings column is worth a look on its
  own — a 5 MB image becomes ~6.7 MB of text in that row, and no size guard was
  evident. Not investigated; noted so it is not lost.

### F-27 🔴 Document upload is dead in every Docker deployment

`docker-compose.yml` passes `IMAGEKIT_*` into the web build but contains **no
`SUPABASE` reference at all** — zero occurrences. `.env.local` has all three
Supabase keys, so `npm run dev` uploads fine; the container never receives them
and every upload 500s.

So the behaviour splits by how the app is run:

| how it runs | reads | document upload |
|---|---|---|
| `npm run dev` | `.env.local` | works |
| `docker compose up` | compose env only | **500, every time** |

That makes this a deployment defect rather than a testing inconvenience. It is
filed unfixed because the correct fix depends on something I should not assume:
whether this compose file is the production deployment path or only a local
harness, and where the service-role key is meant to come from in each case. The
one-line change is to thread `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` through to the `web` service the way the ImageKit
keys already are — but the key is a service-role JWT with full storage rights,
so where it is sourced from matters more than the wiring.

**Storage is split across two providers.** ImageKit holds property, unit,
occupant and inspection images and is wired end to end, backend included.
Supabase holds only tenant documents and the platform-admin logo, and the
backend does not reference it anywhere — it exists solely in two Next route
handlers. Consolidating is not this report's call, but the split is why one
half of file handling is configured everywhere and the other half is configured
in exactly one place.

### Findings

| id | defect | severity | state |
|----|--------|----------|-------|
| F-24 | every valid Ghanaian MoMo number is rejected — nothing can be linked, nothing can be withdrawn | 🔴 | fixed, uncommitted |
| F-25 | recording a utility bill saves, but the table keeps saying "No bills recorded yet" | 🟠 | fixed, uncommitted |
| F-26 | a new rent review shows its tenant as "Vacant" | 🟡 | fixed, uncommitted |
| F-27 | document upload 500s in every Docker deployment — compose never passes the Supabase keys | 🔴 | fixed — the [Supabase removal](#supabase-removed--2026-08-14) took the cause away |
| F-28 | every "deleted" image stayed live on the CDN — delete never purged | 🔴 | fixed, uncommitted |

### F-24 🔴 No landlord can link a MoMo number or withdraw their money

Typing `0244778899` into Linked MoMo Number returns **"Enter a valid 10-digit
Ghanaian number"**. It is a valid 10-digit Ghanaian number.

The pattern is `/^0[2-9]\d{7}$/` — a leading zero, a network digit, then seven
more. Nine digits. A Ghanaian mobile number is ten. The rule and the error
message printed beside it contradicted each other, and the rule won:

```
0244778899  (10 digits, real)  → rejected
024477889   ( 9 digits, fake)  → accepted
```

It appears **twice** — `WalletDashboard.tsx:313` in the withdraw dialog and
`:920` in the linked-number card — so both halves of the money-out path were
closed. The backend stores the number without validating it, so this regex was
the only gate.

This is the most serious defect in the report. Everything else costs a landlord
confidence or a re-entry; this one means the rent they have collected cannot
leave the platform. It was invisible to the second pass because the field
renders perfectly — you only see it if you type a real number and press the
button.

Fixed by declaring the pattern once, `/^0[2-9]\d{8}$/`, above both call sites.
Verified live: the number now saves, and `wallets.linked_momo_number` reads
`0244778899 | MTN`. Pinned by 15 assertions in
`src/__tests__/wallet/momoNumber.test.ts`, including the nine-digit case —
a test written with a nine-digit fixture would have passed against the bug.

### F-25 🟠 A recorded utility bill is not shown until the page is reloaded

`POST /utilities/bills` returns **201**, the dialog closes, and the table
underneath still reads "No bills recorded yet — 0–0 of 0". The bill is really
there; a manual reload shows it.

`BillsTable` loads once per meter (`useCallback(..., [meter.id])`) and
`UtilitiesView`'s `onCreated` only closed the dialog. Nothing told the table.

The cost is not the missing row, it is what the landlord does next: told the
bill did not save, they record it again. `RecordTokenDialog` had the identical
wiring, so prepaid tokens duplicated the same way.

Fixed with a `refreshKey` the parent bumps on create, threaded into both tables'
load dependencies. Verified live: a second bill appeared immediately, no reload.

### F-26 🟡 A new rent review calls its tenant "Vacant"

Creating a review against an occupied unit renders **Occupant: Vacant**.

`POST /rent-reviews` resolves and stores `occupantId` correctly, then returns
`occupantName`, `occupantPhone` and `occupantEmail` as `null` —
`RentReviewServiceImpl:118` passed a literal `null` where the mapper expects the
occupant. The list endpoint enriches properly, so the row is right after a
reload; only the response the table renders first was wrong.

The three null fields are the same three the notify step reads, which is why
this was worth fixing rather than leaving as cosmetic: the workflow is
propose → **notify** → apply. Verified live: the tenant's name now appears the
moment the review is created.

### What this pass got wrong

Recorded because the same mistakes will otherwise recur:

- **A blank field is not a blank field.** Two "findings" from the second pass
  were text-extraction artefacts: the email templates (withdrawn above) and the
  Invite Staff dialog, which pre-fills Company Name with the tenant's name.
  The tool used reads rendered text, not `input.value`.
- **A dialog that seems to have closed may not have.** Preventative Schedules
  looked like a silent failure. It was a validation alert inside a dialog that
  had stayed open — invisible because the page text was read from `<main>` and
  the dialog is a portal.
- **Driving React through injected JavaScript manufactures bugs.** A
  programmatic click on the property dropdown left the unit dropdown empty and
  looked like a real defect. Repeating it with genuine clicks showed the unit
  listed. Every finding here was re-confirmed through the real UI before being
  written down.

The lesson is the first report's, arriving again from a new direction:
**treating absence of output as evidence.** Three of the four false alarms above
were an empty reading from a tool that could not have shown the value.

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

It kept holding across both passes, which is why it is worth stating as a rule
rather than a tally. Later instances: the property valuation the form collected
and dropped (F-06); the exact room counts rewritten to "6+" (F-07); the
`unitStatus` the API knew and the card never asked for (F-02); the Units
Overview counts recomputed from one page of rows when a portfolio-wide endpoint
already existed (F-20); the company name typed at signup and asked for again
(F-22); the rent review that stored an `occupantId` and then returned null for
the name (F-26). **Before deriving a number, check whether something upstream
already knows it.**

A second pattern earned its place over the later passes: **a catch broad enough
to be useful is broad enough to swallow something that mattered.** The wallet
swallowed the MoMo refusal, the downgrade card swallowed the server's 409, the
document delete swallowed its own storage cleanup, `/listings` swallowed Next's
dynamic-rendering signal, and `handleError` swallowed the entire generic error
branch — that last one leaking internal messages into production for as long as
it stood. Four of the five printed nothing at all. **When you write a catch, say
out loud what it is allowed to eat.**

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
to rethrow it. Fixed on 2026-08-14 — see [the `/listings` build
warning](#the-listings-build-warning--2026-08-14). It was never one of the
numbered nineteen, and was the last item in this report to be closed.

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

