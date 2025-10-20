import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import { Command, getCurrentTaskInput } from '@langchain/langgraph'
import { type PgParseResult, pgParse } from '@liam-hq/schema/parser'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { SSE_EVENTS } from '../../streaming/constants'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { toJsonSchema } from '../../utils/jsonSchema'
import { withSentryCaptureException } from '../../utils/withSentryCaptureException'
import type { testcaseAnnotation } from '../testcaseGeneration/testcaseAnnotation'

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
 * Check if SQL contains pgTAP test code
 */
const isPgTapTest = (sql: string): boolean => {
  const lowerSql = sql.toLowerCase()
  // Check for pgTAP-specific functions
  return (
    lowerSql.includes('plan(') ||
    lowerSql.includes('finish()') ||
    lowerSql.includes('lives_ok(') ||
    lowerSql.includes('throws_ok(') ||
    lowerSql.includes('has_table(') ||
    lowerSql.includes('has_column(')
  )
}

/**
 * Validate pgTAP test structure
 */
const validatePgTapTest = (
  sql: string,
  toolCallId: string,
): Promise<void> => {
  const lowerSql = sql.toLowerCase()
  const errors: string[] = []

  // Check for plan()
  if (!lowerSql.includes('plan(')) {
    errors.push('Missing plan() declaration - pgTAP tests must declare the number of tests')
  }

  // Check for finish()
  if (!lowerSql.includes('finish()')) {
    errors.push('Missing finish() call - pgTAP tests must call finish() at the end')
  }

  // Check for BEGIN/ROLLBACK (should not be included)
  if (lowerSql.includes('begin;') || lowerSql.includes('rollback;')) {
    errors.push('Do not include BEGIN/ROLLBACK - the system automatically wraps tests in transactions')
  }

  // Check for at least one assertion
  const hasAssertion =
    lowerSql.includes('lives_ok(') ||
    lowerSql.includes('throws_ok(') ||
    lowerSql.includes('is(') ||
    lowerSql.includes('ok(') ||
    lowerSql.includes('results_eq(') ||
    lowerSql.includes('has_table(') ||
    lowerSql.includes('has_column(')

  if (!hasAssertion) {
    errors.push('No pgTAP assertions found - test must include at least one assertion (lives_ok, throws_ok, is, ok, etc.)')
  }

  if (errors.length > 0) {
    const message = `pgTAP test validation failed:\n${errors.map((e, i) => `${i + 1}. ${e}`).join('\n')}\n\nFix these issues and retry.`
    const toolMessage = new ToolMessage({
      id: uuidv4(),
      name: TOOL_NAME,
      status: 'error',
      content: message,
      tool_call_id: toolCallId,
    })
    dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)
    return Promise.reject(new Error(message))
  }

  return Promise.resolve()
}

/**
 * Validate SQL syntax using pgParse. On error, notify UI via SSE then throw to trigger retry.
 */
const validateSqlSyntax = async (
  sql: string,
  toolCallId: string,
): Promise<void> => {
  // Check if this is a pgTAP test
  if (isPgTapTest(sql)) {
    return validatePgTapTest(sql, toolCallId)
  }

  // For non-pgTAP SQL, use pgParse validation
  const parseResult: PgParseResult = await pgParse(sql)

  if (parseResult.error) {
    const message = `SQL syntax error: ${parseResult.error.message}. Fix the SQL and retry.`
    const toolMessage = new ToolMessage({
      id: uuidv4(),
      name: TOOL_NAME,
      status: 'error',
      content: message,
      tool_call_id: toolCallId,
    })
    await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)
    return Promise.reject(new Error(message))
  }
}

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

      await validateSqlSyntax(sql, toolCallId)

      // Get current state to retrieve testcase info
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
