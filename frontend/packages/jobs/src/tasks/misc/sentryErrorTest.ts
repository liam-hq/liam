import { task } from '@trigger.dev/sdk/v3'

export const sentryErrorTest = task({
  id: 'sentry-error-test',
  retry: {
    maxAttempts: 1,
  },
  run: async () => {
    throw new Error('Sentry integration test error')
  },
})
