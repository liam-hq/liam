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
        '../../../apps/app/components/SessionDetailPage/components/Chat/components/TimelineItem/components/VersionMessage/VersionMessage':
          path.resolve(
            __dirname,
            '../../../apps/app/components/SessionDetailPage/components/Chat/components/TimelineItem/components/VersionMessage/VersionMessage.mock.tsx',
          ),
      }

      if (!config.resolve.plugins) {
        config.resolve.plugins = []
      }

      // Custom webpack resolver plugin to handle '@/' alias in erd-core package.
      // The erd-core package uses '@/' as a path alias internally, but Storybook's webpack
      // doesn't understand this alias by default. This plugin intercepts import requests
      // from erd-core and rewrites '@/' to the actual absolute path to erd-core/src.
      config.resolve.plugins.push({
        apply: (resolver: any) => {
          resolver.hooks.resolve.tapAsync(
            'ErdCoreAliasPlugin',
            (request: any, resolveContext: any, callback: any) => {
              if (
                request.context?.issuer?.includes('packages/erd-core') &&
                request.request?.startsWith('@/')
              ) {
                const erdCorePath = path.resolve(
                  __dirname,
                  '../../../packages/erd-core/src',
                )
                const newRequest = {
                  ...request,
                  request: request.request.replace('@/', `${erdCorePath}/`),
                }
                return resolver.doResolve(
                  resolver.hooks.resolve,
                  newRequest,
                  null,
                  resolveContext,
                  callback,
                )
              }
              callback()
            },
          )
        },
      })
    }
    return config
  },
}

export default config
