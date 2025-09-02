import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import { Command } from '@langchain/langgraph'
import { dmlOperationSchema } from '@liam-hq/artifact'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { SSE_EVENTS } from '../../client'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import { toJsonSchema } from '../../shared/jsonSchema'
import { type Testcase, testcaseSchema } from '../types'

const dmlOperationWithoutLogsSchema = v.omit(dmlOperationSchema, [
  'dml_execution_logs',
])

const testcaseWithDmlSchema = v.object({
  ...v.omit(testcaseSchema, ['id', 'dmlOperation']).entries,
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
})

/**
 * Extract tool call ID from config
 */
const getToolCallId = (config: RunnableConfig): string => {
  const configParseResult = v.safeParse(configSchema, config)
  if (!configParseResult.success) {
    throw new WorkflowTerminationError(
      new Error('Tool call ID not found in config'),
      'saveTestcaseTool',
    )
  }
  return configParseResult.output.toolCall.id
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

    const toolCallId = getToolCallId(config)

    const testcaseId = uuidv4()

    const dmlOperationWithId = {
      ...testcaseWithDml.dmlOperation,
      testCaseId: testcaseId,
      dml_execution_logs: [],
    }

    const testcase: Testcase = {
      id: testcaseId,
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
