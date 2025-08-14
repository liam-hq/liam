import { NextResponse } from 'next/server'
import { createClient } from '@/libs/db/server'

// https://vercel.com/docs/functions/configuring-functions/duration#maximum-duration-for-different-runtimes
export const maxDuration = 800

// POST /api/stream/threads/:threadId/runs/stream
export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const { threadId } = await params
    const supabase = await createClient()

    // Get current user ID from server-side auth
    const { data: userData, error: authError } = await supabase.auth.getUser()

    if (authError || !userData?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      )
    }

    const requestBody = await request.json()
    const input = requestBody.input || {}
    const messages = input.messages || []
    
    // Get the last user message
    const lastUserMessage = messages.filter((m: any) => m.type === 'human').pop()
    const userContent = lastUserMessage?.content || 'Hello'
    
    // Create a streaming response that matches LangGraph format
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const runId = crypto.randomUUID()
        
        // Send initial metadata event with proper format
        controller.enqueue(
          encoder.encode(`event: metadata
data: ${JSON.stringify({
            run_id: runId,
          })}

`)
        )

        // Send the response content progressively
        const response = `I received your message: "${userContent}". This is a streaming response from the LangGraph POC.`
        let accumulatedContent = ''
        
        // Split into words for streaming
        const words = response.split(' ')
        
        for (let i = 0; i < words.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 100))
          
          accumulatedContent += (i > 0 ? ' ' : '') + words[i]
          
          // Send messages event for streaming messages
          controller.enqueue(
            encoder.encode(`event: messages
data: ${JSON.stringify([
              {
                id: `msg_${i}`,
                type: 'ai',
                content: accumulatedContent,
              },
              {
                langgraph_step_idx: i,
                langgraph_checkpoint_id: runId,
              }
            ])}

`)
          )
        }

        // Send end event
        controller.enqueue(
          encoder.encode(`event: end
data: null

`)
        )

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('Stream API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}