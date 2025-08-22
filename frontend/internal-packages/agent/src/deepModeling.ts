import { DEFAULT_RECURSION_LIMIT } from './chat/workflow/shared/langGraphUtils'
import type { WorkflowConfigurable } from './chat/workflow/types'
import { createLeadAgentGraph } from './lead-agent/createLeadAgentGraph'
import {
  executeWorkflowWithTracking,
  setupWorkflowState,
} from './shared/workflowSetup'
import type { AgentWorkflowParams, AgentWorkflowResult } from './types'

/**
 * Execute Deep Modeling workflow with Lead Agent supervisor
 * The Lead Agent analyzes user input and routes to the appropriate workflow
 */
export const deepModeling = (
  params: AgentWorkflowParams,
  config: {
    configurable: WorkflowConfigurable
  },
): AgentWorkflowResult => {
  const { recursionLimit = DEFAULT_RECURSION_LIMIT } = params
  const compiled = createLeadAgentGraph(
    config.configurable.repositories.schema.checkpointer,
  )

  return setupWorkflowState(params, config).andThen((setupResult) => {
    // The Lead Agent graph has a different state type but is compatible with WorkflowState
    // for the purpose of execution through the generic executeWorkflowWithTracking
    return executeWorkflowWithTracking(
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      compiled as Parameters<typeof executeWorkflowWithTracking>[0],
      setupResult,
      recursionLimit,
    )
  })
}
