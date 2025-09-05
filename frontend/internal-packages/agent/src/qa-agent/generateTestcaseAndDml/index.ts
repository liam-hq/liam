import {
  type BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { ChatOpenAI } from '@langchain/openai'
import { ResultAsync } from 'neverthrow'
import { convertSchemaToText } from '../../utils/convertSchemaToText'
import { WorkflowTerminationError } from '../../utils/errorHandling'
import { removeReasoningFromMessages } from '../../utils/messageCleanup'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { saveTestcasesAndDmlTool } from '../tools/saveTestcasesAndDmlTool'
import { humanPromptTemplate, SYSTEM_PROMPT } from './prompt'

/**
 * Format analyzed requirements for the prompt
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: TODO: Refactor to reduce complexity
function formatAnalyzedRequirements(
  analyzedRequirements: QaAgentState['analyzedRequirements'],
): string {
  if (!analyzedRequirements) {
    return 'No requirements available.'
  }

  const sections = []

  if (analyzedRequirements.businessRequirement) {
    sections.push(
      '## Business Requirement',
      analyzedRequirements.businessRequirement,
      '',
    )
  }

  if (
    analyzedRequirements.functionalRequirements &&
    Object.keys(analyzedRequirements.functionalRequirements).length > 0
  ) {
    sections.push('## Functional Requirements')
    for (const [category, requirements] of Object.entries(
      analyzedRequirements.functionalRequirements,
    )) {
      if (requirements && requirements.length > 0) {
        sections.push(`### ${category}`)
        for (const req of requirements) {
          sections.push(`- ${req}`)
        }
        sections.push('')
      }
    }
  }

  if (
    analyzedRequirements.nonFunctionalRequirements &&
    Object.keys(analyzedRequirements.nonFunctionalRequirements).length > 0
  ) {
    sections.push('## Non-Functional Requirements')
    for (const [category, requirements] of Object.entries(
      analyzedRequirements.nonFunctionalRequirements,
    )) {
      if (requirements && requirements.length > 0) {
        sections.push(`### ${category}`)
        for (const req of requirements) {
          sections.push(`- ${req}`)
        }
        sections.push('')
      }
    }
  }

  return sections.join('\n').trim()
}

const model = new ChatOpenAI({
  model: 'gpt-5-mini',
  useResponsesApi: true,
}).bindTools([saveTestcasesAndDmlTool], {
  parallel_tool_calls: false,
  tool_choice: 'required',
})

/**
 * Generate Test Case and DML Node - Unified generation
 * Generates both test cases and their corresponding DML operations in a single LLM call
 */
export async function generateTestcaseAndDmlNode(
  state: QaAgentState,
): Promise<{ messages: BaseMessage[] }> {
  if (!state.analyzedRequirements) {
    throw new WorkflowTerminationError(
      new Error(
        'No analyzed requirements found. Cannot generate test cases and DML.',
      ),
      'generateTestcaseAndDmlNode',
    )
  }

  const contextMessage = await humanPromptTemplate.format({
    schemaContext: convertSchemaToText(state.schemaData),
    analyzedRequirements: formatAnalyzedRequirements(
      state.analyzedRequirements,
    ),
  })

  const cleanedMessages = removeReasoningFromMessages(state.messages)

  const invokeModel = ResultAsync.fromThrowable(
    () =>
      model.invoke([
        new SystemMessage(SYSTEM_PROMPT),
        new HumanMessage(contextMessage),
        ...cleanedMessages,
      ]),
    (error) => (error instanceof Error ? error : new Error(String(error))),
  )

  const result = await invokeModel()

  if (result.isErr()) {
    throw new WorkflowTerminationError(
      result.error,
      'generateTestcaseAndDmlNode',
    )
  }

  return {
    messages: [result.value],
  }
}
