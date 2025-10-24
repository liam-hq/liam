import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { ensureUserHasOrganization } from '../../../../components/LoginPage/services/ensureUserHasOrganization'
import { sanitizeReturnPath } from '../../../../components/LoginPage/services/validateReturnPath'
import { createClient } from '../../../../libs/db/server'
import {
  writeAccessToken,
  writeRefreshToken,
} from '../../../../libs/github/cookie'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Use query parameter "next" to redirect after auth, sanitize for security
  const next = sanitizeReturnPath(searchParams.get('next'), '/')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      await ensureUserHasOrganization()
      // Persist provider tokens into encrypted HttpOnly cookies (best-effort)
      const { session } = data
      const access = session?.provider_token ?? ''
      const refresh = session?.provider_refresh_token ?? ''
      // received provider tokens for cookie write
      // Access token expiration: 8 hours.
      // GitHub's OAuth access tokens expire after 8 hours.
      // Reference: https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#step-3-github-redirects-back-to-your-site
      const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000
      // Refresh token expiration: 6 months.
      // GitHub's refresh tokens expire after 6 months of inactivity.
      // Reference: https://docs.github.com/ja/apps/creating-github-apps/authenticating-with-a-github-app/refreshing-user-access-tokens
      const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000

      await fromAsyncThrowable(async () => {
        if (access) {
          const accessExpiresAt = new Date(
            Date.now() + EIGHT_HOURS_MS,
          ).toISOString()
          await writeAccessToken(access, accessExpiresAt)
        }
        if (refresh) {
          const refreshExpiresAt = new Date(
            Date.now() + SIX_MONTHS_MS,
          ).toISOString()
          await writeRefreshToken(refresh, refreshExpiresAt)
        }
      })().match(
        () => undefined,
        (e) => {
          const err = e instanceof Error ? e : new Error(String(e))
          Sentry.captureException(err, {
            tags: {
              area: 'auth_cookie_write',
            },
          })
          return undefined
        },
      )

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('OAuth callback code exchange failed:', {
      error: error.message,
      code: error.status,
      provider: request.url.includes('/github') ? 'github' : 'unknown',
      timestamp: new Date().toISOString(),
    })
  } else {
    console.error('OAuth callback missing code parameter:', {
      url: request.url,
      timestamp: new Date().toISOString(),
    })
  }

  return NextResponse.redirect(`${origin}/error`)
}
