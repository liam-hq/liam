import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import { Command } from '@langchain/langgraph'
import { fromValibotSafeParse } from '@liam-hq/neverthrow'
import { ok, type Result } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { toJsonSchema } from '../../utils/jsonSchema'

const inputSchema = v.object({
  targetAgent: v.picklist(['pmAgent']),
})

const toolSchema = toJsonSchema(inputSchema)

const configSchema = v.object({
  toolCall: v.object({
    id: v.string(),
  }),
})

type ToolConfigurable = {
  toolCallId: string
}

/**
 * Extract tool-specific configuration including tool call ID
 */
const getToolConfigurable = (
  config: RunnableConfig,
): Result<ToolConfigurable, Error> => {
  return fromValibotSafeParse(configSchema, config).andThen((value) =>
    ok({
      toolCallId: value.toolCall.id,
    }),
  )
}

export const routeToAgent: StructuredTool = tool(
  async (input: unknown, config: RunnableConfig): Promise<Command> => {
    const inputParseResult = v.safeParse(inputSchema, input)
    if (!inputParseResult.success) {
      const errorMessage = inputParseResult.issues
        .map((issue) => issue.message)
        .join(', ')
      throw new WorkflowTerminationError(
        new Error(`Invalid input structure: ${errorMessage}`),
        'routeToAgent',
      )
    }

    const toolConfigurableResult = getToolConfigurable(config)
    if (toolConfigurableResult.isErr()) {
      throw new WorkflowTerminationError(
        toolConfigurableResult.error,
        'routeToAgent',
      )
    }

    const { toolCallId } = toolConfigurableResult.value

    return new Command({
      update: {
        next: inputParseResult.output.targetAgent,
        messages: [
          new ToolMessage({
            id: uuidv4(),
            content: `Routing request to ${inputParseResult.output.targetAgent}`,
            tool_call_id: toolCallId,
          }),
        ],
      },
    })
  },
  {
    name: 'routeToAgent',
    description: 'Route the user request to the appropriate specialized agent',
    schema: toolSchema,
  },
)
