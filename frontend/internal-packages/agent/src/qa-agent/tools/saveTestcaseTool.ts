import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import { Command, getCurrentTaskInput } from '@langchain/langgraph'
import { toAsync } from '@liam-hq/neverthrow'
import { ResultAsync } from 'neverthrow'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { toJsonSchema } from '../../utils/jsonSchema'
import { withSentryCaptureException } from '../../utils/withSentryCaptureException'
import type { testcaseAnnotation } from '../testcaseGeneration/testcaseAnnotation'
import { validatePgTapTest } from './validatePgTapTest'
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
        // Removed dispatchCustomEvent to prevent message flooding during parallel execution
        throw new WorkflowTerminationError(new Error(errorMessage), TOOL_NAME)
      }

      const { sql } = parsed.output

      const result = await ResultAsync.combineWithAllErrors([
        validateSqlSyntax(sql),
        toAsync(validatePgTapTest(sql)),
      ])
      if (result.isErr()) {
        // Removed dispatchCustomEvent to prevent message flooding during parallel execution
        // eslint-disable-next-line no-throw-error/no-throw-error -- Required for LangGraph retry mechanism
        throw new Error(result.error.join('\n'))
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
      // Removed dispatchCustomEvent to prevent message flooding during parallel execution

      return new Command({
        update: {
          generatedSqls: [{ testcaseId, sql }],
          internalMessages: [toolMessage],
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
