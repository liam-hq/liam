import { execSync } from 'node:child_process'
import { withSentryConfig } from '@sentry/nextjs'
import type { NextConfig } from 'next'

const gitCommitHash = execSync('git rev-parse --short HEAD').toString().trim()
const releaseDate = new Date().toISOString().split('T')[0]

const nextConfig: NextConfig = {
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

  // Hides source maps from generated client bundles
  hideSourceMaps: true,

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
  // See the following for more information:
  // https://docs.sentry.io/product/crons/
  // https://vercel.com/docs/cron-jobs
  automaticVercelMonitors: true,
})
