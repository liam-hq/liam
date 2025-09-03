import { DEFAULT_RECURSION_LIMIT } from './constants'
import { createGraph } from './createGraph'
import type {
  AgentWorkflowParams,
  AgentWorkflowResult,
  WorkflowConfigurable,
} from './types'
import {
  executeWorkflowWithTracking,
  setupWorkflowState,
} from './utils/workflowSetup'

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
