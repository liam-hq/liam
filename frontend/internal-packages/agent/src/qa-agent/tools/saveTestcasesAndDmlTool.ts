import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import type { JSONSchema } from '@langchain/core/utils/json_schema'
import { Command } from '@langchain/langgraph'
import { dmlOperationSchema } from '@liam-hq/artifact'
import { type PgParseResult, pgParse } from '@liam-hq/schema/parser'
import { toJsonSchema } from '@valibot/to-json-schema'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import { WorkflowTerminationError } from '../../shared/errorHandling'
import { type Testcase, testcaseSchema } from '../types'

const dmlOperationWithoutLogsSchema = v.omit(dmlOperationSchema, [
  'dml_execution_logs',
])

const testcaseWithDmlSchema = v.object({
  ...v.omit(testcaseSchema, ['id', 'dmlOperations']).entries,
  dmlOperations: v.array(dmlOperationWithoutLogsSchema),
})

const saveTestcasesAndDmlToolSchema = v.object({
  testcasesWithDml: v.array(testcaseWithDmlSchema),
})

// toJsonSchema returns a JSONSchema7, which is not assignable to JSONSchema
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const toolSchema = toJsonSchema(saveTestcasesAndDmlToolSchema) as JSONSchema

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

/**
 * Validate SQL syntax for all DML operations
 */
const validateDmlSyntax = async (
  testcasesWithDml: Array<{ dmlOperations: Array<{ sql: string }> }>,
): Promise<void> => {
  for (const testcase of testcasesWithDml) {
    for (const dmlOp of testcase.dmlOperations) {
      const parseResult: PgParseResult = await pgParse(dmlOp.sql)
      if (parseResult.error) {
        throw new WorkflowTerminationError(
          new Error(
            `SQL syntax error in DML operation: ${parseResult.error.message}. SQL: ${dmlOp.sql}`,
          ),
          'saveTestcasesAndDmlTool',
        )
      }
    }
  }
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

    await validateDmlSyntax(testcasesWithDml)

    const toolCallId = getToolCallId(config)

    const generatedTestcases: Testcase[] = testcasesWithDml.map((testcase) => {
      const testcaseId = uuidv4()

      const dmlOperationsWithId = testcase.dmlOperations.map((op) => ({
        ...op,
        testCaseId: testcaseId,
        dml_execution_logs: [],
      }))

      return {
        id: testcaseId,
        requirementType: testcase.requirementType,
        requirementCategory: testcase.requirementCategory,
        requirement: testcase.requirement,
        title: testcase.title,
        description: testcase.description,
        dmlOperations: dmlOperationsWithId,
      }
    })

    const totalDmlOperations = generatedTestcases.reduce(
      (sum, tc) => sum + tc.dmlOperations.length,
      0,
    )

    const toolMessage = new ToolMessage({
      content: `Successfully saved ${generatedTestcases.length} test cases with ${totalDmlOperations} DML operations`,
      tool_call_id: toolCallId,
    })

    return new Command({
      update: {
        generatedTestcases,
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
