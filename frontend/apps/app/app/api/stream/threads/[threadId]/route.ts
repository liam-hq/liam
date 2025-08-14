import { NextResponse } from 'next/server'

// GET /api/stream/threads/:threadId
export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params
  
  // Return thread info for POC
  return NextResponse.json({
    thread_id: threadId,
    assistant_id: 'liam-agent',
    status: 'ready',
    created_at: new Date().toISOString(),
  })
}