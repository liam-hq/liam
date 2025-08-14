import { NextResponse } from 'next/server'

// POST /api/stream/threads - Create a new thread
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const threadId = body.thread_id || crypto.randomUUID()
  
  return NextResponse.json({
    thread_id: threadId,
    created_at: new Date().toISOString(),
    metadata: body.metadata || {},
  })
}

// GET /api/stream/threads - List threads
export async function GET() {
  return NextResponse.json({
    threads: [],
  })
}