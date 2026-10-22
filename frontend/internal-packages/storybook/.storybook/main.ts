import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import type { StorybookConfig } from '@storybook/nextjs'

const require = createRequire(import.meta.url)

const config: StorybookConfig = {
  stories: [
    {
      directory: '../../../apps/app/components',
      files: '**/*.stories.@(jsx|tsx|mdx)',
      titlePrefix: 'app/components',
    },
    {
      directory: '../../../packages/ui/src',
      files: '**/*.stories.@(jsx|tsx|mdx)',
      titlePrefix: 'ui',
    },
    {
      directory: '../../../packages/erd-core/src',
      files: '**/*.stories.@(jsx|tsx|mdx)',
      titlePrefix: 'erd-core',
    },
  ],

  addons: [
    getAbsolutePath('@storybook/addon-links'),
    getAbsolutePath('@storybook/addon-docs'),
  ],

  framework: {
    name: getAbsolutePath('@storybook/nextjs'),
    options: {},
  },

  staticDirs: [
    '../public',
    './public',
    '../../../apps/app/public',
    {
      from: '../../../packages/ui/src/styles',
      to: 'styles',
    },
  ],

  webpackFinal: async (config) => {
    return config
  },
}

export default config

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, 'package.json')))
}
