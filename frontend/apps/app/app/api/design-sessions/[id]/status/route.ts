import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json(
    {
      error:
        'This endpoint is deprecated. Use POST /api/runs/:id/events to record run status.',
    },
    { status: 410 },
  )
}
