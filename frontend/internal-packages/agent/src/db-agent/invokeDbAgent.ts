import {
  executeWorkflowWithTracking,
  setupWorkflowState,
} from '../shared/workflowSetup'
import type { AgentWorkflowParams, AgentWorkflowResult } from '../types'
import { DEFAULT_RECURSION_LIMIT } from '../workflow/shared/workflowConstants'
import type { WorkflowConfigurable } from '../workflow/types'
import { createDbAgentGraph } from './createDbAgentGraph'

/**
 * Invoke the DB Agent with provided parameters and repositories
 * This function encapsulates the logic for creating and invoking the DB agent graph
 * with proper workflow setup, tracking, and error handling
 */
export const invokeDbAgent = (
  params: AgentWorkflowParams,
  config: {
    configurable: WorkflowConfigurable
  },
): AgentWorkflowResult => {
  const { recursionLimit = DEFAULT_RECURSION_LIMIT } = params
  // Pass checkpointer from repositories to enable state persistence
  const compiled = createDbAgentGraph(
    config.configurable.repositories.schema.checkpointer,
  )

  return setupWorkflowState(params, config).andThen((setup) =>
    executeWorkflowWithTracking(compiled, setup, recursionLimit),
  )
}
