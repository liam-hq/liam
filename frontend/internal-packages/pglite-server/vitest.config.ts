import * as path from 'node:path'
import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000, // 30 seconds timeout for CI environments
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
