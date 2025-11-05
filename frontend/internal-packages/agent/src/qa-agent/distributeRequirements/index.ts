import { AIMessage } from '@langchain/core/messages'
import { Send } from '@langchain/langgraph'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { getUnprocessedRequirements } from './getUnprocessedRequirements'

export type { TestCaseData } from './types'

/**
 * Prepare testcase generation by adding a start message to state
 * This node runs before distributing requirements to parallel subgraphs
 */
export function prepareTestcaseGeneration(state: QaAgentState) {
  const targetTestcases = getUnprocessedRequirements(state)

  return {
    messages: [
      new AIMessage({
        id: crypto.randomUUID(),
        name: 'qa',
        content: `Generating test cases (processing ${targetTestcases.length} requirements)...`,
      }),
    ],
  }
}

/**
 * Conditional edge function to create Send objects for parallel processing
 * Distributes each requirement to testcaseGeneration subgraph
 */
export function continueToRequirements(state: QaAgentState) {
  const targetTestcases = getUnprocessedRequirements(state)

  // Use Send API to distribute each testcase for parallel SQL generation
  // Each testcase will be processed by testcaseGeneration with isolated state
  return targetTestcases.map(
    (testcaseData) =>
      new Send('testcaseGeneration', {
        // Each subgraph gets its own isolated state
        currentTestcase: testcaseData,
        schemaData: state.schemaData,
        goal: state.analyzedRequirements.goal,
        internalMessages: [], // Start with empty messages for isolation
      }),
  )
}
