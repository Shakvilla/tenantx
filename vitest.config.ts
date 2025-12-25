import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Environment
    environment: 'happy-dom',
    
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
    
    // Timeout for async tests
    testTimeout: 10000,
    
    // Pool options
    pool: 'forks',
    
    // Mock reset
    mockReset: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
