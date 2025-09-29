import { Send } from '@langchain/langgraph'
import type { QaAgentState } from '../shared/qaAgentAnnotation'
import { getUnprocessedRequirements } from './getUnprocessedRequirements'

export type { RequirementData } from './types'

/**
 * Conditional edge function to create Send objects for parallel processing
 * This is called directly from START node
 */
export function continueToRequirements(state: QaAgentState) {
  const targetRequirements = getUnprocessedRequirements(state)

  // Use Send API to distribute each requirement for parallel processing
  // Each requirement will be processed by testcaseGeneration with isolated state
  return targetRequirements.map(
    (reqData) =>
      new Send('testcaseGeneration', {
        // Each subgraph gets its own isolated state
        currentRequirement: reqData,
        schemaData: state.schemaData,
        messages: [], // Start with empty messages for isolation
        testcases: [], // Will be populated by the subgraph
      }),
  )
}
