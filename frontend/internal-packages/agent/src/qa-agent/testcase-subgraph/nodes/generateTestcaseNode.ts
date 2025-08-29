import {
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { ResultAsync } from 'neverthrow'
import { WorkflowTerminationError } from '../../../shared/errorHandling'
import { convertSchemaToText } from '../../../utils/convertSchemaToText'
import { removeReasoningFromMessages } from '../../../utils/messageCleanup'
import { saveTestcasesAndDmlTool } from '../../tools/saveTestcasesAndDmlTool'
import type { testcaseAnnotation } from '../annotations'
import {
  humanPromptTemplateForSingleRequirement,
  SYSTEM_PROMPT_FOR_SINGLE_REQUIREMENT,
} from '../prompts'

const model = new ChatOpenAI({
  model: 'gpt-5-mini',
  useResponsesApi: true,
}).bindTools([saveTestcasesAndDmlTool], {
  parallel_tool_calls: false,
  tool_choice: 'required',
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

  if (!currentRequirement) {
    throw new WorkflowTerminationError(
      new Error(
        'No current requirement found. This node should be called with requirement data.',
      ),
      'generateTestcaseNode',
    )
  }

  const contextMessage = await humanPromptTemplateForSingleRequirement.format({
    schemaContext: convertSchemaToText(schemaData),
    businessContext: currentRequirement.businessContext || 'Not provided',
    requirementType: currentRequirement.type,
    requirementCategory: currentRequirement.category,
    requirement: currentRequirement.requirement,
  })

  const cleanedMessages = removeReasoningFromMessages(messages)

  const invokeModel = ResultAsync.fromThrowable(
    () =>
      model.invoke([
        new SystemMessage(SYSTEM_PROMPT_FOR_SINGLE_REQUIREMENT),
        new HumanMessage(contextMessage),
        // Include all previous messages in this subgraph's scope
        ...cleanedMessages,
      ]),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  const result = await invokeModel()

  if (result.isErr()) {
    console.error(
      `❌ Failed to generate test case for ${currentRequirement.category}: ${result.error.message}`,
    )
    throw new WorkflowTerminationError(result.error, 'generateTestcaseNode')
  }

  return {
    messages: [result.value],
  }
}
