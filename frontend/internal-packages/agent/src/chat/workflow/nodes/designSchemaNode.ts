import { DatabaseSchemaBuildAgent } from '../../../langchain/agents'
import type { BuildAgentResponse } from '../../../langchain/agents/databaseSchemaBuildAgent/agent'
import type { SchemaAwareChatVariables } from '../../../langchain/utils/types'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

const NODE_NAME = 'designSchemaNode'

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
): Promise<WorkflowState> => {
  await logAssistantMessage(state, 'Applying schema changes...')

  const result = await state.repositories.schema.createVersion({
    buildingSchemaId,
    latestVersionNumber,
    patch: schemaChanges,
  })

  if (!result.success) {
    const errorMessage = result.error || 'Failed to update schema'
    const error = new Error(errorMessage)
    state.logger.error('Schema update failed:', {
      error: errorMessage,
    })
    await logAssistantMessage(state, 'Schema update failed')
    return {
      ...state,
      generatedAnswer: message,
      error,
    }
  }

  const newTableCount = Object.keys(result.newSchema.tables).length
  state.logger.log(
    `[${NODE_NAME}] Applied ${schemaChanges.length} schema changes successfully (${newTableCount} tables)`,
  )

  await logAssistantMessage(
    state,
    `Applied ${schemaChanges.length} schema changes successfully`,
  )

  return {
    ...state,
    schemaData: result.newSchema,
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
  )
}

async function prepareSchemaDesign(
  state: WorkflowState,
): Promise<PreparedSchemaDesign> {
  await logAssistantMessage(state, 'Preparing schema design...')

  const schemaText = convertSchemaToText(state.schemaData)

  // Log current schema state for debugging
  const tableCount = Object.keys(state.schemaData.tables).length
  state.logger.log(`[${NODE_NAME}] Current schema has ${tableCount} tables`)

  // Create the agent instance
  const agent = new DatabaseSchemaBuildAgent()

  await logAssistantMessage(state, 'Schema design preparation completed')

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

  await logAssistantMessage(state, 'Designing database schema...')

  const { agent, schemaText } = await prepareSchemaDesign(state)

  // Check if this is a retry after DDL execution failure
  let userMessage = state.userInput
  if (state.shouldRetryWithDesignSchema && state.ddlExecutionFailureReason) {
    userMessage = `The following DDL execution failed: ${state.ddlExecutionFailureReason}

Original request: ${state.userInput}

Please fix this issue by analyzing the schema and adding any missing constraints, primary keys, or other required schema elements to resolve the DDL execution error.`

    state.logger.log(`[${NODE_NAME}] Retrying after DDL execution failure`)
    await logAssistantMessage(
      state,
      'Redesigning schema to fix DDL execution errors...',
    )
  }

  // Create prompt variables directly
  const promptVariables: SchemaAwareChatVariables = {
    schema_text: schemaText,
    chat_history: state.formattedHistory,
    user_message: userMessage,
  }

  await logAssistantMessage(
    state,
    'Analyzing table structure and relationships...',
  )

  // Use agent's generate method with prompt variables
  const response = await agent.generate(promptVariables)
  const result = await handleSchemaChanges(response, state)

  await logAssistantMessage(state, 'Schema design completed')

  // Clear retry flags after processing
  const finalResult = {
    ...result,
    shouldRetryWithDesignSchema: undefined,
    ddlExecutionFailureReason: undefined,
  }

  state.logger.log(`[${NODE_NAME}] Completed`)
  return finalResult
}
