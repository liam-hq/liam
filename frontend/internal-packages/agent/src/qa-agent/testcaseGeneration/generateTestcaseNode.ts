import {
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { createChatOpenAI } from '../../utils/createChatOpenAI'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { convertSchemaToText } from '../../utils/convertSchemaToText'
import { removeReasoningFromMessages } from '../../utils/messageCleanup'
import { streamLLMResponse } from '../../utils/streamingLlmUtils'
import { saveTestcaseTool } from '../tools/saveTestcaseTool'
import {
  humanPromptTemplateForTestcaseGeneration,
  SYSTEM_PROMPT_FOR_TESTCASE_GENERATION,
} from './prompts'
import type { testcaseAnnotation } from './testcaseAnnotation'

const model = createChatOpenAI({
  model: 'gpt-5-nano',
  reasoning: { effort: 'minimal', summary: 'auto' },
  verbosity: 'low',
  useResponsesApi: true,
}).bindTools([saveTestcaseTool], {
  strict: true,
  parallel_tool_calls: false,
  tool_choice: 'auto',
})

/**
 * Generate Test Case Node for Subgraph
 * Generates test cases and DML operations for a single requirement
 * This node is part of the testcase subgraph with isolated message state
 */
export async function generateTestcaseNode(
  state: typeof testcaseAnnotation.State,
): Promise<{ messages: BaseMessage[] }> {
  const { currentRequirement, schemaData, messages } = state

  const schemaContext = convertSchemaToText(schemaData)

  const contextMessage = await humanPromptTemplateForTestcaseGeneration.format({
    schemaContext,
    businessContext: currentRequirement.businessContext,
    requirementType: currentRequirement.type,
    requirementCategory: currentRequirement.category,
    requirement: currentRequirement.requirement,
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
      `Failed to generate test case for ${currentRequirement.category}: ${streamResult.error.message}`,
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
