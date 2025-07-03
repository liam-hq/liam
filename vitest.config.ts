import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      'frontend/apps/*',
      'frontend/internal-packages/!(e2e)',
      'frontend/packages/*',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '.next/**',
        'storybook-static/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.setup.*',
        '**/stories/**',
        '**/test/**',
        '**/tests/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
      ],
      all: true,
    },
  },
})
