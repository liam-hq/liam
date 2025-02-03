// biome-ignore lint/correctness/noNodejsModules: Because this file is a config file
import * as path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    include: ['src/**/*.test.ts'],
  },
})
