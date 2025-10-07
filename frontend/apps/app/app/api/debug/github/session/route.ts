import { NextResponse } from 'next/server'
import { createClient } from '../../../../../libs/db/server'

const mask = (v?: string | null) =>
  typeof v === 'string' && v.length > 8
    ? `${v.slice(0, 4)}...${v.slice(-2)}`
    : (v ?? null)

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 404 },
    )
  }

  const supabase = await createClient()
  const { data: sessionData, error } = await supabase.auth.getSession()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const session = sessionData?.session ?? null
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const provider =
    (session?.user?.app_metadata?.provider as string | undefined) ?? null
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const providerToken =
    (session as { provider_token?: string } | null)?.provider_token ?? null
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const providerRefresh =
    (session as { provider_refresh_token?: string } | null)
      ?.provider_refresh_token ?? null

  return NextResponse.json({
    hasSession: Boolean(session),
    provider,
    providerTokenMasked: mask(providerToken),
    providerTokenLength: providerToken?.length ?? 0,
    providerRefreshTokenMasked: mask(providerRefresh),
    providerRefreshTokenLength: providerRefresh?.length ?? 0,
  })
}
