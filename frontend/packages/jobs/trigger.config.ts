import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sentryEsbuildPlugin } from '@sentry/esbuild-plugin'
import * as Sentry from '@sentry/node'
import { esbuildPlugin } from '@trigger.dev/build/extensions'
import { additionalFiles } from '@trigger.dev/build/extensions/core'
import { defineConfig } from '@trigger.dev/sdk/v3'
import * as dotenv from 'dotenv'
import { globSync } from 'glob'

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' })
}

dotenv.config({ path: '.env' })

const triggerProjectId = process.env.TRIGGER_PROJECT_ID || 'project-id'

// Current file and directory
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Project root directory (3 levels up from trigger.config.ts in frontend/packages/jobs)
const rootDir = resolve(__dirname, '../../..')

// Find Prisma WASM files using glob patterns relative to the project root
const findPrismaWasmFiles = () => {
  const patterns = [
    // Look in node_modules for prisma WASM files (pnpm structure)
    'node_modules/.pnpm/@prisma+prisma-schema-wasm@*/node_modules/@prisma/prisma-schema-wasm/src/*.wasm',
    'node_modules/.pnpm/prisma@*/node_modules/prisma/build/*.wasm',
    // Look in standard node_modules locations as fallback
    'node_modules/@prisma/prisma-schema-wasm/src/*.wasm',
    'node_modules/prisma/build/*.wasm',
  ]

  const files: string[] = []

  for (const pattern of patterns) {
    const found = globSync(pattern, { cwd: rootDir, absolute: true })
    files.push(...found)
  }

  // eslint-disable-next-line no-console
  console.info('Found Prisma WASM files:', files)

  return files
}

// Find all WASM files and make paths relative for additionalFiles
const prismaWasmFiles = findPrismaWasmFiles()

export default defineConfig({
  project: triggerProjectId,
  runtime: 'node',
  logLevel: 'log',
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    extensions: [
      esbuildPlugin(
        sentryEsbuildPlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
        { placement: 'last', target: 'deploy' },
      ),
      // Add all necessary WASM files
      additionalFiles({
        files: ['prism.wasm', ...prismaWasmFiles],
      }),
    ],
    external: [
      'uuid',
      '@prisma/client',
      '@prisma/debug',
      '@prisma/engines',
      '@prisma/engines-version',
      '@prisma/fetch-engine',
      '@prisma/generator-helper',
      '@prisma/get-platform',
      '@prisma/internals',
      '@prisma/prisma-schema-wasm',
      '@prisma/schema-files-loader',
    ],
  },
  init: async () => {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,

      tracesSampleRate: 1,

      debug: false,

      environment: process.env.NEXT_PUBLIC_ENV_NAME,
    })
  },
  onFailure: async (payload, error, { ctx }) => {
    Sentry.captureException(error, {
      extra: {
        payload,
        ctx,
      },
    })
  },
  dirs: ['./src/trigger'],
})
