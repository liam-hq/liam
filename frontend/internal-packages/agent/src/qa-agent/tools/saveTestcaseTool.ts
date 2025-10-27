import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import { Command, getCurrentTaskInput } from '@langchain/langgraph'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { SSE_EVENTS } from '../../streaming/constants'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { toJsonSchema } from '../../utils/jsonSchema'
import { withSentryCaptureException } from '../../utils/withSentryCaptureException'
import type { testcaseAnnotation } from '../testcaseGeneration/testcaseAnnotation'
import { isPgTapTest, validatePgTapTest } from './validatePgTapTest'
import { validateSqlSyntax } from './validateSqlSyntax'

const TOOL_NAME = 'saveTestcase'

const saveSqlToolSchema = v.object({
  sql: v.string(),
})

const toolSchema = toJsonSchema(saveSqlToolSchema)

const configSchema = v.object({
  toolCall: v.object({
    id: v.string(),
  }),
})

/**
 * Extract tool call ID from config
 */
const getConfigData = (config: RunnableConfig): { toolCallId: string } => {
  const configParseResult = v.safeParse(configSchema, config)
  if (!configParseResult.success) {
    throw new WorkflowTerminationError(
      new Error('Tool call ID not found in config'),
      TOOL_NAME,
    )
  }
  return {
    toolCallId: configParseResult.output.toolCall.id,
  }
}

export const saveTestcaseTool: StructuredTool = tool(
  async (input: unknown, config: RunnableConfig): Promise<Command> => {
    return withSentryCaptureException(async () => {
      const { toolCallId } = getConfigData(config)

      const parsed = v.safeParse(saveSqlToolSchema, input)
      if (!parsed.success) {
        const errorMessage = `Invalid tool input: ${parsed.issues
          .map((issue) => issue.message)
          .join(', ')}`
        const toolMessage = new ToolMessage({
          id: uuidv4(),
          name: TOOL_NAME,
          status: 'error',
          content: errorMessage,
          tool_call_id: toolCallId,
        })
        await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)
        throw new WorkflowTerminationError(new Error(errorMessage), TOOL_NAME)
      }

      const { sql } = parsed.output

      let validationError: string | undefined
      if (isPgTapTest(sql)) {
        validationError = validatePgTapTest(sql)
        if (!validationError) {
          validationError = await validateSqlSyntax(sql)
        }
      } else {
        validationError = await validateSqlSyntax(sql)
      }

      if (validationError) {
        const toolMessage = new ToolMessage({
          id: uuidv4(),
          name: TOOL_NAME,
          status: 'error',
          content: validationError,
          tool_call_id: toolCallId,
        })
        await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)
        throw new WorkflowTerminationError(
          new Error(validationError),
          TOOL_NAME,
        )
      }

      const state = getCurrentTaskInput<typeof testcaseAnnotation.State>()

      const {
        category,
        testcase: { id: testcaseId, title },
      } = state.currentTestcase

      const toolMessage = new ToolMessage({
        id: uuidv4(),
        name: TOOL_NAME,
        status: 'success',
        content: `Successfully saved SQL for test case "${title}" in category "${category}"`,
        tool_call_id: toolCallId,
      })
      await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)

      return new Command({
        update: {
          generatedSqls: [{ testcaseId, sql }],
          messages: [toolMessage],
        },
      })
    })
  },
  {
    name: TOOL_NAME,
    description:
      'Save SQL for the current test case. Only provide the generated SQL.',
    schema: toolSchema,
  },
)
