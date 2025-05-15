import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  integrations: [Sentry.replayIntegration()],

  tracesSampleRate: 1,

  replaysSessionSampleRate: 0.1,

  replaysOnErrorSampleRate: 1.0,

  debug: false,

  environment: process.env.NEXT_PUBLIC_ENV_NAME,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
