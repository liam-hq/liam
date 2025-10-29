import { Send } from '@langchain/langgraph'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { getUnprocessedRequirements } from './getUnprocessedRequirements'

export type { TestCaseData } from './types'

/**
 * Conditional edge function to create Send objects for parallel processing
 * This is called from prepareTestcases node via addConditionalEdges
 */
export function continueToRequirements(state: QaAgentState) {
  const targetTestcases = getUnprocessedRequirements(state)

  // Use Send API to distribute each testcase for parallel SQL generation
  // Each testcase will be processed by testcaseGenerationWithSemaphore with shared state
  return targetTestcases.map(
    (testcaseData) =>
      new Send('testcaseGenerationWithSemaphore', {
        batchId: state.batchId,
        totalTestcases: state.totalTestcases,
        // Each subgraph gets its own isolated state for testcase processing
        currentTestcase: testcaseData,
        schemaData: state.schemaData,
        goal: state.analyzedRequirements.goal,
        messages: [], // Start with empty messages for isolation
      }),
  )
}
