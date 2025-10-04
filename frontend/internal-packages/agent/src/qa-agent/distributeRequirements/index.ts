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

  // Use Send API to distribute each testcase for parallel SQL generation
  // Each testcase will be processed by testcaseGeneration with isolated state
  return targetTestcases.map(
    (testcaseData) =>
      new Send('testcaseGeneration', {
        // Each subgraph gets its own isolated state
        currentTestcase: testcaseData,
        schemaData: state.schemaData,
        goal: state.analyzedRequirements.goal,
        messages: [], // Start with empty messages for isolation
        testcases: [], // Will be populated by the subgraph
      }),
  )
}
