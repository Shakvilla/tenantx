# Detailed Code Review Audit & Refactoring Plan (v1.0)

## Overview

This document is a comprehensive, actionable refactoring plan derived from the extensive code review audit of the `TenantApp` codebase.
It is intended to be handed off to an AI developer agent (like Claude Code, Gemini CLI) or a human developer to strictly implement the suggested fixes.

**Core Objectives:**

1. Secure the Testing Pipeline and achieve `>80%` test coverage on services.
2. Resolve all `eslint` violations.
3. Migrate `tenant_id` injection from global/implicit state to explicit parameter passing.
4. Eliminate UI Data Waterfalls by refactoring Client-Side leaves back into React Server Components (RSC).
5. Conform to Next.js 15 Async API specifications.

---

## Task 1: Establish Testing Pipeline & Coverage (Critical)

**Context:** The `vitest` suite exits with Code 1 because `"No test files found"`.

**Action Items:**

1. **Initialize the Test Spine:**
   Create a root directory `src/__tests__/services` and `src/__tests__/components`.
2. **Setup Vitest Configurations:**
   Verify `vitest.config.ts` or `vite.config.ts` exists and resolves the `@/` alias mapped to `src/`.
3. **Mocking the API Base:**
   Our app communicates with a backend API (Spring Boot/External) via `apiGet`, `apiPost`. Write a mock inside `src/__tests__/utils/api-mock.ts` utilizing `vi.mock('axios')`.
4. **Implement Service Tests:**
   - **File to Target:** `src/__tests__/services/tenants.test.ts`
   - **Condition:** Validate that `getTenants`, `createTenant`, and `updateTenant` properly package endpoints and explicit configurations. Enforce Red-Green-Refactor.

---

## Task 2: Resolve Lint & Code Quality Violations (Critical)

**Context:** Running `npm run lint` yields 166 lines of failures. This blocks automation pipelines.

**Action Items:**

1. **Run Auto-Fix:**
   Execute `npm run lint:fix` globally. This will immediately resolve styling constraints like `padding-line-between-statements` and `newline-before-return`.
2. **Manual Intervention - Hook Dependencies:**
   - **File:** `src/views/tenants/view/PaymentHistoryTab.tsx`
   - **Issue:** `'handleEditClick'` is missing from the dependency array of `useMemo` or `useCallback`.
   - **Fix:** Safely attach it to the `deps` array. If `handleEditClick` mutates, stabilize it with `useCallback`.
3. **Manual Intervention - Unused Variables:**
   - **File:** `src/views/tenants/view/ActivityTimelineTab.tsx`
   - **Issue:** `tenantId` is declared but never read.
   - **Fix:** Prefix with underscore (`_tenantId`) or delete the variable entirely if no API call uses it.

---

## Task 3: Refactor "Implicit" Tenant ID Inferences (Important)

**Context:** The project has multiple architectural directives (e.g., `nextjs-supabase-developer.md` Rule #3) mandating explicit `tenantId` usage, specifying _"never infer from global state."_
Currently, `client.ts` uses `localStorage` to lazily grab it, and `server-api.ts` uses NextJS `cookies()`.

**Action Items:**

### 3.1. Removing Auto-Interception in Client

1. **Target File:** `src/lib/api/client.ts`
2. **Changes:**
   - Locate `apiClient.interceptors.request.use` where `const tenantId = getStoredTenantId()` attaches the `X-Tenant-ID` header.
   - Remove this block. The interceptor should ONLY handle the `Authorization` Bearer token.
   - Modify `apiGet`, `apiPost` signatures to take `AxiosRequestConfig` seamlessly:
     ```ts
     // Example adjustment
     export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> { ... }
     ```

### 3.2. Explicit Passing in External Services

1. **Target File:** `src/lib/api/tenants.ts` (and all other service files).
2. **Changes:**

   - Refactor every function to strictly accept `tenantId` as the leading argument.

   ```ts
   // BEFORE:
   export async function getTenants(query: TenantQuery = {}): Promise<ListResponse<TenantRecord>> { ... }

   // AFTER:
   export async function getTenants(tenantId: string, query: TenantQuery = {}): Promise<ListResponse<TenantRecord>> {
     // ...
     return apiGet(`${API_BASE}/tenants?${params.toString()}`, {
       headers: { 'X-Tenant-ID': tenantId }
     })
   }
   ```

### 3.3. Refactoring Server API Inference

1. **Target File:** `src/lib/api/server-api.ts`
2. **Changes:**
   - Instead of extracting `tenantId` directly from `await cookies()` inside the core fetcher, require the Server Component to explicitly perform the resolution and pass it to `serverApiGet`.
   - Modify `serverApiGet` signature to accept a required `tenantId: string` parameter.

---

## Task 4: Eliminate UI Waterfalls (`'use client'` page replacements)

**Context:** Vercel guidelines mandate reducing client-side cascades. Anomalies were found such as `tenants/[id]/page.tsx` running as a Client Component.

**Action Items:**

1. **Target File:** `src/app/(dashboard)/tenants/[id]/page.tsx`
2. **Changes:**

   - Remove `"use client"`.
   - Remove `useEffect` and `useState`.
   - Refactor the page to a standard NextJS 15 React Server Component.
   - Make sure to correctly **await Next.js 15 params**.

   **Implementation Blueprint:**

   ```tsx
   import { getTenantById } from '@/lib/api/tenants'
   import { cookies } from 'next/headers'
   // ...

   type Props = {
     params: Promise<{ id: string }>
   }

   export default async function ViewTenantPage(props: Props) {
     // 1. Await Next.js 15 Async APIs
     const params = await props.params
     const tenantIdCookie = (await cookies()).get('tenant_id')?.value

     if (!tenantIdCookie) {
       return <div>Unauthenticated/No Tenant Setup</div>
     }

     // 2. Fetch data directly via RSC, passing TenantID explicitly
     const response = await getTenantById(tenantIdCookie, params.id)

     if (!response || !response.success || !response.data) {
       return <div>Tenant not found</div>
     }

     // 3. Transform and Forward
     const tenantData = transformTenantData(response.data)

     return <TenantDetails tenantData={tenantData} tenantId={params.id} />
   }
   ```

3. **Audit Other `(dashboard)` Branches:** Ensure equivalent pages like `billing/invoices/[id]/page.tsx` or `properties/units/[id]/page.tsx` conform to this RSC layout.

---

## Task 5: Zod Schema and Type Cleanup (Minor/Maintenance)

**Context:** Zod is well utilized, but transformations contain `TODO:` calculation notes.

1. **Target File:** `src/app/(dashboard)/tenants/[id]/page.tsx` (`transformTenantData`)
2. **Changes:**
   - Instead of shipping unresolved `- // TODO: Get from unit data` calculations to the client UI, offload this calculation to the Backend Data Transfer Objects (DTOs), or write strict local util parsers in `src/utils/math.ts` to aggregate properties.

---

## Final Verification Handshake

The developer/agent executing this plan must run the following validation workflow before returning the code:

1. `npm run test` -> Passes with valid Vitest summaries.
2. `npm run lint` -> Yields no warnings/errors.
3. `X-Tenant-ID` -> Is verified to be strictly passed parameter-by-parameter in all service layers utilizing Regex checks or codebase searches.
4. Refreshing arbitrary parameterized routes (e.g. `tenants/[id]`) correctly hits the server-side compiler without throwing Next.js 15 parameter resolution errors.
