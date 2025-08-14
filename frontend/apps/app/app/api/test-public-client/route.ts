import { NextResponse } from 'next/server'
import { createPublicServerClient } from '@/libs/db/server'

export async function GET() {
  try {
    // Test createPublicServerClient function
    const supabase = await createPublicServerClient()

    // Basic connection test
    const { data, error } = await supabase
      .from('public_share_settings')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: 'Failed to query public_share_settings table',
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'createPublicServerClient works correctly',
      data: data,
      clientInfo: {
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
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
