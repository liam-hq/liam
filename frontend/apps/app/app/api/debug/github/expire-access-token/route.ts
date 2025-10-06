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

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const invalid = `invalid_${Date.now()}`
  const { error } = await supabase
    .from('user_provider_tokens')
    .update({ access_token: invalid })
    .eq('user_id', user.id)
    .eq('provider', 'github')

  if (error) {
    return NextResponse.json(
      { error: 'Failed to invalidate token', details: error.message },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true, message: 'Access token invalidated' })
}
