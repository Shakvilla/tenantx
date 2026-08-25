# Landlord Field Test — Verification & Remediation Tracker

**Source report:** [`2026-08-22-landlord-field-test.md`](./2026-08-22-landlord-field-test.md)
**Opened:** 2026-08-23

Every factual claim in the report — the 19 `BROKEN` and 17 `MISSING` findings — is
re-verified here from **both sides** before any fix is written: reproduced in the running
app, and traced to the code that causes it. The reporter's severity is his opinion and is
recorded as *claimed*; the severity we act on is set after verification.

The other 51 findings (`FRICTION`, `KEPT`) are judgement rather than fact. They are not
tracked here — they need a product decision, not a verification.

## Why both sides

Reproducing in the UI without finding the cause gives a symptom nobody can fix. Reading the
code without reproducing gives a theory. This report has already produced one confidently
argued Critical that turned out to be a fault in the test harness (see the withdrawn table
in the report), which is the whole argument for not proceeding on anyone's word.

## Status vocabulary

| Status | Meaning |
|---|---|
| `UNVERIFIED` | Not yet examined. |
| `CONFIRMED` | Reproduced in the UI **and** located in the code. Ready to fix. |
| `PARTIAL` | Something real is here, but not what was claimed. The row is rewritten to what is actually true. |
| `REJECTED` | Does not reproduce, or the cause is environmental/harness. Kept with the reason — never deleted. |
| `DECISION` | Real, but the fix is a product call rather than a defect. Needs an owner's answer. |
| `FIXED` | Fix merged, with the verifying commit named. |

## Verification standard

A row may only leave `UNVERIFIED` when it carries:

1. **UI evidence** — the exact screen, the action performed, and what was observed. Pressed,
   not looked at.
2. **Code evidence** — `file:line` for the cause, not for a plausible-looking neighbour.
3. **A stated scope** — does this affect production, or only this test deployment?

Absence of a grep hit is not evidence. Read the method.

---

## A. BROKEN — 19 claims

