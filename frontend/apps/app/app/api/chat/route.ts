import { processChatMessage } from '@liam-hq/agent'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const {
    message,
    schemaData,
    history,
    mode,
    organizationId,
    buildingSchemaId,
    latestVersionNumber = 0,
  } = await request.json()

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

  // Create a ReadableStream for streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        // Process the chat message with streaming
        const generator = await processChatMessage({
          userInput: message,
          schemaData,
          history,
          mode,
          organizationId,
          buildingSchemaId,
          latestVersionNumber,
        })
        
        for await (const chunk of generator) {
          if (chunk.type === 'text') {
            // Encode and enqueue the text chunk as JSON
            controller.enqueue(
              encoder.encode(
                `${JSON.stringify({ type: 'text', content: chunk.content })}\n`,
              ),
            )
          } else if (chunk.type === 'custom') {
            // Encode and enqueue the custom progress message as JSON
            controller.enqueue(
              encoder.encode(
                `${JSON.stringify({ type: 'custom', content: chunk.content })}\n`,
              ),
            )
          } else if (chunk.type === 'error') {
            // Handle error by sending error message and closing the stream
            controller.enqueue(
              encoder.encode(
                `${JSON.stringify({ type: 'error', content: chunk.content })}\n`,
              ),
            )
            controller.close()
            return
          }
        }

        // Close the stream when done
        controller.close()
      } catch (error) {
        // Handle any unexpected errors
        controller.error(error)
      }
    },
  })

  // Return streaming response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
