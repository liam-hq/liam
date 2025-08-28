import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import type { JSONSchema } from '@langchain/core/utils/json_schema'
import { Command } from '@langchain/langgraph'
import { dmlOperationSchema } from '@liam-hq/artifact'
import { toJsonSchema } from '@valibot/to-json-schema'
import * as v from 'valibot'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import { getToolConfigurable } from '../getToolConfigurable'

const dmlOperationWithoutLogsSchema = v.omit(dmlOperationSchema, [
  'dml_execution_logs',
])

const saveDmlOperationsToolSchema = v.object({
  dmlOperations: v.array(dmlOperationWithoutLogsSchema),
})

// toJsonSchema returns a JSONSchema7, which is not assignable to JSONSchema
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const toolSchema = toJsonSchema(saveDmlOperationsToolSchema) as JSONSchema

export const saveDmlOperationsTool: StructuredTool = tool(
  async (input: unknown, config: RunnableConfig): Promise<Command> => {
    const toolConfigurableResult = getToolConfigurable(config)
    if (toolConfigurableResult.isErr()) {
      throw new WorkflowTerminationError(
        toolConfigurableResult.error,
        'saveDmlOperationsTool',
      )
    }

    const { testcases, toolCallId } = toolConfigurableResult.value
    const { dmlOperations } = v.parse(saveDmlOperationsToolSchema, input)

    if (dmlOperations.length === 0) {
      throw new WorkflowTerminationError(
        new Error('No DML operations provided to save.'),
        'saveDmlOperationsTool',
      )
    }

    const updatedTestcases = testcases.map((testcase) => {
      const testcaseDmlOperations = dmlOperations.filter(
        (op) => op.testCaseId === testcase.id,
      )
      return {
        ...testcase,
        dmlOperations: testcaseDmlOperations,
      }
    })

    const toolMessage = new ToolMessage({
      content: `Successfully saved ${dmlOperations.length} DML operations for testing`,
      tool_call_id: toolCallId,
    })

    return new Command({
      update: {
        generatedTestcases: updatedTestcases,
        messages: [toolMessage],
      },
    })
  },
  {
    name: 'saveDmlOperationsTool',
    description:
      'Save generated DML (Data Manipulation Language) operations for testing database schemas. This tool stores INSERT, UPDATE, and other DML operations that have been generated for test cases.',
    schema: toolSchema,
  },
)