| ID | Claimed sev | Claim | UI verdict | Code verdict | Real sev | Status | Fix |
|---|---|---|---|---|---|---|---|
| B1 | Critical | Rent entered as USD $800 silently saved as GHS 800; wrong figure spread to vacancy, forecast, P&L | **Claim disproved, worse problem found.** DB holds `Main House / 800.0000 / USD` — the currency saved correctly. But Settings → Currency invites the landlord to set a USD→GHS rate (defaults to 15) and that rate is applied nowhere. | `CashFlowServiceImpl.java:122-129` sums `unit.getRent()` with no reference to `unit.getCurrency()`. `utils/currency.ts` exports `toGhs()` and `formatDual()` — **zero call sites in the entire frontend**. | Critical | `PARTIAL` | |
| B2 | Critical | 24-month advance shown as "TOTAL EARNED — lifetime income received"; P&L reports 97.71% net margin | **Reproduced.** Wallet shows `TOTAL EARNED — GH₵14,800.00 — Lifetime income received`. ₵14,400 of that is Akosua's 24-month advance (DB: `advance_rents` = **0 rows**; it is only a free-text invoice). | `wallets.total_earned` is credited from payments with no notion of the period the money covers. Nothing in the schema can express "received but not yet earned". | Critical | `FIXED` |  966689e + d792a0a |
| B3 | Critical | Earnings report headline tiles ignore the date filter (Jan 2026 shows current figures); P&L tab filters correctly | **Reproduced exactly.** Set Custom range 2026-01-01→2026-01-31, pressed Apply. Charts switched to "No data available"; the four tiles still read ₵15,600 / ₵14,400 / ₵800 / ₵5,200. | `EarningsReport.tsx:69` — `Promise.all([getInvoiceStats(), getInvoices({startDate, endDate})])`. Tiles read the **unfiltered** stats call; charts read the filtered one. Backend `InvoiceRepository.statsForTenant` takes only `tenantId` — it has no date parameters to pass. | Critical | `FIXED` |  733f896 + frontend |
| B4 | Critical | Four screens report ₵14,400 collected, Wallet reports ₵14,800; a ₵400 cash part-payment is dropped; GRA tax computed on the wrong figure | **Reproduced.** DB truth: payments = ₵14,400 + ₵400 = **₵14,800**. Wallet ledger agrees (₵14,800). Dashboard tile says ₵14.40K. Earnings tiles contradict themselves on screen: Total ₵15,600 − Outstanding ₵800 = ₵14,800, printed as **Paid Revenue ₵14,400**. | `InvoiceRepository.java:86` — `sum(amount) FILTER (WHERE status = 'PAID')`. **Revenue collected is derived from invoice status, not from payments**, so a PARTIAL invoice contributes ₵0 however much was paid against it. `sumPaidAmountByTenantIdAndIssuedDateBetween` (line 97) repeats the pattern for the P&L. | Critical | `FIXED` |  966689e |
| B5 | Critical | Cash Flow says "0 units on advance rent" and forecasts ₵7,200 that will never arrive | **Reproduced verbatim.** Footer: *"0 units on advance rent · 1 unit paying monthly · 8 vacant units"*. Monthly Breakdown shows Advance Renewals ₵0.00 for all 12 months and Regular Rent ₵600.00 × 12 = **₵7,200.00** — from a tenant paid to 2028. | `CashFlowServiceImpl` reads `advance_rents`, which has 0 rows. **Symptom of M1, not an independent defect** — the report is correct and the forecast is genuinely wrong, but the cause is that the advance was never recorded through the feature that exists. Fixing M1 fixes this. | High | `FIXED` | cefc581 (via M1) |
| B6 | Critical | Cannot buy a subscription: MoMo says gateway not configured, bank-transfer details box is empty | **Both halves confirmed.** `gateway_configs` has **no `SUBSCRIPTION`-purpose row** on the clean stack *or* on the ordinary dev stack (which holds only `REDDE / RENT`). `platform_settings` shows `manual_payment.enabled = **false**` with `bank_name`, `account_name`, `account_number`, `branch` all empty strings. | `SubscriptionPlansListTable.tsx:353` renders "Transfer {amount} using the details below" **unconditionally**, while the details card is guarded by `{manualDetails && ...}` and each row filtered on a truthy value. So a disabled, unconfigured method is still offered and then instructed. | Critical | `FIXED` |  af8d4a4 (code half; gateway still unconfigured) |
| B7 | High | "Onboard a Tenant" opens once then never again; property selection doesn't stick; X won't close the dialog | **Does not reproduce on the clean path.** Live test on `/occupants`: press → dialog opens; X → closes; press again → opens; press again → stays open. Repeatable. | **Mechanism found for his exact state.** `OnboardTenantWizard.tsx:78-85` — `requestClose()` returns early via `setConfirmClose(true)` **without** `setOpen(false)` once `entityIds.occupantId` exists and the wizard is not completed. `openWizard` only calls `setOpen(true)`, so with `open` already true **every further press of the launcher is a silent no-op**. He had created an occupant, so he was in exactly that branch. The X is not dead — it raises a "Leave onboarding?" confirm (line 163) whose **Leave** button is the only exit; Escape closes that confirm and returns to the wizard, which can loop. | Medium | `FIXED` | `f2a395a` — the launcher no longer reset()s an in-progress run, which was both the silent no-op and the lost occupant; proven by reverting and watching the test fail |
| B8 | High | 15-minute session; refresh refused as device mismatch revokes the whole session with nothing on screen | **Confirmed from the server.** Login response carries `expiresIn: 900` (15 min). The log for the reporter's session shows `SECURITY_EVENT: action=REFRESH_TOKEN_DEVICE_MISMATCH, family=…, result=FAMILY_REVOKED`, immediately after `JWT expired`. Nothing was shown to him; the page kept its furniture and swallowed clicks. | A refresh that fails device matching revokes the entire token family. Correct as a security control; the defect is that the client has no handler that tells the user they have been signed out. | High | `CONFIRMED` | |
| B9 | High | Raw "Request failed with status code 401" shown to the user on the login page | **Does not reproduce.** Logged in with a deliberately wrong password: the page showed **"Invalid credentials"**, the backend's own wording. Backend 401 bodies carry a top-level `message` (verified by curl on `/auth/refresh`: `"Refresh token is invalid"`). | `auth-client.ts:143` does use the raw `error.message`, but it receives an error already normalised by `client.ts:255` — `throw new Error(getErrorMessage(error))`. `getErrorMessage` (client.ts:203) reads `data.error.message || data.message` first. **Residual, real:** its final fallback is `error.message`, so any **bodyless** failure — network drop, server unreachable, blocked request — still shows the raw axios sentence. Common on mobile data. | Medium | `FIXED` | c93819b |
| B10 | High | Maintenance "Actual Cost: GHS 330" never reaches Expenses or the dashboard | **Confirmed.** DB: `maintenance_requests.actual_cost = 330.00`; `expenses` holds exactly one row, "Plumbing repairs / 330.00" — the one the reporter retyped by hand. The two are unconnected. | The **entire maintenance module contains no reference to `Expense`** — grep across `modules/maintenance` returns nothing. No code path creates an expense from a repair. Compounded by M10: `expenses` has no `maintenance_request_id` column, so the link cannot be stored even if someone wrote it. | High | `FIXED` |  4eca43b |
| B11 | High | Menu items, table links and buttons routinely need two presses, with no feedback on the first | **Cannot be settled with this harness — deliberately not judged.** The browser pane used for verification collapsed to a 0×0 viewport four times in this session, which sends clicks outside the page and produces this exact symptom. That is the same fault that generated the reporter's withdrawn login finding. Clicking by DOM node (bypassing coordinates) worked every time. | No mechanism found in code: navigation uses ordinary `next/link` anchors and MUI buttons. | **Reduced, and confirmed as a real defect.** Re-tested in a real browser at 1280x900: one press navigates. What is absent is any acknowledgement — the App Router gives no pending state for `<Link>` on Next 15.1 (`useLinkStatus` is 15.3+), the pressed item does not change, and `NavbarContent.tsx:74` wired the `LinearProgress` to token refresh only. Press, then silence, so the user presses again. | `FIXED` | `ecf1ae3` — `useRouteChangePending` drives the existing navbar bar during route changes, in both layouts; browser-verified via MutationObserver |
| B12 | High | Payment receipt / invoice print produces nothing — no window, no download | **Confirmed, and the server is innocent.** `GET /api/v1/payments/{id}/receipt` returns **200**, `text/html;charset=UTF-8`, 3,570 bytes of a rendered receipt. The document exists and is correct. | `lib/api/payments.ts` — `openPaymentReceipt()` does `await apiClient.get(...)` and *then* calls `window.open()`. Once an `await` separates the call from the click, browsers no longer treat it as a user gesture and **block the popup silently**. Nothing is shown because nothing is allowed to open. | High | `FIXED` |  07a17c2 |
| B13 | High | Counters disagree with the rows beneath them: "Overdue 0" for a 7-week-old bill; Maintenance Total 0/Open 0 with a visible row | **Confirmed as a staleness bug, not a wrong-number bug.** On a freshly loaded page the tiles are *correct* (Overdue Invoices **1**, matching INV-2026-003). The defect only appears after creating data while the page is already open — which is what the reporter did. | `BillingStatsCard.tsx:112` — `useEffect(() => { getInvoiceStats()... }, [])`. Empty dependency array: **fetched once on mount, never again**, with no dependency on the invoice list and no refresh path. Only a remount updates it, exactly as reported. `.catch(() => {})` on line 115 also discards errors silently. | High | `FIXED` |  07a17c2 |
| B14 | High | Collapsing the sidebar makes every sub-page unreachable; recoverable only from the Dashboard | **Confirmed in code, and it matches his account precisely.** | `Navigation.tsx:151` — `{!(isCollapsed && !isHovered) && (<NavCollapseIcons onClick={…toggle…} />)}`. **While collapsed and not hovered, the control that un-collapses the menu is not rendered at all.** The only way back is to hover the icon strip and hope the icon appears — which is what he eventually found. Sub-menu items also become hover-dependent when collapsed, so the "sub-pages unreachable" half follows from the same design. Unusable on touch. | High | `FIXED` |  b351e52 |
| B15 | Medium | Escape inside a dialog dropdown closes the whole form and discards input, no warning | **Claim disproved; a real residue remains.** Live test on Add Occupant: typed a value, opened a Select (7 options), pressed Escape once → **only the dropdown closed** (7 → 0 options), the dialog stayed open and the typed text survived intact. Correct behaviour. A **second** Escape then closed the whole dialog, discarding the part-filled form, with `warningShown: false`. | So it takes two presses, not one — but a part-filled form is still discarded silently. Note the inconsistency: `OnboardTenantWizard` *does* confirm before discarding ("Leave onboarding?"), `AddOccupantDialog` does not. | Medium | `FIXED` | `31f6b4c` — closing a dirty Add Occupant form now asks first, matching the onboarding wizard; all three close paths share the handler |
| B16 | Medium | Page intermittently renders at half size in the top-left, or slides down leaving a grey band | **Attributed to the test harness, not the product — but not provable either way.** I hit an identical symptom repeatedly: the verification browser pane collapsing to a 0×0 viewport, after which content renders at the wrong size and clicks land off-target. It recovered on `resize_window`, exactly as he reported ("only a window resize fixes it"). | No layout code was found that would size a page to half the window. | **Did not reproduce.** Re-tested in a real browser at 1280x900 across dashboard, properties, reports, subscription, utilities and documents: full-width render every time, no grey band. The original report came from the agent harness collapsing the browser pane to a near-zero viewport, which also put the app into its mobile layout with the nav drawer off-canvas. | `REJECTED` | no change — harness artefact, re-test complete |
| B17 | Medium | Setup wizard claims property, occupant and first invoice are ready after all three were skipped | **Confirmed.** | `CompletionScreen.tsx:22-24` — the sentence *"Your property, occupant, and first invoice are ready. Your tenant will receive a notification."* is **hardcoded with no conditionals** on what was actually created, and no check that any notification was sent. (The *other* completion screen, `OnboardCompletionScreen`, is accurate and specific — the reporter praised it. Two screens, one honest.) | Medium | `FIXED` |  156dfab |
| B18 | Medium | Dashboard shows Total Properties 0 while the Properties page shows 1 | **Confirmed as staleness.** The dashboard is correct on a fresh load today (Total Properties 2). The defect appears only in the window right after creating a property. | `CacheConfig.java:71` — `DASHBOARD_STATS_CACHE`, `expireAfterWrite(60s)`, keyed by tenant, and **no `@CacheEvict` exists for it anywhere**. Creating a property does not invalidate it. Its own comment calls the data "entirely tolerant of a minute's staleness" — untrue for the one minute that matters, when a new landlord checks whether their first property saved. Same family as B13. | Medium | `FIXED` |  07654b6 |
| B19 | Low | Failed purchase leaves a PENDING ₵135.00 UPGRADE row for a plan not held; its Verify button does nothing | **Confirmed at data level.** `subscription_invoices` holds exactly one row: `UPGRADE / 9 units / ₵15.00 per unit / ₵135.00 / **PENDING** / payment_method **MANUAL**`, created at the moment of his failed purchase, target plan Basic — while the tenant is on Pro. Never cleaned up. | Compounds B6: the invoice was written with `payment_method = MANUAL`, a method `platform_settings` has **disabled**. A failed purchase leaves a payable-looking bill for a plan the tenant does not hold. Verify-button behaviour not separately tested. | Medium | `FIXED` | `fda0419` (backend) — a MANUAL upgrade is refused when manual payment is switched off, so the orphaned PENDING invoice cannot be created; abandoned PENDING rows are now findable |

