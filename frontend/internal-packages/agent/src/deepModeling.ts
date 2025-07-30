import { err } from 'neverthrow'
import { DEFAULT_RECURSION_LIMIT } from './chat/workflow/shared/langGraphUtils'
import type { WorkflowConfigurable } from './chat/workflow/types'
import { createGraph } from './createGraph'
import {
  executeWorkflowWithTracking,
  setupWorkflowState,
} from './shared/workflowSetup'
import type { AgentWorkflowParams, AgentWorkflowResult } from './types'

/**
 * Execute Deep Modeling workflow
 */
export const deepModeling = async (
  params: AgentWorkflowParams,
  config: {
    configurable: WorkflowConfigurable
  },
): Promise<AgentWorkflowResult> => {
  const { recursionLimit = DEFAULT_RECURSION_LIMIT } = params

  // Setup workflow state with message conversion and timeline sync
  const setupResult = await setupWorkflowState(params, config)

  if (setupResult.isErr()) {
    return err(setupResult.error)
  }

  const setup = setupResult.value
  const compiled = createGraph()

  // Execute workflow with proper tracking and error handling
  const workflowResult = await executeWorkflowWithTracking(
    compiled,
    setup,
    recursionLimit,
  )

  return workflowResult.match(
    (result) => result,
    (error) => err(error),
  )
}
