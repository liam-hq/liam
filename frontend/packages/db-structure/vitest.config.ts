import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
        '**/__tests__/**',
        '**/test/**',
        '**/index.ts',
        // TODO: Add ESLint rule to ensure index.ts files only contain exports
        // This would enforce that index.ts files remain pure export files
        // and prevent logic from being added to them
      ],
      include: ['src/**/*.{ts,tsx}'],
      all: true,
      clean: true,
      reportOnFailure: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
