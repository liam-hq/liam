import {
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { yamlSchemaDeparser } from '@liam-hq/schema'
import { removeReasoningFromMessages } from '../../utils/messageCleanup'
import { streamLLMResponse } from '../../utils/streamingLlmUtils'
import { saveTestcaseTool } from '../tools/saveTestcaseTool'
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
): Promise<{ messages: BaseMessage[] }> {
  const { currentTestcase, schemaData, goal, messages } = state

  const schemaContextResult = yamlSchemaDeparser(schemaData)
  if (schemaContextResult.isErr()) {
    throw schemaContextResult.error
  }
  const schemaContext = schemaContextResult.value

  const contextMessage = await humanPromptTemplateForTestcaseGeneration.format({
    schemaContext,
    goal,
    category: currentTestcase.category,
    title: currentTestcase.testcase.title,
    type: currentTestcase.testcase.type,
  })

  const cleanedMessages = removeReasoningFromMessages(messages)

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

  const response = await streamLLMResponse(streamResult.value, {
    agentName: 'qa',
    eventType: 'messages',
  })

  return {
    messages: [response],
  }
}
