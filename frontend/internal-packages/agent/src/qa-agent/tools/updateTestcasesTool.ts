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
import { type Testcase, testcaseSchema } from '../types'

const dmlOperationWithoutLogsSchema = v.omit(dmlOperationSchema, [
  'dml_execution_logs',
])

const testcaseWithDmlSchema = v.object({
  ...v.omit(testcaseSchema, ['id', 'dmlOperation']).entries,
  dmlOperation: dmlOperationWithoutLogsSchema,
})

const updateTestcasesToolSchema = v.object({
  updatedTestcases: v.array(testcaseWithDmlSchema),
  reasonForUpdate: v.string(),
})

const toolSchema = toJsonSchema(updateTestcasesToolSchema)

const configSchema = v.object({
  toolCall: v.object({
    id: v.string(),
  }),
})

/**
 * Validate SQL syntax using pgParse
 */
const validateSqlSyntax = async (sql: string): Promise<void> => {
  const parseResult: PgParseResult = await pgParse(sql)

  if (parseResult.error) {
    // LangGraph tool nodes require throwing errors to trigger retry mechanism
    // eslint-disable-next-line no-throw-error/no-throw-error
    throw new Error(
      `SQL syntax error: ${parseResult.error.message}. Please fix the SQL and try again.`,
    )
  }
}

/**
 * Extract tool call ID from config
 */
const getToolCallId = (config: RunnableConfig): string => {
  const configParseResult = v.safeParse(configSchema, config)
  if (!configParseResult.success) {
    throw new WorkflowTerminationError(
      new Error('Tool call ID not found in config'),
      'updateTestcasesTool',
    )
  }
  return configParseResult.output.toolCall.id
}

export const updateTestcasesTool: StructuredTool = tool(
  async (input: unknown, config: RunnableConfig): Promise<Command> => {
    const parsed = v.safeParse(updateTestcasesToolSchema, input)
    if (!parsed.success) {
      throw new WorkflowTerminationError(
        new Error(
          `Invalid tool input: ${parsed.issues
            .map((issue) => issue.message)
            .join(', ')}`,
        ),
        'updateTestcasesTool',
      )
    }

    const { updatedTestcases, reasonForUpdate } = parsed.output

    // Validate SQL syntax for all updated testcases
    for (const testcaseWithDml of updatedTestcases) {
      await validateSqlSyntax(testcaseWithDml.dmlOperation.sql)
    }

    const toolCallId = getToolCallId(config)

    // Convert testcases with DML to full testcases with IDs
    const fullTestcases: Testcase[] = updatedTestcases.map(
      (testcaseWithDml) => {
        const testcaseId = uuidv4()
        const dmlOperationWithId = {
          ...testcaseWithDml.dmlOperation,
          dml_execution_logs: [],
        }

        return {
          id: testcaseId,
          requirementType: testcaseWithDml.requirementType,
          requirementCategory: testcaseWithDml.requirementCategory,
          requirement: testcaseWithDml.requirement,
          title: testcaseWithDml.title,
          description: testcaseWithDml.description,
          dmlOperation: dmlOperationWithId,
        }
      },
    )

    const toolMessage = new ToolMessage({
      content: `Successfully updated ${fullTestcases.length} test cases. Reason: ${reasonForUpdate}`,
      tool_call_id: toolCallId,
    })
    await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)

    return new Command({
      update: {
        testcases: fullTestcases,
        messages: [toolMessage],
        retryCount: (config.configurable?.['retryCount'] ?? 0) + 1,
      },
    })
  },
  {
    name: 'updateTestcases',
    description:
      'Update multiple test cases based on validation errors. ' +
      'Used to regenerate failed test cases with corrected DML operations to fix SQL constraint violations.',
    schema: toolSchema,
  },
)
