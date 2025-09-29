import * as Sentry from '@sentry/node'

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
      '[withSentryCaptureException] Sent to Sentry with eventId:',
      eventId,
    )
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
