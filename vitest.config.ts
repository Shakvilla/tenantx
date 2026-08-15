import os from 'os'
import path from 'path'

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Deliberately fewer workers than cores.
 *
 * The dialog tests render a 1600-line MUI wizard and walk it end to end. That
 * costs 6–10s each on an idle machine — inherent to the component, not a slow
 * test doing something silly. With one fork per core, each also re-imports the
 * whole MUI surface, and they starve each other badly enough to blow a 30s
 * timeout: measured on a quiet 16-core machine, five tests failed on
 * "Test timed out in 30000ms" and every one of them passed alone.
 *
 * Halving the workers more than halved the work, because the contention was
 * costing more than the parallelism was buying: cumulative import 893s → 100s
 * and test time 1025s → 104s. Wall-clock went from 202s (failing) to 55s on a
 * warm cache, so this is not a green-for-slower trade — it is simply faster.
 *
 * Scaled to the machine rather than pinned, so a 4-core CI box does not end up
 * running six heavyweight workers on four cores — which is the same starvation
 * this exists to prevent.
 *
 * Set via `maxWorkers`, not `poolOptions.forks.maxForks`: this Vitest has no
 * such key and ignored it silently, so the first attempt at this fix changed
 * nothing and the suite went on failing exactly as before.
 */
const maxWorkers = Math.max(2, Math.min(6, Math.ceil(os.cpus().length / 2)))

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: {
        settings: {
          // Don't fetch real iframe pages (e.g. Google Maps embeds) during tests
          disableIframePageLoading: true,
        },
      },
    },

    // Global test setup
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
    
    // Include patterns
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    
    // Exclude patterns
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'src/__tests__/setup.ts',
      'src/__tests__/utils/**',
    ],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/services/**/*.ts',
        'src/repositories/**/*.ts',
        'src/lib/**/*.ts',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/**/*.test.ts',
        'src/__tests__/**',
      ],
      thresholds: {
        // Per your rules: >80% on business logic
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
    
    // Reporters
    reporters: ['default'],
    
    // Timeout for async tests.
    //
    // 10s was too tight for the dialog tests, which render a full multi-step
    // MUI form and walk it end to end: ~2s on an idle machine, well past 10s
    // whenever anything else is running. That failed a different handful of
    // tests on every run — always "Test timed out", never an assertion — and
    // each one passed on its own, which is the worst kind of red: it teaches
    // you to ignore the suite. 30s still fails a genuinely hung test promptly
    // enough, and every test here is expected to finish in single-digit
    // seconds, so a run near this limit is a signal in itself.
    testTimeout: 30000,
    
    // Pool options — see the maxWorkers note above.
    pool: 'forks',
    maxWorkers,
    
    // Mock reset
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/@core'),
      '@layouts': path.resolve(__dirname, './src/@layouts'),
      '@menu': path.resolve(__dirname, './src/@menu'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@components': path.resolve(__dirname, './src/components'),
      '@configs': path.resolve(__dirname, './src/configs'),
      '@views': path.resolve(__dirname, './src/views'),
    },
  },
})
