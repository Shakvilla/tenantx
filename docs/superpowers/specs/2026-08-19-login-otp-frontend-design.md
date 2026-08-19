# Login OTP Verification — Frontend Design

**Date:** 2026-08-19
**Primary repo:** `Tenants` (Next.js 15)
**Also touches:** `TenantX-backend` — two changes, described in §6
**Backend dependency:** `feat/login-otp` @ `c95868a` (pushed, suite 1370/1370)

---

## 1. Goal

Make the shipped login-OTP backend reachable and operable from the web app.

Today none of it is. No client sends `X-Device-Id`; no client handles an `otpRequired`
response; and none of the nine `otp.*` platform settings appear anywhere in the admin console,
so the only way to arm the feature is to run SQL against production. This slice closes all
three gaps, and adds the phone-verification UI that SMS delivery depends on.

**Success criteria.** A super admin can arm login OTP from the admin console; a platform admin
and a landlord each get challenged on an unrecognised device, complete the challenge, and reach
their session; a user who wants SMS can verify a phone number; and a user who does not is never
blocked by that choice.

---

## 2. What exists, verified

Read from the source rather than assumed. Several of these findings changed the design rather
than decorating it.

**Two of the three backend login paths are reachable from this app.**
`AuthContext` calls `globalLogin` → `POST /global/auth/login`, then `selectTenant` →
`POST /global/auth/select-tenant`. Nothing in this repo calls `POST /api/v1/auth/login`, so a
challenge screen for that path would be dead code here and is **out of scope**. It stays
supported on the backend for other clients.

**Two axios instances, and the login calls bypass both interceptors.**
`apiClient` (`src/lib/api/client.ts`) and `adminClient` (`src/lib/api/admin-auth-client.ts`)
each have a request interceptor. But `adminLogin` uses a bare `axios.post`
(`admin-auth-client.ts:186`), and `selectTenant` passes an explicit `headers` object. An
interceptor-only implementation would silently miss the two calls that matter most.

**No OTP settings are visible in the admin console.**
`AdminPlatformSettingsView.tsx` is a hand-curated 1402-line file of ten numbered sections with
zero `otp.` reads. Nothing about the new keys appears automatically.

**There is no resend endpoint for login OTP.**
Neither `AuthController`, `AdminAuthController`, nor `GlobalAuthController` exposes one. A new
code comes only from re-running the originating call. This is cheap and safe on one path and
not the other — see §4.3.

**There is a house OTP pattern but no reusable component.**
`ForgotPassword.tsx` runs an `'EMAIL' | 'CHANNEL' | 'OTP' | 'RESET' | 'SUCCESS'` step machine
with an inline `TextField`. This slice extracts a shared presentational component; it does not
retrofit `ForgotPassword` onto it (out of scope, and its channel-selection step differs).

**`revoke-all` is `GLOBAL_USER`-only.**
`GlobalAuthController:215` hardcodes the principal type. Platform admins have no equivalent.
No "forget my devices" UI is in this slice; §10 records it.

### 2.1 Backend contract

All three verify endpoints take a structurally identical body, so one TS type serves all:

```ts
interface VerifyOtpRequest {
  pendingToken: string
  otp: string
  deviceId: string
  rememberDevice: boolean   // added by §6.1
}
```

The challenge response is equally uniform, and carries no session:

```ts
interface OtpChallengeResponse {
  otpRequired: true
  pendingToken: string
  channel: 'EMAIL' | 'SMS'
  maskedTarget: string      // "j***@example.com" or "***4072"
}
```

| path | initiate | verify |
|---|---|---|
| landlord select-tenant | `POST /api/v1/global/auth/select-tenant` | `POST /api/v1/global/auth/select-tenant/verify-otp` |
| platform admin | `POST /api/v1/admin/auth/login` | `POST /api/v1/admin/auth/verify-otp` |

Phone verification:

| | landlord | platform admin |
|---|---|---|
| submit | `POST /api/v1/profile/phone` | `POST /api/v1/admin/profile/phone` |
| verify | `POST /api/v1/profile/phone/verify` | `POST /api/v1/admin/profile/phone/verify` |