## B. MISSING — 17 claims

| ID | Claimed sev | Claim | UI verdict | Code verdict | Real sev | Status | Fix |
|---|---|---|---|---|---|---|---|
| M1 | Critical | No rent-advance concept anywhere; had to fake it via free-text Invoice Type | **Claim disproved.** The occupant's **Home Details** tab carries a dedicated *Advance Rent* section: "Upfront rent payments covering future periods — invoices and wallet credit auto-applied", with **Record Advance** / **Record First Advance** buttons. It read "No advance rent recorded yet." | `HomeDetailsTab.tsx:191` renders `AdvanceRentSection`; `AddAdvanceRentDrawer` and `advanceRentsApi` are fully wired, and the backend `advance_rents` table and module exist. Nothing is missing. | High | `FIXED` |  cefc581 |
| M2 | Critical | Nothing distinguishes money collected from money earned; no "unearned advance held" anywhere | **Confirmed.** No screen and no column expresses it: `wallets` has `balance` and `total_earned` and nothing else. The only "earned" figure in the product counts money the landlord still owes back. | Same root as B2 — the data model has no concept of a period a payment covers. | Critical | `FIXED` |  51b3c0e + d792a0a |
| M3 | Critical | Caution fee is a number on a lease only — never a balance, never a liability | **Claim disproved.** Same tab carries a *Caution Fee* section — "Security deposit collected at start of tenancy", with **Record Fee** / **Record Caution Fee**. It read "No caution fee recorded yet." | `caution_fees` and `caution_fee_deductions` tables exist with forfeiture logic, and a `CautionFeeSection` renders on the same tab. Built and reachable. | High | `FIXED` | c9fc85a |
| M4 | High | No cost or labour field on a maintenance request; a plumber's fee must be entered as a "part" | **Confirmed.** The reporter's ₵330 is recorded as parts, and `actual_cost` matches. | `MaintenanceRequestServiceImpl.java:481` — `req.setActualCost(currentActual.add(totalPartCost))`. **`actualCost` is derived from parts and nothing else**; it is never set from any other input. A case-insensitive grep for `labour`/`labor` across the maintenance module returns **zero hits**. Entering a man as a part is the only route the code offers. | High | `FIXED` |  4eca43b + c7050ad |
| M5 | High | Tenant email is compulsory | **Frontend fixed (77198cc) and live-verified — but the backend still refuses.** Ran the wizard with a blank email: Continue enabled, form submitted, and the API returned **"Email is required"**. | **My earlier code verdict was incomplete and is corrected here.** `CreateOccupantRequest` does only validate format — but `OccupantServiceImpl:155` provisions a **login account** for every occupant, and `GlobalUser.email` is `@NotBlank`. In the database `global_users.email` is **NOT NULL with a UNIQUE constraint**. So the requirement is real and comes from identity, not from the occupant record. Note `resolveOrCreateGlobalUser` already resolves by **email OR phone**, and `phone_number` already has a partial unique index `WHERE phone_number IS NOT NULL` — the pattern for a nullable unique identity exists in this very table. | High | `FIXED` | 77198cc + 26cca2d (V159, V160) |
| M6 | High | Vacant-unit count appears in four places, never with a cedi cost | **Confirmed.** Dashboard: "Vacant Units — 8 — Total number of vacant units". Cash Flow: "Vacant Units 8 / Total Units 9" and footer "· 8 vacant units". No money on any of them. | The figure is a count only; no aggregate of vacant units' rent is computed anywhere. Note the sum would currently be wrong anyway while B1 stands — the East Legon unit is USD. | High | `CONFIRMED` | after B1 |
| M7 | High | Unit types lack Single Room / Chamber and Hall / Self-contained | **Confirmed against the live API.** `GET /reference/unit-types` returns exactly: Studio, 1 Bedroom, 2 Bedrooms, 3 Bedrooms, 4+ Bedrooms, Commercial, Office, Retail. None of the three commonest Ghanaian unit types is present. | Server-side reference data, so the fix is a backend list — **but see V4**: one of the two Add Unit dialogs hardcodes the same options and would not pick the change up. | High | `FIXED` |  1f6bb2b + 156dfab |
| M8 | Medium | Report date filter has no calendar-month option ("this month", "August vs last August") | **Confirmed.** Options enumerated from the live dropdown: Last 7 days, Last 30 days, Last 3 months, Last 6 months, Last year, All time, Custom range. No calendar month. | — | Medium | `FIXED` |  b351e52 |
| M9 | Medium | P&L cannot break down by property, though the GRA report can | **Confirmed.** | `ProfitLossReport.tsx` contains **no reference to property** at all — no grouping, no filter, no column. Case-insensitive search for `property`/`byProperty`/`groupBy` returns nothing. | Medium | `FIXED` | `fda0419` — property filter threaded through the P&L API, service and report screen (shown when the landlord has more than one property) |
| M10 | Medium | No field on either side to link a maintenance request to its expense | **Confirmed at schema level.** `expenses` columns: id, tenant_id, item, expense_config_id, property_id, unit_id, date, amount, currency, responsibility, status, description, image_url, image_file_id. **No maintenance_request_id.** | The link cannot be made because there is nowhere to store it. | Medium | `FIXED` |  4eca43b (V161) |
| M11 | Medium | Maintenance Category and Expense Item are required with empty lists, and neither form says where the list is built | **Main claim disproved.** Choosing "Other (type manually)" **does** reveal a field: `AddExpenseDrawer.tsx:302` renders an `Expense Name *` TextField gated on `showManualItem`. There is somewhere to type. | **Residual, real:** the dropdowns are required and arrive **empty** for a new tenant, and nothing on either form says the list is populated on the Expense Config / Maintenance Categories pages. The empty state gives no route forward. | Medium | `FIXED` | `7b43433` — both empty dropdowns now name the page that builds the list, link to it, and say what to do meanwhile |
| M12 | Medium | Property types lack Compound House | **Confirmed against the live API.** `GET /reference/property-types` returns exactly: House, Apartment, Residential, Commercial, Mixed Use. The commonest rented building in Ghana is absent. | Same backend reference source as M7. | Medium | `FIXED` |  1f6bb2b |
| M13 | Medium | Document types lack Ghana Card / national ID | **Confirmed.** `AddDocumentDialog.tsx:51-54` — Signed Tenancy Agreement, Lease Agreement, Contract, Receipt, Employment Letter, Business Registration, Reference, Other. No identity document. | ⚠️ **May be deliberate.** The taxonomy was cut from 12 types to 8 in earlier work, with identity types removed on purpose. Needs an owner's ruling rather than a straight fix — reinstating it may re-open whatever data-protection reasoning removed it. The file's own header also warns that this list and the backend's validated list are maintained separately and can drift. | Medium | `DECISION` | |
| M14 | Medium | Occupant → Documentation tab has no upload control | **Confirmed.** | `DocumentationTab.tsx` renders "No documents available" (line 81) and `IconButton`s only for rows that already exist (116-123). There is **no upload Button anywhere in the component**. Upload exists solely in the top-level Documents section. | Medium | `FIXED` |  b351e52 |
| M15 | Medium | No route for a tenant to report a fault, though the page is subtitled "requests from tenants" | **Claim disproved.** A complete occupant-facing surface exists: `MyMaintenanceController` ("The occupant's own maintenance requests") and `MaintenanceCategoryController:43` granting `OCCUPANT` authority, consumed by the occupant mobile app. Tenants can report faults. | **Residual, real:** the landlord portal offers **no way to invite a tenant into the app** — a search across `views/occupants` for invite/app-access/activate returns nothing. So the loop exists and the landlord cannot start it, which is why the page's subtitle reads as a lie. | Medium | `FIXED` | `59df361` — occupant record carries a Tenant app access card (identifier + WhatsApp message) and the maintenance subtitle no longer over-promises. **Send-an-invite endpoint deliberately NOT built** — needs a channel and SMS-cost decision |
| M16 | Medium | Agreement has no witness, signature or stamp, yet declares itself "legally binding and enforceable" | **Claim disproved in part.** `agreements` has `witness_name` and `signed_date` columns; `AddAgreementDialog.tsx:84` collects a witness and `ViewAgreementDialog.tsx:369` displays one. **But** the onboarding-created `AGR-2026-001` has `witness_name` empty and `signed_date` empty, and `documents` = 0 rows — nothing signed is attached. | Same shape as M1/M3: the capability exists and the onboarding path does not use it. The residual defect is real and narrower — the screen asserts "legally binding and enforceable" **regardless of whether witness, signature or attached document are present**. | Medium | `FIXED` | `50060ce` — the enforceability claim is now conditional on signature, witness and attached copy; where they are missing it says so and offers Complete it. Stamp duty was already handled |
| M17 | Low | Units must be added one at a time; the form forgets property/type/rent between each | **Confirmed.** | `view/AddUnitDialog.tsx:105-118` — on every open for a new unit the form is reset to blank defaults (`unitNo: ''`, `type: '1br'`, `rent: ''`). No bulk-add path exists. Eight rooms means retyping type and rent eight times. | Low | `FIXED` | `171df55` — "Add another room" keeps the dialog open, carries type/rent/size forward, clears and focuses the unit number; browser-verified on the Adenta compound |

