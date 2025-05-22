import { validateConfig } from '@liam-hq/github'
import * as Sentry from '@sentry/nextjs'
import { registerOTel } from '@vercel/otel'
import { LangfuseExporter } from 'langfuse-vercel'

export async function register() {
  registerOTel({
    serviceName: 'liam-app',
    traceExporter: new LangfuseExporter({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
      secretKey: process.env.LANGFUSE_SECRET_KEY || '',
      baseUrl: process.env.LANGFUSE_BASE_URL || 'https://cloud.langfuse.com',
      environment: process.env.NEXT_PUBLIC_ENV_NAME || 'development',
    }),
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
