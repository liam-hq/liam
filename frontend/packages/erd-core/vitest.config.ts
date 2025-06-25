// biome-ignore lint/correctness/noNodejsModules: Because this file is a config file
import * as path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: react(),
  test: {
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    environment: 'happy-dom',
    setupFiles: ['@testing-library/jest-dom/vitest'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      reportsDirectory: 'coverage',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    }
  },
})
