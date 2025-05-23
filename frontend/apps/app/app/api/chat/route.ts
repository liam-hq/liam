import { isSchemaUpdated } from '@/app/lib/vectorstore/supabaseVectorStore'
import { syncSchemaVectorStore } from '@/app/lib/vectorstore/syncSchemaVectorStore'
import { mastra } from '@/lib/mastra'
import * as Sentry from '@sentry/nextjs'
import { NextResponse } from 'next/server'
import { dummySchema } from './dummySchema'

export async function POST(request: Request) {
  const { message, schemaData, mode, projectId } = await request.json()

  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 })
  }

  if (!schemaData || typeof schemaData !== 'object') {
    return NextResponse.json(
      { error: 'Valid schema data is required' },
      { status: 400 },
    )
  }

  // Determine which agent to use based on the mode
  const agentName =
    mode === 'build' ? 'databaseSchemaBuildAgent' : 'databaseSchemaAskAgent'
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
    // const formattedChatHistory =
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //   history && history.length > 0
    //     ? history
    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //         .map((msg: [string, string]) => `${msg[0]}: ${msg[1]}`)
    //         // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    //         .join('\n')
    //     : 'No previous conversation.'
    const formattedChatHistory = 'No previous conversation.'

    // Convert schema to text
    // const schemaText = convertSchemaToText(schemaData)
    const schemaText = dummySchema

    // Get the agent from Mastra
    const agent = mastra.getAgent(agentName)
    if (!agent) {
      throw new Error(`${agentName} not found in Mastra instance`)
    }

    // Create a response using the agent
    const response = await agent.generate([
      {
        role: 'system',
        content: `
Complete Schema Information:
${schemaText}

Previous conversation:
${formattedChatHistory}
`,
      },
      {
        role: 'user',
        content: message,
      },
      {
        role: 'system',
        content: `
        If a response should be provided in JSON Patch format, please respond using that format.

When responding, don’t mention the format explicitly—just give the result.
Avoid mentioning the format in your response.

GOOD: Updated. Here you go.
NOT GOOD: Here’s a patch that makes...
`,
      },
    ])

    return new Response(response.text, {
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
