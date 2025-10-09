import type { StateSnapshot } from '@langchain/langgraph'
import type { AnalyzedRequirements } from '@liam-hq/artifact'
import { createGraph } from './createGraph'
import type { WorkflowConfigurable } from './types'

/**
 * Type guard to check if a value is a valid AnalyzedRequirements
 */
const isAnalyzedRequirements = (
  value: unknown,
): value is AnalyzedRequirements => {
  if (!value || typeof value !== 'object') {
    return false
  }

  if (!('goal' in value) || typeof value.goal !== 'string') {
    return false
  }

  if (!('testcases' in value) || typeof value.testcases !== 'object') {
    return false
  }

  return true
}

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

  if (!isAnalyzedRequirements(analyzedRequirements)) {
    return null
  }

  return analyzedRequirements
}

/**
 * Collect analyzedRequirements from tasks recursively
 * This handles subgraphs like PM Agent that may have their own state
 * @param state - The state snapshot containing tasks
 * @returns The first non-null analyzedRequirements found, or null
 */
export const collectAnalyzedRequirementsFromTasks = (
  state: StateSnapshot,
): AnalyzedRequirements | null => {
  const { tasks } = state
  if (!Array.isArray(tasks)) return null

  for (const task of tasks) {
    const childState = task.state
    if (!childState) continue

    if (
      childState &&
      typeof childState === 'object' &&
      'values' in childState &&
      'tasks' in childState
    ) {
      const requirements = extractAnalyzedRequirementsFromState(childState)
      if (requirements) {
        return requirements
      }

      const childRequirements = collectAnalyzedRequirementsFromTasks(childState)
      if (childRequirements) {
        return childRequirements
      }
    }
  }

  return null
}

/**
 * Get analyzedRequirements from the workflow state
 * Checks both the main state and subgraph states (like PM Agent)
 * @param config - Configuration containing repositories and thread_id
 * @returns The analyzedRequirements if found, null otherwise
 */
export const getAnalyzedRequirements = async (config: {
  configurable: WorkflowConfigurable
}): Promise<AnalyzedRequirements | null> => {
  const graph = createGraph(
    config.configurable.repositories.schema.checkpointer,
  )
  const state: StateSnapshot = await graph.getState(
    { ...config },
    { subgraphs: true },
  )

  const mainRequirements = extractAnalyzedRequirementsFromState(state)
  if (mainRequirements) {
    return mainRequirements
  }

  const taskRequirements = collectAnalyzedRequirementsFromTasks(state)
  if (taskRequirements) {
    return taskRequirements
  }

  return null
}
