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

  if (parseResult.error) {
    // LangGraph tool nodes require throwing errors to trigger retry mechanism
    // eslint-disable-next-line no-throw-error/no-throw-error
    throw new Error(
      `SQL syntax error: ${parseResult.error.message}. Please fix the SQL and try again.`,
    )
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
  },
  {
    name: 'saveTestcase',
    description:
      'Save a single test case with its corresponding DML operation for a requirement. ' +
      'The test case includes its scenario description and the SQL operation needed to set up and validate the test.',
    schema: toolSchema,
  },
)
