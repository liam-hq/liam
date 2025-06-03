import { convertSchemaToText } from '@/app/lib/schema/convertSchemaToText'
import { isSchemaUpdated } from '@/app/lib/vectorstore/supabaseVectorStore'
import { syncSchemaVectorStore } from '@/app/lib/vectorstore/syncSchemaVectorStore'
import { mastra } from '@/lib/mastra'
import type { Schema } from '@liam-hq/db-structure'

interface ChatProcessorParams {
  message: string
  schemaData: Schema
  history?: [string, string][]
  mode: 'build' | 'ask'
  projectId?: string
}

interface ChatProcessorResult {
  text: string
  success: boolean
  error?: string
}

export const processChatMessage = async (
  params: ChatProcessorParams,
): Promise<ChatProcessorResult> => {
  const { message, schemaData, history, mode, projectId } = params

  try {
    // Determine which agent to use based on the mode
    const agentName =
      mode === 'build' ? 'databaseSchemaBuildAgent' : 'databaseSchemaAskAgent'

    // Check if schema has been updated
    const schemaUpdated = await isSchemaUpdated(schemaData)

    if (schemaUpdated && projectId) {
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
      history && history.length > 0
        ? history
            .map((msg: [string, string]) => `${msg[0]}: ${msg[1]}`)
            .join('\n')
        : 'No previous conversation.'

    // Convert schema to text
    const schemaText = convertSchemaToText(schemaData)

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
    ])

    return {
      text: response.text,
      success: true,
    }
  } catch (error) {
    return {
      text: '',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
