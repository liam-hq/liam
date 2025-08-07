import path from 'node:path'
import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: [
    {
      directory: '../../../apps/app',
      files: '**/*.stories.@(jsx|tsx|mdx)',
      titlePrefix: 'app',
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
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public', './public', '../../../apps/app/public'],
  webpackFinal: async (config) => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../../../apps/app'),
        // Mock VersionMessage component to avoid Supabase dependency
        '../../../apps/app/components/SessionDetailPage/components/Chat/components/TimelineItem/components/VersionMessage/VersionMessage': path.resolve(
          __dirname,
          '../../../apps/app/components/SessionDetailPage/components/Chat/components/TimelineItem/components/VersionMessage/VersionMessage.mock.tsx',
        ),
      }
    }
    
    const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin')
    if (config.resolve) {
      if (!config.resolve.plugins) {
        config.resolve.plugins = []
      }
      config.resolve.plugins.push(
        new TsconfigPathsPlugin({
          configFile: path.resolve(__dirname, '../../../packages/erd-core/tsconfig.json'),
        })
      )
    }
    
    return config
  },
}

export default config