`SubmitPhoneNumberRequest.phoneNumber` is validated `^\+?[0-9()\s-]{7,16}$`.
`VerifyPhoneNumberRequest.otp` is exactly 6 digits. `submitPhoneNumber` returns
`RequestOtpResponse { message, expiresInSeconds }`.

The nine settings, all category `OTP`:

| key | seed | type |
|---|---|---|
| `otp.login.enabled` | `false` | boolean |
| `otp.admin.login.enabled` | `false` | boolean |
| `otp.login.sms_enabled` | `false` | boolean |
| `otp.device.trust_days` | `30` | positive int |
| `otp.device.max_per_principal` | `10` | positive int |
| `otp.send.max_per_identifier` | `3` | positive int |
| `otp.send.max_per_ip` | `60` | positive int |
| `otp.verify.max_attempts` | `5` | positive int |
| `otp.code.retention_days` | `30` | positive int |

---

## 3. Device identity

**New file: `src/lib/api/device-id.ts`**

```ts
export function getDeviceId(): string
```

Reads `tenantx_device_id` from `localStorage`; if absent, generates `crypto.randomUUID()`,
stores it, and returns it. SSR-safe: returns `''` when `window` is undefined, and callers are
all browser-side.

**One id per browser profile, shared by the landlord and admin surfaces.** It identifies the
browser, not the account. The backend already scopes trust per principal (three partial unique
indexes on `trusted_devices`), so a second id would only double the challenges without adding
isolation.

**Four injection sites.** Not one — three of these bypass an interceptor:

| site | file | why it needs its own line |
|---|---|---|
| `apiClient` request interceptor | `client.ts` | covers `selectTenant` and all tenant-scoped calls |
| `adminClient` request interceptor | `admin-auth-client.ts` | covers admin-scoped calls |
| `adminLogin` | `admin-auth-client.ts:186` | bare `axios.post`, never touches `adminClient` |
| `selectTenant` | `auth-client.ts` | overrides `headers`; must not drop the device header |

Both interceptors set the header only when not already present, matching how they already treat
`Authorization` and `X-Tenant-ID`.

**Clearing site data yields a new id and therefore one extra challenge.** That is correct
behaviour, not a defect, and the challenge screen says so in one line so it does not read as a
bug.

---

## 4. The challenge flow

### 4.1 `<OtpChallengeForm>` — presentational

**New file: `src/components/auth/OtpChallengeForm.tsx`**

```ts
interface OtpChallengeFormProps {
  channel: 'EMAIL' | 'SMS'
  maskedTarget: string
  isSubmitting: boolean
  error: string | null            // no attempt count — see §8.1, the backend returns none
  onSubmit: (otp: string, rememberDevice: boolean) => void
  onResend?: () => void       // absent → renders "Start over" instead
  onStartOver: () => void
}
```

Knows nothing about API calls, tokens, or which path invoked it. Renders: a 6-digit code field,
"Sent to {maskedTarget}", the remember-this-device checkbox (**checked by default**), an error
slot, a submit button, and either a resend control or a "Start over" link.

Rendering "Start over" where `onResend` is absent is the honest representation of a path that
genuinely cannot resend — a disabled resend button would imply a temporary state.

### 4.2 Landlord path — `AuthContext`

`handleSelectWorkspace` currently assumes `selectTenant` returns a session. It gains one branch:
on `otpRequired`, store `{ pendingToken, channel, maskedTarget, workspace }` and set `needsOtp`,
alongside the existing `needsWorkspaceSelection` and `needsPasswordSetup`.

On verify success, **the existing post-select code runs unchanged** — same token storage, same
`setStoredUserRole` / `setStoredUserType`, same state shape. The success path keeps exactly one
implementation; the OTP branch only decides *when* it runs.

### 4.3 Admin path — `AdminAuthContext`

The same branch shape on `adminLogin`.

**Resend asymmetry, stated plainly rather than smoothed over:**

- **Landlord: true resend.** Re-calling `selectTenant(tenantId)` needs only the global token,
  still in `localStorage`. No credentials are held anywhere.
- **Admin: "Start over".** A resend would need the email and password again, and holding a
  password in React state across a challenge screen is not worth one convenience link. The
  send budget is 3 per identifier per hour, so an unlimited resend was never available anyway.

### 4.4 Rendering

