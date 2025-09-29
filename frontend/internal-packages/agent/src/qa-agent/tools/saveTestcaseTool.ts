import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import { Command } from '@langchain/langgraph'
import { dmlOperationSchema } from '@liam-hq/artifact'
import { type PgParseResult, pgParse } from '@liam-hq/schema/parser'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { SSE_EVENTS } from '../../streaming/constants'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { toJsonSchema } from '../../utils/jsonSchema'
import { withSentryCaptureException } from '../../utils/withSentryCaptureException'
import { type Testcase, testcaseSchema } from '../types'

const dmlOperationWithoutLogsSchema = v.omit(dmlOperationSchema, [
  'dml_execution_logs',
])

const testcaseWithDmlSchema = v.object({
  ...v.omit(testcaseSchema, ['id', 'requirementId', 'dmlOperation']).entries,
  dmlOperation: dmlOperationWithoutLogsSchema,
})

const saveTestcaseToolSchema = v.object({
  testcaseWithDml: testcaseWithDmlSchema,
})

const toolSchema = toJsonSchema(saveTestcaseToolSchema)

const configSchema = v.object({
  toolCall: v.object({
    id: v.string(),
  }),
  configurable: v.object({
    requirementId: v.pipe(v.string(), v.uuid()),
  }),
})

/**
 * Validate SQL syntax using pgParse
 */
const validateSqlSyntax = async (sql: string): Promise<void> => {
  const parseResult: PgParseResult = await pgParse(sql)

  // Randomly trigger error 10% of the time for testing Sentry integration
  const shouldSimulateError = Math.random() < 0.1

  if (parseResult.error || shouldSimulateError) {
    const errorMessage = parseResult.error
      ? `SQL syntax error: ${parseResult.error.message}. Fix testcaseWithDml.dmlOperation.sql and retry.`
      : '[TEST] Simulated SQL error for Sentry testing (10% chance). SQL was valid but error was triggered for testing.'

    // Create a custom error with additional properties for Sentry
    const error: Error & {
      tags?: Record<string, string>
      extra?: Record<string, unknown>
    } = new Error(errorMessage)

    // Add Sentry-specific data to the error object
    // withSentryCaptureException will use these when capturing
    error.tags = {
      errorType: shouldSimulateError
        ? 'simulated_sql_error_test'
        : 'sql_syntax_error',
      toolName: 'saveTestcase',
      isTest: shouldSimulateError ? 'true' : 'false',
    }

    error.extra = {
      sql,
      parseError: parseResult.error?.message || 'Simulated error for testing',
      simulatedForTesting: shouldSimulateError,
    }

    // Debug logging to verify error is being triggered
    console.error('[saveTestcaseTool] SQL validation error occurred:', {
      isSimulated: shouldSimulateError,
      errorMessage: error.message,
      sql: sql.substring(0, 100), // Log first 100 chars of SQL
      tags: error.tags,
      extra: error.extra,
    })

    // LangGraph tool nodes require throwing errors to trigger retry mechanism
    // withSentryCaptureException will capture this error
    throw error
  }
}

/**
 * Extract tool call ID and requirementId from config
 */
const getConfigData = (
  config: RunnableConfig,
): { toolCallId: string; requirementId: string } => {
  const configParseResult = v.safeParse(configSchema, config)
  if (!configParseResult.success) {
    throw new WorkflowTerminationError(
      new Error('Tool call ID or requirementId not found in config'),
      'saveTestcaseTool',
    )
  }
  return {
    toolCallId: configParseResult.output.toolCall.id,
    requirementId: configParseResult.output.configurable.requirementId,
  }
}

export const saveTestcaseTool: StructuredTool = tool(
  async (input: unknown, config: RunnableConfig): Promise<Command> => {
    return withSentryCaptureException(async () => {
      const parsed = v.safeParse(saveTestcaseToolSchema, input)
      if (!parsed.success) {
        throw new WorkflowTerminationError(
          new Error(
            `Invalid tool input: ${parsed.issues
              .map((issue) => issue.message)
              .join(', ')}`,
          ),
          'saveTestcaseTool',
        )
      }

      const { testcaseWithDml } = parsed.output

      // Validate SQL syntax before saving
      await validateSqlSyntax(testcaseWithDml.dmlOperation.sql)

      const { toolCallId, requirementId } = getConfigData(config)

      const testcaseId = uuidv4()

      const dmlOperationWithId = {
        ...testcaseWithDml.dmlOperation,
        dml_execution_logs: [],
      }

      const testcase: Testcase = {
        id: testcaseId,
        requirementId: requirementId,
        requirementType: testcaseWithDml.requirementType,
        requirementCategory: testcaseWithDml.requirementCategory,
        requirement: testcaseWithDml.requirement,
        title: testcaseWithDml.title,
        description: testcaseWithDml.description,
        dmlOperation: dmlOperationWithId,
      }

      const toolMessage = new ToolMessage({
        content: `Successfully saved test case "${testcase.title}" with DML operation`,
        tool_call_id: toolCallId,
      })
      await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)

      return new Command({
        update: {
          testcases: [testcase],
          messages: [toolMessage],
        },
      })
    })
  },
  {
    name: 'saveTestcase',
    description:
      'Save a single test case with its corresponding DML operation for a requirement. ' +
      'The test case includes its scenario description and the SQL operation needed to set up and validate the test.',
    schema: toolSchema,
  },
)
