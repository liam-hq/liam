import { processChatMessage } from '@liam-hq/agent'
import { NextResponse } from 'next/server'

// Keep maxDuration at 15 to avoid charges
export const maxDuration = 15

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
      let lastActivityTime = Date.now()
      let keepAliveInterval: NodeJS.Timeout | null = null

      // Keep-alive mechanism to prevent timeout
      // TODO: Remove this keep-alive implementation once ProcessIndicator provides a better solution
      const startKeepAlive = () => {
        keepAliveInterval = setInterval(() => {
          const timeSinceLastActivity = Date.now() - lastActivityTime
          // Send heartbeat if no activity for 8 seconds
          if (timeSinceLastActivity > 8000) {
            const elapsed = Math.floor(timeSinceLastActivity / 1000)
            controller.enqueue(
              encoder.encode(
                `${JSON.stringify({
                  type: 'heartbeat',
                  content: `⏳ Processing... (${elapsed}s)`,
                })}\n`,
              ),
            )
            lastActivityTime = Date.now()
          }
        }, 5000) // Check every 5 seconds
      }

      const stopKeepAlive = () => {
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval)
          keepAliveInterval = null
        }
      }

      try {
        startKeepAlive()

        // Process the chat message with streaming
        for await (const chunk of processChatMessage({
          message,
          schemaData,
          history,
          mode,
          organizationId,
          buildingSchemaId,
          latestVersionNumber,
        })) {
          lastActivityTime = Date.now() // Update activity time

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
      } finally {
        stopKeepAlive()
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
