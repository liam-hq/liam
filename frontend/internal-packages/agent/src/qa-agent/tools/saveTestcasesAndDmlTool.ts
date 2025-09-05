import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import { Command } from '@langchain/langgraph'
import { dmlOperationSchema } from '@liam-hq/artifact'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { SSE_EVENTS } from '../../client'
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

const saveTestcasesAndDmlToolSchema = v.object({
  testcasesWithDml: v.array(testcaseWithDmlSchema),
})

const toolSchema = toJsonSchema(saveTestcasesAndDmlToolSchema)

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
      'saveTestcasesAndDmlTool',
    )
  }
  return configParseResult.output.toolCall.id
}

export const saveTestcasesAndDmlTool: StructuredTool = tool(
  async (input: unknown, config: RunnableConfig): Promise<Command> => {
    const parsed = v.safeParse(saveTestcasesAndDmlToolSchema, input)
    if (!parsed.success) {
      throw new WorkflowTerminationError(
        new Error(
          `Invalid tool input: ${parsed.issues
            .map((issue) => issue.message)
            .join(', ')}`,
        ),
        'saveTestcasesAndDmlTool',
      )
    }

    const { testcasesWithDml } = parsed.output

    if (testcasesWithDml.length === 0) {
      throw new WorkflowTerminationError(
        new Error('No test cases provided to save.'),
        'saveTestcasesAndDmlTool',
      )
    }

    const toolCallId = getToolCallId(config)

    const testcases: Testcase[] = testcasesWithDml.map((testcase) => {
      const testcaseId = uuidv4()

      const dmlOperationWithId = {
        ...testcase.dmlOperation,
        testCaseId: testcaseId,
        dml_execution_logs: [],
      }

      return {
        id: testcaseId,
        requirementType: testcase.requirementType,
        requirementCategory: testcase.requirementCategory,
        requirement: testcase.requirement,
        title: testcase.title,
        description: testcase.description,
        dmlOperation: dmlOperationWithId,
      }
    })

    const totalDmlOperations = testcases.length

    const toolMessage = new ToolMessage({
      id: uuidv4(),
      status: 'success',
      content: `Successfully saved ${testcases.length} test cases with ${totalDmlOperations} DML operations`,
      tool_call_id: toolCallId,
    })
    await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)

    return new Command({
      update: {
        testcases,
        messages: [toolMessage],
      },
    })
  },
  {
    name: 'saveTestcasesAndDmlTool',
    description:
      'Save generated test cases along with their corresponding DML (Data Manipulation Language) operations for testing database schemas. Each test case includes its scenario description and the SQL operations needed to set up and validate the test.',
    schema: toolSchema,
  },
)