Both render the challenge **inline, replacing the form in place** — matching how workspace
selection already works. No new routes. The `pendingToken` never leaves memory, which is why a
dedicated `/login/verify` route was rejected: it would require putting the token in
`localStorage`, worsening the open M-19 finding to buy refresh-survivability on a five-minute
token.

---

## 5. Phone number and verification

**New file: `src/components/auth/PhoneVerificationCard.tsx`**, parameterised by its two
endpoints so one component serves both surfaces.

| | landlord | platform admin |
|---|---|---|
| home | Security settings — a third card under Sessions and Login History | `AdminProfileView` |

Two steps: enter a number → receive an SMS code → enter the code → shows as verified with a
"Change number" affordance. The client mirrors both backend validations (the phone pattern and
the exact 6-digit code) so a typo fails locally instead of spending one of three hourly sends.

**This is never blocking, and the copy says so.** `OtpChannelResolver` picks SMS only when
`otp.login.sms_enabled` is true *and* the principal has `phone_verified_at` set; otherwise it
falls back to email, which no setting can disable. A user who never touches this card logs in
normally. Verifying a phone is how you opt *into* SMS — a prompt that looks mandatory would
generate support tickets for a step nobody has to take.

---

## 6. Backend changes

Two, both small. No migration; no change to any of the nine settings.

### 6.1 `rememberDevice`

Three call sites trust the device unconditionally after a successful verify:

- `AuthServiceImpl:432`
- `GlobalAuthServiceImpl:563`
- `AdminAuthServiceImpl:382`

Add a nullable `Boolean rememberDevice` to the three verify DTOs and guard each
`trustedDeviceService.trust(...)` call with it.

**Absent means trust** — the current behaviour. This is deliberately the fail-open direction and
is defensible here in a way it usually is not: the device being trusted has just presented a
valid, single-use, device-bound OTP, so trusting it is never a bypass — only a choice about how
long the protection lasts. The opposite default is the worse failure: a client that omits the
field would challenge on every login forever, which reads as a broken feature and produces
exactly the pressure to switch the whole thing off. **Both branches are pinned by tests**, since
an unpinned default is how this silently inverts later.

### 6.2 A distinct error for an exhausted code

`checkOtpGuards` (`OtpServiceImpl:625-646`) currently throws the same
`BusinessException(OTP_INVALID)` for an exhausted code as for a wrong one. Add
`OTP_ATTEMPTS_EXHAUSTED` to `BusinessErrorCode`
(`infrastructure/shared/enums/BusinessErrorCode.java`, beside `OTP_EXPIRED` and `OTP_INVALID`,
`HttpStatus.BAD_REQUEST`) and throw it from the `attemptsExhausted` branch only.

**This deliberately narrows the no-oracle property**, so the narrowing is bounded on purpose and
must stay bounded:

- The exhausted branch is reached **only after five failed attempts**, so it is not a cheap
  probe.
- It reveals a fact about the caller's **own** code — that it is spent — and nothing about
  whether any particular guess was right, which device was expected, or whether the account
  exists.
- **The other three causes stay uniform.** Wrong code, device mismatch, and expiry continue to
  throw the identical `OTP_INVALID`. A test pins that, because the temptation to keep splitting
  this enum is exactly how a no-oracle property erodes one reasonable-looking commit at a time.

Without this, a user who mistypes five times then enters the **correct** code is refused with
the same message as attempt one, and nothing on screen explains why — which reads as the feature
being broken rather than as working protection.

---

## 7. Admin console — Login OTP section

A new **section 10** in `AdminPlatformSettingsView.tsx`, following the existing numbered-section
pattern exactly (`val` / `boolVal` helpers, `Switch` rows, the established save handler).

**All nine keys, not just the three switches.** They are one coherent group, and leaving six of
them SQL-only reproduces the gap this section exists to close.

- **Three switches.** `otp.login.enabled` and `otp.admin.login.enabled` are rendered as
  distinctly labelled rows naming the population each governs — telling them apart is the entire
  point of having split them. `otp.login.sms_enabled` is labelled as costing money per send.
- **Six integers.** Each carries a helper line naming its consequence. The backend rejects `0`
  on all six precisely because each zero is a platform-wide outage; a field that only says
  "must be positive" teaches nobody why.

