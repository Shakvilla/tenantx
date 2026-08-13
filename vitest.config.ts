import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

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
    
    // Pool options
    pool: 'forks',
    
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
