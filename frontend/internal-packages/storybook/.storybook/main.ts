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
        // Redirect imports of langfuseWeb to our mock implementation
        '../../../apps/app/lib/langfuseWeb': path.resolve(
          __dirname,
          './langfuseWeb.mock.ts',
        ),
        // Mock VersionMessage component to avoid Supabase dependency
        '../../../apps/app/components/SessionDetailPage/components/Chat/components/TimelineItem/components/VersionMessage/VersionMessage': path.resolve(
          __dirname,
          '../../../apps/app/components/SessionDetailPage/components/Chat/components/TimelineItem/components/VersionMessage/VersionMessage.mock.tsx',
        ),
      }
    }
    return config
  },
}

export default config