### B1 — restated

The reporter said the value was saved wrongly. It was not. What is actually true is worse,
because it is systemic rather than a single bad row:

1. A unit's `currency` is stored correctly (`USD` verified in the database).
2. **Settings → Currency** lets a landlord set a USD→GHS rate, defaulting to 15.
3. `toGhs()` and `formatDual()` exist to apply that rate and **are called from nowhere**.
4. Every aggregate therefore adds a USD rent to a GHS rent as if they were the same unit of
   account. `$800` is counted as `₵800`.

So the product sells multi-currency, collects an exchange rate from the user, and then does
its arithmetic as though every figure were cedis. The reporter's downstream observation —
that his vacancy total, forecast and P&L were all wrong — was right; only his explanation
was wrong. His own manual total of ₵5,500/month against a true ~₵16,700 is the size of it on
a two-property portfolio.

**Fix is not one line.** Either apply the configured rate at every aggregation point and
label the result, or drop multi-currency and the settings screen with it. The second is
defensible; what is not defensible is offering a rate that does nothing.

**Where the fix now lives — owner's decision, 2026-08-23.** The exchange rate is not a
landlord's setting at all; it is a platform fact. Two landlords setting different rates make
their reports incomparable, and nothing stops one setting 100 and inflating his own
portfolio. So B1's remedy is **not** to wire up the landlord-facing rate field. It is:

