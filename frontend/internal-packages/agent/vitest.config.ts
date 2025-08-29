import { defineProject } from 'vitest/config'

export default defineProject({
  test: {
    globals: true,
    environment: 'node',
    exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
  },
})
