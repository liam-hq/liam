import * as path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineProject } from 'vitest/config'

export default defineProject({
  plugins: react(),
  test: {
    globals: true,
    environment: 'happy-dom',
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    setupFiles: ['@testing-library/jest-dom/vitest'],
  },
})
