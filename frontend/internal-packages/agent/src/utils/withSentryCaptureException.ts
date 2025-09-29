import * as Sentry from '@sentry/node'

/**
 * Generate a random UUID for Sentry event ID
 */
function generateEventId(): string {
  return 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'.replace(/[x]/g, () => {
    return Math.floor(Math.random() * 16).toString(16)
  })
}

/**
 * Send error directly to Sentry via API
 * This is used when Sentry SDK is not initialized
 */
async function sendToSentryAPI(
  error: Error,
  tags?: Record<string, string>,
  extra?: Record<string, unknown>,
): Promise<void> {
  const dsn = process.env['SENTRY_DSN'] || process.env['NEXT_PUBLIC_SENTRY_DSN']

  if (!dsn) {
    console.warn('[withSentryCaptureException] No SENTRY_DSN found')
    return
  }

  // Parse DSN
  const dsnMatch = dsn.match(/https:\/\/([^@]+)@([^/]+)\/(.+)/)
  if (!dsnMatch) {
    console.warn('[withSentryCaptureException] Invalid DSN format')
    return
  }

  const [, publicKey, host, projectId] = dsnMatch
  const sentryUrl = `https://${host}/api/${projectId}/store/`

  // Create Sentry event payload
  const event = {
    event_id: generateEventId(),
    timestamp: new Date().toISOString(),
    platform: 'node',
    level: 'error',
    exception: {
      values: [
        {
          type: error.name,
          value: error.message,
          stacktrace: {
            frames: (error.stack || '')
              .split('\n')
              .slice(1)
              .map((line) => ({
                filename: 'unknown',
                function: line.trim(),
                in_app: true,
              }))
              .reverse(),
          },
        },
      ],
    },
    tags,
    extra,
    environment: process.env['NEXT_PUBLIC_ENV_NAME'] || 'development',
  }

  // eslint-disable-next-line no-restricted-syntax -- Need try-catch for fetch error handling
  try {
    const response = await fetch(sentryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Sentry-Auth': `Sentry sentry_key=${publicKey}, sentry_version=7`,
      },
      body: JSON.stringify(event),
    })

    if (!response.ok) {
      console.error(
        '[withSentryCaptureException] Failed to send to Sentry:',
        response.status,
      )
    } else {
    }
  } catch (fetchError) {
    console.error(
      '[withSentryCaptureException] Error sending to Sentry:',
      fetchError,
    )
  }
}

export const withSentryCaptureException = async <T>(
  operation: () => Promise<T>,
): Promise<T> => {
  // eslint-disable-next-line no-restricted-syntax -- LangGraph requires throwing errors for proper retry mechanism
  try {
    return await operation()
  } catch (error) {
    console.error('[withSentryCaptureException] Capturing error:', error)

    // Check if error has Sentry-specific properties
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Need to check for custom error properties
    const errorWithSentry = error as {
      tags?: Record<string, string>
      extra?: Record<string, unknown>
    }

    // Try using Sentry SDK first
    if (Sentry.getCurrentScope()) {
      // Only pass options if they exist
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Need type for Sentry options
      const captureOptions = {} as {
        tags?: Record<string, string>
        extra?: Record<string, unknown>
      }

      if (errorWithSentry.tags) {
        captureOptions.tags = errorWithSentry.tags
      }
      if (errorWithSentry.extra) {
        captureOptions.extra = errorWithSentry.extra
      }

      // Capture with tags and extra data if available
      const eventId =
        Object.keys(captureOptions).length > 0
          ? Sentry.captureException(error, captureOptions)
          : Sentry.captureException(error)

      console.error(
        '[withSentryCaptureException] Sent to Sentry SDK with eventId:',
        eventId,
      )
    } else {
      await sendToSentryAPI(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Need to cast error to Error type
        error as Error,
        errorWithSentry.tags,
        errorWithSentry.extra,
      )
    }

    console.error(
      '[withSentryCaptureException] With tags:',
      errorWithSentry.tags,
    )
    console.error(
      '[withSentryCaptureException] With extra:',
      errorWithSentry.extra,
    )

    throw error
  }
}