The section leads with a short note that arming the admin switch first is the intended rollout —
that is the reasoning the split was built on, and a settings screen is where it has to land.

---

## 8. Error handling

### 8.1 What the backend deliberately will not tell us

`checkOtpGuards` throws the **identical** `BusinessException(OTP_INVALID)` for a wrong code, a
device mismatch, and an expired code. Its own comment states why: "so none of them is an
oracle." It returns no attempt count, and §6.2 does not add one.

That is a deliberate security property, not a gap, and **the UI must not reconstruct the
distinction by inference** — not from timing, not from response shape, not from anything else.
Those three causes share one honest message, which names the only actionable step anyway:

> That code isn't valid. It may be wrong, expired, or already used. Start over to get a new one.

§6.2 carves out exactly one exception — an exhausted code, reachable only after five failures —
because there the user's next action differs: no code they can type will work, and they must
start over. Everything else stays uniform.

### 8.2 Conditions the client can and must distinguish

| backend condition | what the user sees |
|---|---|
| `OTP_INVALID` (wrong / device mismatch / expired) | the single message above |
| `OTP_ATTEMPTS_EXHAUSTED` (§6.2) | "You've used all attempts for this code. Start over to get a new one." |
| send budget exhausted (429) | "Too many codes requested. Try again in an hour" |
| pending token expired / invalid (403) | drop back to the login form with an explanatory line, not a dead screen |
| missing `X-Device-Id` (400, `DEVICE_ID_REQUIRED`) | our client's bug — logs loudly rather than blaming the user |

The last row matters most. Getting it wrong reproduces exactly the defect the backend's
`@NotBlank` on `deviceId` was added to prevent: a null device id reads as a device *mismatch*,
indistinguishable from a wrong code, silently burning the real code's attempts with no signal
that the client, not the user's guess, was at fault.

---

## 9. Testing

Vitest + React Testing Library, matching the repo's existing setup (`vitest run`, tests under
`src/__tests__/`). The load-bearing assertions:

1. `getDeviceId()` generates once and is stable across calls.
2. **Each of the four injection sites actually sends the header**, asserted per site against a
   mocked adapter. An interceptor-only test proves nothing about the three sites that bypass an
   interceptor.
3. An `otpRequired` response stores **no token in `localStorage`, no cookie, no context state** —
   the invariant the entire feature rests on.
4. Verify success runs the same post-login path as an unchallenged login (landlord: tenant token
   + tenantId + role/userType persisted; admin: admin token stored).
5. The remember checkbox reaches the request body in **both** states.
6. The five conditions in §8.2 render five distinguishable messages — and `OTP_INVALID` renders
   the same message for a wrong code, a device mismatch, and an expired one, so no future edit
   turns the UI into the oracle the backend refuses to be.
7. Backend: `rememberDevice` true / false / absent each produce the right `trusted_devices` state
   on all three paths.
8. Backend: `OTP_ATTEMPTS_EXHAUSTED` is thrown **only** from the exhausted branch, and the other
   three causes still throw an indistinguishable `OTP_INVALID` — pinned, because a no-oracle
   property erodes one reasonable-looking commit at a time.

**Every assertion is mutation-checked before being called green** — break the thing it claims to
pin, watch it go red, restore. Ten guards in the backend half turned out to be pinned by nothing,
each caught this way and never by the suite passing.

---

## 10. Out of scope, recorded

- **`POST /api/v1/auth/login` challenge UI** — no client in this repo calls it. Note that §6's
  `rememberDevice` change still covers that path's verify DTO, so all three stay consistent.
- **"Forget all my devices"** — `revoke-all` is `GLOBAL_USER`-only and lives on a global-token
  route; platform admins and tenant users have no equivalent endpoint. Needs backend work first.
- **Retrofitting `ForgotPassword.tsx`** onto the shared component — its channel-selection step
  differs and it works today.
- **The pre-existing before-enabling list** — the `JwtAuthenticationFilter` scope allowlist for
  pending tokens, cleartext OTPs at INFO in `EmailServiceImpl:54-60`, and boolean settings
  failing open via `Boolean.parseBoolean`. All predate this slice and none is introduced by it.
