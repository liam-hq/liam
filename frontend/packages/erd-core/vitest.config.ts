import * as path from 'node:path'
import { storybookTest } from '@storybook/experimental-addon-test/vitest-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    storybookTest({
      configDir: path.join(
        __dirname,
        '../../internal-packages/storybook/.storybook',
      ),
      storybookScript:
        'cd ../../.. && pnpm run dev --filter @liam-hq/storybook',
    }),
  ],
  test: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    browser: {
      enabled: true,
      instances: [{ browser: 'chromium' }],
      headless: true,
      provider: 'playwright',
    },
  },
})
