import * as path from 'node:path'
import dotenv from 'dotenv'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    setupFiles: ['./vitest.setup.ts'],
    env: dotenv.config({ path: '.env' }).parsed,
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
