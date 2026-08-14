/**
 * Next signals control flow by throwing.
 *
 * `notFound()`, `redirect()` and the dynamic-rendering bail-out are all raised
 * as exceptions carrying a `digest`. They are instructions to the framework,
 * not application failures — so a `catch` meant for "the API was unreachable"
 * will happily eat them, and the page then renders something nobody asked for.
 *
 * That is not hypothetical. `/listings` wrapped its fetch in a try/catch to
 * fail open to an empty list, and every production build printed:
 *
 *     [listings] failed to load public listings: Error: Dynamic server usage:
 *     Route /listings couldn't be rendered statically because it used no-store
 *     fetch ... { digest: 'DYNAMIC_SERVER_USAGE' }
 *
 * — the framework telling Next to render the route on demand, logged as an
 * application error. Anyone reading that build log would reasonably conclude
 * the listings API was broken.
 *
 * Call this first in any catch around a Server Component fetch. Matching on
 * `digest` rather than importing `isDynamicServerError` from
 * `next/dist/client/components/...` keeps this off Next's internal paths, which
 * move between versions.
 */
export function rethrowIfNextControlFlow(err: unknown): void {
  const digest = (err as { digest?: unknown } | null)?.digest

  if (typeof digest !== 'string') return

  // DYNAMIC_SERVER_USAGE — bail out of static rendering.
  // NEXT_NOT_FOUND / NEXT_REDIRECT;<url> — notFound() and redirect().
  if (digest === 'DYNAMIC_SERVER_USAGE' || digest.startsWith('NEXT_')) {
    throw err
  }
}
