import dotenv from 'dotenv'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: dotenv.config({ path: '.env' }).parsed,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'text-summary', 'json-summary', 'json'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
    },
  },
})
