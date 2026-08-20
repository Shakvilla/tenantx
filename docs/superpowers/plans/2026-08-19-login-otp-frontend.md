# Login OTP Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the shipped login-OTP backend reachable and operable from the web app — device identity, the challenge flow on both live login paths, phone verification, and an admin-console section that arms the feature without SQL.

**Architecture:** A single `getDeviceId()` module feeds four injection sites (two axios interceptors plus two calls that bypass them). One presentational `<OtpChallengeForm>` serves both login paths; each auth context owns its own `needsOtp` state transition, because the two success paths genuinely differ. Two small backend changes support it: an opt-out on device trust, and a distinct error code for an exhausted code.

**Tech Stack:** Next.js 15 (App Router), React 19, MUI v6, Tailwind v3, axios, Vitest + React Testing Library + happy-dom. Backend: Spring Boot 4 / Java 25, JUnit 5 + AssertJ + Mockito.

**Spec:** `docs/superpowers/specs/2026-08-19-login-otp-frontend-design.md`

## Global Constraints

- **Frontend branch:** `feat/login-otp-ui` in `/Users/mac/Desktop/TenantApp/Tenants`, cut from `origin/master` (`9906e1a`).
- **Backend branch:** `feat/login-otp` in `/Users/mac/Desktop/TenantApp/TenantX-backend`, at `c95868a`.
- **Never stage** `src/main/resources/application.properties`, `docker-compose.yml`, `.claude/`, `.superpowers/`, `.sdd-*.md`, or `Tenants/src/app/(dashboard)/settings/payment/page.tsx`.
- **Commit with explicit file paths only** — never `git add -A` or `git add .`. Never `git commit --amend`. Never `git stash -u`.
- **Never push.** Pushing requires explicit per-action instruction from the user.
- **Node:** the default shell `node` is v10 and breaks `tsc`/`vitest`. Run `source ~/.nvm/nvm.sh && nvm use 22` first in every shell that runs frontend tooling.
- **Backend build:** `./mvnw -o compile` only compiles main. After any constructor or signature change run `./mvnw -o test-compile`.
- **Backend test DB** is `localhost:5432/tenantx`, NOT the Docker app DB on `:55432`.
- **Device header name is exactly `X-Device-Id`** — this casing, everywhere.
- **localStorage key for the device id is exactly `tenantx_device_id`.**
- **The three verify request bodies are `{ pendingToken, otp, deviceId, rememberDevice }`** — identical across all three endpoints.
- **The challenge response is `{ otpRequired: true, pendingToken, channel, maskedTarget }`** and carries no token.
- **Copy rule:** an `OTP_INVALID` response renders ONE message regardless of cause. Never render, infer, or log anything that distinguishes wrong-code from device-mismatch from expired. `OTP_ATTEMPTS_EXHAUSTED` is the single deliberate exception.
- **Every assertion must be mutation-checked before being called green:** break the thing it claims to pin, observe red, restore. Report the mutation and its output.
- **Run every command synchronously.** Never background a build or test run.

---

## File Structure

**Backend — `/Users/mac/Desktop/TenantApp/TenantX-backend`**

| file | responsibility |
|---|---|
| `modules/auth/dto/VerifyLoginOtpRequestDto.java` | + `rememberDevice` |
| `modules/globalauth/dto/VerifySelectTenantOtpRequestDto.java` | + `rememberDevice` |
| `modules/admin/dto/VerifyAdminLoginOtpRequestDto.java` | + `rememberDevice` |
| `modules/auth/services/impl/AuthServiceImpl.java:432` | guard `trust()` |
| `modules/globalauth/services/impl/GlobalAuthServiceImpl.java:563` | guard `trust()` |
| `modules/admin/services/impl/AdminAuthServiceImpl.java:382` | guard `trust()` |
| `infrastructure/shared/enums/BusinessErrorCode.java` | + `OTP_ATTEMPTS_EXHAUSTED` |
| `modules/globalauth/services/impl/OtpServiceImpl.java:~630` | throw the new code from the exhausted branch only |

**Frontend — `/Users/mac/Desktop/TenantApp/Tenants`**

| file | responsibility |
|---|---|
| `src/lib/api/device-id.ts` | **new** — generate/persist the browser's device id |
| `src/lib/api/client.ts` | inject `X-Device-Id` in the tenant interceptor |
| `src/lib/api/admin-auth-client.ts` | inject in the admin interceptor **and** in `adminLogin`; add `verifyAdminLoginOtp` |
| `src/lib/api/auth-client.ts` | inject in `selectTenant`; add `verifySelectTenantOtp`; phone-verification calls |
| `src/lib/api/otp-errors.ts` | **new** — map a backend error to one user-facing message |
| `src/components/auth/OtpChallengeForm.tsx` | **new** — presentational challenge form |
| `src/components/auth/PhoneVerificationCard.tsx` | **new** — two-step phone widget, endpoint-parameterised |
| `src/components/auth/AuthShell.tsx` | **new** — the split-panel login layout, extracted so a third branch does not triple it |
| `src/contexts/AuthContext.tsx` | `needsOtp` branch on select-tenant |
| `src/contexts/AdminAuthContext.tsx` | `needsOtp` branch on admin login |
| `src/views/Login.tsx` | render the challenge branch |
| `src/views/admin/AdminLoginView.tsx` | render the challenge branch |
| `src/views/settings/security/SecuritySettingsView.tsx` | mount the phone card |
| `src/views/admin/AdminProfileView.tsx` | mount the phone card |
| `src/views/admin/AdminPlatformSettingsView.tsx` | new section 10, nine keys |

---

# BACKEND TASKS

## Task 1: `rememberDevice` opt-out on device trust

Work in `/Users/mac/Desktop/TenantApp/TenantX-backend` on `feat/login-otp`.

**Files:**
- Modify: `src/main/java/cloud/norgha/tenantx_backend/modules/auth/dto/VerifyLoginOtpRequestDto.java`
- Modify: `src/main/java/cloud/norgha/tenantx_backend/modules/globalauth/dto/VerifySelectTenantOtpRequestDto.java`
- Modify: `src/main/java/cloud/norgha/tenantx_backend/modules/admin/dto/VerifyAdminLoginOtpRequestDto.java`
- Modify: `src/main/java/cloud/norgha/tenantx_backend/modules/auth/services/impl/AuthServiceImpl.java:432`
- Modify: `src/main/java/cloud/norgha/tenantx_backend/modules/globalauth/services/impl/GlobalAuthServiceImpl.java:563`
- Modify: `src/main/java/cloud/norgha/tenantx_backend/modules/admin/services/impl/AdminAuthServiceImpl.java:382`
- Test: `src/test/java/cloud/norgha/tenantx_backend/modules/admin/services/impl/AdminLoginOtpIntegrationTest.java`

**Interfaces:**
- Produces: all three verify DTOs gain a fourth component `Boolean rememberDevice` (nullable). `rememberDevice == null` or `TRUE` → device trusted; `FALSE` → not trusted. Task 5 sends this field from the frontend.

- [ ] **Step 1: Write the failing tests**

Add to `AdminLoginOtpIntegrationTest`. This class already arms `otp.admin.login.enabled` in `@BeforeEach` and seeds an admin; follow its existing helpers for issuing a challenge and reading the code.

```java
    // ── rememberDevice ──────────────────────────────────────────────────────
    //
    // The device being trusted has just presented a valid, single-use, device-bound OTP, so
    // NOT trusting it is a user preference rather than a security control. The default when
    // the field is absent is therefore `trust` — the behaviour before this field existed —
    // because the opposite default would challenge on every login forever for any client that
    // forgot the field, which reads as a broken feature rather than as tighter security.

    @Test
    @DisplayName("rememberDevice=true trusts the device")
    void rememberDeviceTrueTrustsTheDevice() {
        SystemAdmin admin = seedAdmin();
        AuthResponseDto challenge = adminAuthService.login(
                new AdminLoginRequestDto(admin.getEmail(), RAW_PASSWORD), httpRequest(), DEVICE);

        adminAuthService.verifyLoginOtp(new VerifyAdminLoginOtpRequestDto(
                challenge.pendingToken(), latestOtpFor(admin), DEVICE, Boolean.TRUE), httpRequest());

        assertThat(trustedDeviceCount(admin)).isEqualTo(1);
    }

    @Test
    @DisplayName("rememberDevice=false completes the login but trusts nothing")
    void rememberDeviceFalseDoesNotTrustTheDevice() {
        SystemAdmin admin = seedAdmin();
        AuthResponseDto challenge = adminAuthService.login(
                new AdminLoginRequestDto(admin.getEmail(), RAW_PASSWORD), httpRequest(), DEVICE);

        AuthResponseDto session = adminAuthService.verifyLoginOtp(new VerifyAdminLoginOtpRequestDto(
                challenge.pendingToken(), latestOtpFor(admin), DEVICE, Boolean.FALSE), httpRequest());

        assertThat(session.accessToken())
                .as("declining to remember the device must not deny the session — the OTP was correct")
                .isNotBlank();
        assertThat(trustedDeviceCount(admin))
                .as("no trust row, so the next login from this device is challenged again")
                .isZero();
    }

    @Test
    @DisplayName("rememberDevice absent trusts, preserving pre-field behaviour")
    void rememberDeviceAbsentTrustsTheDevice() {
        SystemAdmin admin = seedAdmin();
        AuthResponseDto challenge = adminAuthService.login(
                new AdminLoginRequestDto(admin.getEmail(), RAW_PASSWORD), httpRequest(), DEVICE);

        adminAuthService.verifyLoginOtp(new VerifyAdminLoginOtpRequestDto(
                challenge.pendingToken(), latestOtpFor(admin), DEVICE, null), httpRequest());

        assertThat(trustedDeviceCount(admin)).isEqualTo(1);
    }
```

Add this helper to the same class if it does not already exist:

```java
    private int trustedDeviceCount(SystemAdmin admin) {
        return jdbc.queryForObject(
                "SELECT COUNT(*) FROM trusted_devices WHERE system_admin_id = ?",
                Integer.class, admin.getId());
    }
```

If `latestOtpFor(SystemAdmin)` does not exist in the class, add it, reading the most recent unused code the same way the class's existing tests do — do not invent a different mechanism.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd /Users/mac/Desktop/TenantApp/TenantX-backend && ./mvnw -o test -Dtest=AdminLoginOtpIntegrationTest
```

Expected: compilation failure — `VerifyAdminLoginOtpRequestDto` takes 3 components, not 4.

- [ ] **Step 3: Add the field to all three DTOs**

In each of the three DTOs, add a fourth component. Use this exact javadoc in `VerifyAdminLoginOtpRequestDto` and adapt the first line for the other two:

```java
        String deviceId,

        /**
         * Whether to remember this device, so a later login from it skips the challenge for
         * {@code otp.device.trust_days}.
         *
         * <p>Nullable, and {@code null} means TRUE — the behaviour before this field existed.
         * That default is deliberately the permissive one: the device reaching this point has
         * just presented a valid, single-use, device-bound OTP, so trusting it is never a
         * bypass, only a choice about how long the protection lasts. Defaulting the other way
         * would make any client that omits the field challenge on every login forever, which
         * reads as a broken feature and produces exactly the pressure to disable login OTP
         * outright.
         */
        Boolean rememberDevice
) {}
```

- [ ] **Step 4: Guard the three trust calls**

In `AuthServiceImpl:432`, `GlobalAuthServiceImpl:563`, and `AdminAuthServiceImpl:382`, replace the unconditional call. The existing comment above each call stays; add the guard and its own comment:

```java
        // Only now, past every check. trust() runs REQUIRES_NEW and so commits independently of
        // this transaction.
        //
        // `null` means true: see VerifyAdminLoginOtpRequestDto#rememberDevice. Skipping the
        // trust does NOT skip the session — the OTP was correct, so the login completes either
        // way; the only difference is whether the next login from this device is challenged.
        if (!Boolean.FALSE.equals(request.rememberDevice())) {
            trustedDeviceService.trust(principal, request.deviceId(), httpRequest.getHeader("User-Agent"));
        }
