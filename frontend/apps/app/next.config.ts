import { execSync } from 'node:child_process'
import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const gitCommitHash = execSync('git rev-parse --short HEAD').toString().trim()
const releaseDate = new Date().toISOString().split('T')[0]

if (process.env.VERCEL_ENV === 'production') {
  if (!process.env.ASSET_PREFIX) {
    throw new Error('ASSET_PREFIX is not set')
  }
}

const nextConfig: NextConfig = {
  // Server-only packages that should not be bundled on the client
  serverExternalPackages: ['@mastra/*'],

  // NOTE: Exclude Prisma-related packages from the bundle
  // These packages are installed separately in the node_modules/@prisma directory
  // Excluding them prevents `Error: Cannot find module 'fs'` errors in the build process
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  webpack: (config) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (Array.isArray(config.externals)) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      config.externals.push(
        '@prisma/debug',
        '@prisma/engines',
        '@prisma/engines-version',
        '@prisma/fetch-engine',
        '@prisma/generator-helper',
        '@prisma/get-platform',
        '@prisma/internals',
        '@prisma/prisma-schema-wasm',
        '@prisma/schema-files-loader',
      )
    } else {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      config.externals['@prisma/debug'] = '@prisma/debug'

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      config.externals['@prisma/engines'] = '@prisma/engines'

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      config.externals['@prisma/engines-version'] = '@prisma/engines-version'

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      config.externals['@prisma/fetch-engine'] = '@prisma/fetch-engine'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      config.externals['@prisma/generator-helper'] = '@prisma/generator-helper'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      config.externals['@prisma/get-platform'] = '@prisma/get-platform'

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      config.externals['@prisma/internals'] = '@prisma/internals'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      config.externals['@prisma/prisma-schema-wasm'] =
        '@prisma/prisma-schema-wasm'
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      config.externals['@prisma/schema-files-loader'] =
        '@prisma/schema-files-loader'
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    config.plugins.push({
      // biome-ignore lint/suspicious/noExplicitAny: webpack types are incomplete so we need to use any here
      apply: (compiler: any) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        compiler.hooks.afterEmit.tap('InstallPrismaInternals', () => {
          execSync('node scripts/install-prisma-internals.mjs', {
            stdio: 'inherit',
            cwd: __dirname,
          })
        })
      },
    })

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    config.plugins = [...config.plugins]

    return config
  },
  outputFileTracingIncludes: {
    '/erd/p/\\[\\.\\.\\.slug\\]': ['./prism.wasm'],
  },
  env: {
    NEXT_PUBLIC_GIT_HASH: gitCommitHash,
    NEXT_PUBLIC_RELEASE_DATE: releaseDate,
  },
  // TODO: consider using .env.preview or the Preview environment variable setting in Vercel
  // https://github.com/liam-hq/liam/pull/422#discussion_r1906531394
  assetPrefix:
    process.env.NEXT_PUBLIC_ENV_NAME === 'production'
      ? process.env.ASSET_PREFIX
      : undefined,
}

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: true,
  },

  // Uncomment to route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  // This can increase your server load as well as your hosting bill.
  // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
  // side errors will fail.
  // tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
})