1. The USD→GHS rate becomes **platform configuration**, owned by admin (see V2b).
2. Every aggregation applies it and labels the result, or multi-currency is withdrawn
   outright — still a live choice, but now made once for the platform rather than per
   tenant.

The landlord-facing currency card is retired along with the rest of V2b, so the "set a rate
that does nothing" problem disappears with it rather than being fixed in place.

**Sequencing.** B1 is now blocked on the V2b move and should be scheduled with the platform
admin work, not ahead of it. What is *not* blocked, and must be fixed on the landlord side
now, is **V2a** — the late-fee card is stranded on the same orphaned page, and it is a paid
feature a landlord cannot switch on.

### M1 and M3 — restated: not missing, undiscoverable

Both features exist, are fully built, and sit two clicks from where the landlord was working.
He never found either, and neither did the onboarding flow route him to them.

What actually happens today, verified end to end:

- Tenant onboarding collects a **"Security deposit"** and writes it to
  `agreements.security_deposit`. The dedicated `caution_fees` ledger stays empty.
- Onboarding has **no advance-rent step at all**, so a landlord recording a two-year advance
  has nowhere obvious to put it and reaches for an invoice, as this one did.
- Both real controls live on the occupant's **"Home Details"** tab — a name that gives no
  hint that money is recorded there.
