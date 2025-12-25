import { vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database/database.types'

/**
 * Creates a mock Supabase client for testing.
 * Allows chaining of methods and returns configurable data.
 */
export function createMockSupabaseClient(overrides?: Partial<MockChainResult>) {
  const defaultResult: MockChainResult = {
    data: null,
    error: null,
    count: null,
    ...overrides,
  }

  const chainMethods = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(defaultResult),
    maybeSingle: vi.fn().mockResolvedValue(defaultResult),
    or: vi.fn().mockReturnThis(),
    and: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    then: vi.fn((resolve) => resolve(defaultResult)),
  }

  // Make all chain methods return the chain object for fluent API
  Object.keys(chainMethods).forEach((key) => {
    if (key !== 'single' && key !== 'maybeSingle' && key !== 'then') {
      (chainMethods as Record<string, ReturnType<typeof vi.fn>>)[key].mockReturnValue(chainMethods)
    }
  })

  const mockClient = {
    from: vi.fn(() => chainMethods),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        createSignedUrl: vi.fn(),
      })),
    },
    // Expose chain methods for test assertions
    _chain: chainMethods,
  }

  return mockClient as unknown as MockSupabaseClient
}

/**
 * Sets the mock result for the next query.
 */
export function setMockResult(
  mockClient: MockSupabaseClient,
  result: MockChainResult
) {
  const chain = (mockClient as unknown as { _chain: MockChain })._chain
  chain.single.mockResolvedValueOnce(result)
  chain.maybeSingle.mockResolvedValueOnce(result)
  chain.then.mockImplementationOnce((resolve: (value: MockChainResult) => void) => resolve(result))
}

/**
 * Sets the mock to return an array of items (for list queries).
 */
export function setMockListResult<T>(
  mockClient: MockSupabaseClient,
  data: T[],
  count?: number
) {
  setMockResult(mockClient, {
    data,
    error: null,
    count: count ?? data.length,
  })
}

/**
 * Sets the mock to return an error.
 */
export function setMockError(
  mockClient: MockSupabaseClient,
  error: { message: string; code?: string }
) {
  setMockResult(mockClient, {
    data: null,
    error: error as PostgrestError,
    count: null,
  })
}

// Types
interface MockChainResult {
  data: unknown
  error: PostgrestError | null
  count: number | null
}

interface PostgrestError {
  message: string
  code?: string
  details?: string
}

interface MockChain {
  select: ReturnType<typeof vi.fn>
  insert: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
  eq: ReturnType<typeof vi.fn>
  single: ReturnType<typeof vi.fn>
  maybeSingle: ReturnType<typeof vi.fn>
  or: ReturnType<typeof vi.fn>
  order: ReturnType<typeof vi.fn>
  range: ReturnType<typeof vi.fn>
  then: ReturnType<typeof vi.fn>
  [key: string]: ReturnType<typeof vi.fn>
}

export type MockSupabaseClient = SupabaseClient<Database> & {
  _chain: MockChain
}
