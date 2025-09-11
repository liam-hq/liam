import type { BaseMessage } from '@langchain/core/messages'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { ToolNode } from '@langchain/langgraph/prebuilt'
import type { Schema } from '@liam-hq/schema'
import type { ResultAsync } from 'neverthrow'
import type { Repositories } from '../../repositories'
import { getConfigurable } from '../../utils/getConfigurable'
import type { DbAgentState } from '../shared/dbAgentAnnotation'
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
  console.info(
    `[wasSchemaDesignToolSuccessful] Found ${toolMessages.length} tool messages at ${new Date().toISOString()}`,
  )

  for (const msg of toolMessages) {
    console.info(
      `[wasSchemaDesignToolSuccessful] Tool message: name="${msg.name}", content type="${typeof msg.content}", content="${msg.content}" at ${new Date().toISOString()}`,
    )
    if (msg.name === 'schemaDesignTool' && typeof msg.content === 'string') {
      const hasSuccessMessage = msg.content.includes(
        'Schema successfully updated',
      )
      console.info(
        `[wasSchemaDesignToolSuccessful] schemaDesignTool message found, hasSuccessMessage: ${hasSuccessMessage} at ${new Date().toISOString()}`,
      )
    }
  }

  const result = toolMessages.some(
    (msg) =>
      msg.name === 'schemaDesignTool' &&
      typeof msg.content === 'string' &&
      msg.content.includes('Schema successfully updated'),
  )
  console.info(
    `[wasSchemaDesignToolSuccessful] Returning: ${result} at ${new Date().toISOString()}`,
  )
  return result
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
  state: DbAgentState,
  config: RunnableConfig,
) => {
  console.info(
    `[invokeSchemaDesignToolNode] Starting tool execution at ${new Date().toISOString()}`,
  )

  const configurableResult = getConfigurable(config)
  if (configurableResult.isErr()) {
    console.info(
      `[invokeSchemaDesignToolNode] Failed with error at ${new Date().toISOString()}`,
    )
    return {
      ...state,
      error: configurableResult.error,
    }
  }
  const { repositories } = configurableResult.value

  const toolNode = new ToolNode<{ messages: BaseMessage[] }>([schemaDesignTool])

  const stream = await toolNode.stream(state, {
    configurable: {
      ...config.configurable,
      buildingSchemaId: state.buildingSchemaId,
      latestVersionNumber: state.latestVersionNumber,
      designSessionId: state.designSessionId,
    },
  })

  let result: { messages: BaseMessage[] } = { messages: [] }

  for await (const chunk of stream) {
    result = chunk
  }

  const messages = result.messages
  if (!Array.isArray(messages)) {
    return result
  }

  let updatedResult = {
    ...state,
    ...result,
    messages: messages,
  }

  if (wasSchemaDesignToolSuccessful(messages)) {
    console.info(
      `[invokeSchemaDesignToolNode] Tool execution successful, fetching updated schema at ${new Date().toISOString()}`,
    )
    const schemaResult = await fetchUpdatedSchemaWithResult(
      repositories,
      state.designSessionId,
    )

    if (schemaResult.isOk()) {
      console.info(
        `[invokeSchemaDesignToolNode] Schema fetch successful at ${new Date().toISOString()}`,
      )
      updatedResult = {
        ...updatedResult,
        schemaData: schemaResult.value.schema,
        latestVersionNumber: schemaResult.value.latestVersionNumber,
      }
    } else {
      console.warn(
        'Failed to fetch updated schema after tool execution:',
        schemaResult.error,
      )
    }
  } else {
    console.info(
      `[invokeSchemaDesignToolNode] Tool execution not successful at ${new Date().toISOString()}`,
    )
  }

  console.info(
    `[invokeSchemaDesignToolNode] Completed at ${new Date().toISOString()}`,
  )
  return updatedResult
}
