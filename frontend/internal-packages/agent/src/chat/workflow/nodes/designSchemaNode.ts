import { DatabaseSchemaBuildAgent } from '../../../langchain/agents'
import type { UpdateSchemaVersionInput } from '../../../langchain/tools'
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
  toolInput: UpdateSchemaVersionInput,
  message: string,
  state: WorkflowState,
): Promise<WorkflowState> => {
  const result = await state.repositories.schema.createVersion({
    buildingSchemaId: state.buildingSchemaId,
    latestVersionNumber: state.latestVersionNumber,
    patch: toolInput.patch,
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

  return {
    ...state,
    generatedAnswer: message,
    error: undefined,
  }
}

/**
 * Handle tool calls from the agent response
 */
const handleToolCalls = async (
  agentMessages: Awaited<ReturnType<DatabaseSchemaBuildAgent['generate']>>,
  state: WorkflowState,
): Promise<WorkflowState> => {
  const lastMessage = agentMessages[agentMessages.length - 1]

  // Check if the last message has tool calls
  if (
    lastMessage &&
    'tool_calls' in lastMessage &&
    lastMessage.tool_calls &&
    Array.isArray(lastMessage.tool_calls) &&
    lastMessage.tool_calls.length > 0
  ) {
    const toolCall = lastMessage.tool_calls[0]

    // Handle the update_schema_version tool call
    if (
      toolCall &&
      typeof toolCall === 'object' &&
      'name' in toolCall &&
      'args' in toolCall &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      toolCall.name === 'update_schema_version'
    ) {
      // Handle tool args - could be string or object depending on tool type
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const rawArgs = toolCall.args
      const toolInput =
        typeof rawArgs === 'string'
          ? (JSON.parse(rawArgs) as UpdateSchemaVersionInput)
          : (rawArgs as UpdateSchemaVersionInput)
      const message = lastMessage.content as string

      return await applySchemaChanges(toolInput, message, state)
    }
  }

  // No tool calls, just return the message
  const messageContent =
    (lastMessage?.content as string) || 'No response from agent'
  return {
    ...state,
    generatedAnswer: messageContent,
  }
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

  // Create prompt variables directly
  const promptVariables: SchemaAwareChatVariables = {
    schema_text: schemaText,
    chat_history: state.formattedHistory,
    user_message: state.userInput,
  }

  // Use agent's generate method with prompt variables
  const agentMessages = await agent.generate(promptVariables)
  const result = await handleToolCalls(agentMessages, state)

  state.logger.log(`[${NODE_NAME}] Completed`)
  return result
}
