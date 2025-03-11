import { validateConfig } from '@/libs/github/config'
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')

    // Validate GitHub configuration at app boot time
    const { valid, missing } = validateConfig()
    if (!valid) {
      console.error(
        `GitHub App configuration error: Missing required environment variables: ${missing.join(', ')}`,
      )
      // We log the error but don't throw to allow the app to start even if GitHub webhook functionality won't work
      // This allows other parts of the application to function normally
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
