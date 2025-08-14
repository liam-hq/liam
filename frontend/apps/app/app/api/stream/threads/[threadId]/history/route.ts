import { NextResponse } from 'next/server'

// GET /api/stream/threads/:threadId/history
export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params
  
  // Return empty history array for POC
  return NextResponse.json([])
}

// POST /api/stream/threads/:threadId/history
export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params
  
  // For POC, just return empty history array
  return NextResponse.json([])
}