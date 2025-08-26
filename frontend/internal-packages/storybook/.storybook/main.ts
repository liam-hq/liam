import { createRequire } from "node:module";
import path, { dirname, join } from 'node:path';
import type { StorybookConfig } from '@storybook/nextjs'

const require = createRequire(import.meta.url);

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

  addons: [getAbsolutePath("@storybook/addon-links"), getAbsolutePath("@storybook/addon-docs")],

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
  }
}

export default config

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
