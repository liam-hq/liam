import * as path from 'node:path'
import dotenv from 'dotenv'
import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    setupFiles: ['./vitest.setup.ts'],
    env: dotenv.config({ path: '.env' }).parsed,
  },
})
