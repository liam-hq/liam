import { NextResponse } from 'next/server'
import { ensureUserHasOrganization } from '../../../../components/LoginPage/services/ensureUserHasOrganization'
import { sanitizeReturnPath } from '../../../../components/LoginPage/services/validateReturnPath'
import { createClient } from '../../../../libs/db/server'

async function persistGitHubProviderTokens() {
  const supabase = await createClient()
  const { data: sessionData } = await supabase.auth.getSession()
  const session = sessionData?.session
  const accessToken = (session as { provider_token?: string } | null)
    ?.provider_token
  const refreshToken = (session as { provider_refresh_token?: string } | null)
    ?.provider_refresh_token
  const userId = session?.user?.id
  const provider =
    (session?.user?.app_metadata?.provider as string | undefined) ?? 'github'

  if (userId && provider === 'github' && accessToken && refreshToken) {
    await supabase.from('user_provider_tokens').upsert(
      {
        user_id: userId,
        provider: 'github',
        access_token: accessToken,
        refresh_token: refreshToken,
      },
      { onConflict: 'user_id,provider' },
    )
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Use query parameter "next" to redirect after auth, sanitize for security
  const next = sanitizeReturnPath(searchParams.get('next'), '/')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Capture provider tokens for GitHub and persist for server-side refresh use
      await persistGitHubProviderTokens().catch((e) => {
        console.error('Failed to persist GitHub provider tokens:', e)
      })

      await ensureUserHasOrganization()

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
  }

  // On error, redirect to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
