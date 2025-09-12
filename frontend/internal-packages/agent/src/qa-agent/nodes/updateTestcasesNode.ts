import {
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { fromAsyncThrowable } from '@liam-hq/neverthrow'
import { convertSchemaToText } from '../../utils/convertSchemaToText'
import { removeReasoningFromMessages } from '../../utils/messageCleanup'
import { streamLLMResponse } from '../../utils/streamingLlmUtils'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { updateTestcasesTool } from '../tools/updateTestcasesTool'
import {
  humanPromptTemplateForTestcaseUpdate,
  SYSTEM_PROMPT_FOR_TESTCASE_UPDATE,
} from './updateTestcasesPrompts'

const model = new ChatOpenAI({
  model: 'gpt-5-nano',
  reasoning: { effort: 'minimal', summary: 'auto' },
  verbosity: 'low',
  useResponsesApi: true,
}).bindTools([updateTestcasesTool], {
  parallel_tool_calls: false,
  tool_choice: 'auto',
})

/**
 * Extract failed test cases from the current testcases based on validation errors
 * This is a simplified approach - in production you might want more sophisticated
 * error parsing to identify exactly which testcases failed
 */
const extractFailedTestcases = (
  testcases: QaAgentState['testcases'],
  validationErrors: string,
): QaAgentState['testcases'] => {
  // For now, we'll regenerate all testcases if there are validation errors
  // In the future, this could be enhanced to parse errors and identify specific failed testcases
  if (validationErrors && validationErrors.length > 0) {
    return testcases
  }
  return []
}

/**
 * Update Test Cases Node
 * Regenerates failed test cases based on validation errors
 * This node is used when test validation fails and we need to fix the issues
 */
export const updateTestcasesNode = async (
  state: QaAgentState,
): Promise<{ messages: BaseMessage[] }> => {
  const {
    schemaData,
    testcases,
    lastValidationErrors,
    retryCount,
    maxRetries,
    messages,
  } = state

  // Generate schema context for the LLM
  const schemaContext = convertSchemaToText(schemaData)

  // Extract failed testcases (for now, all testcases if there are errors)
  const failedTestcases = extractFailedTestcases(
    testcases,
    lastValidationErrors,
  )

  // Format failed testcases for the prompt
  const failedTestcasesText = failedTestcases
    .map(
      (tc, index) => `
${index + 1}. Test Case: ${tc.title}
   Description: ${tc.description}
   Requirement: ${tc.requirement}
   SQL: ${tc.dmlOperation.sql}
   Description: ${tc.dmlOperation.description || 'No description provided'}
`,
    )
    .join('\n')

  const contextMessage = await humanPromptTemplateForTestcaseUpdate.format({
    schemaContext,
    validationErrors: lastValidationErrors || 'No specific errors provided',
    failedTestcases: failedTestcasesText || 'No failed testcases identified',
    retryCount: retryCount,
    maxRetries: maxRetries,
  })

  const cleanedMessages = removeReasoningFromMessages(messages)

  const streamModel = fromAsyncThrowable(() => {
    return model.stream([
      new SystemMessage(SYSTEM_PROMPT_FOR_TESTCASE_UPDATE),
      new HumanMessage(contextMessage),
      // Include previous messages for context
      ...cleanedMessages,
    ])
  })

  const streamResult = await streamModel()

  if (streamResult.isErr()) {
    // eslint-disable-next-line no-throw-error/no-throw-error -- Required for LangGraph retry mechanism
    throw new Error(
      `Failed to update test cases (retry ${retryCount}/${maxRetries}): ${streamResult.error.message}`,
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
