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
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_provider_tokens')
    .select('*')
    .eq('user_id', user.id)
    .eq('provider', 'github')
    .maybeSingle()

  if (error)
    return NextResponse.json(
      { error: 'Failed to load tokens', details: error.message },
      { status: 500 },
    )

  return NextResponse.json({
    userId: user.id,
    hasRow: Boolean(data),
    provider: data?.provider ?? null,
    accessTokenMasked: mask(data?.access_token ?? null),
    accessTokenLength: data?.access_token?.length ?? 0,
    refreshTokenMasked: mask(data?.refresh_token ?? null),
    refreshTokenLength: data?.refresh_token?.length ?? 0,
    createdAt: data?.created_at ?? null,
    updatedAt: data?.updated_at ?? null,
  })
}
