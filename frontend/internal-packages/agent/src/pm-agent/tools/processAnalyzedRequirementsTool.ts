import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { ToolMessage } from '@langchain/core/messages'
import type { RunnableConfig } from '@langchain/core/runnables'
import { type StructuredTool, tool } from '@langchain/core/tools'
import { Command } from '@langchain/langgraph'
import { fromValibotSafeParse, ok, type Result } from '@liam-hq/neverthrow'
import { v4 as uuidv4 } from 'uuid'
import * as v from 'valibot'
import {
  type AnalyzedRequirements,
  testCaseSchema,
} from '../../schemas/analyzedRequirements'
import { SSE_EVENTS } from '../../streaming/constants'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { toJsonSchema } from '../../utils/jsonSchema'

const TOOL_NAME = 'processAnalyzedRequirementsTool'

const testCaseInputSchema = v.omit(testCaseSchema, ['id', 'sql', 'testResults'])

const analyzedRequirementsInputSchema = v.object({
  goal: v.string(),
  testcases: v.record(v.string(), v.array(testCaseInputSchema)),
})

const toolSchema = toJsonSchema(analyzedRequirementsInputSchema)

const configSchema = v.object({
  toolCall: v.object({
    id: v.string(),
  }),
})

type ToolConfigurable = {
  toolCallId: string
}

const getToolConfigurable = (
  config: RunnableConfig,
): Result<ToolConfigurable, Error> => {
  return fromValibotSafeParse(configSchema, config).andThen((value) =>
    ok({
      toolCallId: value.toolCall.id,
    }),
  )
}

/**
 * Tool for processing and streaming analyzed requirements to the frontend.
 * Normalizes LLM output by adding IDs and empty fields, then dispatches streaming events for real-time UI updates.
 */
export const processAnalyzedRequirementsTool: StructuredTool = tool(
  async (input: unknown, config: RunnableConfig): Promise<Command> => {
    // Parse input and add id, sql, testResults to each testcase
    const inputData = v.parse(analyzedRequirementsInputSchema, input)
    const analyzedRequirements: AnalyzedRequirements = {
      goal: inputData.goal,
      testcases: Object.fromEntries(
        Object.entries(inputData.testcases).map(([category, testcases]) => [
          category,
          testcases.map((tc) => ({
            id: uuidv4(),
            title: tc.title,
            type: tc.type,
            sql: '',
            testResults: [],
          })),
        ]),
      ),
    }

    const toolConfigurableResult = getToolConfigurable(config)
    if (toolConfigurableResult.isErr()) {
      throw new WorkflowTerminationError(
        toolConfigurableResult.error,
        TOOL_NAME,
      )
    }

    const { toolCallId } = toolConfigurableResult.value

    const toolMessage = new ToolMessage({
      id: uuidv4(),
      name: TOOL_NAME,
      status: 'success',
      content: 'Requirements processed and streamed successfully',
      tool_call_id: toolCallId,
    })
    await dispatchCustomEvent(SSE_EVENTS.MESSAGES, toolMessage)
    await dispatchCustomEvent(
      SSE_EVENTS.ANALYZED_REQUIREMENTS,
      analyzedRequirements,
    )

    return new Command({
      update: {
        analyzedRequirements,
        messages: [toolMessage],
        artifactSaveSuccessful: true,
      },
    })
  },
  {
    name: TOOL_NAME,
    description:
      'Process analyzed requirements and update workflow state. This tool normalizes LLM output and dispatches streaming events for real-time UI updates.',
    schema: toolSchema,
  },
)
