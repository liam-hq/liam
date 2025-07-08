import { DatabaseSchemaBuildAgent } from '../../../langchain/agents'
import type { BuildAgentResponse } from '../../../langchain/agents/databaseSchemaBuildAgent/agent'
import type { SchemaAwareChatVariables } from '../../../langchain/utils/types'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { getWorkflowNodeProgress } from '../shared/getWorkflowNodeProgress'
import type { WorkflowState } from '../types'

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
    }
  }

  const newTableCount = Object.keys(result.newSchema.tables).length
  state.logger.log(
    `[${NODE_NAME}] Applied ${schemaChanges.length} schema changes successfully (${newTableCount} tables)`,
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
  const schemaText = convertSchemaToText(state.schemaData)

  // Log current schema state for debugging
  const tableCount = Object.keys(state.schemaData.tables).length
  state.logger.log(`[${NODE_NAME}] Current schema has ${tableCount} tables`)

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

  // Update progress message if available
  if (state.progressTimelineItemId) {
    await state.repositories.schema.updateTimelineItem(
      state.progressTimelineItemId,
      {
        content: 'Processing: designSchema',
        progress: getWorkflowNodeProgress('designSchema'),
      },
    )
  }

  const { agent, schemaText } = await prepareSchemaDesign(state)

  // Check if this is a retry after DDL execution failure
  let userMessage = state.userInput
  if (state.shouldRetryWithDesignSchema && state.ddlExecutionFailureReason) {
    userMessage = `The following DDL execution failed: ${state.ddlExecutionFailureReason}

Original request: ${state.userInput}

Please fix this issue by analyzing the schema and adding any missing constraints, primary keys, or other required schema elements to resolve the DDL execution error.`

    state.logger.log(`[${NODE_NAME}] Retrying after DDL execution failure`)
  }

  // Create prompt variables directly
  const promptVariables: SchemaAwareChatVariables = {
    schema_text: schemaText,
    chat_history: state.formattedHistory,
    user_message: userMessage,
  }

  // Use agent's generate method with prompt variables
  const response = await agent.generate(promptVariables)
  const result = await handleSchemaChanges(response, state)

  // Clear retry flags after processing
  const finalResult = {
    ...result,
    shouldRetryWithDesignSchema: undefined,
    ddlExecutionFailureReason: undefined,
  }

  state.logger.log(`[${NODE_NAME}] Completed`)
  return finalResult
}
