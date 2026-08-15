import { describe, it, expect } from 'vitest'

import { rethrowIfNextControlFlow } from '@/lib/next-control-flow'

/**
 * The guard that stops a "the API was unreachable" catch from eating Next's
 * control-flow signals.
 *
 * `/listings` wrapped its fetch to fail open to an empty list, and every
 * production build printed the dynamic-rendering bail-out as
 * "[listings] failed to load public listings" — the framework's instruction,
 * logged as an application error.
 */
describe('rethrowIfNextControlFlow', () => {
  it('rethrows the dynamic-rendering bail-out', () => {
    const err = Object.assign(new Error('Dynamic server usage'), { digest: 'DYNAMIC_SERVER_USAGE' })

    expect(() => rethrowIfNextControlFlow(err)).toThrow(err)
  })

  it('rethrows notFound()', () => {
    const err = Object.assign(new Error('NEXT_NOT_FOUND'), { digest: 'NEXT_NOT_FOUND' })

    expect(() => rethrowIfNextControlFlow(err)).toThrow(err)
  })

  it('rethrows redirect(), whose digest carries the target url', () => {
    const err = Object.assign(new Error('NEXT_REDIRECT'), { digest: 'NEXT_REDIRECT;replace;/login;307;' })

    expect(() => rethrowIfNextControlFlow(err)).toThrow(err)
  })

  it('lets a real failure through, so the caller can still fail open', () => {
    // The case the catch exists for: the listings API is down and the page
    // should render its empty state rather than a 500.
    expect(() => rethrowIfNextControlFlow(new Error('fetch failed'))).not.toThrow()
  })

  it('lets an HTTP error through', () => {
    expect(() => rethrowIfNextControlFlow(new Error('Failed to fetch listings: 502'))).not.toThrow()
  })

  it('ignores anything without a string digest', () => {
    // Thrown values are not always Errors, and `digest` is not always a string.
    expect(() => rethrowIfNextControlFlow(null)).not.toThrow()
    expect(() => rethrowIfNextControlFlow(undefined)).not.toThrow()
    expect(() => rethrowIfNextControlFlow('a string')).not.toThrow()
    expect(() => rethrowIfNextControlFlow({ digest: 404 })).not.toThrow()
  })

  it('does not rethrow a digest that merely looks similar', () => {
    // Guards against matching by substring: only Next's own prefixes count.
    expect(() => rethrowIfNextControlFlow({ digest: 'MY_NEXT_THING' })).not.toThrow()
    expect(() => rethrowIfNextControlFlow({ digest: 'not-DYNAMIC_SERVER_USAGE' })).not.toThrow()
  })
})
