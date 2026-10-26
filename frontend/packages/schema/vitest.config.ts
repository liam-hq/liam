import * as path from 'node:path'
import { configDefaults, defineProject } from 'vitest/config'

export default defineProject({
  test: {
    globals: true,
    environment: 'node',
    exclude: [...configDefaults.exclude, '**/dist/**'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
