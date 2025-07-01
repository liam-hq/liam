// biome-ignore lint/correctness/noNodejsModules: Because this file is a config file
import * as path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineProject } from 'vitest/config'

export default defineProject({
  plugins: react(),
  test: {
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    environment: 'happy-dom',
    setupFiles: ['@testing-library/jest-dom/vitest'],
  },
})
