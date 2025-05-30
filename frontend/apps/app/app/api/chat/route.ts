import { processChatMessage } from '@/lib/chat/chatProcessor'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { message, schemaData, history, mode, projectId } = await request.json()

  // Input validation
  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  if (!schemaData || typeof schemaData !== 'object') {
    return NextResponse.json(
      { error: 'Valid schema data is required' },
      { status: 400 },
    )
  }

  // Process the chat message
  const result = await processChatMessage({
    message,
    schemaData,
    history,
    mode,
    projectId,
  })

  if (!result.success) {
    return NextResponse.json(
      { error: 'Failed to generate response', details: result.error },
      { status: 500 },
    )
  }

  return new Response(result.text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
