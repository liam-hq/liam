import { defineConfig } from 'vitest/config'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import path from 'node:path'

export default defineConfig({
  test: {
    name: 'storybook',
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [
        {
          browser: 'chromium',
          headless: true,
        },
      ],
    },
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@storybook/test': '@storybook/addon-vitest',
      '@': path.resolve(__dirname, '../../apps/app'),
      '@liam-hq/ui/src': path.resolve(__dirname, '../../packages/ui/src'),
      '@liam-hq/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@liam-hq/app-ui': path.resolve(__dirname, '../app-ui/src'),
      '@liam-hq/db-structure': path.resolve(__dirname, '../../packages/db-structure/src'),
    },
  },
  plugins: [storybookTest()],
})