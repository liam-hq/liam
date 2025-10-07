import { NextResponse } from 'next/server'
import { createClient } from '../../../../../libs/db/server'

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 },
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_provider_tokens')
    .select('refresh_token')
    .eq('user_id', user.id)
    .eq('provider', 'github')
    .maybeSingle()
  if (error)
    return NextResponse.json(
      { error: 'Failed to load refresh token', details: error.message },
      { status: 500 },
    )

  const refreshToken = data?.refresh_token ?? null
  if (!refreshToken) {
    return NextResponse.json(
      { ok: false, message: 'No refresh token stored' },
      { status: 200 },
    )
  }

  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID || ''
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET || ''
  if (!clientId || !clientSecret)
    return NextResponse.json(
      {
        ok: false,
        message: 'Missing client credentials',
        hasClientId: Boolean(clientId),
        hasClientSecret: Boolean(clientSecret),
      },
      { status: 200 },
    )

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

  const text = await resp.text().catch(() => '')
  // biome-ignore lint/suspicious/noExplicitAny: Debug endpoint for GitHub OAuth response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
  let json: any = null
  try {
    json = JSON.parse(text)
  } catch {}

  return NextResponse.json({
    status: resp.status,
    ok: resp.ok,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    hasAccessToken: Boolean(json?.access_token),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    hasRefreshToken: Boolean(json?.refresh_token),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    error: json?.error ?? null,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    error_description: json?.error_description ?? null,
    rawSnippet: text.slice(0, 200),
  })
}
