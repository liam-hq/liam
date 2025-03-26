'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export const SentryErrorCapture = () => {
  useEffect(() => {
    const handleError = (event: Event) => {
      const target = event.target as HTMLElement
      if (
        target instanceof HTMLScriptElement ||
        target instanceof HTMLLinkElement ||
        target instanceof HTMLImageElement
      ) {
        const src =
          target instanceof HTMLScriptElement ||
          target instanceof HTMLImageElement
            ? target.src
            : target instanceof HTMLLinkElement
              ? target.href
              : null
        if (src) {
          Sentry.captureMessage(`Failed to load resource: ${src}`, 'error')
        }
      }
    }

    document.addEventListener('error', handleError, true)

    return () => {
      document.removeEventListener('error', handleError, true)
    }
  }, [])

  return null
}
