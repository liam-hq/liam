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

  // Batch size for parallel processing
  // Set to 2000 to allow maximum parallelism
  const BATCH_SIZE = 2000

  // Only process the first batch of requirements
  // This prevents too many parallel API calls at once
  const batchToProcess = targetRequirements.slice(0, BATCH_SIZE)

  console.info(
    `[distributeRequirements] Processing batch of ${batchToProcess.length} out of ${targetRequirements.length} total requirements`,
  )

  // Use Send API to distribute each requirement for parallel processing
  // Each requirement will be processed by testcaseGeneration with isolated state
  return batchToProcess.map(
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
