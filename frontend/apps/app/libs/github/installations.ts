import type { Installation } from '@liam-hq/github'
import { createClient } from '../../libs/db/server'

const DEBUG = process.env.GITHUB_OAUTH_DEBUG === 'true'

function logDebug(message: string, meta?: Record<string, unknown>) {
  if (DEBUG) {
    if (meta) console.info(`[GitHubOAuth] ${message}`, meta)
    else console.info(`[GitHubOAuth] ${message}`)
  }
}

type ProviderTokens = {
  access_token: string
  refresh_token: string | null
}

type GitHubInstallationsResponse = {
  total_count: number
  installations: Installation[]
}

async function fetchGitHubInstallations(accessToken: string) {
  const res = await fetch('https://api.github.com/user/installations', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  })

  return res
}

async function refreshGitHubToken(refreshToken: string) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID || ''
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET || ''

  if (!clientId || !clientSecret) {
    throw new Error('Missing GitHub OAuth client credentials')
  }

  logDebug('Refreshing GitHub token', {
    hasClientId: Boolean(clientId),
    hasClientSecret: Boolean(clientSecret),
    refreshTokenLength: refreshToken?.length ?? 0,
  })

  const body = new URLSearchParams()
  body.set('grant_type', 'refresh_token')
  body.set('refresh_token', refreshToken)
  body.set('client_id', clientId)
  body.set('client_secret', clientSecret)

  const resp = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  })

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    console.error('[GitHubOAuth] Token refresh failed', {
      status: resp.status,
      bodySnippet: text.slice(0, 120),
    })
    throw new Error(`GitHub token refresh failed: ${resp.status}`)
  }

  const json = (await resp.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
    scope?: string
  }
  logDebug('Token refresh response', {
    hasAccessToken: Boolean(json.access_token),
    hasRefreshToken: Boolean(json.refresh_token),
    expiresIn: json.expires_in ?? null,
    tokenType: json.token_type ?? null,
    scope: json.scope ?? null,
  })
  if (!json.access_token) {
    // Many GitHub errors return fields like `error`, `error_description`
    const errShape = json as unknown as Record<string, unknown>
    console.error('[GitHubOAuth] Token refresh missing access_token', {
      error: errShape.error,
      error_description: errShape.error_description,
    })
  }
  return json
}

async function loadOrCreateTokensForUser(
  userId: string,
): Promise<ProviderTokens> {
  const supabase = await createClient()
  const { data: stored, error: loadErr } = await supabase
    .from('user_provider_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'github')
    .maybeSingle()
  if (loadErr) throw new Error('Failed to load provider token')

  const accessToken = stored?.access_token
  const refreshToken = stored?.refresh_token ?? null
  if (accessToken) {
    logDebug('Using stored provider tokens', {
      accessTokenLength: accessToken.length,
      refreshTokenLength: refreshToken?.length ?? 0,
    })
    return { access_token: accessToken, refresh_token: refreshToken }
  }
  logDebug('No stored provider tokens found. Falling back to current session')

  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session
  const sessAccess = (session as { provider_token?: string } | null)
    ?.provider_token
  const sessRefresh =
    (session as { provider_refresh_token?: string } | null)
      ?.provider_refresh_token ?? null
  if (!sessAccess)
    throw new Error('GitHub connection required. Please re-authenticate.')

  logDebug('Captured tokens from current session', {
    accessTokenLength: sessAccess.length,
    refreshTokenLength: sessRefresh?.length,
  })

  await supabase.from('user_provider_tokens').upsert(
    {
      user_id: userId,
      provider: 'github',
      access_token: sessAccess,
      refresh_token: sessRefresh,
    },
    { onConflict: 'user_id,provider' },
  )
  return { access_token: sessAccess, refresh_token: sessRefresh }
}

async function persistTokens(userId: string, tokens: ProviderTokens) {
  const supabase = await createClient()
  logDebug('Persisting refreshed tokens', {
    userId,
    accessTokenLength: tokens.access_token.length,
    refreshTokenLength: tokens.refresh_token?.length ?? 0,
  })
  await supabase.from('user_provider_tokens').upsert(
    {
      user_id: userId,
      provider: 'github',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    },
    { onConflict: 'user_id,provider' },
  )
}

async function getInstallationsWithRefresh(
  userId: string,
  tokens: ProviderTokens,
) {
  const { access_token: accessToken, refresh_token: refreshToken } = tokens
  logDebug('Fetching user installations with access token', {
    accessTokenLength: accessToken.length,
  })
  let resp = await fetchGitHubInstallations(accessToken)
  if (DEBUG) {
    logDebug('Initial installations fetch result', {
      status: resp.status,
      ratelimitRemaining: resp.headers.get('x-ratelimit-remaining'),
      wwwAuth: resp.headers.get('www-authenticate')?.slice(0, 120) ?? null,
    })
  }

  if ((resp.status === 401 || resp.status === 403) && refreshToken) {
    logDebug('Access token rejected, attempting refresh', {
      status: resp.status,
    })
    const refreshed = await refreshGitHubToken(refreshToken)
    const newAccess = refreshed.access_token
    const newRefresh = refreshed.refresh_token ?? refreshToken
    if (!newAccess) throw new Error('Failed to refresh GitHub token')
    await persistTokens(userId, {
      access_token: newAccess,
      refresh_token: newRefresh,
    })
    logDebug('Retrying installations with refreshed token', {
      accessTokenLength: newAccess.length,
    })
    resp = await fetchGitHubInstallations(newAccess)
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    logDebug('Installations fetch failed (non-401/403)', {
      status: resp.status,
      bodySnippet: text.slice(0, 200),
    })
    throw new Error(`GitHub API error: ${resp.status} ${text}`)
  }
  return (await resp.json()) as GitHubInstallationsResponse
}

/**
 * Get GitHub App installations for the current authenticated Supabase user.
 * Handles provider access token refresh transparently using stored refresh token.
 */
export async function getUserInstallationsForCurrentUser(): Promise<GitHubInstallationsResponse> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Unauthorized')

  const tokens = await loadOrCreateTokensForUser(user.id)
  return getInstallationsWithRefresh(user.id, tokens)
}
