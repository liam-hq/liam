import { fromPromise, fromThrowable } from '@liam-hq/neverthrow'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import * as v from 'valibot'
import {
  readRefreshToken,
  writeAccessToken,
  writeRefreshToken,
} from '../../../../../libs/github/cookie'

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

const GitHubTokenSuccessSchema = v.object({
  access_token: v.string(),
  refresh_token: v.string(),
  token_type: v.string(),
  expires_in: v.number(), // seconds
  // Align cookie TTL with GitHub if provided
  refresh_token_expires_in: v.optional(v.number()), // seconds
})

const GitHubTokenErrorSchema = v.object({
  error: v.string(),
  error_description: v.optional(v.string()),
  error_uri: v.optional(v.string()),
})

const getClientCredentials = fromThrowable(() => {
  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    // eslint-disable-next-line no-throw-error/no-throw-error -- Throw to feed fromThrowable wrapper
    throw new Error('Missing GitHub OAuth client credentials')
  }
  return { clientId, clientSecret }
})

function parseGitHubRefreshResponse(json: unknown) {
  const success = v.safeParse(GitHubTokenSuccessSchema, json)
  if (success.success) return success.output
  const ghError = v.safeParse(GitHubTokenErrorSchema, json)
  if (ghError.success) {
    const { error: code, error_description } = ghError.output
    // eslint-disable-next-line no-throw-error/no-throw-error -- Propagate parse failure to caller
    throw new Error(
      `GitHub token refresh failed: ${code}${error_description ? ` - ${error_description}` : ''}`,
    )
  }
  // eslint-disable-next-line no-throw-error/no-throw-error -- Propagate parse failure to caller
  throw new Error('GitHub token refresh returned invalid response')
}

function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string,
) {
  return fromPromise(
    (async () => {
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      })
      const res = await fetch(GITHUB_TOKEN_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
        cache: 'no-store',
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        // eslint-disable-next-line no-throw-error/no-throw-error -- Map HTTP error into Result error
        throw new Error(`GitHub token refresh failed: ${res.status} ${text}`)
      }
      const json = await res.json().catch(() => null)
      const next = parseGitHubRefreshResponse(json)
      const newExpiresAt = new Date(
        Date.now() + next.expires_in * 1000,
      ).toISOString()
      return {
        access_token: next.access_token,
        refresh_token: next.refresh_token,
        refresh_token_expires_in: next.refresh_token_expires_in,
        newExpiresAt,
      }
    })(),
  )
}

async function handler(): Promise<NextResponse> {
  // production flag was only used for dev logging; removed
  // 1) Load refresh token from cookie
  const refresh = await readRefreshToken()
  const refreshToken = refresh?.token ?? ''
  if (!refreshToken) {
    return NextResponse.json(
      { ok: false, error: 'missing_refresh_token' },
      { status: 401 },
    )
  }

  // 2) Load client credentials
  const creds = getClientCredentials()
  if (creds.isErr()) {
    Sentry.captureException(creds.error, { tags: { area: 'refresh_api' } })
    return NextResponse.json(
      { ok: false, error: 'server_misconfigured' },
      { status: 500 },
    )
  }
  const { clientId, clientSecret } = creds.value

  // 3) Refresh via GitHub
  const refreshed = await refreshAccessToken(
    refreshToken,
    clientId,
    clientSecret,
  ).match(
    (v) => v,
    (e) => {
      Sentry.captureException(e, { tags: { area: 'refresh_api' } })
      return null
    },
  )
  if (!refreshed) {
    return NextResponse.json(
      { ok: false, error: 'refresh_failed' },
      { status: 401 },
    )
  }

  // 4) Persist into cookies (access + refresh)
  await writeAccessToken(refreshed.access_token, refreshed.newExpiresAt)
  const rtei = refreshed.refresh_token_expires_in ?? 0
  const refreshTtlMs = rtei > 0 ? rtei * 1000 : THIRTY_DAYS_MS
  const refreshExpiresAt = new Date(Date.now() + refreshTtlMs).toISOString()
  await writeRefreshToken(refreshed.refresh_token, refreshExpiresAt)
  // refreshed successfully; cookies updated

  // 5) return OK
  return NextResponse.json({ ok: true })
}

export async function POST() {
  return handler()
}
