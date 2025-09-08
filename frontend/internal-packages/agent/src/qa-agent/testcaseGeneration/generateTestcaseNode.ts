import {
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { removeReasoningFromMessages } from '../../utils/messageCleanup'
import { saveTestcaseTool } from '../tools/saveTestcaseTool'
import {
  humanPromptTemplateForTestcaseGeneration,
  SYSTEM_PROMPT_FOR_TESTCASE_GENERATION,
} from './prompts'
import type { testcaseAnnotation } from './testcaseAnnotation'

const model = new ChatOpenAI({
  model: 'gpt-5-nano',
  reasoning: { effort: 'minimal', summary: 'auto' },
  verbosity: 'low',
  useResponsesApi: true,
}).bindTools([saveTestcaseTool], {
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
  const { currentRequirement, schemaContext, messages } = state

  const contextMessage = await humanPromptTemplateForTestcaseGeneration.format({
    schemaContext,
    businessContext: currentRequirement.businessContext,
    requirementType: currentRequirement.type,
    requirementCategory: currentRequirement.category,
    requirement: currentRequirement.requirement,
  })

  const cleanedMessages = removeReasoningFromMessages(messages)

  const invokeModel = fromAsyncThrowable(() =>
    model.invoke([
      new SystemMessage(SYSTEM_PROMPT_FOR_TESTCASE_GENERATION),
      new HumanMessage(contextMessage),
      // Include all previous messages in this subgraph's scope
      ...cleanedMessages,
    ]),
  )

  const result = await invokeModel()

  if (result.isErr()) {
    // eslint-disable-next-line no-throw-error/no-throw-error -- Required for LangGraph retry mechanism
    throw new Error(
      `Failed to generate test case for ${currentRequirement.category}: ${result.error.message}`,
    )
  }

  return {
    messages: [result.value],
  }
}
