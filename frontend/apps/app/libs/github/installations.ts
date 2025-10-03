import type { Installation } from '@liam-hq/github'
import { createClient } from '../../libs/db/server'

type ProviderTokens = {
  access_token: string
  refresh_token: string
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
    throw new Error(`GitHub token refresh failed: ${resp.status} ${text}`)
  }

  return (await resp.json()) as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    token_type?: string
    scope?: string
  }
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
  const refreshToken = stored?.refresh_token
  if (accessToken && refreshToken)
    return { access_token: accessToken, refresh_token: refreshToken }

  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session
  const sessAccess = (session as { provider_token?: string } | null)
    ?.provider_token
  const sessRefresh = (session as { provider_refresh_token?: string } | null)
    ?.provider_refresh_token
  if (!sessAccess || !sessRefresh)
    throw new Error('GitHub connection required. Please re-authenticate.')

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
  let resp = await fetchGitHubInstallations(accessToken)

  if (resp.status === 401 || resp.status === 403) {
    if (!refreshToken)
      throw new Error('GitHub token expired and no refresh token available')
    const refreshed = await refreshGitHubToken(refreshToken)
    const newAccess = refreshed.access_token
    const newRefresh = refreshed.refresh_token ?? refreshToken
    if (!newAccess) throw new Error('Failed to refresh GitHub token')
    await persistTokens(userId, {
      access_token: newAccess,
      refresh_token: newRefresh,
    })
    resp = await fetchGitHubInstallations(newAccess)
  }

  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
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
