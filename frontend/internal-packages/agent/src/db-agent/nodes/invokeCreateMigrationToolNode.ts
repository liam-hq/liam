import type { BaseMessage } from '@langchain/core/messages'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import type { Schema } from '@liam-hq/schema'
import type { ResultAsync } from 'neverthrow'
import type { Repositories } from '../../repositories'
import { getConfigurable } from '../../utils/getConfigurable'
import type { DbAgentState } from '../shared/dbAgentAnnotation'
import { createMigrationTool } from '../tools/createMigrationTool'

/**
 * Check if a message is a ToolMessage
 */
const isToolMessage = (message: BaseMessage): message is ToolMessage => {
  return message instanceof ToolMessage
}

/**
 * Check if createMigrationTool was executed successfully
 */
const wasCreateMigrationToolSuccessful = (messages: BaseMessage[]): boolean => {
  const toolMessages = messages.filter(isToolMessage)
  return toolMessages.some(
    (msg) =>
      msg.name === 'createMigrationTool' &&
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
): ResultAsync<{ schema: Schema }, Error> => {
  return repositories.schema.getSchema(designSessionId)
}

export const invokeCreateMigrationToolNode = async (
  state: DbAgentState,
  config: RunnableConfig,
) => {
  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    return {
      ...state,
      error: configurableResult.error,
      createMigrationSuccessful: false,
    }
  }
  const { repositories } = configurableResult.value

  const toolNode = new ToolNode<{ messages: BaseMessage[] }>([
    createMigrationTool,
  ])

  const stream = await toolNode.stream(state, {
    configurable: {
      ...config.configurable,
      designSessionId: state.designSessionId,
    },
  })

  let result: { messages: BaseMessage[] } = { messages: [] }

  for await (const chunk of stream) {
    result = chunk
  }

  const messages = result.messages
  if (!Array.isArray(messages)) {
    return {
      ...result,
      createMigrationSuccessful: false,
    }
  }

  let updatedResult = {
    ...state,
    messages: [...state.messages, ...messages],
    createMigrationSuccessful: false, // Default to false
  }

  if (wasCreateMigrationToolSuccessful(messages)) {
    const schemaResult = await fetchUpdatedSchemaWithResult(
      repositories,
      state.designSessionId,
    )

    if (schemaResult.isOk()) {
      updatedResult = {
        ...updatedResult,
        schemaData: schemaResult.value.schema,
        createMigrationSuccessful: true,
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
