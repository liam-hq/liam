import type { BaseMessage } from '@langchain/core/messages'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import type { Schema } from '@liam-hq/db-structure'
import { errAsync, okAsync, type ResultAsync } from 'neverthrow'
import * as v from 'valibot'
import { getConfigurable } from '../../chat/workflow/shared/getConfigurable'
import type { WorkflowState } from '../../chat/workflow/types'
import { withTimelineItemSync } from '../../chat/workflow/utils/withTimelineItemSync'
import { schemaDesignTool } from '../tools/schemaDesignTool'

/**
 * Check if a message is a ToolMessage
 */
const isToolMessage = (message: BaseMessage): message is ToolMessage => {
  return message instanceof ToolMessage
}

const toolResponseSchema = v.object({
  message: v.string(),
  schemaData: v.any(),
  latestVersionNumber: v.number(),
})

/**
 * Check if schemaDesignTool was executed successfully and extract schema data
 */
const extractSchemaDataFromToolResult = (
  messages: BaseMessage[],
): ResultAsync<{ schemaData: Schema; latestVersionNumber: number }, Error> => {
  const toolMessages = messages.filter(isToolMessage)
  const schemaToolMessage = toolMessages.find(
    (msg) =>
      msg.name === 'schemaDesignTool' &&
      typeof msg.content === 'string' &&
      msg.content.includes('Schema successfully updated'),
  )

  if (!schemaToolMessage) {
    return errAsync(
      new Error('Schema design tool was not executed successfully'),
    )
  }

  if (typeof schemaToolMessage.content !== 'string') {
    return errAsync(new Error('Tool message content is not a string'))
  }

  return okAsync(schemaToolMessage.content)
    .andThen((content) => {
      const parseResult = v.safeParse(toolResponseSchema, JSON.parse(content))
      if (!parseResult.success) {
        return errAsync(new Error('Invalid tool response format'))
      }
      return okAsync({
        schemaData: parseResult.output.schemaData,
        latestVersionNumber: parseResult.output.latestVersionNumber,
      })
    })
    .orElse(() => errAsync(new Error('Failed to parse tool response')))
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
      buildingSchemaVersionId: state.buildingSchemaVersionId,
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

  const schemaResult = await extractSchemaDataFromToolResult(syncedMessages)
  if (schemaResult.isOk()) {
    // Update workflow state with schema data from tool response
    updatedResult = {
      ...updatedResult,
      schemaData: schemaResult.value.schemaData,
      latestVersionNumber: schemaResult.value.latestVersionNumber,
    }
  }

  return updatedResult
}
