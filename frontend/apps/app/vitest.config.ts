import * as path from 'node:path'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import { defineProject } from 'vitest/config'

export default defineProject({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    setupFiles: ['./vitest.setup.ts'],
    env: dotenv.config({ path: '.env' }).parsed,
  },
})
