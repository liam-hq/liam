import { DatabaseSchemaBuildAgent } from '../../../langchain/agents'
import type { BuildAgentResponse } from '../../../langchain/agents/databaseSchemaBuildAgent/agent'
import type { BasePromptVariables } from '../../../langchain/utils/types'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import type { WorkflowState } from '../types'

const NODE_NAME = 'designSchema'

interface PreparedSchemaDesign {
  agent: DatabaseSchemaBuildAgent
  schemaText: string
}

/**
 * Apply schema changes and return updated state
 */
const applySchemaChanges = async (
  schemaChanges: BuildAgentResponse['schemaChanges'],
  buildingSchemaId: string,
  latestVersionNumber: number,
  message: string,
  state: WorkflowState,
  retryCount: number,
): Promise<WorkflowState> => {
  const result = await state.repositories.schema.createVersion({
    buildingSchemaId,
    latestVersionNumber,
    patch: schemaChanges,
  })

  if (!result.success) {
    state.logger.error('Schema update failed:', {
      error: result.error || 'Failed to update schema',
    })
    return {
      ...state,
      generatedAnswer: message,
      error: result.error || 'Failed to update schema',
      retryCount: {
        ...state.retryCount,
        [NODE_NAME]: retryCount + 1,
      },
    }
  }

  return {
    ...state,
    generatedAnswer: message,
    error: undefined,
  }
}

/**
 * Handle schema changes if they exist
 */
const handleSchemaChanges = async (
  parsedResponse: BuildAgentResponse,
  state: WorkflowState,
  retryCount: number,
): Promise<WorkflowState> => {
  if (parsedResponse.schemaChanges.length === 0) {
    return {
      ...state,
      generatedAnswer: parsedResponse.message,
    }
  }

  const buildingSchemaId = state.buildingSchemaId
  const latestVersionNumber = state.latestVersionNumber

  return await applySchemaChanges(
    parsedResponse.schemaChanges,
    buildingSchemaId,
    latestVersionNumber,
    parsedResponse.message,
    state,
    retryCount,
  )
}

async function prepareSchemaDesign(
  state: WorkflowState,
): Promise<PreparedSchemaDesign> {
  const schemaText = convertSchemaToText(state.schemaData)

  // Create the agent instance
  const agent = new DatabaseSchemaBuildAgent()

  return {
    agent,
    schemaText,
  }
}

/**
 * Design Schema Node - DB Design & DDL Execution
 * Performed by dbAgent
 */
export async function designSchemaNode(
  state: WorkflowState,
): Promise<WorkflowState> {
  state.logger.log(`[${NODE_NAME}] Started`)

  const retryCount = state.retryCount[NODE_NAME] ?? 0

  try {
    const { agent, schemaText } = await prepareSchemaDesign(state)

    // Create prompt variables directly
    const promptVariables: BasePromptVariables = {
      schema_text: schemaText,
      chat_history: state.formattedHistory,
      user_message: state.userInput,
    }

    // Use agent's generate method with prompt variables
    const response = await agent.generate(promptVariables)
    const result = await handleSchemaChanges(response, state, retryCount)

    state.logger.log(`[${NODE_NAME}] Completed`)
    return result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    state.logger.error(`[${NODE_NAME}] Failed: ${errorMessage}`)

    // Increment retry count and set error
    return {
      ...state,
      error: errorMessage,
      retryCount: {
        ...state.retryCount,
        [NODE_NAME]: retryCount + 1,
      },
    }
  }
}
