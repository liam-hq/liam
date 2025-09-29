import * as Sentry from '@sentry/node'

export const withSentryCaptureException = async <T>(
  operation: () => Promise<T>,
): Promise<T> => {
  // eslint-disable-next-line no-restricted-syntax -- LangGraph requires throwing errors for proper retry mechanism
  try {
    return await operation()
  } catch (error) {
    console.error('[withSentryCaptureException] Capturing error:', error)
    const eventId = Sentry.captureException(error)
    console.error(
      '[withSentryCaptureException] Sent to Sentry with eventId:',
      eventId,
    )
    throw error
  }
}
