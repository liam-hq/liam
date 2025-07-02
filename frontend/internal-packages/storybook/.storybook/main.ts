import { createRequire } from "node:module";
import path, { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/nextjs'

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
  stories: [
    '../../../apps/app/features/**/*.stories.@(js|jsx|ts|tsx)',
    '../../../apps/app/components/**/*.stories.@(js|jsx|ts|tsx)',
    '../../../packages/ui/src/**/*.stories.@(js|jsx|ts|tsx)',
    '../../app-ui/src/**/*.stories.@(js|jsx|ts|tsx)',
  ],

  addons: [
    getAbsolutePath("@storybook/addon-links"),
    getAbsolutePath("@storybook/addon-docs"),
    getAbsolutePath("@storybook/addon-vitest"),
  ],

  framework: {
    name: getAbsolutePath("@storybook/nextjs"),
    options: {},
  },

  staticDirs: ['../public', './public', '../../../apps/app/public'],

  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../../../apps/app'),
        // Redirect imports of langfuseWeb to our mock implementation
        '../../../apps/app/lib/langfuseWeb': path.resolve(__dirname, './langfuseWeb.mock.ts'),
      }
    }
    return config
  }
}

export default config

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
