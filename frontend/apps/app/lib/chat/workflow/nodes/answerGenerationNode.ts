import {
  type AgentName,
  createPromptVariables,
  getAgent,
} from '@/lib/langchain'
import { createClient } from '@/libs/db/server'
import type { Operation } from '@liam-hq/schema-operations'
import type { WorkflowState } from '../types'

interface PreparedAnswerGeneration {
  agent: ReturnType<typeof getAgent>
  agentName: AgentName
  schemaText: string
  formattedChatHistory: string
}

interface BuildAgentResponse {
  message: string
  schemaChanges: Operation[]
}

/**
 * Parse structured response from buildAgent
 */
const parseStructuredResponse = (
  response: string,
): BuildAgentResponse | null => {
  try {
    // Try to parse as JSON first
    const parsed: unknown = JSON.parse(response)

    // Validate the structure with proper type guards
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'message' in parsed &&
      'schemaChanges' in parsed &&
      typeof (parsed as { message: unknown }).message === 'string' &&
      Array.isArray((parsed as { schemaChanges: unknown }).schemaChanges)
    ) {
      const validatedParsed = parsed as {
        message: string
        schemaChanges: Operation[]
      }
      return {
        message: validatedParsed.message,
        schemaChanges: validatedParsed.schemaChanges,
      }
    }

    return null
  } catch {
    // If JSON parsing fails, return null
    return null
  }
}

/**
 * Get user ID from state or fetch from server
 */
const getUserId = async (state: WorkflowState): Promise<string | undefined> => {
  if (state.userId) {
    return state.userId
  }

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id || undefined
  } catch (error) {
    console.warn('Failed to get user ID:', error)
    return undefined
  }
}

/**
 * Handle buildAgent response processing
 */
const handleBuildAgentResponse = async (
  response: string,
  state: WorkflowState,
): Promise<WorkflowState> => {
  const parsedResponse = parseStructuredResponse(response)

  if (!parsedResponse) {
    console.warn(
      'Failed to parse buildAgent response as structured JSON, using raw response',
    )
    return {
      ...state,
      generatedAnswer: response,
      error: undefined,
    }
  }

  // Queue schema update task asynchronously if there are schema changes
  if (parsedResponse.schemaChanges.length > 0) {
    const buildingSchemaId = state.buildingSchemaId
    const latestVersionNumber = state.latestVersionNumber || 0
    const organizationId = state.organizationId
    const userId = await getUserId(state)

    if (organizationId) {
      await queueSchemaUpdate(
        buildingSchemaId,
        latestVersionNumber,
        parsedResponse.schemaChanges,
        state.userInput,
        organizationId,
        userId,
      )
    } else {
      console.warn('Missing organizationId for schema update')
    }
  }

  return {
    ...state,
    generatedAnswer: parsedResponse.message,
    error: undefined,
  }
}

/**
 * Queue schema update task asynchronously
 */
const queueSchemaUpdate = async (
  buildingSchemaId: string,
  latestVersionNumber: number,
  patchOperations: Operation[],
  userMessage: string,
  organizationId: string,
  userId?: string,
): Promise<void> => {
  try {
    // Import trigger client dynamically to avoid issues if not available
    const { tasks } = await import('@trigger.dev/sdk/v3')

    // Queue the schema update task
    await tasks.trigger('update-schema', {
      buildingSchemaId,
      latestVersionNumber,
      patchOperations,
      userMessage,
      organizationId,
      userId,
    })
  } catch (error) {
    // Log error but don't fail the main process
    console.error('Failed to queue schema update task:', error)
  }
}

async function prepareAnswerGeneration(
  state: WorkflowState,
): Promise<PreparedAnswerGeneration | { error: string }> {
  // Since validationNode has already validated required fields,
  // we can trust that the processed data is available
  if (!state.agentName || !state.schemaText || !state.formattedChatHistory) {
    return { error: 'Required processed data is missing from validation step' }
  }

  const agentName = state.agentName
  const formattedChatHistory = state.formattedChatHistory
  const schemaText = state.schemaText

  // Get the agent from LangChain
  const agent = getAgent(agentName)

  return {
    agent,
    agentName,
    schemaText,
    formattedChatHistory,
  }
}

/**
 * Answer generation node - synchronous execution only
 * Streaming is now handled by finalResponseNode
 */
export async function answerGenerationNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  try {
    const prepared = await prepareAnswerGeneration(state)

    if ('error' in prepared) {
      return {
        ...state,
        error: prepared.error,
      }
    }

    const { agent, agentName, schemaText, formattedChatHistory } = prepared

    // Convert formatted chat history to array format if needed
    const historyArray: [string, string][] = formattedChatHistory
      ? [['Assistant', formattedChatHistory]]
      : []

    // Create prompt variables with correct format
    const promptVariables = createPromptVariables(
      schemaText,
      state.userInput,
      historyArray,
    )

    // Use agent's generate method with prompt variables
    const response = await agent.generate(promptVariables)

    // If this is the buildAgent, handle structured response and schema updates
    if (agentName === 'databaseSchemaBuildAgent') {
      return await handleBuildAgentResponse(response, state)
    }

    return {
      ...state,
      generatedAnswer: response,
      error: undefined,
    }
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : 'Failed to generate answer'
    return {
      ...state,
      error: errorMsg,
    }
  }
}
