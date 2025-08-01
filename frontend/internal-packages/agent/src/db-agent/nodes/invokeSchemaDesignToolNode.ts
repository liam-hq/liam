import type { BaseMessage } from '@langchain/core/messages'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import { postgresqlSchemaDeparser, type Schema } from '@liam-hq/db-structure'
import type { ResultAsync } from 'neverthrow'
import { getConfigurable } from '../../chat/workflow/shared/getConfigurable'
import type { WorkflowState } from '../../chat/workflow/types'
import { withTimelineItemSync } from '../../chat/workflow/utils/withTimelineItemSync'
import type { Repositories } from '../../repositories'
import { schemaDesignTool } from '../tools/schemaDesignTool'

/**
 * Check if a message is a ToolMessage
 */
const isToolMessage = (message: BaseMessage): message is ToolMessage => {
  return message instanceof ToolMessage
}

/**
 * Check if schemaDesignTool was executed successfully
 */
const wasSchemaDesignToolSuccessful = (messages: BaseMessage[]): boolean => {
  const toolMessages = messages.filter(isToolMessage)
  return toolMessages.some(
    (msg) =>
      msg.name === 'schemaDesignTool' &&
      typeof msg.content === 'string' &&
      msg.content.includes('Schema successfully updated'),
  )
}

/**
 * Fetch updated schema safely using ResultAsync
 */
const fetchUpdatedSchemaWithResult = (
  repositories: Repositories,
  designSessionId: string,
): ResultAsync<{ schema: Schema; latestVersionNumber: number }, Error> => {
  return repositories.schema
    .getSchema(designSessionId)
    .map(({ schema, latestVersionNumber }) => ({
      schema,
      latestVersionNumber,
    }))
}

export const invokeSchemaDesignToolNode = async (
  state: WorkflowState,
  config: RunnableConfig,
) => {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { repositories } = configurableResult.value

  const toolNode = new ToolNode<{ messages: BaseMessage[] }>([schemaDesignTool])

  const result = await toolNode.invoke(state, {
    configurable: {
      ...config.configurable,
      buildingSchemaId: state.buildingSchemaId,
      latestVersionNumber: state.latestVersionNumber,
      designSessionId: state.designSessionId,
    },
  })

  // Sync all ToolMessages to timeline
  const messages = result.messages
  if (!Array.isArray(messages)) {
    return result
  }

  const syncedMessages = await Promise.all(
    messages.map(async (message: BaseMessage) => {
      return await withTimelineItemSync(message, {
        designSessionId: state.designSessionId,
        organizationId: state.organizationId || '',
        userId: state.userId,
        repositories,
        assistantRole: 'db',
      })
    }),
  )

  // Check if schemaDesignTool was executed successfully and update workflow state
  let updatedResult = {
    ...state,
    ...result,
    messages: syncedMessages,
  }

  if (wasSchemaDesignToolSuccessful(syncedMessages)) {
    // Fetch the updated schema from database
    const schemaResult = await fetchUpdatedSchemaWithResult(
      repositories,
      state.designSessionId,
    )

    if (schemaResult.isOk()) {
      // Generate DDL statements from the updated schema
      const ddlResult = postgresqlSchemaDeparser(schemaResult.value.schema)
      const ddlStatements =
        ddlResult.errors.length > 0 ? undefined : ddlResult.value

      // Update workflow state with fresh schema data and DDL statements
      updatedResult = {
        ...updatedResult,
        schemaData: schemaResult.value.schema,
        latestVersionNumber: schemaResult.value.latestVersionNumber,
        ddlStatements,
      }
    } else {
      console.warn(
        'Failed to fetch updated schema after tool execution:',
        schemaResult.error,
      )
    }
  }

  return updatedResult
}
