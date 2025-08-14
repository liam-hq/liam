import { NextResponse } from 'next/server'
import { createClient } from '@/libs/db/server'

type Params = {
  params: Promise<{
    id: string
  }>
}

export async function GET(_request: Request, { params }: Params) {
  const { id: designSessionId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  const { data, error } = await supabase
    .from('public_share_settings')
    .select('design_session_id')
    .eq('design_session_id', designSessionId)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "no rows returned"
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ isPublic: !!data })
}

export async function POST(_request: Request, { params }: Params) {
  const { id: designSessionId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  // First check if the user has access to this design session
  const { data: session } = await supabase
    .from('design_sessions')
    .select('id')
    .eq('id', designSessionId)
    .single()

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('public_share_settings')
    .insert({ design_session_id: designSessionId })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id: designSessionId } = await params
  const supabase = await createClient()

  // Get current user
  const { data: userData, error: authError } = await supabase.auth.getUser()
  if (authError || !userData?.user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 },
    )
  }

  const { error } = await supabase
    .from('public_share_settings')
    .delete()
    .eq('design_session_id', designSessionId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
