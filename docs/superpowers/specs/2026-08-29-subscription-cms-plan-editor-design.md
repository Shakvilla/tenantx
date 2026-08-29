# Design: Subscription CMS — the plan editor UI

**Date:** 2026-08-29
**Status:** Design approved. Ready to plan.
**Slice:** B of four.
**Depends on:** slice A (`tenantx-backend` PR #38, merged to master) — the tier-aware plan API.
**Parent:** `TenantX-backend/docs/superpowers/specs/2026-08-20-subscription-pricing-design.md` §8.

---

## 1. Why this exists

Slice A made plans configurable — tier tables, pricing modes, cycles, limits, status, features — and nothing can reach it. The platform-admin console still carries `EditPlanDialog`, which posts the legacy `pricePerUnit` body that slice A deleted, so it now returns 400. Until this slice ships, plan editing is API-only and the console's plan screen is a broken control.

That is the immediate cost. The larger one is that the CMS's whole promise — *change pricing without a deploy* — is unrealised while the only way to exercise it is curl.

## 2. Scope

**In:** the plans list, the plan editor page, duplicate-plan.

**Out:** signup and trial settings (slice C), the audit-log screen (slice D), and choosing the actual prices (parent spec phase 4, awaiting stakeholder consultation).

---

## 3. Routes and file structure

```
/admin/subscriptions              plans list (reworked)
/admin/subscriptions/plans/new    editor, create mode
/admin/subscriptions/plans/[id]   editor, edit mode
```

A dedicated route rather than a dialog, for three reasons: the tier table needs to sit beside a live price curve; a DRAFT plan must be reachable by the id in its own `201` response; and the 409 impact needs to render as a real confirmation rather than a dialog nested inside a dialog.

`AdminSubscriptionsView.tsx` is 988 lines doing two unrelated jobs. The plan half moves to the new pages and **`EditPlanDialog` is deleted** — it writes a body the server no longer accepts, and leaving a control that always fails is worse than removing it. What remains is the tenant-subscriptions table.

New components, one job each:

| Component | Responsibility |
|---|---|
| `PlanList` | status, subscriber count, entry price, Duplicate |
| `PlanEditorForm` | orchestrates the sections, owns save and the handshake |
| `TierTableEditor` | bands, derived lower bounds, add/remove |
| `PriceCurve` | fetches and renders the curve, surfaces a rising cost |
| `FeatureMatrix` | checkboxes over writable feature keys |
| `CycleEditor` | MONTHLY / QUARTERLY / ANNUAL, discount, enabled |
| `ImpactDialog` | renders the 409 impact, replays with the hash |

---

## 4. The tier table editor

**The admin edits only each band's upper bound and its prices.** Every band's lower bound is derived as the previous band's upper + 1. The last band is always open-ended and renders "and above" instead of an input.

- **Add** splits the last band: the current open-ended band gains an upper bound, and a new open-ended band follows it.
- **Remove** re-chains: the removed band's successor inherits its position, so no gap can open.

Gaps, overlaps and multiple open-ended bands become structurally impossible. Three of slice A's five hard blocks therefore cannot fire from this UI.

This does not replace the server guard and must not be described as validation. The server remains the authority; the editor's job is to stop honest mistakes reaching it. If the two ever disagree, the server wins and the 422 renders as a field error.

---

## 5. The price curve

Rendered beside the tier table from `GET /api/v1/admin/subscription-plans/{id}/price-curve`, debounced.

**It reflects SAVED state, not the table being edited.** Slice A deliberately shipped no preview endpoint for an unsaved table, because the one it has (`PricingEngine.preview`) is reached through a plan id. The curve therefore answers "what does this plan cost today", and the editor must label it that way rather than implying it previews unsaved edits.

**A non-monotonic curve is called out in words, not only drawn.** When the response carries `monotonic: false`, the offending quantities are named in a warning: *"A 25-unit landlord would pay more per unit than a 10-unit one."* A rising per-unit cost is the single mistake this endpoint exists to catch, and a line on a chart does not make it obvious — the parent spec calls the curve "not decoration" for exactly this reason.

---

## 6. The impact handshake

Save posts **without** an acknowledgement. Three outcomes:

**200/201** — saved. Navigate to the list with a confirmation.

**409** — `ImpactDialog` opens showing the affected subscriber count and each warning. Confirm replays the identical body with the returned `impactHash`.

Two rules hold this together:

- **The dialog renders the server's warnings verbatim.** The hash binds to the impact the server computed; substituting friendlier copy would have the admin confirming something other than what they read.
- **A second 409 on replay is not a retry.** It means the plan changed underneath — another admin edited it, or the subscriber count moved — so the stale hash was correctly refused. The dialog says so and offers reload, never another Confirm.

**422** — field-level errors on the offending inputs. These are refusals no acknowledgement can clear, so a 422 must never be rendered as something confirmable.

---

## 7. Feature matrix

Checkboxes over the feature keys the API accepts. Slice A restricted writes to `ANNOTATION`-mode keys — those actually gated by `@SubscriptionRequired` — so the matrix shows only those.

Keys governed elsewhere (`EXTERNAL`, gated by purchased credit; `UNGATED`, available to everyone) are named in a short note rather than silently omitted, so an admin looking for `SMS_REMINDERS` learns why it is absent instead of assuming a bug.

---

## 8. Plans list

Columns: name, status chip (DRAFT / ACTIVE / ARCHIVED), billing metric, entry price, live subscriber count, actions.

It reads the admin endpoint that returns **every** plan. Slice A's whole-branch review found the admin list had been sharing `findAllByActiveTrue()` with the public pricing page, so a DRAFT plan appeared in no listing at all — this list is the reason that was fixed, and it must not filter by `active`.

**Duplicate** clones a plan as a `DRAFT` with a new code and opens the editor. Per the parent spec §8 this is the safe way to experiment: clone, edit, publish, migrate.

---

## 9. Testing

Vitest + React Testing Library, following the repo's existing conventions.

| Area | What it proves |
|---|---|
| Derived bounds | A band's lower bound follows its predecessor; the last band stays open-ended |
| Re-chaining | Removing a middle band leaves no gap |
| 409 → dialog | The impact renders and Confirm replays with the returned hash |
| Second 409 | Offers reload, not another Confirm |
| 422 | Renders as field errors, never as a confirmation |
| Non-monotonic curve | The warning names the offending quantity |
| Feature matrix | Only writable keys are offered |

The 409 tests are the load-bearing ones: the handshake is the only place in this UI where getting it wrong lets an admin approve a change they were not shown.

---

## 10. Risks

- **The editor duplicates the server's tier-shape rules in a different form.** Mitigated by deriving rather than validating: the UI cannot express a gap, so there is no second rule set to keep in sync — only a construction that happens to satisfy the first.
- **The curve showing saved state can mislead** if an admin reads it as previewing their edits. Mitigated by labelling; if it proves confusing, the fix is a preview endpoint in a later slice, not client-side pricing.
- **The curve's debounce and the list's subscriber counts are extra admin-side queries.** Both are admin screens, not hot paths; noted rather than optimised.

---

## 11. A backend prerequisite this slice cannot do without

**`popular` and `marketingFeatures` currently have no writer.** `SubscriptionPlanDto` still returns both, and the public pricing page renders both — `popular` as the "Most Popular" badge, `marketingFeatures` as the plan card's bullet list. But slice A deleted `EditPlanDialog`'s legacy body and did not carry either field onto `PlanWriteRequestDto`, so nothing can set them any more. They are frozen at whatever value they hold today, forever.

That is the same failure this whole CMS exists to remove, arrived at from the other direction: not a value that displays but does not bill, but a value that displays and can no longer be changed. Shipping a plan editor that cannot edit the plan's own marketing copy would be a conspicuous hole in the thing being delivered.

**Therefore slice B opens with a small backend change**, in `tenantx-backend`, before any UI work:

1. Add `Boolean popular` and `List<String> marketingFeatures` to `PlanWriteRequestDto`.
2. Apply both in `AdminPlanWriteService`, alongside the other scalar fields.
3. Include them in the audit snapshot, like every other plan attribute.

Neither field affects pricing, so neither belongs in `PlanImpactCalculator`'s warnings — editing marketing copy stays a free-bucket change, per parent spec §7.

The editor then carries both: `popular` as a toggle, `marketingFeatures` as an ordered list of short strings.

---

## 12. Out of scope, carried forward

Two defects slice A surfaced and deliberately left, both product questions rather than code:

- **`transactionFeePct`** is advertised per plan but never charged per plan — every tenant pays one global `platform_settings` rate. The editor should not offer a field that bills nothing; until the product question is settled, it is omitted.
- **`isPublic`** is written by the CMS and read by nothing. Same reasoning: not offered.
