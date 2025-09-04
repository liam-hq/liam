import { createGraph } from './createGraph'
import {
  executeWorkflowWithTracking,
  setupWorkflowState,
} from './shared/workflowSetup'
import type { AgentWorkflowParams, AgentWorkflowResult } from './types'
import { DEFAULT_RECURSION_LIMIT } from './workflow/shared/workflowConstants'
import type { WorkflowConfigurable } from './workflow/types'

/**
 * Execute Deep Modeling workflow
 */
export const deepModeling = (
  params: AgentWorkflowParams,
  config: {
    configurable: WorkflowConfigurable
  },
): AgentWorkflowResult => {
  const { recursionLimit = DEFAULT_RECURSION_LIMIT } = params
  const compiled = createGraph(
    config.configurable.repositories.schema.checkpointer,
  )

  return setupWorkflowState(params, config).andThen((setupResult) => {
    return executeWorkflowWithTracking(compiled, setupResult, recursionLimit)
  })
}
