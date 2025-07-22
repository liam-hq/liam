import type { RunnableConfig } from '@langchain/core/runnables'
import type { Database } from '@liam-hq/db'
import { invokeDesignAgent } from '../../../langchain/agents/databaseSchemaBuildAgent/agent'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { getConfigurable } from '../shared/getConfigurable'
import type { WorkflowState } from '../types'
import { logAssistantMessage } from '../utils/timelineLogger'

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
    await logAssistantMessage(state, repositories, errorMessage, assistantRole)
    return {
      ...state,
      error: new Error(errorMessage),
    }
  }

  await logAssistantMessage(
    state,
    repositories,
    'Created new schema version for updates...',
    assistantRole,
  )

  const schemaText = convertSchemaToText(state.schemaData)

  const messages = [...state.messages]

  await logAssistantMessage(
    state,
    repositories,
    'Analyzing table structure and relationships, validating DDL...',
    assistantRole,
  )

  const invokeResult = await invokeDesignAgent({ schemaText }, messages, {
    buildingSchemaVersionId: createVersionResult.versionId,
    repositories,
  })

  if (invokeResult.isErr()) {
    await logAssistantMessage(
      state,
      repositories,
      'Schema design failed',
      assistantRole,
    )

    // Clean up the empty version that was created
    const deleteResult = await repositories.schema.deleteEmptyVersion(
      createVersionResult.versionId,
    )
    if (!deleteResult.success) {
      await logAssistantMessage(
        state,
        repositories,
        `Warning: Failed to cleanup empty version: ${deleteResult.error}`,
        assistantRole,
      )
    } else {
      await logAssistantMessage(
        state,
        repositories,
        'Cleaned up empty version due to design failure',
        assistantRole,
      )
    }

    return {
      ...state,
      error: invokeResult.error,
    }
  }

  await logAssistantMessage(
    state,
    repositories,
    'Schema design and DDL validation completed successfully',
    assistantRole,
  )

  return {
    ...state,
    messages: [invokeResult.value],
    buildingSchemaVersionId: createVersionResult.versionId,
    latestVersionNumber: state.latestVersionNumber + 1,
  }
}
