import '@testing-library/jest-dom'
import { vi } from 'vitest'

// happy-dom logs a DOMException for every iframe because iframe page loading
// is disabled (see vitest.config.ts). It logs through the console reference it
// captured at environment setup, which bypasses vitest's onConsoleLog and any
// console patched here, so filter the message at the stream level instead.
for (const stream of [process.stderr, process.stdout]) {
  const originalWrite = stream.write.bind(stream)
  stream.write = ((chunk: string | Uint8Array, ...rest: unknown[]) => {
    if (typeof chunk === 'string' && chunk.includes('Iframe page loading is disabled')) {
      const callback = rest.find(arg => typeof arg === 'function') as (() => void) | undefined
      callback?.()
      return true
    }
    return originalWrite(chunk, ...(rest as []))
  }) as typeof stream.write
}

// In-memory localStorage polyfill (happy-dom does not provide a working one here)
if (typeof window !== 'undefined' && typeof window.localStorage?.getItem !== 'function') {
  const store = new Map<string, string>()
  const localStorageMock: Storage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => {
      store.set(key, String(value))
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size
    }
  }
  Object.defineProperty(window, 'localStorage', { writable: true, value: localStorageMock })
}

// Mock matchMedia if needed
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
