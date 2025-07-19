import { HumanMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import {
  type DesignResponse,
  type InvokeResult,
  invokeDesignAgent,
} from '../../../langchain/agents/databaseSchemaBuildAgent/agent'
import type { Repositories } from '../../../repositories'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

/**
 * Apply schema changes and return updated state
 */
const applySchemaChanges = async (
  operations: DesignResponse['operations'],
  buildingSchemaVersionId: string,
  message: string,
  state: WorkflowState,
  repositories: Repositories,
  assistantRole: Database['public']['Enums']['assistant_role_enum'],
): Promise<WorkflowState> => {
  await logAssistantMessage(
    state,
    repositories,
    'Applying schema changes...',
    assistantRole,
  )

  const result = await repositories.schema.updateVersion({
    buildingSchemaVersionId,
    patch: operations,
  })

  if (!result.success) {
    const errorMessage = result.error || 'Failed to update schema'
    await logAssistantMessage(
      state,
      repositories,
      'Schema update failed',
      assistantRole,
    )
    return {
      ...state,
      error: new Error(errorMessage),
    }
  }

  await logAssistantMessage(
    state,
    repositories,
    `Applied ${operations.length} schema changes successfully`,
    assistantRole,
  )

  // Save timeline item directly when answer is generated
  const saveResult = await repositories.schema.createTimelineItem({
    designSessionId: state.designSessionId,
    content: message,
    type: 'assistant',
    role: 'db',
  })

  if (!saveResult.success) {
    return {
      ...state,
      schemaData: result.newSchema,
      error: new Error(
        `Failed to save assistant timeline item: ${saveResult.error}`,
      ),
    }
  }

  return {
    ...state,
    schemaData: result.newSchema,
    error: undefined,
  }
}

/**
 * Handle schema changes if they exist
 */
const handleSchemaChanges = async (
  invokeResult: InvokeResult,
  buildingSchemaVersionId: string,
  state: WorkflowState,
  repositories: Repositories,
  assistantRole: Database['public']['Enums']['assistant_role_enum'],
): Promise<WorkflowState> => {
  if (invokeResult.operations.length === 0) {
    // Save timeline item directly when answer is generated
    const saveResult = await repositories.schema.createTimelineItem({
      designSessionId: state.designSessionId,
      content: invokeResult.message.text,
      type: 'assistant',
      role: 'db',
    })

    if (!saveResult.success) {
      return {
        ...state,
        error: new Error(
          `Failed to save assistant timeline item: ${saveResult.error}`,
        ),
      }
    }
    return state
  }

  return await applySchemaChanges(
    invokeResult.operations,
    buildingSchemaVersionId,
    invokeResult.message.text,
    state,
    repositories,
    assistantRole,
  )
}

/**
 * Design Schema Node - DB Design & DDL Execution
 * Performed by dbAgent
 */
export async function designSchemaNode(
  state: WorkflowState,
  config: RunnableConfig,
): Promise<WorkflowState> {
  const assistantRole: Database['public']['Enums']['assistant_role_enum'] = 'db'
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { repositories } = configurableResult.value

  await logAssistantMessage(
    state,
    repositories,
    'Designing database schema...',
    assistantRole,
  )

  // Create empty version at the beginning of the node
  const buildingSchemaId = state.buildingSchemaId
  const latestVersionNumber = state.latestVersionNumber

  const createVersionResult = await repositories.schema.createEmptyPatchVersion(
    {
      buildingSchemaId,
      latestVersionNumber,
    },
  )

  if (!createVersionResult.success) {
    const errorMessage =
      createVersionResult.error || 'Failed to create new version'
    await logAssistantMessage(
      state,
      repositories,
      'Version creation failed',
      assistantRole,
    )
    return {
      ...state,
      error: new Error(errorMessage),
    }
  }

  const buildingSchemaVersionId = createVersionResult.versionId

  await logAssistantMessage(
    state,
    repositories,
    'Created new schema version for updates...',
    assistantRole,
  )

  const schemaText = convertSchemaToText(state.schemaData)

  // Log appropriate message for DDL retry case
  if (state.shouldRetryWithDesignSchema && state.ddlExecutionFailureReason) {
    await logAssistantMessage(
      state,
      repositories,
      'Redesigning schema to fix DDL execution errors...',
      assistantRole,
    )
  }

  // Use existing messages, or add DDL failure context if retrying
  let messages = [...state.messages]
  if (state.shouldRetryWithDesignSchema && state.ddlExecutionFailureReason) {
    const ddlRetryMessage = new HumanMessage(
      `The following DDL execution failed: ${state.ddlExecutionFailureReason}
Original request: ${state.userInput}
Please fix this issue by analyzing the schema and adding any missing constraints, primary keys, or other required schema elements to resolve the DDL execution error.`,
    )
    messages = [...messages, ddlRetryMessage]
  }

  await logAssistantMessage(
    state,
    repositories,
    'Analyzing table structure and relationships...',
    assistantRole,
  )

  const invokeResult = await invokeDesignAgent({ schemaText }, messages)

  if (invokeResult.isErr()) {
    await logAssistantMessage(
      state,
      repositories,
      'Schema design failed',
      assistantRole,
    )
    return {
      ...state,
      error: invokeResult.error,
    }
  }

  const result = await handleSchemaChanges(
    invokeResult.value,
    buildingSchemaVersionId,
    state,
    repositories,
    assistantRole,
  )

  await logAssistantMessage(
    state,
    repositories,
    'Schema design completed',
    assistantRole,
  )

  // Clear retry flags after processing
  const finalResult = {
    ...result,
    messages: [...messages, invokeResult.value.message],
    shouldRetryWithDesignSchema: undefined,
    ddlExecutionFailureReason: undefined,
  }

  return finalResult
}