```

Use the same three lines in all three files, adjusting only the javadoc reference in the comment to that file's own DTO.

- [ ] **Step 5: Fix the other call sites the signature change breaks**

```bash
cd /Users/mac/Desktop/TenantApp/TenantX-backend && ./mvnw -o test-compile 2>&1 | grep -E "ERROR.*\.java" | head -30
```

Every existing construction of the three DTOs now needs a fourth argument. Pass `Boolean.TRUE` in existing tests — they were written against the trust-always behaviour and must keep asserting it.

- [ ] **Step 6: Run the tests to verify they pass**

```bash
cd /Users/mac/Desktop/TenantApp/TenantX-backend && ./mvnw -o test -Dtest='AdminLoginOtpIntegrationTest,AdminLoginOtpTest,TenantLoginOtpTest,TenantLoginOtpIntegrationTest,LandlordSelectTenantOtpTest,LandlordSelectTenantOtpIntegrationTest,LoginOtpIntegrationTest'
```

Expected: all pass.

- [ ] **Step 7: Mutation-check the default**

Invert the guard to `if (Boolean.TRUE.equals(request.rememberDevice()))`, which changes the absent case from trust to no-trust. Run:

```bash
cd /Users/mac/Desktop/TenantApp/TenantX-backend && ./mvnw -o test -Dtest=AdminLoginOtpIntegrationTest
```

Expected: `rememberDeviceAbsentTrustsTheDevice` FAILS. Then restore the original guard and re-run to confirm green. Report both outputs.

- [ ] **Step 8: Run the full suite**

```bash
cd /Users/mac/Desktop/TenantApp/TenantX-backend && ./mvnw -o test 2>&1 | grep -A3 "^\[INFO\] Results"
```

Expected: 0 failures, 0 errors.

- [ ] **Step 9: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/TenantX-backend
git add src/main/java/cloud/norgha/tenantx_backend/modules/auth/dto/VerifyLoginOtpRequestDto.java \
        src/main/java/cloud/norgha/tenantx_backend/modules/globalauth/dto/VerifySelectTenantOtpRequestDto.java \
        src/main/java/cloud/norgha/tenantx_backend/modules/admin/dto/VerifyAdminLoginOtpRequestDto.java \
        src/main/java/cloud/norgha/tenantx_backend/modules/auth/services/impl/AuthServiceImpl.java \
        src/main/java/cloud/norgha/tenantx_backend/modules/globalauth/services/impl/GlobalAuthServiceImpl.java \
        src/main/java/cloud/norgha/tenantx_backend/modules/admin/services/impl/AdminAuthServiceImpl.java
git add <every test file you touched, by explicit path>
git commit -m "feat(auth): let a user decline to have their device remembered"
```

---

## Task 2: A distinct error for an exhausted code

**Files:**
- Modify: `src/main/java/cloud/norgha/tenantx_backend/infrastructure/shared/enums/BusinessErrorCode.java:34-35`
- Modify: `src/main/java/cloud/norgha/tenantx_backend/modules/globalauth/services/impl/OtpServiceImpl.java` (the `attemptsExhausted` branch in `checkOtpGuards`, near line 627)
- Test: `src/test/java/cloud/norgha/tenantx_backend/modules/admin/services/impl/AdminLoginOtpIntegrationTest.java`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `BusinessErrorCode.OTP_ATTEMPTS_EXHAUSTED`, HTTP 400, thrown ONLY from the attempts-exhausted branch. Task 7 maps its code string to a distinct message.

**Critical constraint.** `checkOtpGuards` throws an identical `OTP_INVALID` for a wrong code, a device mismatch, and an expired code — deliberately, so that "none of them is an oracle". This task carves out exactly one exception and must not widen it. Those three causes stay indistinguishable.

- [ ] **Step 1: Write the failing tests**

```java
    // ── exhausted vs merely wrong ───────────────────────────────────────────

    @Test
    @DisplayName("the 6th attempt reports the code exhausted, not merely wrong")
    void exhaustedCodeIsReportedDistinctly() {
        SystemAdmin admin = seedAdmin();
        AuthResponseDto challenge = adminAuthService.login(
                new AdminLoginRequestDto(admin.getEmail(), RAW_PASSWORD), httpRequest(), DEVICE);
        String realCode = latestOtpFor(admin);

        for (int i = 0; i < 5; i++) {
            assertThatThrownBy(() -> adminAuthService.verifyLoginOtp(
                    new VerifyAdminLoginOtpRequestDto(challenge.pendingToken(), "000000", DEVICE, Boolean.TRUE),
                    httpRequest()))
                    .isInstanceOf(BusinessException.class)
                    .extracting(e -> ((BusinessException) e).getErrorCode())
                    .as("a wrong guess is only ever OTP_INVALID, attempt %s", i + 1)
                    .isEqualTo(BusinessErrorCode.OTP_INVALID);
        }

        // The REAL code now — the user finally typed it right, and it can no longer work.
        // Without a distinct code here the UI would repeat "that code isn't right", which is
        // both useless and untrue: the code is spent, and only starting over helps.
        assertThatThrownBy(() -> adminAuthService.verifyLoginOtp(
                new VerifyAdminLoginOtpRequestDto(challenge.pendingToken(), realCode, DEVICE, Boolean.TRUE),
                httpRequest()))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(BusinessErrorCode.OTP_ATTEMPTS_EXHAUSTED);
    }

    @Test
    @DisplayName("a device mismatch stays indistinguishable from a wrong code")
    void deviceMismatchIsStillOtpInvalid() {
        SystemAdmin admin = seedAdmin();
        AuthResponseDto challenge = adminAuthService.login(
                new AdminLoginRequestDto(admin.getEmail(), RAW_PASSWORD), httpRequest(), DEVICE);
        String realCode = latestOtpFor(admin);

        // Right code, wrong device. If this ever stops being OTP_INVALID, the API has become
        // an oracle telling an attacker which half of the pair they got right.
        assertThatThrownBy(() -> adminAuthService.verifyLoginOtp(
                new VerifyAdminLoginOtpRequestDto(challenge.pendingToken(), realCode, DEVICE_2, Boolean.TRUE),
                httpRequest()))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getErrorCode())
                .isEqualTo(BusinessErrorCode.OTP_INVALID);
    }
```

Add `private static final String DEVICE_2 = "admin-otp-device-02";` to the class if absent.

- [ ] **Step 2: Run to verify they fail**

```bash
cd /Users/mac/Desktop/TenantApp/TenantX-backend && ./mvnw -o test -Dtest=AdminLoginOtpIntegrationTest#exhaustedCodeIsReportedDistinctly+deviceMismatchIsStillOtpInvalid
```

Expected: `exhaustedCodeIsReportedDistinctly` fails (symbol `OTP_ATTEMPTS_EXHAUSTED` not found); `deviceMismatchIsStillOtpInvalid` should already pass.

- [ ] **Step 3: Add the error code**

In `BusinessErrorCode.java`, directly after `OTP_INVALID` (line 35):

```java
    // Split out of OTP_INVALID deliberately, and narrowly. checkOtpGuards keeps ONE
    // indistinguishable response for a wrong code, a device mismatch and an expired code, so
    // that none of them is an oracle. This is the single exception, and it is bounded:
    // it is reachable only after otp.verify.max_attempts failures, so it is not a cheap probe;
    // and it reveals a fact about the caller's OWN code — that it is spent — rather than
    // anything about whether a given guess was right, which device was expected, or whether
    // the account exists.
    //
    // It earns the exception because the user's next action differs. Every other cause means
    // "check what you typed"; this one means "nothing you type will work, start over" — and
    // reporting it as OTP_INVALID leaves someone entering the CORRECT code and being refused
    // with no explanation, which reads as the feature being broken.
    OTP_ATTEMPTS_EXHAUSTED(HttpStatus.BAD_REQUEST, "Too many incorrect attempts for this code"),
```

- [ ] **Step 4: Throw it from the exhausted branch only**

In `OtpServiceImpl#checkOtpGuards`, in the `if (attemptsExhausted)` block, change only the throw:

```java
            throw new BusinessException(BusinessErrorCode.OTP_ATTEMPTS_EXHAUSTED);
```

Leave the `deviceMismatch || codeMismatch` branch's `OTP_INVALID` exactly as it is. Update the class comment that currently says every guard "throws the exact same `BusinessException(OTP_INVALID)`, so none of them is an oracle" to state the new, bounded truth — that the three unsuccessful-guess causes remain identical and only exhaustion is distinguished.

- [ ] **Step 5: Run to verify they pass**

```bash
cd /Users/mac/Desktop/TenantApp/TenantX-backend && ./mvnw -o test -Dtest=AdminLoginOtpIntegrationTest
```

Expected: all pass.

- [ ] **Step 6: Mutation-check both directions**

Mutation A — collapse the split: change the exhausted branch back to `OTP_INVALID`. Expect `exhaustedCodeIsReportedDistinctly` red. Restore.

Mutation B — widen the split: change the `deviceMismatch || codeMismatch` branch to `OTP_ATTEMPTS_EXHAUSTED`. Expect `deviceMismatchIsStillOtpInvalid` red. Restore.

```bash
cd /Users/mac/Desktop/TenantApp/TenantX-backend && ./mvnw -o test -Dtest=AdminLoginOtpIntegrationTest
```

Report both outputs. Mutation B is the important one — it proves the guard against this exception widening later.

- [ ] **Step 7: Run the full suite**

```bash
cd /Users/mac/Desktop/TenantApp/TenantX-backend && ./mvnw -o test 2>&1 | grep -A3 "^\[INFO\] Results"
```

Some existing tests may assert `OTP_INVALID` on an exhausted code. If so, they were asserting the old behaviour: update them to `OTP_ATTEMPTS_EXHAUSTED` and say so in the report. Do not weaken an assertion to make it pass.

- [ ] **Step 8: Commit**

```bash
cd /Users/mac/Desktop/TenantApp/TenantX-backend
git add src/main/java/cloud/norgha/tenantx_backend/infrastructure/shared/enums/BusinessErrorCode.java \
        src/main/java/cloud/norgha/tenantx_backend/modules/globalauth/services/impl/OtpServiceImpl.java
git add <every test file you touched, by explicit path>
git commit -m "feat(auth): report an exhausted OTP distinctly from a wrong one"
```

---

# FRONTEND TASKS

All remaining tasks work in `/Users/mac/Desktop/TenantApp/Tenants` on `feat/login-otp-ui`.
Start every shell with:

```bash
source ~/.nvm/nvm.sh && nvm use 22 && cd /Users/mac/Desktop/TenantApp/Tenants
```

## Task 3: Device identity

**Files:**
- Create: `src/lib/api/device-id.ts`
- Test: `src/__tests__/auth/device-id.test.ts`

**Interfaces:**
- Produces: `getDeviceId(): string` and `DEVICE_ID_STORAGE_KEY = 'tenantx_device_id'`, both named exports. Tasks 4 and 5 consume `getDeviceId`.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/auth/device-id.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'

import { getDeviceId, DEVICE_ID_STORAGE_KEY } from '@/lib/api/device-id'

