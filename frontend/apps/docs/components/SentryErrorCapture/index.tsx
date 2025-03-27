'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/**
 * SentryErrorCapture - Captures 404 errors for asset files and reports them to Sentry
 *
 * Background:
 * This component was added after a postmortem analysis of an incident where
 * stylesheet paths in the HTML head tag were using relative paths instead of absolute paths.
 * When the docs app is path-routed under liambx.com/docs, relative paths caused 404 errors
 * as they tried to load assets from liambx.com/_next instead of the docs app's domain.
 *
 * This component helps detect such issues by capturing and reporting 404 errors
 * for script, link (CSS), and image elements to Sentry.
 */
export const SentryErrorCapture = () => {
  useEffect(() => {
    const handleError = (event: Event) => {
      const target = event.target
      if (
        target instanceof HTMLScriptElement ||
        target instanceof HTMLLinkElement ||
        target instanceof HTMLImageElement
      ) {
        let src: string | null = null
        if (
          target instanceof HTMLScriptElement ||
          target instanceof HTMLImageElement
        ) {
          src = target.src
        } else if (target instanceof HTMLLinkElement) {
          src = target.href
        }

        if (src) {
          try {
            if (process.env.NEXT_PUBLIC_ENV_NAME === 'development') {
            }
            Sentry.captureMessage(`Failed to load resource: ${src}`, 'error')
          } catch (e) {
            console.warn('Failed to send error to Sentry:', e)
          }
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
