import '@testing-library/jest-dom/vitest'
import { vi, afterEach } from 'vitest'

// Mock Next.js modules
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
  headers: vi.fn(() => new Headers()),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  usePathname: vi.fn(() => '/'),
}))

// Mock environment variables
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key')

// Global test cleanup
afterEach(() => {
  vi.clearAllMocks()
})
