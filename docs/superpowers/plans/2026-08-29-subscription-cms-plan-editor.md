# Subscription CMS — Plan Editor UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give platform admins a working plan editor — tier tables, cycles, features, limits and status — so the CMS's promise of changing pricing without a deploy is reachable from a browser.

**Architecture:** Two backend prerequisites first (slice A left plan state unreadable and marketing copy unwritable), then a full-page editor at `/admin/subscriptions/plans/[id]`. The tier editor derives lower bounds rather than validating them, so gaps are structurally impossible. Saving posts without an acknowledgement; a 409 opens a dialog rendering the server's own warnings, and Confirm replays with the returned hash.

**Tech Stack:** Next.js 15 App Router, MUI v6, TypeScript, Vitest + React Testing Library (happy-dom). Backend: Spring Boot 4, Java 25.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-29-subscription-cms-plan-editor-design.md`. Read §4, §6 and §11 before Task 3.
- **Two repos.** Tasks 1–2 are in `TenantX-backend` (branch off `origin/master`, which carries slice A). Tasks 3–9 are in `Tenants` on `feat/subscription-cms-plan-editor`.
- Frontend commands need node 22: `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22`. The default shell node is v10 and breaks `tsc` and `vitest`.
- Frontend tests: `npx vitest run <path> --testTimeout=60000 --maxWorkers=2`. Without those flags slow suites produce false reds.
- Typecheck with `npx tsc --noEmit` before every frontend commit.
- Backend tests need a throwaway Postgres, never the app DB on `:55432`:
  ```bash
  docker start tx-test-db || docker run -d --name tx-test-db -e POSTGRES_PASSWORD=throwaway -e POSTGRES_DB=txboot -p 55499:5432 postgres:17
  ```
  ```bash
  SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:55499/txboot" SPRING_DATASOURCE_USERNAME=postgres SPRING_DATASOURCE_PASSWORD=throwaway DB_PASSWORD=throwaway JWT_SECRET="throwaway-not-a-real-secret-0123456789012345" IMAGEKIT_PRIVATE_KEY=throwaway RESEND_API_KEY=throwaway JAVA_HOME=/Users/mac/Library/Java/JavaVirtualMachines/openjdk-25.0.1/Contents/Home ./mvnw surefire:test -Dtest=ClassName
  ```
- Admin authority: reads `platform:plans:read`, writes `platform:plans:write`.
- Money is a string on the wire and must never be parsed to a JS `number` for arithmetic — render and post it as typed.
- Do NOT offer `transactionFeePct` or `isPublic` in the editor. Both are documented in spec §12 as values nothing reads or charges; adding a control for either would ship a knob that does nothing.

---

## Why the plan opens in the backend

Slice A shipped a write API whose state cannot be read back:

| Field the PUT body requires | Returned by any GET? |
|---|---|
| `billingMetric`, `pricingMode`, `currency` | no |
| `maxQty`, `selfServeMaxQty`, `sortOrder`, `description` | no |
| **`cycles`** | **no** |

`cycles` is the dangerous one. `PlanWriteRequestDto` marks it `@NotEmpty`, and `AdminPlanWriteService` replaces the cycle rows wholesale — the DTO's own comment records that an omitted list deletes every row, after which `PricingEngine.resolveDiscount` renews **every annual subscriber at full price**. An editor that cannot read a plan's cycles cannot safely save that plan at all.

Separately, `popular` and `marketingFeatures` are still rendered on the public pricing page but lost their only writer when slice A deleted the legacy body, so the "Most Popular" badge and the plan card's bullet list are frozen permanently (spec §11).

Tasks 1 and 2 close both. No frontend task can start before them.

---

## File Structure

**Backend — `TenantX-backend`**

- Modify `modules/subscription/dto/PlanWriteRequestDto.java` — add `popular`, `marketingFeatures`
- Modify `modules/subscription/admin/AdminPlanWriteService.java` — apply and audit them
- Create `modules/subscription/dto/PlanDetailDto.java` — every writable field, including cycles
- Modify `modules/subscription/controllers/AdminSubscriptionController.java` — `GET /{planId}`

**Frontend — `Tenants`**

- Create `src/lib/api/subscription-plans-admin.ts` — types and calls for the plan CMS
- Create `src/views/admin/plans/TierTableEditor.tsx`
- Create `src/views/admin/plans/CycleEditor.tsx`
- Create `src/views/admin/plans/FeatureMatrix.tsx`
- Create `src/views/admin/plans/PriceCurve.tsx`
- Create `src/views/admin/plans/ImpactDialog.tsx`
- Create `src/views/admin/plans/PlanEditorForm.tsx`
- Create `src/views/admin/plans/PlanList.tsx`
- Create `src/app/admin/subscriptions/plans/new/page.tsx`
- Create `src/app/admin/subscriptions/plans/[id]/page.tsx`
- Modify `src/views/admin/AdminSubscriptionsView.tsx` — delete `EditPlanDialog` and the plan table
- Modify `src/lib/api/admin-auth-client.ts` — remove the dead legacy plan functions

---

## Task 1: Backend — restore the marketing fields

**Repo:** `TenantX-backend`, new branch `feat/plan-editor-api-gaps` off `origin/master`.

**Files:**
- Modify: `src/main/java/cloud/norgha/tenantx_backend/modules/subscription/dto/PlanWriteRequestDto.java`
- Modify: `src/main/java/cloud/norgha/tenantx_backend/modules/subscription/admin/AdminPlanWriteService.java`
- Test: `src/test/java/cloud/norgha/tenantx_backend/modules/subscription/controllers/AdminPlanWriteHttpTest.java`

**Interfaces:**
- Produces: `PlanWriteRequestDto` gains `Boolean popular` and `List<String> marketingFeatures`, placed immediately after `featureKeys` and before `acknowledgement`.

Neither field affects pricing, so neither belongs in `PlanImpactCalculator` — editing marketing copy stays a free-bucket change.

- [ ] **Step 1: Write the failing test**

Add to `AdminPlanWriteHttpTest`:

```java
    @Test
    @DisplayName("popular and marketingFeatures round-trip through the write API")
    void marketingFieldsRoundTrip() throws Exception {
        String body = """
            {"code":"MKT-TEST","name":"MKT","displayName":"Marketing Test","status":"DRAFT",
             "billingMetric":"UNITS","pricingMode":"GRADUATED","currency":"GHS",
             "isPublic":true,"sortOrder":9,
             "tiers":[{"fromQty":1,"toQty":null,"flatPrice":"0","perUnitPrice":"20"}],
             "cycles":[{"cycle":"MONTHLY","discountPct":"0","enabled":true}],
             "featureKeys":[],
             "popular":true,
             "marketingFeatures":["Unlimited properties","Priority support"]}
            """;

        mockMvc.perform(post("/api/v1/admin/subscription-plans")
                        .header("Authorization", "Bearer " + writeToken())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.popular").value(true))
                .andExpect(jsonPath("$.marketingFeatures[0]").value("Unlimited properties"))
                .andExpect(jsonPath("$.marketingFeatures[1]").value("Priority support"));
    }
```

Use whatever helper that file already has for a write-authority token and for cleanup — read it first; do not assume `writeToken()` exists under that name.

- [ ] **Step 2: Run it and confirm it fails**

Run: `./mvnw surefire:test -Dtest=AdminPlanWriteHttpTest`

Expected: FAIL — the response carries `popular: false` and an empty `marketingFeatures`, because nothing writes them.

- [ ] **Step 3: Add the fields to the request DTO**

In `PlanWriteRequestDto`, after `featureKeys`:

```java
        /**
         * Rendered on the public pricing page as the "Most Popular" badge and the plan card's
         * bullet list. They lost their only writer when the legacy plan body was deleted, so
         * without these two they are frozen at whatever value they held — a value that displays
         * and can no longer be changed, which is the same defect as one that displays and does
         * not bill. Neither affects pricing, so neither warns in PlanImpactCalculator.
         */
        Boolean popular,
        List<String> marketingFeatures,
```

- [ ] **Step 4: Apply them in the write service**

In `AdminPlanWriteService`, alongside the other scalar assignments:

```java
        plan.setPopular(Boolean.TRUE.equals(request.popular()));
        plan.setMarketingFeatures(request.marketingFeatures() == null
                ? new String[0]
                : request.marketingFeatures().toArray(new String[0]));
```

Read `SubscriptionPlan` first to confirm the setter names and that `marketingFeatures` is a `String[]`. Both fields must also appear in the before/after audit snapshot — check how the snapshot is built and add them the same way.

- [ ] **Step 5: Run the test and confirm it passes**

Run: `./mvnw surefire:test -Dtest=AdminPlanWriteHttpTest`

- [ ] **Step 6: Commit**

```bash
git commit -am "feat(subscription): let the CMS write popular and marketingFeatures"
```

---

## Task 2: Backend — a plan detail endpoint the editor can load

**Files:**
- Create: `src/main/java/cloud/norgha/tenantx_backend/modules/subscription/dto/PlanDetailDto.java`
- Modify: `src/main/java/cloud/norgha/tenantx_backend/modules/subscription/controllers/AdminSubscriptionController.java`
- Test: `src/test/java/cloud/norgha/tenantx_backend/modules/subscription/controllers/AdminPlanDetailHttpTest.java`

**Interfaces:**
- Produces: `GET /api/v1/admin/subscription-plans/{planId}` → `PlanDetailDto`, carrying **every field `PlanWriteRequestDto` accepts** plus `id` and `subscriberCount`. Authority `platform:plans:read`.

The contract that matters: a client must be able to GET a plan, change one field, and PUT the result back without losing anything. Today it cannot, and the field it would silently destroy is `cycles`.

- [ ] **Step 1: Write the failing test**

```java
package cloud.norgha.tenantx_backend.modules.subscription.controllers;

// imports as in AdminPlanWriteHttpTest

@SpringBootTest
@AutoConfigureMockMvc
class AdminPlanDetailHttpTest {

    @Test
    @DisplayName("the detail endpoint returns every field the write body requires, so a plan round-trips")
    void detailCarriesEveryWritableField() throws Exception {
        mockMvc.perform(get("/api/v1/admin/subscription-plans/" + proPlanId())
                        .header("Authorization", "Bearer " + readToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").exists())
                .andExpect(jsonPath("$.status").exists())
                .andExpect(jsonPath("$.billingMetric").value("UNITS"))
                .andExpect(jsonPath("$.pricingMode").exists())
                .andExpect(jsonPath("$.currency").value("GHS"))
                .andExpect(jsonPath("$.sortOrder").exists())
                .andExpect(jsonPath("$.isPublic").exists())
                .andExpect(jsonPath("$.tiers").isArray())
                // The one that makes this endpoint necessary: without cycles on the read,
                // any PUT built from it deletes every cycle row and renews annual
                // subscribers at full price.
                .andExpect(jsonPath("$.cycles").isArray())
                .andExpect(jsonPath("$.cycles[0].cycle").exists())
                .andExpect(jsonPath("$.cycles[0].discountPct").exists())
                .andExpect(jsonPath("$.cycles[0].enabled").exists())
                .andExpect(jsonPath("$.featureKeys").isArray())
                .andExpect(jsonPath("$.marketingFeatures").isArray());
    }

    @Test
    @DisplayName("a caller without plans:read is refused")
    void requiresReadAuthority() throws Exception {
        mockMvc.perform(get("/api/v1/admin/subscription-plans/" + proPlanId()))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("an unknown plan id is 404, not 500")
    void unknownPlanIs404() throws Exception {
        mockMvc.perform(get("/api/v1/admin/subscription-plans/" + UUID.randomUUID())
                        .header("Authorization", "Bearer " + readToken()))
                .andExpect(status().isNotFound());
    }
}
```

Copy the token helpers and the plan lookup from `AdminPlanWriteHttpTest` rather than inventing them.

- [ ] **Step 2: Run and confirm failure**

Run: `./mvnw surefire:test -Dtest=AdminPlanDetailHttpTest`

Expected: FAIL with 404 or 405 — no such endpoint.

- [ ] **Step 3: Create the DTO**

```java
package cloud.norgha.tenantx_backend.modules.subscription.dto;

import cloud.norgha.tenantx_backend.modules.subscription.pricing.BillingMetric;
import cloud.norgha.tenantx_backend.modules.subscription.pricing.PricingMode;

import java.util.List;
import java.util.UUID;

/**
 * Everything the editor needs to load a plan and PUT it back unchanged.
 *
 * <p>Deliberately mirrors {@code PlanWriteRequestDto} field for field, plus {@code id} and
 * {@code subscriberCount}. The write body replaces tiers and cycles WHOLESALE, so a client that
 * cannot read them back cannot safely save at all — an omitted cycle list deletes every row and
 * renews annual subscribers at full price. Any field added to the write body must be added here
 * in the same commit.
 */
public record PlanDetailDto(
        UUID id,
        String code,
        String name,
        String displayName,
        String description,
        String status,
        BillingMetric billingMetric,
        PricingMode pricingMode,
        String currency,
        Integer maxQty,
        Integer selfServeMaxQty,
        boolean isPublic,
        int sortOrder,
        List<PlanTierDto> tiers,
        List<PlanCycleDto> cycles,
        List<String> featureKeys,
        boolean popular,
        List<String> marketingFeatures,
        long subscriberCount
) {}
```

- [ ] **Step 4: Add the endpoint**

In `AdminSubscriptionController`, alongside the existing plan handlers:

```java
    @GetMapping("/{planId}")
    @PreAuthorize("hasAuthority('platform:plans:read')")
    public ResponseEntity<PlanDetailDto> getPlan(@PathVariable UUID planId) {
        return ResponseEntity.ok(adminPlanWriteService.detail(planId));
    }
```

Implement `detail(UUID)` on `AdminPlanWriteService`: load the plan (404 via the same `BusinessException` the delete path uses for an unknown id), read its tiers via `findByPlanIdOrderByFromQtyAsc`, its cycles via `findByPlanId`, its enabled feature keys, and its subscriber count via `countByPlanIdAndStatus(planId, "ACTIVE")`.

- [ ] **Step 5: Run and confirm it passes**

Run: `./mvnw surefire:test -Dtest=AdminPlanDetailHttpTest`

- [ ] **Step 6: Run the whole subscription package, then commit**

Run: `./mvnw surefire:test -Dtest='cloud.norgha.tenantx_backend.modules.subscription.**'`

```bash
git commit -am "feat(subscription): a plan detail endpoint the editor can round-trip"
```

Open a PR for tasks 1–2 against `master` and merge it before starting Task 3. The frontend calls this endpoint.

---

## Task 3: Frontend — the API client

**Repo:** `Tenants`, branch `feat/subscription-cms-plan-editor`.

**Files:**
- Create: `src/lib/api/subscription-plans-admin.ts`
- Test: `src/__tests__/admin/subscriptionPlansAdminClient.test.ts`

**Interfaces:**
- Produces:
  - `type PlanTier = { fromQty: number; toQty: number | null; flatPrice: string; perUnitPrice: string }`
  - `type PlanCycle = { cycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'; discountPct: string; enabled: boolean }`
  - `type PlanDetail = { id, code, name, displayName, description, status, billingMetric, pricingMode, currency, maxQty, selfServeMaxQty, isPublic, sortOrder, tiers, cycles, featureKeys, popular, marketingFeatures, subscriberCount }`
  - `type PlanWriteBody` = `PlanDetail` minus `id`/`subscriberCount`, plus `acknowledgement?: { impactHash: string; affectedSubscribers: number }`
  - `type PlanImpact = { warnings: string[]; affectedSubscribers: number; impactHash: string }`
  - `type PriceCurve = { points: { quantity: number; amount: string; effectiveUnitPrice: string; salesLed: boolean }[]; monotonic: boolean; risingAt: number[] }`
  - `class PlanImpactRequired extends Error { impact: PlanImpact }`
  - `getAdminPlans(): Promise<PlanSummary[]>`, `getPlanDetail(id): Promise<PlanDetail>`, `savePlan(id: string | null, body: PlanWriteBody): Promise<PlanDetail>`, `deletePlan(id): Promise<void>`, `getPriceCurve(id, quantities?): Promise<PriceCurve>`

`savePlan` throws `PlanImpactRequired` on 409 so callers branch on a type, not a status code.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/api/admin-auth-client', () => ({ adminClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))

import { adminClient } from '@/lib/api/admin-auth-client'
import { savePlan, PlanImpactRequired } from '@/lib/api/subscription-plans-admin'

const body: any = { code: 'X', tiers: [], cycles: [] }

describe('savePlan', () => {
  beforeEach(() => vi.clearAllMocks())

  it('throws PlanImpactRequired carrying the impact when the server refuses with 409', async () => {
    const impact = { warnings: ['pricing changes for 12 active subscriber(s)'], affectedSubscribers: 12, impactHash: 'abc123' }
    ;(adminClient.put as any).mockRejectedValue({ response: { status: 409, data: impact } })

    await expect(savePlan('plan-1', body)).rejects.toBeInstanceOf(PlanImpactRequired)
    await expect(savePlan('plan-1', body)).rejects.toMatchObject({ impact })
  })

  it('does not convert a 422 into an impact — a hard block is not confirmable', async () => {
    ;(adminClient.put as any).mockRejectedValue({ response: { status: 422, data: { message: 'tier table has a gap' } } })

    await expect(savePlan('plan-1', body)).rejects.not.toBeInstanceOf(PlanImpactRequired)
  })

  it('POSTs when the id is null and PUTs when it is not', async () => {
    ;(adminClient.post as any).mockResolvedValue({ data: { id: 'new' } })
    await savePlan(null, body)
    expect(adminClient.post).toHaveBeenCalled()
    expect(adminClient.put).not.toHaveBeenCalled()
  })
})
```

Read `src/lib/api/admin-auth-client.ts` first: confirm how the axios instance is exported and mock that name, not the one assumed here.

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run src/__tests__/admin/subscriptionPlansAdminClient.test.ts --testTimeout=60000 --maxWorkers=2`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the client**

Types as in the Interfaces block, plus:

```ts
/** A 409 is not an error the user caused — it is the server asking for consent. */
export class PlanImpactRequired extends Error {
  constructor(public readonly impact: PlanImpact) {
    super('Plan change requires acknowledgement')
    this.name = 'PlanImpactRequired'
  }
}

export async function savePlan(id: string | null, body: PlanWriteBody): Promise<PlanDetail> {
  try {
    const res = id
      ? await adminClient.put(`/subscription-plans/${id}`, body)
      : await adminClient.post('/subscription-plans', body)

    return res.data
  } catch (err: any) {
    // 409 ONLY. A 422 is a hard block no acknowledgement can clear, and turning one into a
    // confirmable dialog would offer the admin a button that cannot work.
    if (err?.response?.status === 409) throw new PlanImpactRequired(err.response.data)
    throw err
  }
}
```

- [ ] **Step 4: Run and confirm it passes**

Run: `npx vitest run src/__tests__/admin/subscriptionPlansAdminClient.test.ts --testTimeout=60000 --maxWorkers=2`

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit
```

```bash
git add src/lib/api/subscription-plans-admin.ts src/__tests__/admin/subscriptionPlansAdminClient.test.ts && git commit -m "feat(admin): API client for the plan CMS"
```

---

## Task 4: TierTableEditor

**Files:**
- Create: `src/views/admin/plans/TierTableEditor.tsx`
- Test: `src/__tests__/admin/TierTableEditor.test.tsx`

**Interfaces:**
- Consumes: `PlanTier` from Task 3.
- Produces: `<TierTableEditor value={PlanTier[]} onChange={(t: PlanTier[]) => void} />`, plus exported pure helpers `addBand(tiers): PlanTier[]`, `removeBand(tiers, index): PlanTier[]`, `setUpperBound(tiers, index, upper): PlanTier[]`.

Put the list arithmetic in the exported helpers and test those directly — they are the part that must not be wrong, and testing them through the DOM would obscure it.

**The rule (spec §4):** the admin edits each band's UPPER bound and its prices. Lower bounds derive as predecessor + 1. The last band is always open-ended (`toQty: null`) and renders "and above", never an input.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest'
import { addBand, removeBand, setUpperBound } from '@/views/admin/plans/TierTableEditor'

const band = (fromQty: number, toQty: number | null, perUnitPrice = '10') =>
  ({ fromQty, toQty, flatPrice: '0', perUnitPrice })

describe('tier band arithmetic', () => {
  it('keeps the last band open-ended when a band is added', () => {
    const result = addBand([band(1, null)])
    expect(result).toHaveLength(2)
    expect(result[result.length - 1].toQty).toBeNull()
  })

  it('derives each lower bound from its predecessor', () => {
    const result = setUpperBound([band(1, null), band(2, null)], 0, 15)
    expect(result[0].toQty).toBe(15)
    expect(result[1].fromQty).toBe(16)
  })

  it('leaves no gap when a middle band is removed', () => {
    const tiers = [band(1, 10), band(11, 25), band(26, null)]
    const result = removeBand(tiers, 1)
    expect(result).toHaveLength(2)
    expect(result[0].toQty).toBe(10)
    expect(result[1].fromQty).toBe(11)
    expect(result[1].toQty).toBeNull()
  })

  it('never leaves zero bands — a plan that cannot price anything is not a plan', () => {
    expect(removeBand([band(1, null)], 0)).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npx vitest run src/__tests__/admin/TierTableEditor.test.tsx --testTimeout=60000 --maxWorkers=2`

- [ ] **Step 3: Implement**

Export the three helpers as pure functions, then the component: one row per band showing a read-only lower bound, an editable upper bound (or "and above" for the last), and inputs for flat and per-unit price. Re-derive the whole list through the helpers on every change so the invariant cannot drift.

- [ ] **Step 4: Run and confirm it passes**

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit && git add -A src/views/admin/plans src/__tests__/admin && git commit -m "feat(admin): tier table editor with derived band boundaries"
```

---

## Task 5: CycleEditor and FeatureMatrix

**Files:**
- Create: `src/views/admin/plans/CycleEditor.tsx`, `src/views/admin/plans/FeatureMatrix.tsx`
- Test: `src/__tests__/admin/CycleEditor.test.tsx`, `src/__tests__/admin/FeatureMatrix.test.tsx`

**Interfaces:**
- Produces: `<CycleEditor value={PlanCycle[]} onChange={(c: PlanCycle[]) => void} />`; `<FeatureMatrix value={string[]} available={string[]} onChange={(keys: string[]) => void} />`.

- [ ] **Step 1: Write the failing tests**

```tsx
// src/__tests__/admin/CycleEditor.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import CycleEditor from '@/views/admin/plans/CycleEditor'

const cycles = [
  { cycle: 'MONTHLY' as const, discountPct: '0', enabled: true },
  { cycle: 'ANNUAL' as const, discountPct: '0.17', enabled: true }
]

describe('CycleEditor', () => {
  it('renders a row for every billing cycle', () => {
    render(<CycleEditor value={cycles} onChange={vi.fn()} />)
    expect(screen.getByText('MONTHLY')).toBeInTheDocument()
    expect(screen.getByText('ANNUAL')).toBeInTheDocument()
    expect(screen.getByText('QUARTERLY')).toBeInTheDocument()
  })

  it('will not let MONTHLY be disabled — a plan with no enabled cycle cannot be billed', () => {
    render(<CycleEditor value={cycles} onChange={vi.fn()} />)
    expect(screen.getByRole('checkbox', { name: /monthly/i })).toBeDisabled()
  })

  it('reports a discount change for the cycle it belongs to', () => {
    const onChange = vi.fn()
    render(<CycleEditor value={cycles} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/annual discount/i), { target: { value: '0.2' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ cycle: 'ANNUAL', discountPct: '0.2' })])
    )
  })
})
```

```tsx
// src/__tests__/admin/FeatureMatrix.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import FeatureMatrix from '@/views/admin/plans/FeatureMatrix'

describe('FeatureMatrix', () => {
  it('offers only the keys the API accepts', () => {
    render(
      <FeatureMatrix value={['EXPENSES']} available={['EXPENSES', 'ADVANCE_RENT']} onChange={vi.fn()} />
    )
    expect(screen.getByRole('checkbox', { name: /EXPENSES/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /ADVANCE_RENT/ })).not.toBeChecked()
    // Slice A refuses non-ANNOTATION keys with a 422, so offering one would be a
    // checkbox that cannot be saved.
    expect(screen.queryByRole('checkbox', { name: /SMS_REMINDERS/ })).not.toBeInTheDocument()
  })

  it('explains why some capabilities are absent rather than silently omitting them', () => {
    render(<FeatureMatrix value={[]} available={['EXPENSES']} onChange={vi.fn()} />)
    expect(screen.getByText(/governed elsewhere/i)).toBeInTheDocument()
  })
})
```

`available` is supplied by the caller; Task 8 passes the keys returned by the plan detail endpoint's feature set.

- [ ] **Step 2: Run and confirm failure**

- [ ] **Step 3: Implement both**

- [ ] **Step 4: Run and confirm they pass**

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat(admin): cycle editor and feature matrix"
```

---

## Task 6: PriceCurve

**Files:**
- Create: `src/views/admin/plans/PriceCurve.tsx`
- Test: `src/__tests__/admin/PriceCurve.test.tsx`

**Interfaces:**
- Consumes: `getPriceCurve` and `PriceCurve` from Task 3.
- Produces: `<PriceCurve planId={string} />`.

**Two things this must get right** (spec §5): it reflects SAVED state, not the table being edited, and must be labelled that way. And a non-monotonic result is stated in words, not only drawn.

- [ ] **Step 1: Write the failing test**

```tsx
it('names the offending quantity when the per-unit cost rises', async () => {
  ;(getPriceCurve as any).mockResolvedValue({
    points: [
      { quantity: 10, amount: '50', effectiveUnitPrice: '5.00', salesLed: false },
      { quantity: 25, amount: '800', effectiveUnitPrice: '32.00', salesLed: false }
    ],
    monotonic: false,
    risingAt: [25]
  })

  render(<PriceCurve planId='plan-1' />)

  // The warning must name the quantity. A chart alone does not make a rising
  // per-unit cost obvious, and this is the one mistake the endpoint exists to catch.
  expect(await screen.findByText(/25/)).toBeInTheDocument()
  expect(await screen.findByText(/more per unit/i)).toBeInTheDocument()
})

it('says the curve reflects the saved plan, not unsaved edits', async () => {
  ;(getPriceCurve as any).mockResolvedValue({ points: [], monotonic: true, risingAt: [] })
  render(<PriceCurve planId='plan-1' />)
  expect(await screen.findByText(/saved/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Run and confirm failure**

- [ ] **Step 3: Implement**

A table of quantity / total / per-unit is sufficient and is what the warning hangs off; a chart is optional and must not replace the worded warning.

- [ ] **Step 4: Run and confirm it passes**

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat(admin): price curve with a worded rising-cost warning"
```

---

## Task 7: ImpactDialog and the save handshake

**Files:**
- Create: `src/views/admin/plans/ImpactDialog.tsx`
- Test: `src/__tests__/admin/ImpactDialog.test.tsx`

**Interfaces:**
- Consumes: `PlanImpact` from Task 3.
- Produces: `<ImpactDialog impact={PlanImpact | null} stale={boolean} onConfirm={() => void} onClose={() => void} />`.

**This is the load-bearing task.** It is the only place in this UI where getting it wrong lets an admin approve a change they were not shown.

- [ ] **Step 1: Write the failing test**

```tsx
const impact = {
  warnings: ['pricing changes from [1-:0.00+30.0000] to [1-:0.00+45.0000] for 12 active subscriber(s) at their next renewal'],
  affectedSubscribers: 12,
  impactHash: 'abc123'
}

it("renders the server's warnings verbatim, not a paraphrase", () => {
  render(<ImpactDialog impact={impact} stale={false} onConfirm={vi.fn()} onClose={vi.fn()} />)
  // The hash binds to what the SERVER computed. Friendlier copy would have the admin
  // confirming something other than what they read.
  expect(screen.getByText(impact.warnings[0])).toBeInTheDocument()
  expect(screen.getByText(/12/)).toBeInTheDocument()
})

it('offers reload rather than another Confirm when the acknowledgement was stale', () => {
  render(<ImpactDialog impact={impact} stale onConfirm={vi.fn()} onClose={vi.fn()} />)
  // A second 409 means the plan moved underneath. Retrying the same hash cannot succeed.
  expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
})
```

- [ ] **Step 2: Run and confirm failure**

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run and confirm it passes**

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat(admin): impact dialog for the acknowledgement handshake"
```

---

## Task 8: PlanEditorForm and the routes

**Files:**
- Create: `src/views/admin/plans/PlanEditorForm.tsx`
- Create: `src/app/admin/subscriptions/plans/new/page.tsx`, `src/app/admin/subscriptions/plans/[id]/page.tsx`
- Test: `src/__tests__/admin/PlanEditorForm.test.tsx`

**Interfaces:**
- Consumes: every component from Tasks 4–7 and every function from Task 3.
- Produces: `<PlanEditorForm planId={string | null} />`.

Assembles the sections, loads via `getPlanDetail` in edit mode, and owns the save flow.

**It must carry the marketing controls Task 1 exists to enable** (spec §11): `popular` as a toggle, `marketingFeatures` as an ordered list of short strings with add and remove. Without them Task 1 is dead weight and the "Most Popular" badge and the plan card's bullet list stay frozen — which was the whole reason for the backend prerequisite. Include a test asserting both round-trip: load a plan with `popular: true` and two marketing features, change one, save, and assert the posted body carries the edit.

Alongside them, the plain scalar fields: `code` (disabled in edit mode — the server refuses a change with 422), `name`, `displayName`, `description`, `status`, `billingMetric`, `pricingMode`, `currency`, `maxQty`, `selfServeMaxQty`, `sortOrder`.

The save flow:

1. `savePlan(planId, body)` with no acknowledgement.
2. `PlanImpactRequired` → open `ImpactDialog` with `stale={false}`.
3. Confirm → `savePlan(planId, { ...body, acknowledgement: { impactHash, affectedSubscribers } })`.
4. A second `PlanImpactRequired` → re-open with `stale={true}`.
5. A 422 → field errors. Never the dialog.

- [ ] **Step 1: Write the failing test**

Cover all five branches above, mocking `savePlan`. The stale case is the one most likely to be got wrong: assert the second 409 does NOT produce another Confirm.

- [ ] **Step 2: Run and confirm failure**

- [ ] **Step 3: Implement the form and the two thin route pages**

Each page reads its param and renders `<PlanEditorForm planId={...} />`; `new/page.tsx` passes `null`.

- [ ] **Step 4: Run and confirm it passes**

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat(admin): plan editor page and the save handshake"
```

---

## Task 9: PlanList, Duplicate, and removing the broken dialog

**Files:**
- Create: `src/views/admin/plans/PlanList.tsx`
- Modify: `src/views/admin/AdminSubscriptionsView.tsx` — delete `EditPlanDialog` and the plan table
- Modify: `src/lib/api/admin-auth-client.ts` — delete `createSubscriptionPlan`, `updateSubscriptionPlan` and the legacy `CreatePlanRequestDto` / `UpdatePlanRequestDto` types
- Test: `src/__tests__/admin/PlanList.test.tsx`

**Interfaces:**
- Produces: `<PlanList />`, rendered by `src/app/admin/subscriptions/page.tsx`.

`EditPlanDialog` posts a body the server deleted and returns 400 on every save. Removing it is the point of the task, not a side effect — leaving a control that always fails is worse than having none.

- [ ] **Step 1: Write the failing test**

Assert the list renders a DRAFT plan (it reads the endpoint returning ALL plans, not just active ones — a DRAFT appearing here is the whole reason slice A fixed that query), shows a status chip and subscriber count per row, and that Duplicate navigates to the editor.

- [ ] **Step 2: Run and confirm failure**

- [ ] **Step 3: Implement `PlanList`, wire it into the subscriptions page, and delete the dead code**

Run `npx tsc --noEmit` immediately after deleting — it will name every remaining reference.

- [ ] **Step 4: Run the WHOLE frontend suite**

Run: `npx vitest run --testTimeout=60000 --maxWorkers=2`

Expected: 0 failures. Deleting the legacy client functions will break any test that referenced them; fix or delete those tests rather than stubbing them.

- [ ] **Step 5: Typecheck and commit**

```bash
npx tsc --noEmit && git add -A && git commit -m "feat(admin): plans list, duplicate, and removal of the legacy plan dialog"
```

---

## Done when

- A platform admin can create a GRADUATED plan with four tiers, publish it, and change its price — confirming the subscriber impact when asked.
- A DRAFT plan appears in the admin list and is reachable by URL.
- The tier editor cannot produce a gap, an overlap, or two open-ended bands.
- A rising per-unit cost is stated in words, naming the quantity.
- A stale acknowledgement offers reload, not another Confirm.
- No control remains that posts the legacy plan body.