describe('getDeviceId', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('generates an id and persists it under the agreed key', () => {
    const id = getDeviceId()

    expect(id).not.toBe('')
    expect(localStorage.getItem(DEVICE_ID_STORAGE_KEY)).toBe(id)
  })

  // The whole feature rests on this: an id that changed per call would make every login look
  // like a new device, so the user would be challenged forever and never build any trust.
  it('returns the same id on every subsequent call', () => {
    const first = getDeviceId()
    const second = getDeviceId()
    const third = getDeviceId()

    expect(second).toBe(first)
    expect(third).toBe(first)
  })

  it('reuses an id already in storage rather than generating a new one', () => {
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, 'pre-existing-id')

    expect(getDeviceId()).toBe('pre-existing-id')
  })

  // Clearing site data legitimately yields a new device and therefore one extra challenge.
  it('generates a fresh id after storage is cleared', () => {
    const before = getDeviceId()
    localStorage.clear()
    const after = getDeviceId()

    expect(after).not.toBe(before)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/auth/device-id.test.ts
```

Expected: FAIL — cannot resolve `@/lib/api/device-id`.

- [ ] **Step 3: Implement**

Create `src/lib/api/device-id.ts`:

```ts
/**
 * The browser's device identity for login OTP.
 *
 * This is NOT a secret and NOT a credential. It names a browser so the backend can remember
 * that this particular browser already passed an OTP challenge, and skip the challenge for
 * `otp.device.trust_days`. Possessing it grants nothing on its own — trust is stored
 * server-side against (principal, device) and every use still requires a valid session or a
 * correct password first.
 *
 * ONE id per browser profile, shared by the landlord and platform-admin surfaces. It names the
 * browser, not the account; the backend already scopes trust per principal, so a second id
 * would only double the challenges without isolating anything.
 */
export const DEVICE_ID_STORAGE_KEY = 'tenantx_device_id'

export function getDeviceId(): string {
  // Server-rendered passes have no browser to identify. Returning '' rather than generating
  // one keeps a per-render random value out of the header, which would look like a brand new
  // device on every single request.
  if (typeof window === 'undefined') return ''

  const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY)

  if (existing) return existing

  const generated = crypto.randomUUID()

  window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, generated)

  return generated
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
npx vitest run src/__tests__/auth/device-id.test.ts
```

Expected: 4 passed.

- [ ] **Step 5: Mutation-check**

Change the implementation to always generate (`const generated = crypto.randomUUID(); window.localStorage.setItem(...); return generated`), skipping the `existing` read. Re-run: expect `returns the same id on every subsequent call` and `reuses an id already in storage` to FAIL. Restore and confirm green. Report the output.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/device-id.ts src/__tests__/auth/device-id.test.ts
git commit -m "feat(auth): give the browser a stable device id"
```

---

## Task 4: Send `X-Device-Id` from all four call sites

**Files:**
- Modify: `src/lib/api/client.ts` (the request interceptor, ~line 26)
- Modify: `src/lib/api/admin-auth-client.ts` (the request interceptor ~line 31, and `adminLogin` ~line 186)
- Modify: `src/lib/api/auth-client.ts` (`selectTenant`'s explicit `headers` object)
- Test: `src/__tests__/auth/device-header.test.ts`

**Interfaces:**
- Consumes: `getDeviceId()` from Task 3.
- Produces: every request from all four sites carries `X-Device-Id`.

**Why four sites and not one:** three of them bypass an interceptor. `adminLogin` uses a bare `axios.post`, and `selectTenant` passes its own `headers` object. An interceptor-only change silently misses the two calls that actually raise challenges.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/auth/device-header.test.ts`. Assert per call site against a stubbed axios adapter, not by reading the interceptor — reading the interceptor cannot prove the two bypassing sites send anything.

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'

import { getDeviceId } from '@/lib/api/device-id'

/**
 * Captures the config of every request axios makes, from any instance, by replacing the
 * adapter. This is what lets one test cover both interceptor-based and bare-axios call sites
 * with the same assertion — which matters, because the difference between them is exactly the
 * bug this test exists to catch.
 */
function captureRequests() {
  const seen: { url?: string; headers: Record<string, unknown> }[] = []

  const adapter = vi.fn(async (config: any) => {
    seen.push({
      url: config.url,
      headers: Object.fromEntries(
        typeof config.headers?.toJSON === 'function'
          ? Object.entries(config.headers.toJSON())
          : Object.entries(config.headers ?? {})
      )
    })

    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  })

  axios.defaults.adapter = adapter

  return seen
}

function headerOf(entry: { headers: Record<string, unknown> }, name: string): unknown {
  const key = Object.keys(entry.headers).find(k => k.toLowerCase() === name.toLowerCase())

  return key ? entry.headers[key] : undefined
}

describe('X-Device-Id is sent from every call site', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('the tenant interceptor sends it', async () => {
    const seen = captureRequests()
    const { apiGet, API_BASE } = await import('@/lib/api/client')

    await apiGet(`${API_BASE}/properties`)

    expect(headerOf(seen[0], 'X-Device-Id')).toBe(getDeviceId())
  })

  it('the admin interceptor sends it', async () => {
    const seen = captureRequests()
    const { getAdminMe } = await import('@/lib/api/admin-auth-client')

    await getAdminMe()

    expect(headerOf(seen[0], 'X-Device-Id')).toBe(getDeviceId())
  })

  // adminLogin uses a bare axios.post and never touches adminClient's interceptor.
  it('adminLogin sends it despite bypassing the admin interceptor', async () => {
    const seen = captureRequests()
    const { adminLogin } = await import('@/lib/api/admin-auth-client')

    await adminLogin('someone@example.com', 'password')

    expect(headerOf(seen[0], 'X-Device-Id')).toBe(getDeviceId())
  })

  // selectTenant passes its own headers object, which can silently replace the interceptor's.
  it('selectTenant sends it alongside its explicit Authorization header', async () => {
    const seen = captureRequests()

    localStorage.setItem('auth_token', 'global-token')

    const { selectTenant } = await import('@/lib/api/auth-client')

    await selectTenant('tenant-1')

    expect(headerOf(seen[0], 'X-Device-Id')).toBe(getDeviceId())
    expect(headerOf(seen[0], 'Authorization')).toBe('Bearer global-token')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/auth/device-header.test.ts
```

Expected: all four FAIL — the header is `undefined`.

- [ ] **Step 3: Inject in the tenant interceptor**

In `src/lib/api/client.ts`, import `getDeviceId` from `./device-id` and add inside the existing request interceptor, after the `X-Tenant-ID` block:

```ts
  // Identifies the browser for login OTP device trust. Set unconditionally rather than only
  // on auth routes: the backend reads it on /select-tenant, and a caller that overrides
  // `headers` still gets it because that override happens before this interceptor runs.
  if (!config.headers?.get('X-Device-Id')) {
    config.headers.set('X-Device-Id', getDeviceId())
  }
```

- [ ] **Step 4: Inject in the admin interceptor and in `adminLogin`**

In `src/lib/api/admin-auth-client.ts`, import `getDeviceId` from `./device-id`. Add to the request interceptor:

```ts
  if (!config.headers['X-Device-Id']) {
    config.headers['X-Device-Id'] = getDeviceId()
  }
```

And change `adminLogin`'s bare call — this one gets no interceptor at all, so the header must be passed explicitly:

```ts
export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse> {
  // Bare axios.post: no auth header is needed for login, and adminClient's interceptor never
  // runs here. X-Device-Id must therefore be passed explicitly — without it the backend
  // cannot tell whether this browser is already trusted, and rejects the login outright when
  // login OTP is armed.
  const res = await axios.post<AdminLoginResponse>(
    `${ADMIN_API_BASE}/auth/login`,
    { email, password },
    { headers: { 'X-Device-Id': getDeviceId() } }
  )

  setStoredAdminToken(res.data.accessToken)

  return res.data
}
```

Note: `adminLogin` will be revised again in Task 5 to handle a challenge response. Leave the `setStoredAdminToken` call as-is for now.

- [ ] **Step 5: Inject in `selectTenant`**

In `src/lib/api/auth-client.ts`, import `getDeviceId` from `./device-id` and extend the explicit headers object:

```ts
      {
        headers: {
          Authorization: `Bearer ${token}`,

          // This object REPLACES nothing the interceptor set, but stating the device id here
          // makes the requirement local to the call that depends on it: /select-tenant is one
          // of the two endpoints that raise an OTP challenge.
          'X-Device-Id': getDeviceId()
        },
      }
```

- [ ] **Step 6: Run to verify it passes**

```bash
npx vitest run src/__tests__/auth/device-header.test.ts
```

Expected: 4 passed.

- [ ] **Step 7: Mutation-check each site independently**

Remove the header line from ONE site at a time, run the suite, confirm exactly the matching test goes red, and restore. Four mutations, four single-test failures. If removing a line turns *no* test red, that test is not pinning what it claims and must be fixed before proceeding. Report all four outputs.

- [ ] **Step 8: Type-check and commit**

```bash
npm run type-check
git add src/lib/api/client.ts src/lib/api/admin-auth-client.ts src/lib/api/auth-client.ts src/__tests__/auth/device-header.test.ts
git commit -m "feat(auth): send X-Device-Id from every login call site"
```

---

## Task 5: OTP API types and verify calls

**Files:**
- Modify: `src/lib/api/auth-client.ts`
- Modify: `src/lib/api/admin-auth-client.ts`
- Test: `src/__tests__/auth/otp-clients.test.ts`

**Interfaces:**
- Consumes: `getDeviceId()` from Task 3.
- Produces, all named exports:
  - `interface OtpChallenge { otpRequired: true; pendingToken: string; channel: 'EMAIL' | 'SMS'; maskedTarget: string }`
  - `function isOtpChallenge(value: unknown): value is OtpChallenge`
  - `auth-client.ts`: `verifySelectTenantOtp(pendingToken: string, otp: string, rememberDevice: boolean): Promise<OtpVerifyResult>` where

    ```ts
    type OtpVerifyResult =
      | { success: true; data: SelectTenantResponse }
      // rawError is the original axios error, NOT a message. otpErrorMessage (Task 6) needs the
      // status and the backend's error code to tell OTP_ATTEMPTS_EXHAUSTED from OTP_INVALID,
      // and apiPost's rethrown Error has already discarded both.
      | { success: false; data: null; rawError: unknown }
    ```

    `selectTenant` now returns `ApiResponse<SelectTenantResponse | OtpChallenge>`
  - `admin-auth-client.ts`: `verifyAdminLoginOtp(pendingToken: string, otp: string, rememberDevice: boolean): Promise<AdminLoginResponse>`; `adminLogin` now returns `AdminLoginResponse | OtpChallenge`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/auth/otp-clients.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import axios from 'axios'

import { getDeviceId } from '@/lib/api/device-id'

function captureRequests() {
  const seen: { url?: string; data: any }[] = []

  axios.defaults.adapter = vi.fn(async (config: any) => {
    seen.push({ url: config.url, data: config.data ? JSON.parse(config.data) : undefined })

    return { data: {}, status: 200, statusText: 'OK', headers: {}, config }
  })

  return seen
}

function respondWith(payload: unknown) {
  axios.defaults.adapter = vi.fn(async (config: any) => ({
    data: payload, status: 200, statusText: 'OK', headers: {}, config
  }))
}

describe('isOtpChallenge', () => {
  it('recognises a challenge and rejects a session', async () => {
    const { isOtpChallenge } = await import('@/lib/api/auth-client')

    expect(isOtpChallenge({ otpRequired: true, pendingToken: 't', channel: 'EMAIL', maskedTarget: 'a***@b.com' })).toBe(true)
    expect(isOtpChallenge({ accessToken: 'real-token', refreshToken: 'r' })).toBe(false)
    expect(isOtpChallenge(null)).toBe(false)
  })
})

describe('the challenge carries no session', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  // The invariant the whole feature rests on: a challenge must never leave a usable token
  // behind, or the OTP step is decorative.
  it('selectTenant stores nothing when challenged', async () => {
    respondWith({ otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' })
    localStorage.setItem('auth_token', 'global-token')

    const { selectTenant } = await import('@/lib/api/auth-client')
    const result = await selectTenant('tenant-1')

    expect(result.success).toBe(true)
    expect((result.data as any).otpRequired).toBe(true)
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(localStorage.getItem('tenant_id')).toBeNull()
    expect(document.cookie).not.toContain('tenant_id=')
  })

  it('adminLogin stores no admin token when challenged', async () => {
    respondWith({ otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' })

    const { adminLogin } = await import('@/lib/api/admin-auth-client')
    const result = await adminLogin('admin@example.com', 'password')

    expect((result as any).otpRequired).toBe(true)
    expect(localStorage.getItem('admin_token')).toBeNull()
  })
})

describe('verify calls', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.resetModules()
  })

  it('verifySelectTenantOtp posts the agreed body including rememberDevice', async () => {
    const seen = captureRequests()
    const { verifySelectTenantOtp } = await import('@/lib/api/auth-client')

    await verifySelectTenantOtp('pending-token', '123456', false)

    expect(seen[0].url).toContain('/global/auth/select-tenant/verify-otp')
    expect(seen[0].data).toEqual({
      pendingToken: 'pending-token',
      otp: '123456',
      deviceId: getDeviceId(),
      rememberDevice: false
    })
  })

  it('verifyAdminLoginOtp posts the agreed body including rememberDevice', async () => {
    const seen = captureRequests()
    const { verifyAdminLoginOtp } = await import('@/lib/api/admin-auth-client')

    await verifyAdminLoginOtp('pending-token', '654321', true)

    expect(seen[0].url).toContain('/auth/verify-otp')
    expect(seen[0].data).toEqual({
      pendingToken: 'pending-token',
      otp: '654321',
      deviceId: getDeviceId(),
      rememberDevice: true
    })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/auth/otp-clients.test.ts
```

Expected: FAIL — `isOtpChallenge`, `verifySelectTenantOtp`, `verifyAdminLoginOtp` are not exported.

- [ ] **Step 3: Add the shared types to `auth-client.ts`**

```ts
/**
 * A login-OTP challenge. Returned by /select-tenant and /admin/auth/login in place of a
 * session when the device is not trusted and login OTP is armed.
 *
 * It deliberately carries NO token of any kind. That is what makes the OTP step unskippable:
 * there is nothing here a client could store and use, so the only way forward is to verify.
 */
export interface OtpChallenge {
  otpRequired: true
  pendingToken: string
  channel: 'EMAIL' | 'SMS'
  maskedTarget: string
}

/** Narrows a login response to a challenge. Keyed on `otpRequired`, the flag the backend sets. */
export function isOtpChallenge(value: unknown): value is OtpChallenge {
  return typeof value === 'object' && value !== null && (value as { otpRequired?: unknown }).otpRequired === true
}
```

- [ ] **Step 4: Branch `selectTenant` and add `verifySelectTenantOtp`**

Change `selectTenant`'s return type to `Promise<ApiResponse<SelectTenantResponse | OtpChallenge>>` and guard the storage calls:

```ts
    const data = await apiPost<SelectTenantResponse | OtpChallenge>(
      `${API_BASE}/global/auth/select-tenant`,
      { tenantId },
      { headers: { Authorization: `Bearer ${token}`, 'X-Device-Id': getDeviceId() } }
    )

    // A challenge is not a session. Storing anything here — even the tenant id — would leave
    // the app in a half-authenticated state that middleware and the interceptors would treat
    // as real.
    if (isOtpChallenge(data)) {
      return { success: true, data }
    }

    setStoredTokens(data.accessToken, data.refreshToken)
    setStoredTenantId(tenantId)
    // ...rest of the existing success path, unchanged
```

Then add:

```ts
export type OtpVerifyResult =
  | { success: true; data: SelectTenantResponse }
  | { success: false; data: null; rawError: unknown }

/**
 * Completes the login-OTP challenge raised by {@link selectTenant}.
 *
 * On success this is indistinguishable from an unchallenged /select-tenant: same response
 * shape, same storage. The caller's success path is therefore identical either way.
 *
 * Posts through `apiClient` rather than the `apiPost` helper, deliberately. `apiPost` catches
 * the AxiosError and rethrows a plain Error carrying only a message — which discards the HTTP
 * status and the backend's error code, the two things `otpErrorMessage` needs to tell an
 * exhausted code from a merely wrong one. The raw error is handed upward instead, and only the
 * caller turns it into words.
 */
export async function verifySelectTenantOtp(
  pendingToken: string,
  otp: string,
  rememberDevice: boolean
): Promise<OtpVerifyResult> {
  try {
    const response = await apiClient.post<SelectTenantResponse>(
      `${API_BASE}/global/auth/select-tenant/verify-otp`,
      { pendingToken, otp, deviceId: getDeviceId(), rememberDevice }
    )

    setStoredTokens(response.data.accessToken, response.data.refreshToken)

    return { success: true, data: response.data }
  } catch (error: unknown) {
    return { success: false, data: null, rawError: error }
  }
}
```

`apiClient` is not currently exported from `client.ts` — add `export` to its declaration. Note this function stores the tokens itself, exactly as `selectTenant`'s success path does; `setStoredTenantId` is left to the caller, which knows the workspace.

- [ ] **Step 5: Branch `adminLogin` and add `verifyAdminLoginOtp`**

```ts
export async function adminLogin(email: string, password: string): Promise<AdminLoginResponse | OtpChallenge> {
  const res = await axios.post<AdminLoginResponse | OtpChallenge>(
    `${ADMIN_API_BASE}/auth/login`,
    { email, password },
    { headers: { 'X-Device-Id': getDeviceId() } }
  )

  // No token is minted alongside a challenge, so there is nothing to store and storing the
  // undefined accessToken would corrupt the session state.
  if (isOtpChallenge(res.data)) return res.data

  setStoredAdminToken(res.data.accessToken)

  return res.data
}

/**
 * Completes the login-OTP challenge raised by {@link adminLogin}. On success the stored admin
 * token is identical to an unchallenged login's.
 */
export async function verifyAdminLoginOtp(
  pendingToken: string,
  otp: string,
  rememberDevice: boolean
): Promise<AdminLoginResponse> {
  const res = await axios.post<AdminLoginResponse>(
    `${ADMIN_API_BASE}/auth/verify-otp`,
    { pendingToken, otp, deviceId: getDeviceId(), rememberDevice }
  )

  setStoredAdminToken(res.data.accessToken)

  return res.data
}
```

Import `OtpChallenge` and `isOtpChallenge` from `./auth-client`.

- [ ] **Step 6: Run to verify it passes**

```bash
npx vitest run src/__tests__/auth/otp-clients.test.ts
```

Expected: 6 passed.

- [ ] **Step 7: Mutation-check the invariant**

Remove the `if (isOtpChallenge(data)) return ...` early return from `selectTenant`, so a challenge falls through to `setStoredTokens`. Re-run: expect `selectTenant stores nothing when challenged` to FAIL. Restore, confirm green, report the output. This is the single most important assertion in the frontend half.

- [ ] **Step 8: Type-check and commit**

```bash
npm run type-check
git add src/lib/api/auth-client.ts src/lib/api/admin-auth-client.ts src/__tests__/auth/otp-clients.test.ts
git commit -m "feat(auth): OTP challenge types and verify calls for both login paths"
```

---

## Task 6: `otpErrorMessage` — one message per distinguishable condition

**Files:**
- Create: `src/lib/api/otp-errors.ts`
- Test: `src/__tests__/auth/otp-errors.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `otpErrorMessage(error: unknown): { message: string; startOver: boolean }`. `startOver: true` means the caller should return to the login form rather than let the user retype a code.

**Critical constraint.** `OTP_INVALID` covers a wrong code, a device mismatch, and an expired code, and gets ONE message. Do not add branches that distinguish them — the backend refuses to be an oracle and the UI must not become one.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/auth/otp-errors.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

import { otpErrorMessage } from '@/lib/api/otp-errors'

function backendError(status: number, code?: string) {
  return { response: { status, data: { code } } }
}

describe('otpErrorMessage', () => {
  it('gives one message for every OTP_INVALID cause', () => {
    const result = otpErrorMessage(backendError(400, 'OTP_INVALID'))

    expect(result.message).toMatch(/wrong, expired, or already used/i)
    expect(result.startOver).toBe(false)
  })

  it('tells the user to start over when the code is exhausted', () => {
    const result = otpErrorMessage(backendError(400, 'OTP_ATTEMPTS_EXHAUSTED'))

    expect(result.message).toMatch(/used all/i)
    expect(result.startOver).toBe(true)
  })

  it('names the wait when the send budget is spent', () => {
    const result = otpErrorMessage(backendError(429))

    expect(result.message).toMatch(/too many/i)
    expect(result.startOver).toBe(false)
  })

  it('sends the user back to the login form when the pending token is dead', () => {
    const result = otpErrorMessage(backendError(403))

    expect(result.startOver).toBe(true)
  })

  // A missing device id is OUR bug. Blaming the user's typing for it is how the backend's
  // @NotBlank guard came to exist in the first place: a null device id reads as a device
  // mismatch, indistinguishable from a wrong code, silently burning real attempts.
  it('does not blame the user for a missing device id', () => {
    const result = otpErrorMessage(backendError(400, 'DEVICE_ID_REQUIRED'))

    expect(result.message).not.toMatch(/code/i)
    expect(result.startOver).toBe(true)
  })

  it('falls back to a generic message for anything unrecognised', () => {
    expect(otpErrorMessage(new Error('socket hang up')).message).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/auth/otp-errors.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/lib/api/otp-errors.ts`:

```ts
/**
 * Maps a failed OTP verification to what the user should read and do next.
 *
 * The backend throws an IDENTICAL error for a wrong code, a device mismatch and an expired
 * code, on purpose, so that none of them is an oracle. This module preserves that: those three
 * share one message, and nothing here may branch on anything that would let a caller tell them
 * apart. `OTP_ATTEMPTS_EXHAUSTED` is the single deliberate exception, because there — and only
 * there — the user's next action genuinely differs: no code they can type will work.
 */
export interface OtpErrorDisplay {
  message: string

  /** True when retyping a code cannot help, so the UI should return to the login form. */
  startOver: boolean
}

export function otpErrorMessage(error: unknown): OtpErrorDisplay {
  const response = (error as { response?: { status?: number; data?: { code?: string } } })?.response
  const status = response?.status
  const code = response?.data?.code

  if (code === 'OTP_ATTEMPTS_EXHAUSTED') {
    return {
      message: 'You’ve used all attempts for this code. Start over to get a new one.',
      startOver: true
    }
  }

  if (code === 'DEVICE_ID_REQUIRED') {
    // Nothing the user typed caused this and nothing they type will fix it.
    return {
      message: 'Something went wrong on our side identifying this browser. Please start over.',
      startOver: true
    }
  }

  if (status === 429) {
    return {
      message: 'Too many codes requested. Try again in an hour.',
      startOver: false
    }
  }

  if (status === 403) {
    return {
      message: 'This sign-in attempt has expired. Please sign in again.',
      startOver: true
    }
  }

  if (code === 'OTP_INVALID' || status === 400) {
    return {
      message: 'That code isn’t valid. It may be wrong, expired, or already used. Start over to get a new one.',
      startOver: false
    }
  }

  return {
    message: 'We couldn’t verify that code. Please try again.',
    startOver: false
  }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
npx vitest run src/__tests__/auth/otp-errors.test.ts
```

Expected: 6 passed.

- [ ] **Step 5: Add the oracle guard and mutation-check it**

Add this test to the same file:

```ts
  // Guards the property, not an example: the module must not grow a branch that reveals WHICH
  // of the three causes occurred. A no-oracle property erodes one reasonable-looking commit
  // at a time, and this is the commit that would notice.
  it('never distinguishes the OTP_INVALID causes', () => {
    const forbidden = /device|mismatch|expired code|wrong code|incorrect code/i
    const result = otpErrorMessage(backendError(400, 'OTP_INVALID'))

    expect(result.message).not.toMatch(forbidden)
  })
```

Note the `OTP_INVALID` message legitimately contains the word "expired" as part of a list of possibilities; the regex targets `expired code` specifically, which would assert a single cause. Verify this test passes, then mutation-check it by changing the `OTP_INVALID` message to `'That code is wrong.'` and confirming the earlier `gives one message for every OTP_INVALID cause` test goes red. Restore and report.

- [ ] **Step 6: Commit**

```bash
git add src/lib/api/otp-errors.ts src/__tests__/auth/otp-errors.test.ts
git commit -m "feat(auth): one user-facing message per distinguishable OTP failure"
```

---

## Task 7: `<OtpChallengeForm>`

**Files:**
- Create: `src/components/auth/OtpChallengeForm.tsx`
- Test: `src/__tests__/auth/OtpChallengeForm.test.tsx`

**Interfaces:**
- Consumes: nothing (purely presentational).
- Produces:

```ts
export interface OtpChallengeFormProps {
  channel: 'EMAIL' | 'SMS'
  maskedTarget: string
  isSubmitting: boolean
  error: string | null
  onSubmit: (otp: string, rememberDevice: boolean) => void
  onResend?: () => void
  onStartOver: () => void
}
```

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/auth/OtpChallengeForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import OtpChallengeForm from '@/components/auth/OtpChallengeForm'

function renderForm(overrides: Partial<React.ComponentProps<typeof OtpChallengeForm>> = {}) {
  const props = {
    channel: 'EMAIL' as const,
    maskedTarget: 'j***@example.com',
    isSubmitting: false,
    error: null,
    onSubmit: vi.fn(),
    onStartOver: vi.fn(),
    ...overrides
  }

  render(<OtpChallengeForm {...props} />)

  return props
}

describe('OtpChallengeForm', () => {
  it('shows where the code was sent, without the full address', () => {
    renderForm()

    expect(screen.getByText(/j\*\*\*@example\.com/)).toBeInTheDocument()
  })

  it('submits the code with rememberDevice true by default', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.type(screen.getByLabelText(/verification code/i), '123456')
    await user.click(screen.getByRole('button', { name: /verify/i }))

    expect(props.onSubmit).toHaveBeenCalledWith('123456', true)
  })

  it('submits rememberDevice false when the box is unchecked', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.click(screen.getByRole('checkbox', { name: /remember this device/i }))
    await user.type(screen.getByLabelText(/verification code/i), '123456')
    await user.click(screen.getByRole('button', { name: /verify/i }))

    expect(props.onSubmit).toHaveBeenCalledWith('123456', false)
  })

  it('will not submit a code shorter than six digits', async () => {
    const user = userEvent.setup()
    const props = renderForm()

    await user.type(screen.getByLabelText(/verification code/i), '123')

    expect(screen.getByRole('button', { name: /verify/i })).toBeDisabled()
    expect(props.onSubmit).not.toHaveBeenCalled()
  })

  it('renders the error it is given', () => {
    renderForm({ error: 'That code isn’t valid.' })

    expect(screen.getByText(/that code isn’t valid/i)).toBeInTheDocument()
  })

  // A path that cannot resend must not show a resend control at all. A disabled one would
  // imply a temporary state and invite the user to wait for something that never arrives.
  it('offers resend only when the caller can resend', () => {
    const { unmount } = render(
      <OtpChallengeForm
        channel='EMAIL' maskedTarget='a***@b.com' isSubmitting={false} error={null}
        onSubmit={vi.fn()} onStartOver={vi.fn()} onResend={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: /send a new code/i })).toBeInTheDocument()
    unmount()

    renderForm()
    expect(screen.queryByRole('button', { name: /send a new code/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /start over/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/auth/OtpChallengeForm.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `src/components/auth/OtpChallengeForm.tsx`:

```tsx
'use client'

import { useState } from 'react'

import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

const OTP_LENGTH = 6

export interface OtpChallengeFormProps {
  channel: 'EMAIL' | 'SMS'

  /** e.g. "j***@example.com" or "***4072" — never the full address or number. */
  maskedTarget: string

  isSubmitting: boolean

  /**
   * The message from `otpErrorMessage`. There is deliberately no attempt counter: the backend
   * returns none, and inferring one client-side would turn the UI into the oracle the backend
   * refuses to be.
   */
  error: string | null

  onSubmit: (otp: string, rememberDevice: boolean) => void

  /** Omit entirely where the path cannot resend — a "Start over" link is rendered instead. */
  onResend?: () => void

  onStartOver: () => void
}

export default function OtpChallengeForm({
  channel,
  maskedTarget,
  isSubmitting,
  error,
  onSubmit,
  onResend,
  onStartOver
}: OtpChallengeFormProps) {
  const [otp, setOtp] = useState('')
  const [rememberDevice, setRememberDevice] = useState(true)

  const canSubmit = otp.length === OTP_LENGTH && !isSubmitting

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (canSubmit) onSubmit(otp, rememberDevice)
  }

  return (
    <form noValidate autoComplete='off' onSubmit={handleSubmit} className='flex flex-col gap-5'>
      <Box>
        <Typography variant='h5'>Confirm it’s you</Typography>
        <Typography variant='body2' color='text.secondary' className='mt-1'>
          We sent a {OTP_LENGTH}-digit code by {channel === 'SMS' ? 'text message' : 'email'} to{' '}
          <strong>{maskedTarget}</strong>. We ask for this the first time you sign in from a
          browser we don’t recognise.
        </Typography>
      </Box>

      {error && <Alert severity='error'>{error}</Alert>}

      <TextField
        autoFocus
        fullWidth
        label='Verification code'
        value={otp}
        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH))}
        inputProps={{ inputMode: 'numeric', autoComplete: 'one-time-code', maxLength: OTP_LENGTH }}
      />

      <FormControlLabel
        control={<Checkbox checked={rememberDevice} onChange={e => setRememberDevice(e.target.checked)} />}
        label='Remember this device'
      />
      <Typography variant='caption' color='text.secondary' sx={{ mt: -2 }}>
        Leave this unchecked on a shared or public computer — we’ll ask for a code every time.
      </Typography>

      <Button fullWidth variant='contained' type='submit' disabled={!canSubmit}>
        {isSubmitting ? <CircularProgress size={22} color='inherit' /> : 'Verify'}
      </Button>

      <Box className='flex justify-center gap-4'>
        {onResend && (
          <Button size='small' onClick={onResend} disabled={isSubmitting}>
            Send a new code
          </Button>
        )}
        <Button size='small' color='secondary' onClick={onStartOver} disabled={isSubmitting}>
          Start over
        </Button>
      </Box>
    </form>
  )
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
npx vitest run src/__tests__/auth/OtpChallengeForm.test.tsx
```

Expected: 6 passed.

- [ ] **Step 5: Mutation-check the default**

Change `useState(true)` to `useState(false)` for `rememberDevice`. Expect `submits the code with rememberDevice true by default` to FAIL. Restore, confirm green, report.

- [ ] **Step 6: Commit**

```bash
git add src/components/auth/OtpChallengeForm.tsx src/__tests__/auth/OtpChallengeForm.test.tsx
git commit -m "feat(auth): shared OTP challenge form"
```

---

## Task 8: Landlord challenge — `AuthContext` + `Login`

**Files:**
- Create: `src/components/auth/AuthShell.tsx`
- Modify: `src/contexts/AuthContext.tsx`
- Modify: `src/views/Login.tsx`
- Test: `src/__tests__/auth/AuthContext.otp.test.tsx`

**Interfaces:**
- Consumes: `verifySelectTenantOtp`, `isOtpChallenge`, `OtpChallenge` (Task 5); `otpErrorMessage` (Task 6); `OtpChallengeForm` (Task 7).
- Produces on the `useAuth()` value:
  - state: `needsOtp: boolean`, `otpChallenge: (OtpChallenge & { workspace: Workspace }) | null`
  - `verifyOtp(otp: string, rememberDevice: boolean): Promise<{ success: boolean; error?: string; startOver?: boolean }>`
  - `resendOtp(): Promise<void>` — re-runs `selectTenant` for the stored workspace
  - `cancelOtp(): void` — clears the challenge and returns to the workspace/login step

**Why `AuthShell` is part of this task:** `Login.tsx` currently repeats a ~40-line split-panel layout for its workspace-selection branch. Adding a third branch would make three copies. Extract it once here, into the task whose deliverable needs it.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/auth/AuthContext.otp.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'

import { AuthProvider, useAuth } from '@/contexts/AuthContext'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }))
vi.mock('@/lib/api/auth-client', async () => {
  const actual = await vi.importActual<any>('@/lib/api/auth-client')

  return {
    ...actual,
    selectTenant: vi.fn(),
    verifySelectTenantOtp: vi.fn(),
    getCurrentUser: vi.fn().mockResolvedValue({ success: false, data: null }),
    getStoredToken: vi.fn(() => null),
    getStoredTenantId: vi.fn(() => null)
  }
})

import { selectTenant, verifySelectTenantOtp } from '@/lib/api/auth-client'

const WORKSPACE = { tenantId: 't-1', tenantName: 'Atkaada', role: 'OWNER', userType: 'LANDLORD' }

let api: ReturnType<typeof useAuth>

function Probe() {
  api = useAuth()

  return <div data-testid='needs-otp'>{String(api.needsOtp)}</div>
}

function renderProvider() {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  )
}

describe('AuthContext login-OTP branch', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('enters the challenge state and stores no session', async () => {
    ;(selectTenant as any).mockResolvedValue({
      success: true,
      data: { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }
    })

    renderProvider()
    await act(async () => { await api.selectWorkspace(WORKSPACE as any) })

    await waitFor(() => expect(screen.getByTestId('needs-otp')).toHaveTextContent('true'))
    expect(api.isAuthenticated).toBe(false)
    expect(api.otpChallenge?.pendingToken).toBe('pending')
    expect(api.otpChallenge?.workspace.tenantId).toBe('t-1')
  })

  // The success path after a challenge must be the SAME path as an unchallenged login, or the
  // two drift and only one of them stays correct.
  it('lands in the identical authenticated state after verifying', async () => {
    ;(selectTenant as any).mockResolvedValue({
      success: true,
      data: { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }
    })
    ;(verifySelectTenantOtp as any).mockResolvedValue({
      success: true,
      data: {
        accessToken: 'tenant-token', refreshToken: 'refresh', tokenType: 'Bearer',
        expiresIn: 3600, expiresAt: '', user: { id: 'u1', email: 'a@b.com', fullName: 'A B', companyName: '', active: true, createdAt: '' }
      }
    })

    renderProvider()
    await act(async () => { await api.selectWorkspace(WORKSPACE as any) })
    await act(async () => { await api.verifyOtp('123456', true) })

    await waitFor(() => expect(api.isAuthenticated).toBe(true))
    expect(api.needsOtp).toBe(false)
    expect(api.tenant?.id).toBe('t-1')
    expect(api.user?.role).toBe('OWNER')
    expect(api.user?.userType).toBe('LANDLORD')
  })

  it('passes rememberDevice through to the verify call', async () => {
    ;(selectTenant as any).mockResolvedValue({
      success: true,
      data: { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }
    })
    ;(verifySelectTenantOtp as any).mockResolvedValue({ success: false, data: null, error: { code: 'X', message: 'no' } })

    renderProvider()
    await act(async () => { await api.selectWorkspace(WORKSPACE as any) })
    await act(async () => { await api.verifyOtp('123456', false) })

    expect(verifySelectTenantOtp).toHaveBeenCalledWith('pending', '123456', false)
  })

  it('resend re-runs select-tenant for the same workspace', async () => {
    ;(selectTenant as any).mockResolvedValue({
      success: true,
      data: { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }
    })

    renderProvider()
    await act(async () => { await api.selectWorkspace(WORKSPACE as any) })
    await act(async () => { await api.resendOtp() })

    expect(selectTenant).toHaveBeenCalledTimes(2)
    expect((selectTenant as any).mock.calls[1][0]).toBe('t-1')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/auth/AuthContext.otp.test.tsx
```

Expected: FAIL — `needsOtp` / `verifyOtp` do not exist.

- [ ] **Step 3: Extend the AuthContext state**

Add to `AuthState`:

```ts
  needsOtp: boolean

  /** The live challenge plus the workspace it was raised for, so resend and verify can finish it. */
  otpChallenge: (OtpChallenge & { workspace: Workspace }) | null
```

Initialise both (`needsOtp: false`, `otpChallenge: null`) in the `useState` call and in **every** `setState({...})` that replaces the whole object — there are several, and missing one leaves a stale challenge visible after logout.

Add to `AuthContextValue`:

```ts
  verifyOtp: (otp: string, rememberDevice: boolean) => Promise<{ success: boolean; error?: string; startOver?: boolean }>
  resendOtp: () => Promise<void>
  cancelOtp: () => void
```

- [ ] **Step 4: Branch `handleSelectWorkspace` and add the three methods**

In `handleSelectWorkspace`, immediately after the `!result.success || !result.data` guard:

```ts
    // A challenge, not a session. Everything below this point assumes tokens exist.
    if (isOtpChallenge(result.data)) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        needsOtp: true,
        otpChallenge: { ...result.data as OtpChallenge, workspace }
      }))

      return { success: true }
    }

    const tenantData = result.data as SelectTenantResponse
```

Then extract the existing post-select body — from `setStoredUserRole(...)` through the final `setState({...})` — into a single function so the challenged and unchallenged paths share one implementation:

```ts
  /**
   * The one and only place a landlord session is established. Both the unchallenged
   * /select-tenant path and the post-OTP path call this, so the two cannot drift apart.
   */
  const establishTenantSession = (tenantData: SelectTenantResponse, workspace: Workspace) => {
    setStoredUserRole(workspace.role)
    setStoredUserType(workspace.userType)

    setState({
      user: tenantData.user
        ? mapProfileToUser(tenantData.user, workspace.role, workspace.userType)
        : { id: '', email: '', name: '', role: workspace.role, userType: workspace.userType },
      tenant: { id: workspace.tenantId, name: workspace.tenantName },
      isAuthenticated: true,
      isLoading: false,
      isRefreshing: false,
      pendingWorkspaces: null,
      needsWorkspaceSelection: false,
      needsPasswordSetup: false,
      needsOtp: false,
      otpChallenge: null
    })
  }
```

Then:

```ts
  const verifyOtp = useCallback(async (otp: string, rememberDevice: boolean) => {
    const challenge = stateRef.current.otpChallenge

    if (!challenge) return { success: false, error: 'No verification in progress.', startOver: true }

    setState(prev => ({ ...prev, isLoading: true }))

    const result = await verifySelectTenantOtp(challenge.pendingToken, otp, rememberDevice)

    if (!result.success || !result.data) {
      const display = otpErrorMessage(result.rawError)

      setState(prev => ({
        ...prev,
        isLoading: false,
        needsOtp: !display.startOver,
        otpChallenge: display.startOver ? null : prev.otpChallenge
      }))

      return { success: false, error: display.message, startOver: display.startOver }
    }

    establishTenantSession(result.data, challenge.workspace)

    return { success: true }
  }, [])

  const resendOtp = useCallback(async () => {
    const challenge = stateRef.current.otpChallenge

    if (!challenge) return

    // A true resend: /select-tenant needs only the global token, which is still held. No
    // credentials are kept anywhere to make this possible.
    const result = await selectTenant(challenge.workspace.tenantId)

    if (result.success && isOtpChallenge(result.data)) {
      setState(prev => ({
        ...prev,
        otpChallenge: { ...(result.data as OtpChallenge), workspace: challenge.workspace }
      }))
    }
  }, [])

  const cancelOtp = useCallback(() => {
    setState(prev => ({ ...prev, needsOtp: false, otpChallenge: null }))
  }, [])
```

`stateRef` is a `useRef` kept in sync with `state` via a `useEffect`, so these `useCallback`s can read the current challenge without listing `state` as a dependency (the file's existing callbacks all use `[]` deps with an eslint-disable; follow that pattern rather than changing it):

```ts
  const stateRef = useRef(state)

  useEffect(() => { stateRef.current = state }, [state])
```

Add `verifyOtp`, `resendOtp`, `cancelOtp` to the provider's `value`.

**On `result.rawError`:** `verifySelectTenantOtp` from Task 5 returns `{ success, data, error }`. Extend its failure branch to also return `rawError: error` (the original axios error object) so `otpErrorMessage` can read the status and code. Update Task 5's type accordingly if you have not already.

- [ ] **Step 5: Run the context tests**

```bash
npx vitest run src/__tests__/auth/AuthContext.otp.test.tsx
```

Expected: 4 passed.

- [ ] **Step 6: Extract `AuthShell` and render the branch in `Login.tsx`**

Create `src/components/auth/AuthShell.tsx` holding exactly the split-panel markup currently duplicated in `Login.tsx`'s workspace-selection branch and its main form branch — the illustration column, the background image, the `<Logo />` link, and the content column:

```tsx
'use client'

import type { ReactNode } from 'react'

import classnames from 'classnames'

import Link from '@components/Link'
import Logo from '@components/layout/shared/Logo'

/**
 * The split-panel login layout, extracted because Login.tsx renders three branches through it
 * (main form, workspace selection, OTP challenge) and three copies of forty lines of layout is
 * three places for them to drift.
 */
export default function AuthShell({
  children,
  characterIllustration,
  authBackground,
  bordered
}: {
  children: ReactNode
  characterIllustration: string
  authBackground: string
  bordered: boolean
}) {
  return (
    <div className='flex bs-full justify-center'>
      <div
        className={classnames(
          'flex bs-full items-center justify-center flex-1 min-bs-[100dvh] relative p-6 max-md:hidden',
          { 'border-ie': bordered }
        )}
      >
        <div className='pli-6 max-lg:mbs-40 lg:mbe-24'>
          <img src={characterIllustration} alt='character-illustration' className='max-bs-[673px] max-is-full bs-auto' />
        </div>
        <img src={authBackground} className='absolute bottom-[4%] z-[-1] is-full max-md:hidden' />
      </div>
      <div className='flex justify-center items-center bs-full bg-backgroundPaper !min-is-full p-6 md:!min-is-[unset] md:p-12 md:is-[480px]'>
        <Link className='absolute block-start-5 sm:block-start-[38px] inline-start-6 sm:inline-start-[38px]'>
          <Logo />
        </Link>
        <div className='flex flex-col gap-5 is-full sm:is-auto md:is-full sm:max-is-[400px] md:max-is-[unset] mbs-11 sm:mbs-14 md:mbs-0'>
          {children}
        </div>
      </div>
    </div>
  )
}
```

Rewrite `Login.tsx`'s existing workspace-selection branch to use it, and add the OTP branch **before** the workspace branch (a challenge is more specific than a selection):

```tsx
  if (needsOtp && otpChallenge) {
    return (
      <AuthShell
        characterIllustration={characterIllustration}
        authBackground={authBackground}
        bordered={settings.skin === 'bordered'}
      >
        <OtpChallengeForm
          channel={otpChallenge.channel}
          maskedTarget={otpChallenge.maskedTarget}
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={handleOtpSubmit}
          onResend={handleOtpResend}
          onStartOver={handleOtpCancel}
        />
      </AuthShell>
    )
  }
```

with handlers:

```tsx
  const handleOtpSubmit = async (otp: string, rememberDevice: boolean) => {
    setError(null)
    setIsSubmitting(true)

    const result = await verifyOtp(otp, rememberDevice)

    if (result.success) {
      router.push(redirectTo)
    } else {
      setError(result.error ?? 'Verification failed.')
    }

    setIsSubmitting(false)
  }

  const handleOtpResend = async () => {
    setError(null)
    await resendOtp()
  }

  const handleOtpCancel = () => {
    setError(null)
    cancelOtp()
  }
```

Destructure `needsOtp, otpChallenge, verifyOtp, resendOtp, cancelOtp` from `useAuth()`.

- [ ] **Step 7: Verify nothing regressed**

```bash
npm run type-check && npx vitest run
```

Expected: type-check clean, whole suite green.

- [ ] **Step 8: Mutation-check the shared success path**

In `verifyOtp`, replace `establishTenantSession(result.data, challenge.workspace)` with a hand-written `setState` that omits `setStoredUserRole` / `setStoredUserType`. Expect `lands in the identical authenticated state after verifying` to FAIL on `api.user?.role`. Restore, confirm green, report.

- [ ] **Step 9: Commit**

```bash
git add src/contexts/AuthContext.tsx src/views/Login.tsx src/components/auth/AuthShell.tsx src/__tests__/auth/AuthContext.otp.test.tsx src/lib/api/auth-client.ts
git commit -m "feat(auth): challenge landlords on an unrecognised device"
```

---

## Task 9: Admin challenge — `AdminAuthContext` + `AdminLoginView`

**Files:**
- Modify: `src/contexts/AdminAuthContext.tsx`
- Modify: `src/views/admin/AdminLoginView.tsx`
- Test: `src/__tests__/auth/AdminAuthContext.otp.test.tsx`

**Interfaces:**
- Consumes: `adminLogin`, `verifyAdminLoginOtp` (Task 5); `otpErrorMessage` (Task 6); `OtpChallengeForm` (Task 7).
- Produces on `useAdminAuth()`: `needsOtp: boolean`, `otpChallenge: OtpChallenge | null`, `verifyOtp(otp, rememberDevice)`, `cancelOtp()`. **No `resendOtp`** — see below.
- `adminLogin` now returns `{ success: boolean; error?: string; otpRequired?: boolean }`.

**No resend on this path.** A resend would need the email and password again, and holding a password in React state across the challenge screen is not worth one convenience link. `OtpChallengeForm` renders "Start over" when `onResend` is absent, which returns to the login form where the user re-enters credentials — the same number of actions, without the retained password.

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/auth/AdminAuthContext.otp.test.tsx`:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { act } from 'react'

import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/lib/api/admin-auth-client', async () => {
  const actual = await vi.importActual<any>('@/lib/api/admin-auth-client')

  return {
    ...actual,
    adminLogin: vi.fn(),
    verifyAdminLoginOtp: vi.fn(),
    getAdminMe: vi.fn(),
    getStoredAdminToken: vi.fn(() => null),
    clearStoredAdminToken: vi.fn(),
    adminLogout: vi.fn()
  }
})

import { adminLogin, verifyAdminLoginOtp, getAdminMe } from '@/lib/api/admin-auth-client'

const CHALLENGE = { otpRequired: true, pendingToken: 'pending', channel: 'EMAIL', maskedTarget: 'a***@b.com' }
const PROFILE = { id: 'a1', email: 'admin@example.com', fullName: 'Admin', permissions: [], roles: [] }

let api: ReturnType<typeof useAdminAuth>

function Probe() {
  api = useAdminAuth()

  return null
}

function renderProvider() {
  render(<AdminAuthProvider><Probe /></AdminAuthProvider>)
}

describe('AdminAuthContext login-OTP branch', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('enters the challenge state without authenticating', async () => {
    ;(adminLogin as any).mockResolvedValue(CHALLENGE)

    renderProvider()
    let result: any
    await act(async () => { result = await api.adminLogin('admin@example.com', 'pw') })

    expect(result.otpRequired).toBe(true)
    expect(api.needsOtp).toBe(true)
    expect(api.isAdminAuthenticated).toBe(false)
    expect(getAdminMe).not.toHaveBeenCalled()
  })

  it('authenticates after verifying, fetching the profile exactly as an unchallenged login does', async () => {
    ;(adminLogin as any).mockResolvedValue(CHALLENGE)
    ;(verifyAdminLoginOtp as any).mockResolvedValue({ accessToken: 'admin-token' })
    ;(getAdminMe as any).mockResolvedValue(PROFILE)

    renderProvider()
    await act(async () => { await api.adminLogin('admin@example.com', 'pw') })
    await act(async () => { await api.verifyOtp('123456', true) })

    await waitFor(() => expect(api.isAdminAuthenticated).toBe(true))
    expect(api.adminUser?.email).toBe('admin@example.com')
    expect(api.needsOtp).toBe(false)
  })

  it('passes rememberDevice through', async () => {
    ;(adminLogin as any).mockResolvedValue(CHALLENGE)
    ;(verifyAdminLoginOtp as any).mockRejectedValue({ response: { status: 400, data: { code: 'OTP_INVALID' } } })

    renderProvider()
    await act(async () => { await api.adminLogin('admin@example.com', 'pw') })
    await act(async () => { await api.verifyOtp('123456', false) })

    expect(verifyAdminLoginOtp).toHaveBeenCalledWith('pending', '123456', false)
  })

  it('drops the challenge and reports startOver when the code is exhausted', async () => {
    ;(adminLogin as any).mockResolvedValue(CHALLENGE)
    ;(verifyAdminLoginOtp as any).mockRejectedValue({
      response: { status: 400, data: { code: 'OTP_ATTEMPTS_EXHAUSTED' } }
    })

    renderProvider()
    await act(async () => { await api.adminLogin('admin@example.com', 'pw') })
    let result: any
    await act(async () => { result = await api.verifyOtp('123456', true) })

    expect(result.startOver).toBe(true)
    expect(api.needsOtp).toBe(false)
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/auth/AdminAuthContext.otp.test.tsx
```

Expected: FAIL — `needsOtp` / `verifyOtp` do not exist.

- [ ] **Step 3: Implement the context changes**

Extend `AdminAuthState` with `needsOtp: boolean` and `otpChallenge: OtpChallenge | null`, initialising both in the `useState` and in every whole-object `setState` (including the session-expiry handler and `adminLogout` — a stale challenge surviving a logout would show a challenge form to a signed-out admin).

```ts
  const adminLogin = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isAdminLoading: true }))
    try {
      const result = await apiAdminLogin(email, password)

      // A challenge mints no token, so there is no profile to fetch yet and nothing to store.
      if (isOtpChallenge(result)) {
        setState(prev => ({ ...prev, isAdminLoading: false, needsOtp: true, otpChallenge: result }))

        return { success: true, otpRequired: true }
      }

      const profile = await getAdminMe()

      setState({ adminUser: profile, isAdminAuthenticated: true, isAdminLoading: false, needsOtp: false, otpChallenge: null })

      return { success: true }
    } catch (err: any) {
      setState(prev => ({ ...prev, isAdminLoading: false }))
      const msg = err?.response?.data?.message ?? err?.message ?? 'Admin login failed'

      return { success: false, error: msg }
    }
  }, [])

  const verifyOtp = useCallback(async (otp: string, rememberDevice: boolean) => {
    const challenge = stateRef.current.otpChallenge

    if (!challenge) return { success: false, error: 'No verification in progress.', startOver: true }

    setState(prev => ({ ...prev, isAdminLoading: true }))

    try {
      await verifyAdminLoginOtp(challenge.pendingToken, otp, rememberDevice)

      const profile = await getAdminMe()

      setState({ adminUser: profile, isAdminAuthenticated: true, isAdminLoading: false, needsOtp: false, otpChallenge: null })

      return { success: true }
    } catch (err) {
      const display = otpErrorMessage(err)

      setState(prev => ({
        ...prev,
        isAdminLoading: false,
        needsOtp: !display.startOver,
        otpChallenge: display.startOver ? null : prev.otpChallenge
      }))

      return { success: false, error: display.message, startOver: display.startOver }
    }
  }, [])

  const cancelOtp = useCallback(() => {
    setState(prev => ({ ...prev, needsOtp: false, otpChallenge: null }))
  }, [])
```

Add the same `stateRef` + `useEffect` pattern as Task 8, and add all three to the provider `value` and to `AdminAuthContextValue`.

- [ ] **Step 4: Run to verify it passes**

```bash
npx vitest run src/__tests__/auth/AdminAuthContext.otp.test.tsx
```

Expected: 4 passed.

- [ ] **Step 5: Render the branch in `AdminLoginView`**

Destructure `needsOtp, otpChallenge, verifyOtp, cancelOtp` from `useAdminAuth()`. Change `handleSubmit` so a challenge is not mistaken for a failure — the current code shows "Invalid credentials" for anything that is not an outright success:

```tsx
    const result = await adminLogin(email, password)

    if (result.otpRequired) {
      // Not an error: the password was correct and the component re-renders into the
      // challenge below. Falling through would show "Invalid credentials" for a SUCCESSFUL
      // password check.
      setIsSubmitting(false)

      return
    }

    if (result.success) {
      router.push('/admin')
    } else {
      setError('Invalid credentials. This portal is for platform administrators only.')
    }
```

Then render the challenge inside the same outer wrapper the form uses, replacing the form:

```tsx
  if (needsOtp && otpChallenge) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-backgroundDefault p-6'>
        <div className='w-full max-w-[400px] flex flex-col gap-6'>
          <div className='flex flex-col items-center gap-3'>
            <Link href='/'><Logo /></Link>
            <Chip label='Platform Administration' size='small' color='warning' variant='outlined' />
          </div>
          <OtpChallengeForm
            channel={otpChallenge.channel}
            maskedTarget={otpChallenge.maskedTarget}
            isSubmitting={isSubmitting}
            error={error}
            onSubmit={handleOtpSubmit}
            onStartOver={handleOtpCancel}
          />
        </div>
      </div>
    )
  }
```

with:

```tsx
  const handleOtpSubmit = async (otp: string, rememberDevice: boolean) => {
    setError(null)
    setIsSubmitting(true)

    const result = await verifyOtp(otp, rememberDevice)

    if (result.success) {
      router.push('/admin')
    } else {
      setError(result.error ?? 'Verification failed.')
      // startOver means no code can help — the form below is what the user needs next.
      if (result.startOver) setPassword('')
    }

    setIsSubmitting(false)
  }

  const handleOtpCancel = () => {
    setError(null)
    setPassword('')
    cancelOtp()
  }
```

Note `onResend` is deliberately **not** passed.

- [ ] **Step 6: Verify and mutation-check**

```bash
npm run type-check && npx vitest run
```

Then mutation-check: remove the `if (result.otpRequired) return` early exit from `handleSubmit`. This has no unit test of its own, so add one asserting `AdminLoginView` renders the code field and NOT an "Invalid credentials" alert after a challenged login, confirm it goes red under the mutation, restore, and report.

- [ ] **Step 7: Commit**

```bash
git add src/contexts/AdminAuthContext.tsx src/views/admin/AdminLoginView.tsx src/__tests__/auth/AdminAuthContext.otp.test.tsx
git commit -m "feat(auth): challenge platform admins on an unrecognised device"
```

---

## Task 10: `<PhoneVerificationCard>` and its API calls

**Files:**
- Create: `src/components/auth/PhoneVerificationCard.tsx`
- Modify: `src/lib/api/auth-client.ts` (landlord phone calls)
- Modify: `src/lib/api/admin-auth-client.ts` (admin phone calls)
- Test: `src/__tests__/auth/PhoneVerificationCard.test.tsx`

**Interfaces:**
- Produces:
  - `auth-client.ts`: `submitPhoneNumber(phoneNumber: string): Promise<{ expiresInSeconds: number }>`, `verifyPhoneNumber(otp: string): Promise<void>`
  - `admin-auth-client.ts`: `submitAdminPhoneNumber(phoneNumber: string): Promise<{ expiresInSeconds: number }>`, `verifyAdminPhoneNumber(otp: string): Promise<void>`
  - Component props:

```ts
export interface PhoneVerificationCardProps {
  currentPhone: string | null
  isVerified: boolean
  onSubmitPhone: (phoneNumber: string) => Promise<{ expiresInSeconds: number }>
  onVerifyPhone: (otp: string) => Promise<void>
  onVerified: () => void
}
```

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/auth/PhoneVerificationCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import PhoneVerificationCard from '@/components/auth/PhoneVerificationCard'

function renderCard(overrides: Partial<React.ComponentProps<typeof PhoneVerificationCard>> = {}) {
  const props = {
    currentPhone: null,
    isVerified: false,
    onSubmitPhone: vi.fn().mockResolvedValue({ expiresInSeconds: 600 }),
    onVerifyPhone: vi.fn().mockResolvedValue(undefined),
    onVerified: vi.fn(),
    ...overrides
  }

  render(<PhoneVerificationCard {...props} />)

  return props
}

describe('PhoneVerificationCard', () => {
  // A prompt that reads as mandatory generates support tickets for a step nobody has to take:
  // email delivery has no switch and always works.
  it('says plainly that verifying is optional', () => {
    renderCard()

    expect(screen.getByText(/optional/i)).toBeInTheDocument()
  })

  it('rejects a malformed number locally, without spending a send', async () => {
    const user = userEvent.setup()
    const props = renderCard()

    await user.type(screen.getByLabelText(/phone number/i), '123')
    await user.click(screen.getByRole('button', { name: /send code/i }))

    expect(props.onSubmitPhone).not.toHaveBeenCalled()
    expect(screen.getByText(/7 to 16 digits/i)).toBeInTheDocument()
  })

  it('submits a valid number and moves to the code step', async () => {
    const user = userEvent.setup()
    const props = renderCard()

    await user.type(screen.getByLabelText(/phone number/i), '+233241234567')
    await user.click(screen.getByRole('button', { name: /send code/i }))

    expect(props.onSubmitPhone).toHaveBeenCalledWith('+233241234567')
    expect(await screen.findByLabelText(/verification code/i)).toBeInTheDocument()
  })

  it('will not submit a code that is not exactly six digits', async () => {
    const user = userEvent.setup()

    renderCard()
    await user.type(screen.getByLabelText(/phone number/i), '+233241234567')
    await user.click(screen.getByRole('button', { name: /send code/i }))
    await user.type(await screen.findByLabelText(/verification code/i), '12345')

    expect(screen.getByRole('button', { name: /^verify$/i })).toBeDisabled()
  })

  it('reports success upward after verifying', async () => {
    const user = userEvent.setup()
    const props = renderCard()

    await user.type(screen.getByLabelText(/phone number/i), '+233241234567')
    await user.click(screen.getByRole('button', { name: /send code/i }))
    await user.type(await screen.findByLabelText(/verification code/i), '123456')
    await user.click(screen.getByRole('button', { name: /^verify$/i }))

    expect(props.onVerifyPhone).toHaveBeenCalledWith('123456')
    expect(props.onVerified).toHaveBeenCalled()
  })

  it('shows a verified number with a way to change it', async () => {
    const user = userEvent.setup()

    renderCard({ currentPhone: '+233241234567', isVerified: true })

    expect(screen.getByText(/verified/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /change number/i }))
    expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to verify it fails**

```bash
npx vitest run src/__tests__/auth/PhoneVerificationCard.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Add the four API functions**

In `auth-client.ts`:

```ts
/** Backend contract: SubmitPhoneNumberRequest validates ^\+?[0-9()\s-]{7,16}$ */
export async function submitPhoneNumber(phoneNumber: string): Promise<{ expiresInSeconds: number }> {
  return apiPost<{ message: string; expiresInSeconds: number }>(`${API_BASE}/profile/phone`, { phoneNumber })
}

/** Backend contract: VerifyPhoneNumberRequest requires exactly 6 digits. */
export async function verifyPhoneNumber(otp: string): Promise<void> {
  await apiPost<void>(`${API_BASE}/profile/phone/verify`, { otp })
}
```

In `admin-auth-client.ts`, the same two against `/profile/phone` and `/profile/phone/verify` via `adminPost` (the admin client's own base URL already prefixes `/api/v1/admin`), named `submitAdminPhoneNumber` and `verifyAdminPhoneNumber`.

- [ ] **Step 4: Implement the component**

Create `src/components/auth/PhoneVerificationCard.tsx` as an MUI `Card` with `CardHeader` + `CardContent`, matching `SecuritySettingsView`'s existing cards. Requirements the tests encode:

- Header "Phone number", subtitle stating verification is **optional** and that codes are sent by email unless a verified phone exists.
- Step 1: a `TextField` labelled "Phone number", validated client-side against `/^\+?[0-9()\s-]{7,16}$/` with the message "Enter 7 to 16 digits, optionally starting with +". Button "Send code".
- Step 2: a `TextField` labelled "Verification code", digits only, `maxLength={6}`; button "Verify", disabled unless `length === 6`. Calls `onVerifyPhone(otp)` then `onVerified()`.
- When `isVerified && currentPhone`: show the number, a "Verified" `Chip`, and a "Change number" button returning to step 1.
- Errors from either call render in an `Alert`.

The local regex must match the backend's exactly. Mirroring it here is what stops a typo from spending one of the three hourly sends.

- [ ] **Step 5: Run to verify it passes**

```bash
npx vitest run src/__tests__/auth/PhoneVerificationCard.test.tsx
```

Expected: 6 passed.

- [ ] **Step 6: Mutation-check the local validation**

Remove the client-side regex check so `onSubmitPhone` is called unconditionally. Expect `rejects a malformed number locally` to FAIL. Restore, confirm green, report.

- [ ] **Step 7: Commit**

```bash
git add src/components/auth/PhoneVerificationCard.tsx src/lib/api/auth-client.ts src/lib/api/admin-auth-client.ts src/__tests__/auth/PhoneVerificationCard.test.tsx
git commit -m "feat(auth): phone number verification widget"
```

---

## Task 11: Mount the phone card on both surfaces

**Files:**
- Modify: `src/views/settings/security/SecuritySettingsView.tsx`
- Modify: `src/views/admin/AdminProfileView.tsx`

**Interfaces:**
- Consumes: `PhoneVerificationCard` and the four API functions from Task 10.

- [ ] **Step 1: Mount on the landlord Security page**

In `SecuritySettingsView.tsx`, add the card as a third `Card` after "Sessions" and before "Login History", wired to `submitPhoneNumber` / `verifyPhoneNumber`. Read the current phone and verified flag from the user profile the page already has access to via `useAuth()`; if `AuthUser` carries no `phoneVerified` flag, pass `currentPhone={user?.phone ?? null}` and `isVerified={false}` and let `onVerified` flip local state — do **not** invent a backend field that does not exist.

- [ ] **Step 2: Mount on the admin profile page**

In `AdminProfileView.tsx`, add the same card wired to `submitAdminPhoneNumber` / `verifyAdminPhoneNumber`.

- [ ] **Step 3: Verify**

```bash
npm run type-check && npx vitest run && npm run build
```

Expected: all clean. `npm run build` catches Server/Client Component boundary mistakes that Vitest cannot.

- [ ] **Step 4: Commit**

```bash
git add src/views/settings/security/SecuritySettingsView.tsx src/views/admin/AdminProfileView.tsx
git commit -m "feat(auth): offer phone verification on both profile surfaces"
```

---

## Task 12: Admin console — Login OTP section

**Files:**
- Modify: `src/views/admin/AdminPlatformSettingsView.tsx`

**Interfaces:**
- Consumes: the file's existing `val`, `boolVal`, `SectionHeader`, `ToggleRow`, `save`, `setLocal`, `saveDirty`, `localValues`, `dirty`, `saving`.

**Why all nine keys:** six of them are currently reachable only by SQL, which is the same gap this section exists to close.

- [ ] **Step 1: Add section 10**

Insert after section 9 (Platform Branding), following the file's existing structure exactly:

```tsx
      {/* ── 10. Login OTP ─────────────────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <SectionHeader
            icon='ri-shield-keyhole-line'
            title='Login OTP'
            subtitle='A one-time code on the first sign-in from an unrecognised browser. Email delivery has no switch and can never be turned off, so no setting here can lock anyone out.'
          />
          <Divider sx={{ mb: 2 }} />

          <Alert severity='info' sx={{ mb: 2 }}>
            Arm <strong>platform admins</strong> first. They are a handful of people you can reach
            directly, so a problem is a conversation. Landlord sign-in covers every paying
            customer, where the same problem is a lockout discovered through support tickets.
          </Alert>

          <ToggleRow
            label='Require OTP for landlord and staff sign-in'
            description='Applies to tenant-user login and workspace selection — every landlord and staff account'
            checked={boolVal(settings, 'OTP', 'otp.login.enabled')}
            saving={saving.has('otp.login.enabled')}
            onChange={v => save('otp.login.enabled', String(v))}
          />

          <ToggleRow
            label='Require OTP for platform admin sign-in'
            description='Applies only to this console. Independent of the landlord switch above'
            checked={boolVal(settings, 'OTP', 'otp.admin.login.enabled')}
            saving={saving.has('otp.admin.login.enabled')}
            onChange={v => save('otp.admin.login.enabled', String(v))}
          />

          <ToggleRow
            label='Allow SMS delivery'
            description='Off by default: SMS costs money per send. Codes go by SMS only to users who have verified a phone number; everyone else still receives email'
            checked={boolVal(settings, 'OTP', 'otp.login.sms_enabled')}
            saving={saving.has('otp.login.sms_enabled')}
            onChange={v => save('otp.login.sms_enabled', String(v))}
          />

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
            {[
              { key: 'otp.device.trust_days',         label: 'Remember a device for (days)', help: 'How long a verified browser skips the code. Lower is stricter and asks more often' },
              { key: 'otp.device.max_per_principal',  label: 'Remembered devices per user',  help: 'Once reached, the least recently used device is forgotten' },
              { key: 'otp.send.max_per_identifier',   label: 'Codes per account per hour',   help: 'Set too low and a user who mistypes their email cannot get a second code' },
              { key: 'otp.send.max_per_ip',           label: 'Codes per IP per hour',        help: 'Keep well above the per-account limit: households and offices share one address behind a router' },
              { key: 'otp.verify.max_attempts',       label: 'Attempts per code',            help: 'After this many wrong guesses the code is dead and the user must start over' },
              { key: 'otp.code.retention_days',       label: 'Keep used codes for (days)',   help: 'How long expired codes stay in the database before the purge job removes them' },
            ].map(({ key, label, help }) => (
              <TextField
                key={key}
                size='small'
                label={label}
                type='number'
                inputProps={{ min: 1 }}
                value={localValues[key] ?? ''}
                onChange={e => setLocal(key, e.target.value)}
                helperText={help}
              />
            ))}
          </Box>

          <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 2 }}>
            Every value above must be 1 or more. Zero is rejected because each one is a
            platform-wide outage rather than a stricter setting: no codes can be sent, no code can
            be redeemed, or live codes are deleted mid-login.
          </Typography>

          {['otp.device.trust_days', 'otp.device.max_per_principal', 'otp.send.max_per_identifier', 'otp.send.max_per_ip', 'otp.verify.max_attempts', 'otp.code.retention_days'].some(k => dirty.has(k)) && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant='contained'
                size='small'
                onClick={() => saveDirty(['otp.device.trust_days', 'otp.device.max_per_principal', 'otp.send.max_per_identifier', 'otp.send.max_per_ip', 'otp.verify.max_attempts', 'otp.code.retention_days'])}
                disabled={['otp.device.trust_days', 'otp.device.max_per_principal', 'otp.send.max_per_identifier', 'otp.send.max_per_ip', 'otp.verify.max_attempts', 'otp.code.retention_days'].some(k => saving.has(k))}
              >
                Save OTP Limits
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
```

Confirm `Alert` is imported in this file; add the import if not.

- [ ] **Step 2: Confirm the category string is right**

The `boolVal(settings, 'OTP', ...)` calls depend on the settings being grouped under the category `OTP`. Verify against the live backend:

```bash
export PGPASSWORD=$(grep -m1 '^DB_PASSWORD=' /Users/mac/Desktop/TenantApp/TenantX-backend/.env | cut -d= -f2-)
psql -h localhost -p 5432 -U postgres -d tenantx -tAc "SELECT DISTINCT category FROM platform_settings WHERE setting_key LIKE 'otp.%';"
```

Expected: `OTP`. If it differs, use the actual value — do not change the migration.

- [ ] **Step 3: Verify**

```bash
npm run type-check && npx vitest run && npm run build
```

- [ ] **Step 4: Confirm it renders against the real backend**

Start the dev server via the preview tooling (never `npm run dev` in Bash), sign in to `/admin/login`, open Platform Settings, and confirm the Login OTP section renders all nine controls with the seeded values (three toggles off; 30, 10, 3, 60, 5, 30). Toggle `otp.admin.login.enabled` on, reload, and confirm it persisted. **Then toggle it back off** — leaving it armed with no verified phone or tested flow would lock the console.

- [ ] **Step 5: Commit**

```bash
git add src/views/admin/AdminPlatformSettingsView.tsx
git commit -m "feat(admin): expose the login OTP settings in the platform console"
```

---

## Task 13: End-to-end verification against a live stack

**Files:** none — this task produces evidence, not code.

- [ ] **Step 1: Bring the stack up**

```bash
cd /Users/mac/Desktop/TenantApp/TenantX-backend && BACKEND_PORT=8099 WEB_PORT=3099 docker compose up -d --build api
```

Then build and start `web` separately — a combined `--build` silently skips a service.

- [ ] **Step 2: Arm the admin switch only**

In the admin console, turn on "Require OTP for platform admin sign-in". Leave the landlord switch off.

- [ ] **Step 3: Prove the admin challenge end to end**

Sign out, clear `tenantx_device_id` from localStorage, and sign in again. Confirm: the code screen appears; the masked target matches the admin's email; no `admin_token` exists in localStorage while the challenge is on screen (this is the invariant — check it in devtools, do not infer it); entering the code from the `user_otps` table completes the login.

- [ ] **Step 4: Prove `rememberDevice` both ways**

Sign out and back in with the box **checked** — confirm a row appears in `trusted_devices` and the next sign-in is not challenged. Then revoke it, repeat with the box **unchecked** — confirm no row appears and the next sign-in **is** challenged again.

```bash
psql -h localhost -p 55432 -U postgres -d tenantx -tAc "SELECT COUNT(*) FROM trusted_devices;"
```

Note the port: `55432` is the Docker app DB, not the test DB on `5432`.

- [ ] **Step 5: Prove the exhausted-code message**

Enter a wrong code five times, then the correct one. Confirm the sixth response reads "You've used all attempts for this code", not the generic message.

- [ ] **Step 6: Repeat for the landlord path**

Arm `otp.login.enabled`, sign in as a landlord, and confirm the challenge appears at workspace selection, that "Send a new code" produces a new code, and that verification lands on the dashboard with the correct role.

- [ ] **Step 7: Turn both switches back off**

The feature ships dark. Confirm both are `false` before finishing.

- [ ] **Step 8: Record the evidence**

Write what you observed into the task report — actual observations, not restated expectations. If any step could not be completed, say which and why.

---

## Self-Review Notes

**Spec coverage:** §3 device identity → Tasks 3–4. §4 challenge flow → Tasks 5–9. §5 phone verification → Tasks 10–11. §6.1 `rememberDevice` → Task 1. §6.2 `OTP_ATTEMPTS_EXHAUSTED` → Task 2. §7 admin console → Task 12. §8 error handling → Task 6, consumed by Tasks 8–9. §9 testing → assertions 1–8 map to Tasks 3, 4, 5, 8/9, 7, 6, 1, 2 respectively. §10 out-of-scope items have no tasks, by design.

**Known deviation from the spec:** the spec's §4.1 props block omits `onStartOver`; this plan adds it, because a form that cannot resend needs a way out. The spec's intent is unchanged.

**Sequencing:** Tasks 1–2 (backend) must land before Task 13, and Task 5's `rememberDevice` field is only honoured once Task 1 ships. Tasks 3→4→5 are strictly ordered. Tasks 8 and 9 both depend on 5, 6, 7 but not on each other. Tasks 10→11 are ordered. Task 12 is independent of everything except the backend seed. Task 13 is last.
