import type { StateSnapshot } from '@langchain/langgraph'
import { safeParse } from 'valibot'
import { createGraph } from './createGraph'
import {
  type AnalyzedRequirements,
  analyzedRequirementsSchema,
} from './schemas/analyzedRequirements'
import type { WorkflowConfigurable } from './types'

/**
 * Extract analyzedRequirements from a state snapshot
 * @param state - The state snapshot to extract from
 * @returns The analyzedRequirements if present, null otherwise
 */
export const extractAnalyzedRequirementsFromState = (
  state: StateSnapshot,
): AnalyzedRequirements | null => {
  const { values } = state
  if (!values) {
    return null
  }

  if (!('analyzedRequirements' in values)) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const analyzedRequirements: unknown = values.analyzedRequirements

  const result = safeParse(analyzedRequirementsSchema, analyzedRequirements)
  if (!result.success) {
    return null
  }

  return result.output
}

/**
 * Get analyzedRequirements from the workflow state
 * @param config - Configuration containing repositories and thread_id
 * @returns The analyzedRequirements if found, null otherwise
 */
export const getAnalyzedRequirements = async (config: {
  configurable: WorkflowConfigurable
}): Promise<AnalyzedRequirements | null> => {
  const graph = createGraph(
    config.configurable.repositories.schema.checkpointer,
  )
  const state: StateSnapshot = await graph.getState({ ...config })

  return extractAnalyzedRequirementsFromState(state)
}
