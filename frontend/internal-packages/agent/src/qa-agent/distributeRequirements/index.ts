import { dispatchCustomEvent } from '@langchain/core/callbacks/dispatch'
import { AIMessageChunk } from '@langchain/core/messages'
import { Send } from '@langchain/langgraph'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { getUnprocessedRequirements } from './getUnprocessedRequirements'

export type { TestCaseData } from './types'

/**
 * Conditional edge function to create Send objects for parallel processing
 * This is called directly from START node
 */
export function continueToRequirements(state: QaAgentState) {
  const targetTestcases = getUnprocessedRequirements(state)

  // Send start message once before parallel processing (fire-and-forget)
  void dispatchCustomEvent(
    'messages',
    new AIMessageChunk({
      id: crypto.randomUUID(),
      name: 'qa',
      content: `Generating test cases (processing ${targetTestcases.length} requirements)...`,
    }),
  )

  // Use Send API to distribute each testcase for parallel SQL generation
  // Each testcase will be processed by testcaseGeneration with isolated state
  return targetTestcases.map(
    (testcaseData) =>
      new Send('testcaseGeneration', {
        // Each subgraph gets its own isolated state
        currentTestcase: testcaseData,
        schemaData: state.schemaData,
        goal: state.analyzedRequirements.goal,
        messages: [], // Keep messages empty to prevent auto-concat to parent
        internalMessages: [], // Start with empty messages for isolation
      }),
  )
}
