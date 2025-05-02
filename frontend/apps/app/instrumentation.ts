import { validateConfig } from '@liam-hq/github'
import * as Sentry from '@sentry/nextjs'
import { registerOTel } from '@vercel/otel'
import { LangfuseExporter } from 'langfuse-vercel'

export async function register() {
  registerOTel({
    serviceName: 'liam-app',
    traceExporter: new LangfuseExporter(),
  })

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }

  if (process.env.VERCEL === '1') {
    const { valid, missing } = validateConfig()
    if (!valid) {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`,
      )
    }
  }
}

export const onRequestError = Sentry.captureRequestError