- The same tab then shows a **"Security Deposit"** field *and* a separate **"Caution Fee"**
  section. Two places for one sum, and the wizard fills the one that is not the ledger.

So the severity drops from Critical to **High**, and the nature changes completely: this is
information architecture, not engineering. The fix is to route onboarding into the features
that already exist — far cheaper than what the report implied, and it removes the cause of
**B5** (the forecast reads `advance_rents`, which is empty *because nobody was ever sent
there*) and much of **B2**.

**This is the clearest argument in the whole exercise for verifying before building.** Taken
at face value, M1 and M3 would have commissioned two features that are already written,
tested and shipped.

### The pattern behind M1, M3, M5 and M16

Four separate findings turn out to be one problem wearing different clothes.

| Finding | What exists | What onboarding does instead |
|---|---|---|
| M1 | `advance_rents` + a Record Advance UI | No advance step; landlord reaches for an invoice |
| M3 | `caution_fees` ledger with forfeiture | Writes a number to `agreements.security_deposit` |
| M16 | `witness_name`, `signed_date`, document attachment | Leaves all three empty, still claims "legally binding" |
| M5 | Backend accepts an occupant with no email | Frontend invents a mandatory email field |

**The onboarding wizard creates a shallow record and skips the richer features already built
behind it.** It is the shortest path through the product and it teaches the landlord that the
product cannot do things it can.

