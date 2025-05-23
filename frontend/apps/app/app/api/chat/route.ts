import { convertSchemaToText } from '@/app/lib/schema/convertSchemaToText'
import { isSchemaUpdated } from '@/app/lib/vectorstore/supabaseVectorStore'
import { syncSchemaVectorStore } from '@/app/lib/vectorstore/syncSchemaVectorStore'
import { runChat } from '@/lib/chat/langGraph'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { message, schemaData, mode, projectId, history } = await request.json()

  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  if (!schemaData || typeof schemaData !== 'object') {
    return NextResponse.json(
      { error: 'Valid schema data is required' },
      { status: 400 },
    )
  }

  try {
    // Check if schema has been updated
    const schemaUpdated = await isSchemaUpdated(schemaData)

    if (schemaUpdated) {
      try {
        // Synchronize vector store
        await syncSchemaVectorStore(schemaData, projectId)
        // Log success message
        process.stdout.write('Vector store synchronized successfully.\n')
      } catch (syncError) {
        // Log error but continue with chat processing
        process.stderr.write(
          `Warning: Failed to synchronize vector store: ${syncError}\n`,
        )
      }
    }
    // Format chat history for prompt
    const formattedChatHistory =
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      history && history.length > 0
        ? history
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .map((msg: [string, string]) => `${msg[0]}: ${msg[1]}`)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .join('\n')
        : 'No previous conversation.'

    // Convert schema to text
    const schemaText = convertSchemaToText(schemaData)

    // Use LangGraph pipeline for build mode, fallback to original for ask mode
    let responseText: string | undefined
    if (mode === 'build') {
      responseText = await runChat(message, schemaText, formattedChatHistory)
    } else {
      // For ask mode, we'll keep the original implementation for now
      // This can be refactored later to use a separate LangGraph pipeline
      throw new Error('Ask mode not yet implemented with LangGraph')
    }

    return new Response(responseText, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    Sentry.captureException(error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 },
    )
  }
}
