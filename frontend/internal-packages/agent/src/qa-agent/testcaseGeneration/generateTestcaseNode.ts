import {
  AIMessage,
  type AIMessageChunk,
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { yamlSchemaDeparser } from '@liam-hq/schema'
import { removeReasoningFromMessages } from '../../utils/messageCleanup'
import { saveTestcaseTool } from '../tools/saveTestcaseTool'
import { formatPreviousFailures } from '../utils/formatPreviousFailures'
import {
  humanPromptTemplateForTestcaseGeneration,
  SYSTEM_PROMPT_FOR_TESTCASE_GENERATION,
} from './prompts'
import type { testcaseAnnotation } from './testcaseAnnotation'

const model = new ChatOpenAI({
  model: 'gpt-5-mini',
  reasoning: { effort: 'minimal', summary: 'auto' },
  verbosity: 'low',
  useResponsesApi: true,
}).bindTools([saveTestcaseTool], {
  strict: true,
  parallel_tool_calls: false,
  tool_choice: 'required', // Force LLM to always call the tool
})

/**
 * Generate Test Case Node for Subgraph
 * Generates SQL for a single test case
 * This node is part of the testcase subgraph with isolated message state
 */
export async function generateTestcaseNode(
  state: typeof testcaseAnnotation.State,
): Promise<{ internalMessages: BaseMessage[] }> {
  const { currentTestcase, schemaData, goal, internalMessages } = state

  const schemaContextResult = yamlSchemaDeparser(schemaData)
  if (schemaContextResult.isErr()) {
    throw schemaContextResult.error
  }
  const schemaContext = schemaContextResult.value

  const previousFailures = formatPreviousFailures(currentTestcase.testcase)

  const contextMessage = await humanPromptTemplateForTestcaseGeneration.format({
    schemaContext,
    goal,
    category: currentTestcase.category,
    title: currentTestcase.testcase.title,
    type: currentTestcase.testcase.type,
    previousFailures,
  })

  const cleanedMessages = removeReasoningFromMessages(internalMessages)

  const streamModel = fromAsyncThrowable(() => {
    return model.stream(
      [
        new SystemMessage(SYSTEM_PROMPT_FOR_TESTCASE_GENERATION),
        new HumanMessage(contextMessage),
        // Include all previous messages in this subgraph's scope
        ...cleanedMessages,
      ],
      {
        options: {
          timeout: 120000, // 120s
        },
      },
    )
  })

  const streamResult = await streamModel()

  if (streamResult.isErr()) {
    // eslint-disable-next-line no-throw-error/no-throw-error -- Required for LangGraph retry mechanism
    throw new Error(
      `Failed to generate SQL for ${currentTestcase.category}/${currentTestcase.testcase.title}: ${streamResult.error.message}`,
    )
  }

  let accumulatedChunk: AIMessageChunk | null = null
  for await (const chunk of streamResult.value) {
    accumulatedChunk = accumulatedChunk ? accumulatedChunk.concat(chunk) : chunk
  }

  const response = new AIMessage({
    content: accumulatedChunk?.content || '',
    additional_kwargs: accumulatedChunk?.additional_kwargs || {},
    name: 'qa',
    ...(accumulatedChunk?.tool_calls && {
      tool_calls: accumulatedChunk.tool_calls,
    }),
  })

  return {
    internalMessages: [response],
  }
}
