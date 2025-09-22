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
  timeout: 60000, // 60 seconds timeout
  maxRetries: 0, // Disable OpenAI SDK level retries (controlled by LangGraph)
  maxConcurrency: 1, // Limit concurrent requests
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
  const startTime = Date.now()
  const { currentRequirement, schemaData, messages } = state

  // Set up AbortController for forced timeout
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => {
    console.error(
      '[generateTestcaseNode] Aborting due to timeout after 60s - ' +
        `Category: ${currentRequirement.category}`,
    )
    abortController.abort()
  }, 60000) // 60 second absolute timeout

  // Log start of processing
  console.info(
    `[generateTestcaseNode] START - Category: ${currentRequirement.category}, ` +
      `Requirement: ${currentRequirement.requirement.substring(0, 50)}...`,
  )

  // Convert schema and log size
  const schemaConversionStart = Date.now()
  const schemaContext = convertSchemaToText(schemaData)
  console.info(
    `[generateTestcaseNode] Schema conversion: ${Date.now() - schemaConversionStart}ms, ` +
      `size: ${schemaContext.length} chars`,
  )

  // Generate prompt and log time/size
  const promptStart = Date.now()
  const contextMessage = await humanPromptTemplateForTestcaseGeneration.format({
    schemaContext,
    businessContext: currentRequirement.businessContext,
    requirementType: currentRequirement.type,
    requirementCategory: currentRequirement.category,
    requirement: currentRequirement.requirement,
  })
  console.info(
    `[generateTestcaseNode] Prompt generation: ${Date.now() - promptStart}ms, ` +
      `size: ${contextMessage.length} chars`,
  )

  // Log message count
  const cleanedMessages = removeReasoningFromMessages(messages)
  console.info(
    `[generateTestcaseNode] Previous messages count: ${cleanedMessages.length}`,
  )

  // Log API call start
  const apiStart = Date.now()
  console.info('[generateTestcaseNode] Calling OpenAI API (gpt-5-nano)...')

  const streamModel = fromAsyncThrowable(() => {
    return model.stream(
      [
        new SystemMessage(SYSTEM_PROMPT_FOR_TESTCASE_GENERATION),
        // Include all previous messages in this subgraph's scope
        ...cleanedMessages,
        new HumanMessage(contextMessage),
      ],
      {
        signal: abortController.signal, // Add AbortSignal for timeout
      },
    )
  })

  const streamResult = await streamModel()

  if (streamResult.isErr()) {
    clearTimeout(timeoutId)
    const apiErrorTime = Date.now() - apiStart
    console.error(
      `[generateTestcaseNode] API Error after ${apiErrorTime}ms: ${streamResult.error.message}`,
    )
    // eslint-disable-next-line no-throw-error/no-throw-error -- Required for LangGraph retry mechanism
    throw new Error(
      `Failed to generate test case for ${currentRequirement.category}: ${streamResult.error.message}`,
    )
  }

  console.info(
    `[generateTestcaseNode] API stream started after ${Date.now() - apiStart}ms`,
  )

  // Log streaming processing with timeout check
  const streamStart = Date.now()
  let response: BaseMessage

  // eslint-disable-next-line no-restricted-syntax -- Try-catch required for stream error handling and abort
  try {
    response = await streamLLMResponse(streamResult.value, {
      agentName: 'qa',
      eventType: 'messages',
      maxStreamTime: 50000, // 50 seconds max for streaming (within 60s total)
    })
    clearTimeout(timeoutId)
    console.info(
      `[generateTestcaseNode] Stream processing completed: ${Date.now() - streamStart}ms`,
    )
  } catch (error) {
    clearTimeout(timeoutId)
    console.error(
      `[generateTestcaseNode] Stream processing error after ${Date.now() - streamStart}ms: ${error}`,
    )
    abortController.abort()

    throw error
  }

  // Log total time
  const totalTime = Date.now() - startTime
  console.info(
    `[generateTestcaseNode] END - Total time: ${totalTime}ms (${Math.round(totalTime / 1000)}s)`,
  )

  return {
    messages: [response],
  }
}
