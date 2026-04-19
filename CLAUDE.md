# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start dev server with Turbopack (localhost:3000)
npm run build         # Production build
npm run lint          # Run ESLint
npm run lint:fix      # ESLint with auto-fix
npm run format        # Prettier formatting (src/**/*.{js,jsx,ts,tsx})
npm run type-check    # TypeScript check (tsc --noEmit)
npm run test          # Run Vitest once
npm run test:watch    # Vitest in watch mode
npm run test:coverage # Vitest with coverage report
```

## Architecture Overview

**TenantX** is a Next.js 15 multi-tenant property management SaaS using the App Router.

### Two-Step Authentication Flow

1. **Global Login** → `globalLogin()` returns list of workspaces the user belongs to
2. **Workspace Selection** → `selectTenant()` exchanges the global token for a tenant-scoped access + refresh token
3. **Dashboard Access** → all API calls automatically include `X-Tenant-ID` and `Authorization` headers via axios interceptors

Special states: `needsWorkspaceSelection` (multiple workspaces), `needsPasswordSetup` (first-time login with OTP flow).

### Middleware Authentication

`src/middleware.ts` runs on every request and considers a user "fully authenticated" only when both `auth_token` AND `tenant_id` cookies are present. It redirects unauthenticated users to `/login?redirectTo=<path>` and injects `Authorization` / `X-Tenant-ID` headers for Server Components. Auth pages redirect authenticated users to `/dashboard`.

### Route Groups

- `/(blank-layout-pages)/` — Auth pages (login, register, forgot-password, 403) with no sidebar
- `/(dashboard)/` — Protected pages with full sidebar layout
- `/` redirects to `/dashboard` (configured in `next.config.ts`)

### Layer Responsibilities

| Layer | Location | Responsibility |
|---|---|---|
| Pages | `src/app/(dashboard)/*/page.tsx` | Route entry points, server components |
| Views | `src/views/` | Feature-specific client components by domain |
| Components | `src/components/` | Reusable UI components, layout pieces |
| API clients | `src/lib/api/` | All HTTP calls, one file per domain |
| Auth | `src/contexts/AuthContext.tsx` | Global auth state via `useAuth()` hook |
| Validation | `src/lib/validation/schemas/` | Zod schemas for forms and API payloads |
| Types | `src/types/` | TypeScript types organized by domain |

### API Client Pattern

**Client components** use `src/lib/api/client.ts` (axios with interceptors):

```typescript
import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from '@/lib/api/client'

export async function getProperties(): Promise<ApiResponse<Property[]>> {
  try {
    const data = await apiGet<Property[]>(`${API_BASE}/properties`)
    return { success: true, data }
  } catch (error: any) {
    return { success: false, data: null, error: { code: 'FETCH_ERROR', message: error.message } }
  }
}
```

**Server components / Route Handlers** use `src/lib/api/server-api.ts` (native `fetch` + `next/headers`):

```typescript
import { serverApiGet } from '@/lib/api/server-api'

// In a Server Component or Route Handler
const data = await serverApiGet<Property[]>(`${API_BASE}/properties`)
```

Use the `.server.ts` suffix for server-only API modules (e.g., `properties.server.ts`).

**Token Refresh:** On 401, the client interceptor queues concurrent requests, attempts refresh, replays queued requests on success, and dispatches `AUTH_SESSION_EXPIRED` to `window` if refresh fails. Also dispatches `AUTH_REFRESHING` and `AUTH_FORBIDDEN` events that `AuthContext` listens to.

### Token & Tenant Storage

`src/lib/api/storage.ts` — cookies are the source of truth (middleware reads them); localStorage is a fallback. Both are kept in sync automatically. Use:
- `getStoredToken()` / `getStoredRefreshToken()`
- `getStoredTenantId()`
- `setStoredTokens(token, refreshToken)` / `setStoredTenantId(tenantId)`
- `clearStoredTokens()`

### Error Handling

`src/lib/errors/` defines a typed error hierarchy:

```typescript
// Throw typed errors in service layer
throw new ValidationError('Invalid input', details)
throw new UnauthorizedError()
throw new NotFoundError('Property not found')

// Catch all at API boundary
import { handleError } from '@/lib/errors'
try { ... } catch (err) { return handleError(err) }
```

`handleError()` converts Zod errors, `AppError` subclasses, and generic errors into the standard `ErrorResponse` shape. Predefined codes live in `ErrorCode` enum (`VALIDATION_ERROR`, `TOKEN_EXPIRED`, `INSUFFICIENT_PERMISSIONS`, `RESOURCE_CONFLICT`, etc.).

### Pagination

`src/lib/api/pagination.ts` provides:
- `parsePaginationParams(searchParams)` — validates URL params, returns `QueryOptions`
- `DEFAULT_PAGE_SIZE = 10`, `MAX_PAGE_SIZE = 100`
- `PaginationMeta` interface used in list responses (`page`, `pageSize`, `total`, `totalPages`, `hasNext`, `hasPrev`)

### Key Providers Stack

`src/components/Providers.tsx` wraps in order: `VerticalNavProvider` → `SettingsProvider` → `ThemeProvider` → `AuthProviderWrapper` (client-only, in `src/components/AuthProviderWrapper.tsx`).

### Path Aliases (tsconfig)

- `@/` → `src/`
- `@core/` → `src/@core/`
- `@layouts/` → `src/@layouts/`
- `@menu/` → `src/@menu/`
- `@components/` → `src/components/`
- `@views/` → `src/views/`

## Environment Variables

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
BASEPATH=
```

## Adding a New Feature

1. `src/app/(dashboard)/feature/page.tsx` — server component page
2. `src/views/feature/FeatureView.tsx` — client component with `'use client'`
3. `src/lib/api/feature.ts` — API functions returning `ApiResponse<T>` (use `feature.server.ts` for server-only)
4. `src/types/feature/` — domain types
5. `src/lib/validation/schemas/feature.schema.ts` — Zod schema if needed

In client components, always gate API calls on tenant being available:

```typescript
const { tenant } = useAuth()
useEffect(() => {
  if (tenant) fetchData()
}, [tenant])
```

## Key Architectural Rules

- **No API calls in page.tsx** — keep pages as thin wrappers; logic lives in views and `src/lib/api/`
- **Use parallel requests** — `Promise.all()` instead of sequential awaits to avoid waterfalls
- **Business logic in service layer** — not in components; components call functions from `src/lib/api/`
- **`X-Tenant-ID` is automatic** — the axios interceptor handles it; never pass it manually
- **No state management library** — use Context API (`AuthContext`) + local `useState`; no React Query, Zustand, or Formik
- **Forms use Zod schemas** — validate with `src/lib/validation/schemas/`; controlled inputs with `useState`
- **Avoid barrel `index.ts` files** for large modules — hurts tree-shaking
- **`'use client'`** must be explicit on components that use hooks, browser APIs, or event handlers

## Testing

- **Runner**: Vitest with `happy-dom` environment
- **Setup**: `src/__tests__/setup.ts` mocks `window.matchMedia`
- **Coverage thresholds**: 80% statements, branches, functions, lines on business logic
- **Pattern**: mock API helpers with `vi.mock('@/lib/api/client')`; test files in `src/__tests__/`

```bash
npx vitest run src/__tests__/specific.test.ts  # Run a single test file
```

## UI Stack

- **MUI v6** for components (`@mui/material`)
- **Tailwind CSS v3** for utility classes — `corePlugins.preflight: false` (MUI owns base styles), `important: '#__next'` for specificity, `tailwindcss-logical` for RTL support
- **Emotion** for CSS-in-JS (MUI's styling engine)
- **Iconify** with custom CSS build (`npm run build:icons`, auto-runs on postinstall)
- **ApexCharts** via `react-apexcharts` for data visualization
- **TanStack Table v8** for data tables
