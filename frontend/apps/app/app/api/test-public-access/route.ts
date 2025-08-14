import { NextResponse } from 'next/server'
import { createPublicServerClient } from '@/libs/db/server'

export async function GET() {
  try {
    const supabase = await createPublicServerClient()

    // Get public design_sessions (testing RLS policies)
    const { data: publicSessions, error: sessionsError } = await supabase
      .from('design_sessions_public')
      .select(`
        id,
        name,
        created_at,
        public_share_settings!inner(created_at)
      `)
      .limit(5)

    if (sessionsError) {
      return NextResponse.json(
        {
          success: false,
          error: sessionsError.message,
          step: 'querying public design_sessions',
        },
        { status: 500 },
      )
    }

    // Get related artifacts
    const sessionIds = publicSessions?.map((s) => s.id) || []
    const { data: artifacts, error: artifactsError } = await supabase
      .from('artifacts_public')
      .select('id, design_session_id, created_at')
      .in('design_session_id', sessionIds)
      .limit(10)

    if (artifactsError) {
      return NextResponse.json(
        {
          success: false,
          error: artifactsError.message,
          step: 'querying public artifacts',
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Public data access works correctly',
      data: {
        publicSessions: publicSessions,
        artifacts: artifacts,
        counts: {
          sessions: publicSessions?.length || 0,
          artifacts: artifacts?.length || 0,
        },
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