This is the highest-leverage conclusion in the exercise. One piece of work — make onboarding
route into the features that exist — closes M1, M3, M16, most of M5, all of B5, and much of
B2. None of it requires building a new capability.

## C. Raised during verification, not by the reporter

| ID | Sev | Finding | Evidence | Status | Fix |
|---|---|---|---|---|---|
| V1 | — | Every plan's price subtracts the **FREE** plan's `freeUnitCap`, so the first 5 units are free on Basic and Pro too. A landlord with ≤5 units on Pro is billed **₵0.00/month** with no minimum-charge guard. 14 units on Basic = 9 × ₵15 = ₵135, which is why that quote looked wrong. | `SubscriptionBillingServiceImpl.java:186-197` — `billableUnits = max(0, totalUnits − FREE.freeUnitCap)`, then `monthlyAmount = pricePerUnit × billableUnits` with no floor | `DECISION` | |
| V2 | High | **`/settings/payment` has no link anywhere in the UI.** Reached only by typing the URL. The Settings menu lists six children; seven settings pages exist on disk. | `verticalMenuData.tsx:185-190` lists notification, sms, company, recurring-invoice, security, team — `payment` is absent. `app/(dashboard)/settings/payment/page.tsx` exists and renders. Verified in the browser by the product owner: the page only appears when its URL is typed by hand. | High | `FIXED` | `100a268` — Payment Settings added to the Settings menu (badged Basic, the tier that carries LATE_FEES). A test now compares the settings routes on disk against the menu, so the next orphaned page fails in CI |
| V2a | High | **Late-fee configuration is unreachable.** It lives on the orphaned payment-settings page. Late fees are a *paid* feature, so a landlord on Basic or Pro cannot switch on something he is paying for. | `PaymentSettingsContent.tsx:24` renders `LateFeeSettings`; that page has no navigation entry (V2). | High | `FIXED` | `100a268` — reachable via V2; late-fee configuration is no longer URL-only |
| V5 | High | **"Collected this month" is attributed by invoice issue date, not by payment date.** Akosua's ₵400 was received on 23 Aug against an invoice issued 1 Sep, so the dashboard tile labelled *"Total amount collected this month"* excludes money genuinely collected this month. Found while verifying the B4 fix — the reporter mistook this for the same bug. | `DashboardSummaryServiceImpl.java:54-59` derives `paidThisMonth` from `monthlyTrend`, which groups by `issued_date`. `InvoiceRepository:114` admits the constraint: *"Invoice has no paidAt"*. Correct fix needs attribution by `payment_transactions.payment_date`. | High | `FIXED` |  e9787c8 |
| V4 | Medium | **Two Add Unit dialogs, two sources of truth for unit type.** `views/properties/view/AddUnitDialog.tsx:289` renders `ref.unitTypes` from the API; `views/properties/AddUnitDialog.tsx:470` hardcodes `studio / 1br / 2br / 3br / 4br+ / commercial / office / retail`. Fixing M7 in reference data changes one form and silently leaves the other wrong. | Both files read directly. | Medium | `FIXED` |  156dfab |
| V3 | Medium | **The plans page never shows what the landlord will actually pay.** It headlines "GH₵ 30.00 / unit / month" and "Units used 9 / ∞", but the free-5 rule means the real charge is 4 × ₵30 = ₵120, not 9 × ₵30 = ₵270. Nothing on the screen explains the difference. | Live UI at `/subscription-plans`; arithmetic per `SubscriptionBillingServiceImpl.java:186`. Related to V1. | Medium | `FIXED` | `dbfe633` — both the current-plan card and each plan card state the real monthly charge with the subtraction shown; a test asserts ₵270 never appears |
| V2b | — | **Currency and tax settings are on the wrong portal.** Exchange rate, allowed currencies, decimal places, symbol position, statutory tax rates and VAT are platform-wide facts, not per-landlord preferences. Owner's decision, 2026-08-23: move to platform admin. | `CurrencySettings.tsx:120-179`, `TaxSettings.tsx:99-155`. Precedent already in `PaymentSettingsContent.tsx:2-3`: gateway and payment-method cards were moved out as "platform admin-only" with a `TODO: re-add to System Admin panel` that was never done. | — | `DEFERRED` | admin-portal test |

---

## Environment used for verification

- Clean-room stack, isolated from the app database: Postgres `ft-db` (`:55433`), backend
  `ft-api` (`:8098`), frontend `:3098` from `origin/master` (`7c3eb3a`).
- Carries the reporter's own data — two properties, 9 units, Akosua Boateng's tenancy,
  the ₵14,400 advance, the ₵400 cash part-payment, the closed maintenance job.
- Backend image predates migrations V159–V161. Anything touching those is re-checked
  against source rather than against this deployment.
